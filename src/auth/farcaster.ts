/**
 * Farcaster authentication utilities.
 *
 * Implements decentralised login via the Farcaster protocol:
 *  - Sign-In-With-Farcaster (SIWF) message construction
 *  - Custody wallet verification
 *  - Profile data mapping
 *  - Creator identity extraction
 */

export interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  bio?: string;
  pfpUrl?: string;
  custodyAddress: string;
  verifiedAddresses: string[];
  followerCount: number;
  followingCount: number;
  isCreator: boolean;
}

export interface FarcasterAuthPayload {
  fid: number;
  username: string;
  custodyAddress: string;
  /** Hex-encoded signature over the SIWF message */
  signature: string;
  /** The original message that was signed */
  message: string;
  nonce: string;
  issuedAt: string;
}

/** Farcaster Hub endpoint (public, no auth required for read) */
const FARCASTER_HUB = 'https://hub.pinata.cloud';

/**
 * Fetch a basic Farcaster profile by FID.
 * Returns null if the FID does not exist or the Hub is unreachable.
 */
export async function fetchFarcasterProfile(fid: number): Promise<FarcasterProfile | null> {
  try {
    const res = await fetch(`${FARCASTER_HUB}/v1/userDataByFid?fid=${fid}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      messages?: Array<{
        data?: {
          userDataBody?: { type: string; value: string };
        };
      }>;
    };

    // Collect fields from the message stream
    let username = '';
    let displayName = '';
    let bio = '';
    let pfpUrl = '';

    for (const msg of data.messages ?? []) {
      const body = msg.data?.userDataBody;
      if (!body) continue;
      switch (body.type) {
        case 'USER_DATA_TYPE_USERNAME':
          username = body.value;
          break;
        case 'USER_DATA_TYPE_DISPLAY':
          displayName = body.value;
          break;
        case 'USER_DATA_TYPE_BIO':
          bio = body.value;
          break;
        case 'USER_DATA_TYPE_PFP':
          pfpUrl = body.value;
          break;
      }
    }

    return {
      fid,
      username,
      displayName: displayName || username,
      bio,
      pfpUrl,
      custodyAddress: '',
      verifiedAddresses: [],
      followerCount: 0,
      followingCount: 0,
      isCreator: false,
    };
  } catch {
    return null;
  }
}

/**
 * Build a Sign-In-With-Farcaster message for the given custody address.
 * The message follows the same format as SIWE so it can be signed with
 * any EIP-191-compatible wallet.
 */
export function buildSiwfMessage(params: {
  domain: string;
  custodyAddress: string;
  fid: number;
  nonce: string;
}): string {
  const { domain, custodyAddress, fid, nonce } = params;
  const issuedAt = new Date().toISOString();
  const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  return [
    `${domain} wants you to sign in with your Farcaster account:`,
    custodyAddress,
    '',
    `Farcaster FID: ${fid}`,
    '',
    `URI: https://${domain}`,
    `Version: 1`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expiry}`,
  ].join('\n');
}

/** Map a Farcaster profile to Lira creator identity metadata. */
export function toCreatorIdentity(profile: FarcasterProfile): {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  verifiedAddresses: string[];
} {
  return {
    handle: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.pfpUrl,
    bio: profile.bio,
    verifiedAddresses: [profile.custodyAddress, ...profile.verifiedAddresses].filter(Boolean),
  };
}
