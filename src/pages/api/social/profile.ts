import type { NextApiRequest, NextApiResponse } from 'next';

// Mock data - replace with actual database
const mockProfiles: Record<string, any> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address is required' });
    }

    const profile = mockProfiles[address.toLowerCase()];
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json(profile);
  }

  if (req.method === 'POST') {
    const { handle, bio, avatar, website, walletAddress } = req.body;

    if (!walletAddress || !handle) {
      return res.status(400).json({ error: 'Wallet address and handle required' });
    }

    const handleRegex = /^[a-zA-Z0-9_]{1,32}$/;
    if (!handleRegex.test(handle)) {
      return res.status(400).json({ error: 'Invalid handle format' });
    }

    const addressKey = walletAddress.toLowerCase();
    const isNew = !mockProfiles[addressKey];

    mockProfiles[addressKey] = {
      address: walletAddress,
      handle,
      bio: bio || '',
      avatar: avatar || '',
      website: website || '',
      updatedAt: new Date().toISOString(),
    };

    return res.status(isNew ? 201 : 200).json({
      message: 'Profile saved',
      profile: mockProfiles[addressKey],
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
