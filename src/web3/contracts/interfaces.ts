/**
 * TypeScript interfaces for all Lira smart contracts.
 *
 * The first five interfaces (ILiraToken, ILiraTokenRegistry, ITokenLaunchFactory,
 * ILiraProfile, ILiraSocialGraph) are derived from CONTRACT_ABIS in src/lib/contracts.ts
 * and must be kept in sync with those ABIs.
 *
 * IAgentExecutor and ILiraAccessToken are planned contracts that have not yet been
 * deployed; they are provided here for early type-safety and have no corresponding
 * entries in CONTRACT_ABIS or scripts/validate-env.ts yet.
 */

// ---------------------------------------------------------------------------
// LiraToken
// ---------------------------------------------------------------------------

export interface ILiraToken {
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  totalSupply(): Promise<bigint>;
  balanceOf(account: string): Promise<bigint>;
  transfer(to: string, amount: bigint): Promise<boolean>;
  setTreasury(treasury: string): Promise<void>;
  setProtocolFee(fee: bigint): Promise<void>;
}

// ---------------------------------------------------------------------------
// LiraTokenRegistry
// ---------------------------------------------------------------------------

/** Matches the tuple returned by getToken() in the registry ABI. */
export interface RegistryTokenInfo {
  contractAddress: string;
  owner: string;
  tokenType: number;    // uint8
  name: string;
  symbol: string;
  isActive: boolean;
  createdAt: bigint;
}

export interface ILiraTokenRegistry {
  /** registerToken(address tokenAddress, address owner, uint8 tokenType) */
  registerToken(tokenAddress: string, owner: string, tokenType: number): Promise<void>;
  updateToken(tokenAddress: string, isActive: boolean): Promise<void>;
  getToken(tokenAddress: string): Promise<RegistryTokenInfo>;
  getAllTokens(): Promise<string[]>;
  getTokensByType(tokenType: number): Promise<string[]>;
  getTokensByOwner(owner: string): Promise<string[]>;
  setDAOOperator(operator: string, status: boolean): Promise<void>;
  setTokenFactory(factory: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// TokenLaunchFactory
// ---------------------------------------------------------------------------

export interface ITokenLaunchFactory {
  /**
   * launchToken(string name, string symbol, uint256 initialSupply, uint256 liquidityAmount)
   * payable – caller must supply ETH for the launch fee
   */
  launchToken(
    name: string,
    symbol: string,
    initialSupply: bigint,
    liquidityAmount: bigint,
  ): Promise<string>; // returns new token address
  getLaunchedTokens(creator: string): Promise<string[]>;
}

// ---------------------------------------------------------------------------
// LiraProfile
// ---------------------------------------------------------------------------

/** Matches the tuple returned by getProfile() in the profile ABI. */
export interface ProfileInfo {
  handle: string;
  metadataURI: string;
  primaryToken: string;
  createdAt: bigint;
}

export interface ILiraProfile {
  createProfile(handle: string, metadataURI: string): Promise<void>;
  updateProfile(metadataURI: string): Promise<void>;
  getProfile(user: string): Promise<ProfileInfo>;
}

// ---------------------------------------------------------------------------
// LiraSocialGraph
// ---------------------------------------------------------------------------

export interface ILiraSocialGraph {
  follow(user: string): Promise<void>;
  unfollow(user: string): Promise<void>;
  block(user: string): Promise<void>;
  unblock(user: string): Promise<void>;
  getFollowers(user: string): Promise<string[]>;
  getFollowing(user: string): Promise<string[]>;
  isFollowing(follower: string, following: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// AgentExecutor
// ---------------------------------------------------------------------------

export interface IAgentExecutor {
  executeTask(
    agentId: string,
    taskType: string,
    payload: string, // JSON-encoded
  ): Promise<string>; // returns task ID
  getTaskResult(taskId: string): Promise<{ success: boolean; result: string }>;
  isAuthorizedAgent(agentAddress: string): Promise<boolean>;
  authorizeAgent(agentAddress: string): Promise<void>;
  revokeAgent(agentAddress: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// LiraAccessToken
// ---------------------------------------------------------------------------

export interface ILiraAccessToken {
  mint(to: string, tokenId: bigint, amount: bigint, data: Uint8Array): Promise<void>;
  balanceOf(account: string, tokenId: bigint): Promise<bigint>;
  safeTransferFrom(
    from: string,
    to: string,
    tokenId: bigint,
    amount: bigint,
    data: Uint8Array,
  ): Promise<void>;
}

// ---------------------------------------------------------------------------
// Union type
// ---------------------------------------------------------------------------

export type ContractInterface =
  | ILiraToken
  | ILiraTokenRegistry
  | ITokenLaunchFactory
  | ILiraProfile
  | ILiraSocialGraph
  | IAgentExecutor
  | ILiraAccessToken;

export type ContractName =
  | 'LiraToken'
  | 'LiraTokenRegistry'
  | 'TokenLaunchFactory'
  | 'LiraProfile'
  | 'LiraSocialGraph'
  | 'AgentExecutor'
  | 'LiraAccessToken';
