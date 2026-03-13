import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useUniversalAccount } from "../context/UniversalAccountContext";
import {
  executeSwap,
  executeSell,
  getChainIdFromBlockchain,
  pollTransactionDetails,
  getChainName,
  type SwapResult,
} from "../lib/swapService";

interface TokenInfo {
  symbol: string;
  name: string;
  logo?: string;
  price?: number;
  decimals?: number;
  address?: string;
  chainId?: number;
  contracts?: Array<{ address: string; blockchain: string }>;
}

interface SwapModalProps {
  visible: boolean;
  onClose: () => void;
  targetToken: TokenInfo | null;
  onSuccess?: (txId: string) => void;
}

const USDC_LOGO =
  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png";

const CHAIN_LOGOS: Record<number, string> = {
  1: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  8453: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  42161: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  10: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
  137: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  101: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
};

const DEFAULT_SLIPPAGE_PCT = 1;
const MIN_SLIPPAGE_PCT = 0.1;
const MAX_SLIPPAGE_PCT = 10;
const PRESET_SLIPPAGE_PCTS = [0.5, 1, 2, 3, 5];

const formatTokenAmount = (amount: number, decimals: number = 6): string => {
  if (amount === 0) return "0";
  if (amount < 0.000001) return amount.toFixed(10).replace(/\.?0+$/, "");
  if (amount < 1) return amount.toFixed(Math.min(decimals, 6));
  if (amount < 1000) return amount.toFixed(4);
  if (amount < 1000000) return amount.toFixed(2);
  return amount.toFixed(0);
};

const clampSlippagePct = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_SLIPPAGE_PCT;
  return Math.max(
    MIN_SLIPPAGE_PCT,
    Math.min(MAX_SLIPPAGE_PCT, Number(value.toFixed(2)))
  );
};

