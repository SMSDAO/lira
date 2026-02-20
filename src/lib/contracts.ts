/**
 * Smart Contract Integration Layer for Admin Control
 * Enables admin.exe on Windows 11 to sync and control all LIRA contracts
 * Compatible with Node 24+ and ethers.js v6
 */

import { ethers } from 'ethers';

// Contract addresses from environment (Vercel placeholders for production)
export const CONTRACT_ADDRESSES = {
  liraToken: process.env.NEXT_PUBLIC_LIRA_TOKEN || '',
  liraRegistry: process.env.NEXT_PUBLIC_LIRA_REGISTRY || '',
  liraProfile: process.env.NEXT_PUBLIC_LIRA_PROFILE || '',
  liraSocialGraph: process.env.NEXT_PUBLIC_LIRA_SOCIAL_GRAPH || '',
  tokenFactory: process.env.NEXT_PUBLIC_FACTORY || '',
  userTokenFactory: process.env.NEXT_PUBLIC_USER_FACTORY || '',
  adminWallet: process.env.NEXT_PUBLIC_ADMIN_WALLET || '',
};

// RPC endpoints (public sources for Vercel build)
export const RPC_ENDPOINTS = {
  baseSepolia: process.env.NEXT_PUBLIC_RPC_BASE_SEPOLIA || 'https://sepolia.base.org',
  baseMainnet: process.env.NEXT_PUBLIC_RPC_BASE_MAINNET || 'https://mainnet.base.org',
};

// Get provider (public RPC for read operations)
export function getProvider(network: 'sepolia' | 'mainnet' = 'mainnet'): ethers.JsonRpcProvider {
  const rpcUrl = network === 'sepolia' ? RPC_ENDPOINTS.baseSepolia : RPC_ENDPOINTS.baseMainnet;
  return new ethers.JsonRpcProvider(rpcUrl);
}

// Get signer (for admin operations via wallet)
export function getSigner(walletProvider: any): ethers.Signer {
  return new ethers.BrowserProvider(walletProvider).getSigner();
}

/**
 * Contract ABIs (minimal interfaces for admin operations)
 * These are production-safe and don't require full contract compilation
 */
