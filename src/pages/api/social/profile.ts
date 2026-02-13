import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address is required' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { walletAddress: address.toLowerCase() },
        include: { profile: true },
      });

      if (!user || !user.profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({
        address: user.walletAddress,
        handle: user.profile.handle,
        bio: user.profile.bio,
        avatar: user.profile.avatar,
        website: user.profile.socialLinks?.website || '',
        twitter: user.profile.socialLinks?.twitter || '',
        github: user.profile.socialLinks?.github || '',
        discord: user.profile.socialLinks?.discord || '',
        updatedAt: user.profile.updatedAt.toISOString(),
        createdAt: user.createdAt.toISOString(),
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const { handle, bio, avatar, website, twitter, github, discord, walletAddress } = req.body;

    if (!walletAddress || !handle) {
      return res.status(400).json({ error: 'Wallet address and handle required' });
    }

    const handleRegex = /^[a-zA-Z0-9_]{1,32}$/;
    if (!handleRegex.test(handle)) {
      return res.status(400).json({ error: 'Invalid handle format' });
    }

    try {
      const addressKey = walletAddress.toLowerCase();

      // Check if handle is already taken by another user
      const existingProfile = await prisma.profile.findUnique({
        where: { handle },
        include: { user: true },
      });

      if (existingProfile && existingProfile.user.walletAddress !== addressKey) {
        return res.status(409).json({ error: 'Handle already taken' });
      }

      // Upsert user and profile
      const user = await prisma.user.upsert({
        where: { walletAddress: addressKey },
        create: {
          walletAddress: addressKey,
          profile: {
            create: {
              handle,
              bio: bio || '',
              avatar: avatar || '',
              socialLinks: {
                website: website || '',
                twitter: twitter || '',
                github: github || '',
                discord: discord || '',
              },
            },
          },
        },
        update: {
          profile: {
            update: {
              handle,
              bio: bio || '',
              avatar: avatar || '',
              socialLinks: {
                website: website || '',
                twitter: twitter || '',
                github: github || '',
                discord: discord || '',
              },
            },
          },
        },
        include: { profile: true },
      });

      const isNew = !existingProfile;

      return res.status(isNew ? 201 : 200).json({
        message: 'Profile saved',
        profile: {
          address: user.walletAddress,
          handle: user.profile!.handle,
          bio: user.profile!.bio,
          avatar: user.profile!.avatar,
          updatedAt: user.profile!.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