const TokenWithChainBadge = ({
  logo,
  symbol,
  chainId,
  size = 40,
}: {
  logo?: string;
  symbol: string;
  chainId?: number;
  size?: number;
}) => {
  const chainLogo = chainId ? CHAIN_LOGOS[chainId] : null;
  return (
    <View style={{ position: "relative" }}>
      {logo ? (
        <Image
          source={{ uri: logo }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={[
            styles.tokenFallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={styles.tokenFallbackText}>
            {symbol?.slice(0, 2) || "?"}
          </Text>
        </View>
      )}
      {chainLogo && (
        <Image
          source={{ uri: chainLogo }}
          style={styles.chainBadge}
        />
      )}
    </View>
  );
};

export default function SwapModal({
  visible,
  onClose,
  targetToken,
  onSuccess,
}: SwapModalProps) {
  const { universalAccount, primaryAssets, signUATransaction } =
    useUniversalAccount();

  const [amount, setAmount] = useState("");
  const [sliderValue, setSliderValue] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [txResult, setTxResult] = useState<{
    txId: string;
    expectedAmount?: string;
    actualAmount?: string;
    explorerUrl?: string;
    chainId?: number;
    status: "pending" | "completed" | "failed";
  } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [slippagePct, setSlippagePct] = useState(DEFAULT_SLIPPAGE_PCT);
  const [customSlippageInput, setCustomSlippageInput] = useState(
    DEFAULT_SLIPPAGE_PCT.toString()
  );

  const sliderSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const totalBalance = primaryAssets?.totalAmountInUSD || 0;
  const amountNum = parseFloat(amount) || 0;
  const amountUsd = amountNum;
  const slippageBps = Math.round(slippagePct * 100);
  const slippageLabel = Number(slippagePct.toFixed(2)).toString();

  const outputAmount = targetToken?.price
    ? amountUsd / targetToken.price
    : 0;
  const rate = targetToken?.price ? 1 / targetToken.price : 0;

  const applySlippagePct = useCallback((nextValue: number) => {
    const safe = clampSlippagePct(nextValue);
    setSlippagePct(safe);
    setCustomSlippageInput(Number(safe.toFixed(2)).toString());
  }, []);

  useEffect(() => {
    if (visible) {
      setAmount("");
      setSliderValue(50);
      setError(null);
      setTxResult(null);
      setDirection("buy");
      setIsTyping(false);
      setShowSlippageSettings(false);
    }
  }, [visible]);

  const getTokenBalance = useCallback(() => {
    if (!targetToken || !primaryAssets?.assets) return 0;
    const asset = (primaryAssets.assets as any[]).find(
      (a: any) =>
        a.symbol?.toUpperCase() === targetToken.symbol?.toUpperCase()
    );
    if (!asset) return 0;
    return typeof asset.amount === "string"
      ? parseFloat(asset.amount)
      : asset.amount || 0;
  }, [primaryAssets, targetToken]);

  const tokenBalance = getTokenBalance();
  const sellPreviewAmount =
    ((tokenBalance * sliderValue) / 100) *
    (targetToken?.price || 0) *
    Math.max(0, 1 - slippagePct / 100);

  useEffect(() => {
    if (!txResult && !isTyping) {
      if (direction === "buy" && totalBalance > 0) {
        const newAmount = ((totalBalance * sliderValue) / 100).toFixed(2);
        setAmount(newAmount);
      } else if (direction === "sell" && tokenBalance > 0) {
        const tokenAmt = (tokenBalance * sliderValue) / 100;
        const usdValue = tokenAmt * (targetToken?.price || 0);
        setAmount(usdValue.toFixed(2));
      }
    }
  }, [
    sliderValue,
    totalBalance,
    tokenBalance,
    direction,
    txResult,
    targetToken?.price,
    isTyping,
  ]);

  useEffect(() => {
    return () => {
      if (sliderSyncTimerRef.current) {
        clearTimeout(sliderSyncTimerRef.current);
      }
    };
  }, []);

  const handleNumPad = (key: string) => {
    if (txResult) return;
    setIsTyping(true);

    let newAmount = amount;
    if (key === "backspace") {
      newAmount = amount.slice(0, -1);
    } else if (key === ".") {
      if (!amount.includes(".")) {
        newAmount = amount + ".";
      }
    } else {
      if (amount.length < 10) {
        newAmount = amount + key;
      }
    }

    setAmount(newAmount);

    if (sliderSyncTimerRef.current) {
      clearTimeout(sliderSyncTimerRef.current);
    }

    sliderSyncTimerRef.current = setTimeout(() => {
      const enteredValue = parseFloat(newAmount) || 0;
      if (direction === "buy" && totalBalance > 0) {
        const pct = Math.min(
          100,
          Math.round((enteredValue / totalBalance) * 100)
        );
        setSliderValue(pct);
      } else if (
        direction === "sell" &&
        tokenBalance > 0 &&
        targetToken?.price
      ) {
        const maxUsdValue = tokenBalance * targetToken.price;
        const pct = Math.min(
          100,
          Math.round((enteredValue / maxUsdValue) * 100)
        );
        setSliderValue(pct);
      }
    }, 1500);
  };

  const getTokenAddressAndChain = useCallback(() => {
    if (!targetToken) return { address: "", chainId: 8453 };

    if (targetToken.address && targetToken.chainId) {
      return {
        address: targetToken.address,
        chainId: targetToken.chainId,
      };
    }

    if (targetToken.contracts && targetToken.contracts.length > 0) {
      const baseContract = targetToken.contracts.find(
        (c) => c.blockchain.toLowerCase() === "base"
      );
      const ethContract = targetToken.contracts.find(
        (c) => c.blockchain.toLowerCase() === "ethereum"
      );
      const solContract = targetToken.contracts.find(
        (c) => c.blockchain.toLowerCase() === "solana"
      );

      if (baseContract)
        return { address: baseContract.address, chainId: 8453 };
      if (ethContract)
        return { address: ethContract.address, chainId: 1 };
      if (solContract)
        return { address: solContract.address, chainId: 101 };

      const first = targetToken.contracts[0];
      return {
        address: first.address,
        chainId: getChainIdFromBlockchain(first.blockchain),
      };
    }

    if (primaryAssets?.assets) {
      const matchingAsset = (primaryAssets.assets as any[]).find(
        (a: any) =>
          a.symbol?.toUpperCase() === targetToken.symbol?.toUpperCase()
      );
      if (matchingAsset?.chainAggregation) {
        const chainData = matchingAsset.chainAggregation.find(
          (c: any) => c.token?.address && c.token?.chainId
        );
        if (chainData?.token?.address) {
          return {
            address: chainData.token.address,
            chainId: chainData.token.chainId || 8453,
          };
        }
      }
    }

    return { address: "", chainId: 8453 };
  }, [targetToken, primaryAssets]);

  const handleSwap = async () => {
    if (!targetToken || amountNum <= 0 || !universalAccount) {
      setError("Invalid swap parameters");
      return;
    }

    const { address, chainId: targetChainId } = getTokenAddressAndChain();
    if (!address) {
      setError("Token address not found");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStatus(
      direction === "buy" ? "Preparing buy..." : "Preparing sell..."
    );

    try {
      let result: SwapResult;

      if (direction === "buy") {
        result = await executeSwap({
          ua: universalAccount,
          fromToken: "USDC",
          toTokenAddress: address,
          toTokenChainId: targetChainId,
          amountUsd,
          slippageBps,
        });
      } else {
        const tokenAmountToSell = (tokenBalance * sliderValue) / 100;
        const decimals = targetToken.decimals || 18;
        const amountStr = tokenAmountToSell.toFixed(decimals);
        const [intPart, decPart = ""] = amountStr.split(".");
        const paddedDec = (decPart + "0".repeat(decimals)).slice(
          0,
          decimals
        );
        const amountRaw =
          (intPart + paddedDec).replace(/^0+/, "") || "0";

        result = await executeSell({
          ua: universalAccount,
          tokenAddress: address,
          tokenChainId: targetChainId,
          amountRaw,
          slippagePct,
        });
      }

      if (!result.success) {
        setError(result.error || "Failed to prepare swap");
        return;
      }

      if (result.requiresSignature && result.rootHash) {
        try {
          const signature = await signUATransaction(result.rootHash);

          setLoadingStatus("Sending transaction...");
          const sendResult = await universalAccount.sendTransaction(
            result.transaction as any,
            signature
          );

          if (sendResult?.transactionId) {
            const outputDecimals =
              direction === "sell"
                ? 6
                : targetToken?.decimals || 18;
            const expectedFormatted = result.outputAmount
              ? formatTokenAmount(
                  parseFloat(result.outputAmount) /
                    Math.pow(10, outputDecimals)
                )
              : undefined;

            setTxResult({
              txId: sendResult.transactionId,
              expectedAmount: expectedFormatted,
              status: "pending",
              chainId: targetChainId,
            });
            onSuccess?.(sendResult.transactionId);
            setIsLoading(false);

            setLoadingStatus("Confirming...");
            const txDetails = await pollTransactionDetails(
              universalAccount,
              sendResult.transactionId,
              targetChainId
            );

            if (txDetails.status === "completed") {
              setTxResult((prev) =>
                prev
                  ? {
                      ...prev,
                      status: "completed",
                      actualAmount: txDetails.receivedAmount,
                      explorerUrl: txDetails.explorerUrl,
                      chainId: txDetails.chainId || targetChainId,
                    }
                  : null
              );
            } else if (txDetails.status === "failed") {
              setTxResult((prev) =>
                prev ? { ...prev, status: "failed" } : null
              );
            }
          } else {
            setError("Transaction failed - no ID returned");
          }
        } catch (signError) {
          console.error("Signing error:", signError);
          setError("Failed to sign transaction");
          return;
        }
      } else if (result.transactionId) {
        setTxResult({
          txId: result.transactionId,
          expectedAmount: result.outputAmount,
          status: "pending",
          chainId: targetChainId,
        });
        onSuccess?.(result.transactionId);
      } else {
        setError("Swap failed - no transaction created");
      }
    } catch (err) {
      console.error("Swap error:", err);
      setError(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const hasInsufficientBalance =
    direction === "buy"
      ? amountNum > totalBalance
      : tokenBalance <= 0;
  const canSwap =
    sliderValue > 0 &&
    targetToken &&
    universalAccount &&
    !txResult &&
    (direction === "buy" ? amountNum > 0 : tokenBalance > 0);

  const getButtonText = () => {
    if (isLoading) return loadingStatus || (direction === "buy" ? "Buying..." : "Selling...");
    if (direction === "sell" && tokenBalance <= 0) return "No tokens to sell";
    if (hasInsufficientBalance && direction === "buy") return "Insufficient Balance";
    if (!universalAccount) return "Connect Wallet";
    if (sliderValue <= 0) return "Enter Amount";
    return direction === "buy"
      ? `Buy ${targetToken?.symbol}`
      : `Sell ${targetToken?.symbol}`;
  };

  const NUM_PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerBtn}
            >
              <Feather name="x" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Swap</Text>
            <TouchableOpacity
              onPress={() => setShowSlippageSettings((p) => !p)}
              style={[
                styles.headerBtn,
                showSlippageSettings && styles.headerBtnActive,
              ]}
            >
              <Feather name="settings" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Slippage Settings */}
          {!txResult && showSlippageSettings && (
            <View style={styles.slippageContainer}>
              <View style={styles.slippageRow}>
                <Text style={styles.slippageTitle}>
                  Slippage tolerance
                </Text>
                <Text style={styles.slippageValue}>
                  {slippageLabel}%
                </Text>
              </View>
              <View style={styles.presetRow}>
                {PRESET_SLIPPAGE_PCTS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => applySlippagePct(preset)}
                    style={[
                      styles.presetBtn,
                      Math.abs(slippagePct - preset) < 0.001 &&
                        styles.presetBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetBtnText,
                        Math.abs(slippagePct - preset) < 0.001 &&
                          styles.presetBtnTextActive,
                      ]}
                    >
                      {preset}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.customSlippageRow}>
                <TextInput
                  style={styles.customSlippageInput}
                  keyboardType="decimal-pad"
                  value={customSlippageInput}
                  onChangeText={setCustomSlippageInput}
                  onBlur={() =>
                    applySlippagePct(Number(customSlippageInput))
                  }
                  returnKeyType="done"
                  onSubmitEditing={() =>
                    applySlippagePct(Number(customSlippageInput))
                  }
                />
                <Text style={styles.customSlippageHint}>
                  % (0.1 - 10)
                </Text>
              </View>
            </View>
          )}

          {/* Success / Pending State */}
          {txResult ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultIcon}>
                {txResult.status === "completed"
                  ? "\u2705"
                  : txResult.status === "failed"
                  ? "\u274C"
                  : "\u23F3"}
              </Text>
              <Text style={styles.resultTitle}>
                {txResult.status === "completed"
                  ? "Swap Complete!"
                  : txResult.status === "failed"
                  ? "Swap Failed"
                  : "Swap Pending..."}
              </Text>

              {txResult.status === "completed" &&
              txResult.actualAmount ? (
                <Text style={styles.resultAmountGreen}>
                  Received:{" "}
                  {formatTokenAmount(parseFloat(txResult.actualAmount))}{" "}
                  {direction === "sell" ? "USDC" : targetToken?.symbol}
                </Text>
              ) : txResult.expectedAmount ? (
                <Text style={styles.resultAmountGray}>
                  Expected: ~{txResult.expectedAmount}{" "}
                  {direction === "sell" ? "USDC" : targetToken?.symbol}
                </Text>
              ) : null}

              {txResult.chainId && (
                <Text style={styles.resultChain}>
                  on {getChainName(txResult.chainId)}
                </Text>
              )}

              {txResult.explorerUrl ? (
                <TouchableOpacity
                  style={styles.explorerBtn}
                  onPress={() =>
                    Linking.openURL(txResult.explorerUrl!)
                  }
                >
                  <Text style={styles.explorerBtnText}>
                    View on{" "}
                    {getChainName(txResult.chainId || 8453)} \u2197
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `https://universalx.app/activity/details?id=${txResult.txId}`
                    )
                  }
                >
                  <Text style={styles.universalxLink}>
                    View on UniversalX
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={onClose}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.body}
                keyboardShouldPersistTaps="handled"
              >
                {/* Error */}
                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* From Card */}
                <View style={styles.swapCard}>
                  <View style={styles.swapCardRow}>
                    <View style={styles.swapCardLeft}>
                      {direction === "buy" ? (
                        <>
                          <Image
                            source={{ uri: USDC_LOGO }}
                            style={styles.tokenIcon}
                          />
                          <View style={styles.amountRow}>
                            <Text style={styles.dollarSign}>$</Text>
                            <Text style={styles.amountText}>
                              {amount || "0"}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <TokenWithChainBadge
                            logo={targetToken?.logo}
                            symbol={targetToken?.symbol || "?"}
                            chainId={getTokenAddressAndChain().chainId}
                          />
                          <Text style={styles.amountText}>
                            {formatTokenAmount(
                              (tokenBalance * sliderValue) / 100
                            )}
                          </Text>
                        </>
                      )}
                    </View>
                    <View style={styles.swapCardRight}>
                      <View
                        style={[
                          styles.tokenBadge,
                          {
                            backgroundColor:
                              direction === "buy"
                                ? "#2563eb"
                                : "#ef4444",
                          },
                        ]}
                      >
                        {direction === "buy" && (
                          <Image
                            source={{ uri: USDC_LOGO }}
                            style={styles.badgeIcon}
                          />
                        )}
                        <Text style={styles.tokenBadgeText}>
                          {direction === "buy"
                            ? "USDC"
                            : targetToken?.symbol}
                        </Text>
                      </View>
                      <Text style={styles.balanceText}>
                        {direction === "buy"
                          ? `Balance: $${totalBalance.toFixed(2)}`
                          : `Balance: ${formatTokenAmount(
                              tokenBalance
                            )}`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Swap Direction Arrow */}
                <View style={styles.arrowContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      setDirection((d) =>
                        d === "buy" ? "sell" : "buy"
                      )
                    }
                    style={styles.arrowBtn}
                  >
                    <Feather
                      name="arrow-down"
                      size={18}
                      color="#f97316"
                    />
                  </TouchableOpacity>
                </View>

                {/* To Card */}
                <View style={styles.swapCard}>
                  <View style={styles.swapCardRow}>
                    <View style={styles.swapCardLeft}>
                      {direction === "buy" ? (
                        <>
                          <TokenWithChainBadge
                            logo={targetToken?.logo}
                            symbol={targetToken?.symbol || "?"}
                            chainId={getTokenAddressAndChain().chainId}
                          />
                          <Text style={styles.amountText}>
                            {formatTokenAmount(outputAmount)}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Image
                            source={{ uri: USDC_LOGO }}
                            style={styles.tokenIcon}
                          />
                          <View style={styles.amountRow}>
                            <Text style={styles.dollarSign}>$</Text>
                            <Text style={styles.amountText}>
                              {sellPreviewAmount.toFixed(2)}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                    <View style={styles.swapCardRight}>
                      <View
                        style={[
                          styles.tokenBadge,
                          {
                            backgroundColor:
                              direction === "sell"
                                ? "#2563eb"
                                : "#374151",
                          },
                        ]}
                      >
                        {direction === "sell" && (
                          <Image
                            source={{ uri: USDC_LOGO }}
                            style={styles.badgeIcon}
                          />
                        )}
                        <Text style={styles.tokenBadgeText}>
                          {direction === "buy"
                            ? targetToken?.symbol || "Select"
                            : "USDC"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Rate */}
                <View style={styles.rateContainer}>
                  <Text style={styles.rateText}>
                    {direction === "buy"
                      ? `$1 \u2248 ${formatTokenAmount(rate)} ${
                          targetToken?.symbol || "???"
                        }`
                      : `1 ${
                          targetToken?.symbol
                        } \u2248 $${(targetToken?.price || 0).toFixed(
                          6
                        )}`}
                  </Text>
                  <Text style={styles.rateSlippage}>
                    Max slippage: {slippageLabel}%
                  </Text>
                </View>

                {/* Slider */}
                <View style={styles.sliderSection}>
                  <View style={styles.sliderHeader}>
                    <View style={styles.sliderHeaderLeft}>
                      <Image
                        source={{ uri: USDC_LOGO }}
                        style={styles.sliderIcon}
                      />
                      <Text style={styles.sliderLabel}>
                        {direction === "buy"
                          ? `Buy ${sliderValue}%`
                          : `Sell ${sliderValue}%`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setIsTyping(false);
                        setSliderValue(100);
                      }}
                    >
                      <Text style={styles.maxBtn}>Max</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Percentage buttons as slider replacement */}
                  <View style={styles.percentRow}>
                    {[25, 50, 75, 100].map((pct) => (
                      <TouchableOpacity
                        key={pct}
                        onPress={() => {
                          setIsTyping(false);
                          setSliderValue(pct);
                        }}
                        style={[
                          styles.percentBtn,
                          sliderValue === pct &&
                            styles.percentBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.percentBtnText,
                            sliderValue === pct &&
                              styles.percentBtnTextActive,
                          ]}
                        >
                          {pct}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Number Pad */}
                <View style={styles.numPad}>
                  {NUM_PAD_KEYS.map((key) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => handleNumPad(key)}
                      style={styles.numPadBtn}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.numPadBtnText}>
                        {key === "backspace" ? "\u232B" : key}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Bottom Action */}
              <View style={styles.bottomBar}>
                <View style={styles.gasRow}>
                  <View style={styles.gasLeft}>
                    <Feather
                      name="zap"
                      size={14}
                      color="#f97316"
                    />
                    <Text style={styles.gasLabel}>Fast</Text>
                  </View>
                  <View style={styles.gasRight}>
                    <Text style={styles.gasValue}>
                      Gas: &lt;$0.01
                    </Text>
                    <Text style={styles.gasSlippage}>
                      Slippage: {slippageLabel}%
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSwap}
                  disabled={!canSwap || isLoading}
                  style={[
                    styles.swapBtn,
                    canSwap && !isLoading
                      ? direction === "buy"
                        ? styles.swapBtnBuy
                        : styles.swapBtnSell
                      : styles.swapBtnDisabled,
                  ]}
                >
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.swapBtnText}>
                        {getButtonText()}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.swapBtnText,
                        !canSwap && styles.swapBtnTextDisabled,
                      ]}
                    >
                      {getButtonText()}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#0a0a0a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "95%",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnActive: {
    backgroundColor: "rgba(249,115,22,0.3)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.5)",
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  slippageContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
  },
  slippageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  slippageTitle: { color: "#fff", fontWeight: "500" },
  slippageValue: { color: "#f97316", fontSize: 14 },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  presetBtnActive: { backgroundColor: "#f97316" },
  presetBtnText: { color: "#d1d5db", fontSize: 12 },
  presetBtnTextActive: { color: "#fff" },
  customSlippageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customSlippageInput: {
    width: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: "#fff",
  },
  customSlippageHint: { color: "#9ca3af", fontSize: 12 },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.5)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: "#f87171", fontSize: 13 },
  swapCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  swapCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  swapCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  swapCardRight: { alignItems: "flex-end" },
  tokenIcon: { width: 40, height: 40, borderRadius: 20 },
  amountRow: { flexDirection: "row", alignItems: "center" },
  dollarSign: { color: "#9ca3af", fontSize: 24 },
  amountText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  tokenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeIcon: { width: 16, height: 16, borderRadius: 8 },
  tokenBadgeText: { color: "#fff", fontWeight: "500" },
  balanceText: { color: "#9ca3af", fontSize: 12, marginTop: 4 },
  arrowContainer: {
    alignItems: "center",
    marginVertical: -8,
    zIndex: 10,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 4,
    borderColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  rateContainer: { marginTop: 12 },
  rateText: { color: "#9ca3af", fontSize: 13 },
  rateSlippage: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  sliderSection: { marginTop: 24 },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sliderIcon: { width: 20, height: 20, borderRadius: 10 },
  sliderLabel: { color: "#fff", fontWeight: "500" },
  maxBtn: { color: "#f97316", fontWeight: "500" },
  percentRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  percentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  percentBtnActive: { backgroundColor: "#f97316" },
  percentBtnText: { color: "#d1d5db", fontSize: 13, fontWeight: "500" },
  percentBtnTextActive: { color: "#fff" },
  numPad: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
    marginBottom: 16,
  },
  numPadBtn: {
    width: "31%",
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  numPadBtnText: { color: "#fff", fontSize: 20, fontWeight: "500" },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  gasRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  gasLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  gasLabel: { color: "#fff", fontWeight: "500" },
  gasRight: { alignItems: "flex-end" },
  gasValue: { color: "#9ca3af", fontSize: 13 },
  gasSlippage: { color: "#6b7280", fontSize: 11 },
  swapBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  swapBtnBuy: { backgroundColor: "#f97316" },
  swapBtnSell: { backgroundColor: "#ef4444" },
  swapBtnDisabled: { backgroundColor: "#374151" },
  swapBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  swapBtnTextDisabled: { color: "#9ca3af" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  resultIcon: { fontSize: 56, marginBottom: 16 },
  resultTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  resultAmountGreen: {
    color: "#4ade80",
    fontSize: 16,
    marginBottom: 4,
  },
  resultAmountGray: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 4,
  },
  resultChain: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 16,
  },
  explorerBtn: {
    backgroundColor: "rgba(249,115,22,0.2)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.5)",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  explorerBtnText: { color: "#f97316", fontWeight: "500" },
  universalxLink: {
    color: "#f97316",
    textDecorationLine: "underline",
    marginBottom: 24,
  },
  doneBtn: {
    backgroundColor: "#f97316",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 8,
  },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  tokenFallback: {
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  tokenFallbackText: { color: "#fff", fontWeight: "700" },
  chainBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#0a0a0a",
  },
});
