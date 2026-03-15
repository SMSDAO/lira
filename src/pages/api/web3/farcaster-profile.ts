import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchFarcasterProfile, toCreatorIdentity } from '@/auth/farcaster';
import { apiLimiter } from '@/security/rateLimit';

/**
 * GET /api/web3/farcaster-profile?fid=<fid>
 * Fetches a Farcaster profile and maps it to creator identity.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiLimiter(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { fid } = req.query;
  if (!fid || Array.isArray(fid)) return res.status(400).json({ error: 'fid is required' });

  const fidNum = parseInt(fid, 10);
  if (Number.isNaN(fidNum)) return res.status(400).json({ error: 'fid must be a number' });

  const profile = await fetchFarcasterProfile(fidNum);
  if (!profile) return res.status(404).json({ error: 'Farcaster profile not found' });

  return res.status(200).json({
    profile,
    creatorIdentity: toCreatorIdentity(profile),
  });
}
