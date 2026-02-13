import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { followerAddress, followingAddress, action } = req.body;

  if (!followerAddress || !followingAddress) {
    return res.status(400).json({ error: 'Both addresses required' });
  }

  if (!['follow', 'unfollow', 'block', 'unblock', 'mute', 'unmute'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  if (followerAddress.toLowerCase() === followingAddress.toLowerCase()) {
    return res.status(400).json({ error: 'Cannot perform action on yourself' });
  }

  try {
    const followerKey = followerAddress.toLowerCase();
    const followingKey = followingAddress.toLowerCase();

    // Ensure both users exist
    const [follower, following] = await Promise.all([
      prisma.user.upsert({
        where: { walletAddress: followerKey },
        create: { walletAddress: followerKey },
        update: {},
      }),
      prisma.user.upsert({
        where: { walletAddress: followingKey },
        create: { walletAddress: followingKey },
        update: {},
      }),
    ]);

    if (action === 'follow') {
      // Create follow edge if it doesn't exist
      await prisma.socialEdge.upsert({
        where: {
          followerId_followingId_edgeType: {
            followerId: follower.id,
            followingId: following.id,
            edgeType: 'follow',
          },
        },
        create: {
          followerId: follower.id,
          followingId: following.id,
          edgeType: 'follow',
        },
        update: {},
      });

      return res.status(200).json({ message: 'Followed successfully' });
    }

    if (action === 'unfollow') {
      // Delete follow edge
      await prisma.socialEdge.deleteMany({
        where: {
          followerId: follower.id,
          followingId: following.id,
          edgeType: 'follow',
        },
      });

      return res.status(200).json({ message: 'Unfollowed successfully' });
    }

    if (action === 'block') {
      // Create block edge and remove follow if exists
      await prisma.$transaction([
        prisma.socialEdge.deleteMany({
          where: {
            followerId: follower.id,
            followingId: following.id,
            edgeType: 'follow',
          },
        }),
        prisma.socialEdge.upsert({
          where: {
            followerId_followingId_edgeType: {
              followerId: follower.id,
              followingId: following.id,
              edgeType: 'block',
            },
          },
          create: {
            followerId: follower.id,
            followingId: following.id,
            edgeType: 'block',
          },
          update: {},
        }),
      ]);

      return res.status(200).json({ message: 'Blocked successfully' });
    }

    if (action === 'unblock') {
      // Delete block edge
      await prisma.socialEdge.deleteMany({
        where: {
          followerId: follower.id,
          followingId: following.id,
          edgeType: 'block',
        },
      });

      return res.status(200).json({ message: 'Unblocked successfully' });
    }

    if (action === 'mute') {
      // Create mute edge
      await prisma.socialEdge.upsert({
        where: {
          followerId_followingId_edgeType: {
            followerId: follower.id,
            followingId: following.id,
            edgeType: 'mute',
          },
        },
        create: {
          followerId: follower.id,
          followingId: following.id,
          edgeType: 'mute',
        },
        update: {},
      });

      return res.status(200).json({ message: 'Muted successfully' });
    }

    if (action === 'unmute') {
      // Delete mute edge
      await prisma.socialEdge.deleteMany({
        where: {
          followerId: follower.id,
          followingId: following.id,
          edgeType: 'mute',
        },
      });

      return res.status(200).json({ message: 'Unmuted successfully' });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error('Error processing social action:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
