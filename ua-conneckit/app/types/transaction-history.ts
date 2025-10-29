// Types for transaction history returned by getTransactions()
// This is different from ITransaction used for creating transactions

export interface ITransactionHistoryResponse {
  hasNextPage: boolean;
  data: ITransactionHistory[];
  currentPage: number;
}

export interface ITransactionHistory {
  transactionId: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
  targetToken: ITargetToken;
  change: ITransactionChange;
  detail: Record<string, unknown>;
  status: number;
  fromChains: number[];
  toChains: number[];
}

export interface ITargetToken {
  name: string;
  rank: number | null;
  image: string;
  price: number;
  symbol: string;
  address: string;
  assetId: string;
  chainId: number;
  decimals: number;
  realDecimals: number;
  type?: string;
  isToken2022?: boolean;
  isMultiChain?: boolean;
  isPrimaryToken?: boolean;
  isMultiChainDefault?: boolean;
}

export interface ITransactionChange {
  amount?: string;
  amountInUSD?: string;
  netAmountInUSD?: string;
  from: string;
  to: string;
}
