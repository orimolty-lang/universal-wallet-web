export const formatAddress = (addr: string) => {
  if (!addr) return "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

export const formatAmount = (amount: number): string => {
  if (amount === 0) return "0";
  if (amount < 0.00001) return "<0.00001";
  return amount.toFixed(5);
};

export const formatUSD = (amount: number): string => {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return "<$0.01";
  return `$${amount.toFixed(2)}`;
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
