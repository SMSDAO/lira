/**
 * Indexer Configuration
 * Manages network connections and contract addresses
 */

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  startBlock?: number;
}

export interface ContractConfig {
  name: string;
  address: string;
  abi: any[];
  events: string[];
}

// Network configurations
export const NETWORKS: Record<string, NetworkConfig> = {
  'base-sepolia': {
    name: 'Base Sepolia',
    rpcUrl: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    chainId: 84532,
    startBlock: parseInt(process.env.START_BLOCK_SEPOLIA || '0'),
  },
  'base-mainnet': {
    name: 'Base Mainnet',
    rpcUrl: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
    chainId: 8453,
    startBlock: parseInt(process.env.START_BLOCK_MAINNET || '0'),
  },
};

// Contract addresses (from environment or deployment)
export const CONTRACTS: Record<string, ContractConfig> = {
  LiraToken: {
    name: 'LiraToken',
    address: process.env.NEXT_PUBLIC_LIRA_TOKEN || '',
    abi: [], // Import from artifacts
    events: ['Transfer', 'Approval', 'TreasuryUpdated', 'ProtocolFeeUpdated'],
  },
  LiraTokenRegistry: {
    name: 'LiraTokenRegistry',
    address: process.env.NEXT_PUBLIC_LIRA_REGISTRY || '',
    abi: [],
    events: ['TokenRegistered', 'TokenUpdated', 'TokenRemoved', 'DAOOperatorSet', 'TokenFactoryUpdated'],
  },
  TokenLaunchFactory: {
    name: 'TokenLaunchFactory',
    address: process.env.NEXT_PUBLIC_FACTORY || '',
    abi: [],
    events: ['TokenLaunched'],
  },
  LiraUserTokenFactory: {
    name: 'LiraUserTokenFactory',
    address: process.env.NEXT_PUBLIC_USER_TOKEN_FACTORY || '',
    abi: [],
    events: ['ReputationTokenCreated', 'SocialTokenCreated', 'AccessTokenCreated'],
  },
  LiraProfile: {
    name: 'LiraProfile',
    address: process.env.NEXT_PUBLIC_LIRA_PROFILE || '',
    abi: [],
    events: ['ProfileCreated', 'ProfileUpdated', 'HandleUpdated', 'PrimaryTokenLinked'],
  },
  LiraSocialGraph: {
    name: 'LiraSocialGraph',
    address: process.env.NEXT_PUBLIC_LIRA_SOCIAL_GRAPH || '',
    abi: [],
    events: ['Followed', 'Unfollowed', 'Blocked', 'Unblocked', 'Muted', 'Unmuted'],
  },
};

// Indexer configuration
export const INDEXER_CONFIG = {
  pollInterval: parseInt(process.env.INDEXER_POLL_INTERVAL || '5000'), // 5 seconds
  batchSize: parseInt(process.env.INDEXER_BATCH_SIZE || '1000'),
  retryAttempts: parseInt(process.env.INDEXER_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.INDEXER_RETRY_DELAY || '1000'),
  logLevel: process.env.INDEXER_LOG_LEVEL || 'info',
};

// Database URL
export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/lira';

// Active network (from environment)
export const ACTIVE_NETWORK = process.env.INDEXER_NETWORK || 'base-sepolia';
