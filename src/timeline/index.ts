/**
 * Timeline service – re-exports the TimelineStore and provides
 * convenience helpers used by API routes and dashboard components.
 */

export { TimelineStore } from '@/models/TimelineEvent';
export type { TimelineEvent, TimelineEventType, TimelineEventSeverity } from '@/models/TimelineEvent';
import { TimelineStore } from '@/models/TimelineEvent';
import type { TimelineEvent, TimelineEventType } from '@/models/TimelineEvent';

/** Singleton timeline store for the current process. */
export const timeline = TimelineStore.getInstance();

/** Record a user action event. */
export function trackUserAction(params: {
  userId: string;
  walletAddress?: string;
  /** Explicit timeline event type; use 'user.profile_update', 'user.wallet_connect', etc. */
  type?: TimelineEventType;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): TimelineEvent {
  return timeline.add({
    type: params.type ?? 'user.profile_update',
    severity: 'info',
    userId: params.userId,
    walletAddress: params.walletAddress,
    title: params.action,
    description: params.description,
    metadata: params.metadata,
  });
}

/** Record an on-chain wallet event. */
export function trackWalletEvent(params: {
  walletAddress: string;
  eventType: 'wallet.transfer' | 'wallet.nft_mint' | 'wallet.nft_transfer' | 'wallet.contract_call';
  txHash?: string;
  blockNumber?: number;
  chain?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): TimelineEvent {
  return timeline.add({
    type: params.eventType,
    severity: 'info',
    walletAddress: params.walletAddress,
    title: `Wallet ${params.eventType.split('.')[1]}`,
    description: params.description,
    txHash: params.txHash,
    blockNumber: params.blockNumber,
    chain: params.chain,
    metadata: params.metadata,
  });
}

/** Record a system alert. */
export function trackSystemAlert(params: {
  title: string;
  description?: string;
  severity?: 'info' | 'warning' | 'error';
  metadata?: Record<string, unknown>;
}): TimelineEvent {
  return timeline.add({
    type: 'system.alert',
    severity: params.severity ?? 'warning',
    title: params.title,
    description: params.description,
    metadata: params.metadata,
  });
}
