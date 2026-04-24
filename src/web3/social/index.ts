/**
 * Web3 social integration – Farcaster & Zora.
 * Provides helpers for publishing casts, minting NFTs, and fetching
 * creator analytics without modifying any existing social API routes.
 */

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Farcaster
// ---------------------------------------------------------------------------

export interface FarcasterCastPayload {
  /** Farcaster FID of the author */
  fid: number;
  /** Cast text (max 320 characters) */
  text: string;
  /** Optional embed URL */
  embedUrl?: string;
  /** Optional parent cast hash for replies */
  parentHash?: string;
}

export interface PublishedCast {
  hash: string;
  fid: number;
  text: string;
  timestamp: number;
  url: string;
}

/**
 * Publish a cast to Farcaster via the Warpcast / Hub REST API.
 * Requires a valid signer UUID from the Farcaster Auth Kit.
 *
 * NOTE: This is a stub. Production usage requires a signerUuid obtained through
 * Farcaster Auth Kit (client-side signing). Call this function only when you
 * have wired a real Hub endpoint and a valid signerUuid.
 *
 * @throws {Error} Always – the production integration is not yet implemented.
 */
export async function publishFarcasterCast(
  _payload: FarcasterCastPayload,
  _signerUuid?: string,
): Promise<PublishedCast | null> {
  throw new Error(
    'publishFarcasterCast is not yet implemented. ' +
    'Wire a real Farcaster Hub endpoint and a valid signerUuid to enable this feature.',
  );
}

// ---------------------------------------------------------------------------
// Zora
// ---------------------------------------------------------------------------

export interface ZoraMintParams {
  /** ERC-1155 contract address on Base */
  contractAddress: string;
  /** Token ID to mint */
  tokenId: bigint;
  /** Quantity to mint */
  quantity: bigint;
  /** Recipient wallet address */
  to: string;
  /** Comment attached to the mint */
  comment?: string;
}

export interface MintReceipt {
  txHash: string;
  contractAddress: string;
  tokenId: bigint;
  quantity: bigint;
  to: string;
  mintedAt: number;
}

/**
 * Mint a Zora NFT via the Zora Protocol SDK.
 *
 * NOTE: This is a stub. Production usage requires the `@zoralabs/protocol-sdk`
 * package and a wallet signer. This function will throw until implemented.
 *
 * @throws {Error} Always – the production integration is not yet implemented.
 */
export async function mintZoraNft(_params: ZoraMintParams): Promise<MintReceipt> {
  throw new Error(
    'mintZoraNft is not yet implemented. ' +
    'Install @zoralabs/protocol-sdk and provide a wallet signer to enable this feature.',
  );
}

// ---------------------------------------------------------------------------
// Creator analytics
// ---------------------------------------------------------------------------

export interface CreatorAnalytics {
  address: string;
  totalMints: number;
  totalVolume: bigint;
  topCollectors: Array<{ address: string; mintCount: number }>;
  recentCasts: number;
  followerCount: number;
  /** ETH-denominated revenue, formatted as a decimal string (e.g. "1.234567"). */
  revenueEth: string;
}

/**
 * Aggregate creator analytics from on-chain indexed data (Prisma) and social
 * data (SocialEdge). Off-chain Farcaster cast counts are not yet wired to a
 * Hub endpoint and always return 0 until an external integration is added.
 */
export async function getCreatorAnalytics(
  address: string,
): Promise<CreatorAnalytics> {
  const normalised = address.toLowerCase();

  // ── On-chain: tokens created by this address ───────────────────────────
  const createdTokenAddresses = await prisma.token.findMany({
    where: { creatorAddress: normalised },
    select: { contractAddress: true },
  });
  const tokenAddrs = createdTokenAddresses.map(t => t.contractAddress);

  // Total mints: count of Mint events on the creator's tokens
  const totalMints = tokenAddrs.length
    ? await prisma.tokenEvent.count({
        where: { tokenAddress: { in: tokenAddrs }, eventType: 'Mint' },
      })
    : 0;

  // Total volume (raw token units, summed across all creator tokens)
  const volumeAgg = tokenAddrs.length
    ? await prisma.tokenStat.aggregate({
        where: { tokenAddress: { in: tokenAddrs } },
        _sum: { volumeTotal: true },
      })
    : { _sum: { volumeTotal: null } };
  const rawVolume = volumeAgg._sum.volumeTotal;
  // Prisma Decimal.toFixed(0) gives exact integer string — safe for BigInt
  const totalVolume: bigint =
    rawVolume != null ? BigInt(rawVolume.toFixed(0)) : 0n;

  // Top collectors: wallets that received the most mints on creator's tokens
  const mintRecipients = tokenAddrs.length
    ? await prisma.tokenEvent.groupBy({
        by: ['toAddress'],
        where: {
          tokenAddress: { in: tokenAddrs },
          eventType: 'Mint',
          toAddress: { not: null },
        },
        _count: { toAddress: true },
        orderBy: { _count: { toAddress: 'desc' } },
        take: 10,
      })
    : [];
  // toAddress is guaranteed non-null by the `not: null` filter above
  const topCollectors = mintRecipients.map(r => ({
    address: r.toAddress!,
    mintCount: r._count.toAddress,
  }));

  // Revenue (ETH-denominated): sum of fee collections for this address
  const feeAgg = await prisma.feeCollection.aggregate({
    where: { collectorAddress: normalised },
    _sum: { amount: true },
  });
  const rawFee = feeAgg._sum.amount;
  // Use exact Decimal division (avoids Number overflow/Infinity for large wei values).
  // Result is a fixed-point string with 6 decimal places (e.g. "1.234567").
  const ETHER_WEI = new Prisma.Decimal('1e18');
  const REVENUE_DECIMAL_PLACES = 6;
  const revenueEth: string =
    rawFee != null
      ? rawFee.div(ETHER_WEI).toDecimalPlaces(REVENUE_DECIMAL_PLACES).toFixed(REVENUE_DECIMAL_PLACES)
      : '0.000000';

  // ── Social: follower count from Prisma SocialEdge ──────────────────────
  // Look up the user record by wallet address to get the Integer PK
  const user = await prisma.user.findUnique({
    where: { walletAddress: normalised },
    select: { id: true },
  });
  const followerCount = user
    ? await prisma.socialEdge.count({
        where: { followingId: user.id, edgeType: 'follow' },
      })
    : 0;

  return {
    address,
    totalMints,
    totalVolume,
    topCollectors,
    // recentCasts requires an external Farcaster Hub – not yet wired
    recentCasts: 0,
    followerCount,
    revenueEth,
  };
}
