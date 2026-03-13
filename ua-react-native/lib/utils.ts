export const formatAddress = (addr: string, chars = 6): string => {
  if (!addr) return "";
  return `${addr.substring(0, chars)}...${addr.substring(addr.length - 4)}`;
};

export const formatAmount = (amount: number): string => {
  if (amount === 0) return "0";
  if (amount < 0.00001) return "<0.00001";
  return amount.toFixed(5);
};

export const formatUSD = (amount: number): string => {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return "<$0.01";
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatHexAmount = (
  hexAmount: string,
  decimals: number = 18
): string => {
  try {
    const cleanHex = hexAmount.startsWith("0x")
      ? hexAmount.slice(2)
      : hexAmount;
    const amount = BigInt("0x" + cleanHex);
    const divisor = BigInt(10 ** decimals);
    const wholePart = amount / divisor;
    const remainder = amount % divisor;
    const decimalPart = Number(remainder) / Number(divisor);
    const result = Number(wholePart) + decimalPart;
    return result.toFixed(decimals > 6 ? 6 : decimals);
  } catch (error) {
    console.error("Error formatting hex amount:", hexAmount, error);
    return "0";
  }
};

export const formatPrice = (price: number): string => {
  if (price === 0) return "$0.00";
  if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  if (price >= 0.0001) return `$${price.toFixed(6)}`;
  return `$${price.toExponential(2)}`;
};

export const formatMarketCap = (value: number): string => {
  if (value === 0) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};
