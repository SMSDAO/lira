/**
 * Web3 social integration – Farcaster & Zora.
 * Provides helpers for publishing casts, minting NFTs, and fetching
 * creator analytics without modifying any existing social API routes.
 */

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
  revenueEth: number;
}

/** Aggregate creator analytics from on-chain and social data. */
export async function getCreatorAnalytics(
  address: string,
): Promise<CreatorAnalytics> {
  // Stub: in production query Zora subgraph + Farcaster Hub
  return {
    address,
    totalMints: 0,
    totalVolume: 0n,
    topCollectors: [],
    recentCasts: 0,
    followerCount: 0,
    revenueEth: 0,
  };
}