export const CONTRACT_ABIS = {
  // LiraToken - ERC20 + Governance
  liraToken: [
    'function balanceOf(address account) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function setTreasury(address treasury) external',
    'function setProtocolFee(uint256 fee) external',
    'function transfer(address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ],

  // LiraTokenRegistry - Token management
  liraRegistry: [
    'function getToken(address tokenAddress) view returns (tuple(address contractAddress, address owner, uint8 tokenType, string name, string symbol, bool isActive, uint256 createdAt))',
    'function getAllTokens() view returns (address[])',
    'function getTokensByType(uint8 tokenType) view returns (address[])',
    'function getTokensByOwner(address owner) view returns (address[])',
    'function setDAOOperator(address operator, bool status) external',
    'function setTokenFactory(address factory) external',
    'function registerToken(address tokenAddress, address owner, uint8 tokenType) external',
    'function updateToken(address tokenAddress, bool isActive) external',
    'event TokenRegistered(address indexed tokenAddress, address indexed owner, uint8 tokenType)',
    'event TokenUpdated(address indexed tokenAddress, bool isActive)',
    'event DAOOperatorSet(address indexed operator, bool status)',
  ],

  // LiraProfile - User profiles
  liraProfile: [
    'function getProfile(address user) view returns (tuple(string handle, string metadataURI, address primaryToken, uint256 createdAt))',
    'function createProfile(string handle, string metadataURI) external',
    'function updateProfile(string metadataURI) external',
    'event ProfileCreated(address indexed user, string handle)',
    'event ProfileUpdated(address indexed user, string metadataURI)',
  ],

  // LiraSocialGraph - Social relationships
  liraSocialGraph: [
    'function isFollowing(address follower, address following) view returns (bool)',
    'function getFollowers(address user) view returns (address[])',
    'function getFollowing(address user) view returns (address[])',
    'function follow(address user) external',
    'function unfollow(address user) external',
    'function block(address user) external',
    'function unblock(address user) external',
    'event Followed(address indexed follower, address indexed following)',
    'event Unfollowed(address indexed follower, address indexed following)',
  ],

  // TokenLaunchFactory - Project token launches
  tokenFactory: [
    'function launchToken(string name, string symbol, uint256 initialSupply, uint256 liquidityAmount) external payable returns (address)',
    'function getLaunchedTokens(address creator) view returns (address[])',
    'event TokenLaunched(address indexed tokenAddress, address indexed creator, string name, string symbol)',
  ],

  // LiraUserTokenFactory - User/Social tokens
  userTokenFactory: [
    'function createReputationToken(string name, string symbol) external returns (address)',
    'function createSocialToken(string name, string symbol, uint256 maxSupply) external returns (address)',
    'function createAccessToken(string name, string symbol, uint256 initialSupply) external returns (address)',
    'function getCreatedTokens(address creator) view returns (address[])',
    'event ReputationTokenCreated(address indexed tokenAddress, address indexed creator)',
    'event SocialTokenCreated(address indexed tokenAddress, address indexed creator)',
    'event AccessTokenCreated(address indexed tokenAddress, address indexed creator)',
  ],
};

/**
 * Get contract instance for reading (no wallet required)
 */
export function getContract(
  contractName: keyof typeof CONTRACT_ADDRESSES,
  network: 'sepolia' | 'mainnet' = 'mainnet'
): ethers.Contract {
  const address = CONTRACT_ADDRESSES[contractName];
  const provider = getProvider(network);
  const abi = CONTRACT_ABIS[contractName] || [];
  
  return new ethers.Contract(address, abi, provider);
}

/**
 * Get contract instance for writing (wallet required)
 */
export function getContractWithSigner(
  contractName: keyof typeof CONTRACT_ADDRESSES,
  signer: ethers.Signer
): ethers.Contract {
  const address = CONTRACT_ADDRESSES[contractName];
  const abi = CONTRACT_ABIS[contractName] || [];
  
  return new ethers.Contract(address, abi, signer);
}

/**
 * Admin Contract Operations
 * All operations sync with blockchain and update local state
 */
export class AdminContractController {
  private provider: ethers.JsonRpcProvider;
  private network: 'sepolia' | 'mainnet';

  constructor(network: 'sepolia' | 'mainnet' = 'mainnet') {
    this.network = network;
    this.provider = getProvider(network);
  }

  // Get all contract addresses (for admin UI display)
  async getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }

  // Get network info
  async getNetworkInfo() {
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    
    return {
      chainId: Number(network.chainId),
      name: network.name,
      blockNumber,
      rpcUrl: this.network === 'sepolia' ? RPC_ENDPOINTS.baseSepolia : RPC_ENDPOINTS.baseMainnet,
    };
  }

  // Get LIRA token info
  async getLiraTokenInfo() {
    const contract = getContract('liraToken', this.network);
    
    try {
      const totalSupply = await contract.totalSupply();
      return {
        address: CONTRACT_ADDRESSES.liraToken,
        totalSupply: ethers.formatEther(totalSupply),
        decimals: 18,
        symbol: 'LIRA',
      };
    } catch (error) {
      console.error('Error fetching LIRA token info:', error);
      return null;
    }
  }

  // Get registry stats
  async getRegistryStats() {
    const contract = getContract('liraRegistry', this.network);
    
    try {
      const allTokens = await contract.getAllTokens();
      return {
        totalTokens: allTokens.length,
        registryAddress: CONTRACT_ADDRESSES.liraRegistry,
      };
    } catch (error) {
      console.error('Error fetching registry stats:', error);
      return { totalTokens: 0, registryAddress: CONTRACT_ADDRESSES.liraRegistry };
    }
  }

  // Get all registered tokens (for admin management)
  async getAllRegisteredTokens() {
    const contract = getContract('liraRegistry', this.network);
    
    try {
      const tokenAddresses = await contract.getAllTokens();
      const tokens = [];

      for (const address of tokenAddresses) {
        try {
          const tokenInfo = await contract.getToken(address);
          tokens.push({
            address: address,
            owner: tokenInfo.owner,
            tokenType: Number(tokenInfo.tokenType), // 0=PROJECT, 1=USER, 2=SOCIAL
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            isActive: tokenInfo.isActive,
            createdAt: Number(tokenInfo.createdAt),
          });
        } catch (err) {
          console.warn(`Failed to fetch token ${address}:`, err);
        }
      }

      return tokens;
    } catch (error) {
      console.error('Error fetching registered tokens:', error);
      return [];
    }
  }

  // Set DAO operator (admin operation - requires signer)
  async setDAOOperator(operatorAddress: string, status: boolean, signer: ethers.Signer) {
    const contract = getContractWithSigner('liraRegistry', signer);
    
    try {
      const tx = await contract.setDAOOperator(operatorAddress, status);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error setting DAO operator:', error);
      return { success: false, error: error.message };
    }
  }

  // Update token status (admin operation - requires signer)
  async updateTokenStatus(tokenAddress: string, isActive: boolean, signer: ethers.Signer) {
    const contract = getContractWithSigner('liraRegistry', signer);
    
    try {
      const tx = await contract.updateToken(tokenAddress, isActive);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error updating token status:', error);
      return { success: false, error: error.message };
    }
  }

  // Set protocol fee (admin operation - requires signer)
  async setProtocolFee(feeInBasisPoints: number, signer: ethers.Signer) {
    const contract = getContractWithSigner('liraToken', signer);
    
    try {
      const tx = await contract.setProtocolFee(feeInBasisPoints);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error setting protocol fee:', error);
      return { success: false, error: error.message };
    }
  }

  // Get treasury balance
  async getTreasuryBalance() {
    if (!CONTRACT_ADDRESSES.adminWallet) {
      return { eth: '0', lira: '0' };
    }

    try {
      const ethBalance = await this.provider.getBalance(CONTRACT_ADDRESSES.adminWallet);
      const liraContract = getContract('liraToken', this.network);
      const liraBalance = await liraContract.balanceOf(CONTRACT_ADDRESSES.adminWallet);

      return {
        eth: ethers.formatEther(ethBalance),
        lira: ethers.formatEther(liraBalance),
      };
    } catch (error) {
      console.error('Error fetching treasury balance:', error);
      return { eth: '0', lira: '0' };
    }
  }
}

// Export singleton instance for easy use
export const adminController = new AdminContractController(
  process.env.NODE_ENV === 'production' ? 'mainnet' : 'sepolia'
);
