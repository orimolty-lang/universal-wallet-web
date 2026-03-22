import { CHAIN_ID } from "@particle-network/universal-account-sdk";

export interface Chain {
  name: string;
  icon: string;
  id: string;
  chainId: CHAIN_ID;
}

export const supportedChains: Chain[] = [
  {
    name: "Solana",
    icon: "https://static.particle.network/chains/solana/icons/101.png",
    id: "solana",
    chainId: CHAIN_ID.SOLANA_MAINNET,
  },
  {
    name: "Ethereum",
    icon: "https://static.particle.network/chains/evm/icons/1.png",
    id: "ethereum",
    chainId: CHAIN_ID.ETHEREUM_MAINNET,
  },
  {
    name: "BNB Chain",
    icon: "https://static.particle.network/chains/evm/icons/56.png",
    id: "bnb_chain",
    chainId: CHAIN_ID.BSC_MAINNET,
  },
  {
    name: "Base",
    icon: "https://static.particle.network/chains/evm/icons/8453.png",
    id: "base",
    chainId: CHAIN_ID.BASE_MAINNET,
  },
  {
    name: "Arbitrum",
    icon: "https://static.particle.network/chains/evm/icons/42161.png",
    id: "arbitrum",
    chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE,
  },
  {
    name: "Avalanche",
    icon: "https://static.particle.network/chains/evm/icons/43114.png",
    id: "avalanche",
    chainId: CHAIN_ID.AVALANCHE_MAINNET,
  },
  {
    name: "Optimism",
    icon: "https://static.particle.network/chains/evm/icons/10.png",
    id: "optimism",
    chainId: CHAIN_ID.OPTIMISM_MAINNET,
  },
  {
    name: "Polygon",
    icon: "https://static.particle.network/chains/evm/icons/137.png",
    id: "polygon",
    chainId: CHAIN_ID.POLYGON_MAINNET,
  },
  {
    name: "HyperEVM",
    icon: "https://static.particle.network/chains/evm/icons/999.png",
    id: "hyper-evm",
    chainId: 999 as CHAIN_ID,
  },
  {
    name: "Berachain",
    icon: "https://static.particle.network/chains/evm/icons/80094.png",
    id: "berachain",
    chainId: CHAIN_ID.BERACHAIN_MAINNET,
  },
  {
    name: "Linea",
    icon: "https://static.particle.network/chains/evm/icons/59144.png",
    id: "linea",
    chainId: CHAIN_ID.LINEA_MAINNET,
  },
  {
    name: "Sonic",
    icon: "https://static.particle.network/chains/evm/icons/146.png",
    id: "sonic",
    chainId: CHAIN_ID.SONIC_MAINNET,
  },
  {
    name: "Merlin",
    icon: "https://static.particle.network/chains/evm/icons/4200.png",
    id: "merlin",
    chainId: CHAIN_ID.MERLIN_MAINNET,
  },
];
