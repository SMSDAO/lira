/**
 * Auto-generated contract interfaces for all Lira smart contracts.
 * These types are derived from the ABI definitions in src/lib/contracts.ts.
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
  approve(spender: string, amount: bigint): Promise<boolean>;
  allowance(owner: string, spender: string): Promise<bigint>;
}

// ---------------------------------------------------------------------------
// LiraTokenRegistry
// ---------------------------------------------------------------------------

export interface ILiraTokenRegistry {
  registerToken(
    tokenAddress: string,
    creator: string,
    name: string,
    symbol: string,
    totalSupply: bigint,
  ): Promise<void>;
  getToken(tokenAddress: string): Promise<{
    tokenAddress: string;
    creator: string;
    name: string;
    symbol: string;
    totalSupply: bigint;
    registeredAt: bigint;
    active: boolean;
  }>;
  getTokensByCreator(creator: string): Promise<string[]>;
  isRegistered(tokenAddress: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// TokenLaunchFactory
// ---------------------------------------------------------------------------

export interface ITokenLaunchFactory {
  launchToken(
    name: string,
    symbol: string,
    totalSupply: bigint,
    launchFee: bigint,
  ): Promise<string>; // returns new token address
  getLaunchFee(): Promise<bigint>;
  setLaunchFee(fee: bigint): Promise<void>;
  getTokensLaunchedBy(creator: string): Promise<string[]>;
}

// ---------------------------------------------------------------------------
// LiraProfile
// ---------------------------------------------------------------------------

export interface ILiraProfile {
  createProfile(handle: string, metadataUri: string): Promise<void>;
  updateProfile(handle: string, metadataUri: string): Promise<void>;
  getProfile(owner: string): Promise<{ handle: string; metadataUri: string; createdAt: bigint }>;
  handleExists(handle: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// LiraSocialGraph
// ---------------------------------------------------------------------------

export interface ILiraSocialGraph {
  follow(target: string): Promise<void>;
  unfollow(target: string): Promise<void>;
  getFollowers(user: string): Promise<string[]>;
  getFollowing(user: string): Promise<string[]>;
  isFollowing(follower: string, target: string): Promise<boolean>;
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
