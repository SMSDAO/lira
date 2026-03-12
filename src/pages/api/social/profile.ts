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
        handle: user.handle,
        bio: user.profile.bio,
        avatar: user.profile.avatarUrl,
        website: user.profile.website || '',
        twitter: user.profile.twitter || '',
        discord: user.profile.discord || '',
        updatedAt: user.profile.updatedAt.toISOString(),
        createdAt: user.createdAt.toISOString(),
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const { handle, bio, avatar, website, twitter, discord, walletAddress } = req.body;

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
      const existingUser = await prisma.user.findUnique({
        where: { handle },
        include: { profile: true },
      });

      if (existingUser && existingUser.walletAddress !== addressKey) {
        return res.status(409).json({ error: 'Handle already taken' });
      }

      // Upsert user and profile
      const user = await prisma.user.upsert({
        where: { walletAddress: addressKey },
        create: {
          walletAddress: addressKey,
          handle,
          profile: {
            create: {
              bio: bio || '',
              avatarUrl: avatar || '',
              website: website || '',
              twitter: twitter || '',
              discord: discord || '',
            },
          },
        },
        update: {
          handle,
          profile: {
            upsert: {
              create: {
                bio: bio || '',
                avatarUrl: avatar || '',
                website: website || '',
                twitter: twitter || '',
                discord: discord || '',
              },
              update: {
                bio: bio || '',
                avatarUrl: avatar || '',
                website: website || '',
                twitter: twitter || '',
                discord: discord || '',
              },
            },
          },
        },
        include: { profile: true },
      });

      const isNew = !existingUser;

      return res.status(isNew ? 201 : 200).json({
        message: 'Profile saved',
        profile: {
          address: user.walletAddress,
          handle: user.handle,
          bio: user.profile!.bio,
          avatar: user.profile!.avatarUrl,
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

