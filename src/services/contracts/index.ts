/**
 * Contract service wrappers.
 * Thin wrappers around the contract interfaces that add error handling,
 * logging, and event emission. Intended for use in API routes and agent tasks.
 */

import logger from '@/observability/logger';
import type { ContractName } from '@/web3/contracts/interfaces';

export interface ContractCallResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  txHash?: string;
  gasUsed?: bigint;
}

/**
 * Safe wrapper that executes a contract call and normalises the response.
 */
export async function safeContractCall<T>(
  contractName: ContractName,
  method: string,
  fn: () => Promise<T>,
): Promise<ContractCallResult<T>> {
  const start = Date.now();
  try {
    const data = await fn();
    logger.info('Contract call succeeded', {
      contract: contractName,
      method,
      durationMs: Date.now() - start,
    });
    return { success: true, data };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error('Contract call failed', {
      contract: contractName,
      method,
      error,
      durationMs: Date.now() - start,
    });
    return { success: false, error };
  }
}

/**
 * Parse a contract revert reason from an ethers / viem error.
 */
export function parseRevertReason(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.reason === 'string') return e.reason;
    if (typeof e.message === 'string') {
      const match = /reverted with reason string '(.+?)'/.exec(e.message);
      if (match) return match[1];
      return e.message;
    }
  }
  return 'Unknown contract error';
}

/**
 * Registry of deployed contract addresses per chain.
 * Populated from environment variables at startup.
 */
export const CONTRACT_ADDRESSES: Record<string, Record<ContractName, string>> = {
  base: {
    LiraToken: process.env.NEXT_PUBLIC_LIRA_TOKEN ?? '',
    LiraTokenRegistry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? '',
    TokenLaunchFactory: process.env.NEXT_PUBLIC_FACTORY ?? '',
    LiraProfile: process.env.NEXT_PUBLIC_PROFILE_ADDRESS ?? '',
    LiraSocialGraph: process.env.NEXT_PUBLIC_SOCIAL_GRAPH_ADDRESS ?? '',
    AgentExecutor: process.env.NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS ?? '',
    LiraAccessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN_ADDRESS ?? '',
  },
  'base-sepolia': {
    LiraToken: process.env.NEXT_PUBLIC_LIRA_TOKEN ?? '',
    LiraTokenRegistry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? '',
    TokenLaunchFactory: process.env.NEXT_PUBLIC_FACTORY ?? '',
    LiraProfile: process.env.NEXT_PUBLIC_PROFILE_ADDRESS ?? '',
    LiraSocialGraph: process.env.NEXT_PUBLIC_SOCIAL_GRAPH_ADDRESS ?? '',
    AgentExecutor: process.env.NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS ?? '',
    LiraAccessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN_ADDRESS ?? '',
  },
};

export function getContractAddress(
  chain: string,
  contract: ContractName,
): string | undefined {
  return CONTRACT_ADDRESSES[chain]?.[contract];
}
