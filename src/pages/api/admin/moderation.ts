import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '20', flagged = 'false' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Query recent posts
      const [posts, total, blocks] = await Promise.all([
        prisma.post.findMany({
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              include: { profile: true }
            }
          }
        }),
        prisma.post.count(),
        prisma.socialEdge.findMany({
          where: { edgeType: 'block' },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            follower: { include: { profile: true } },
            following: { include: { profile: true } }
          }
        })
      ]);

      res.status(200).json({
        posts,
        blocks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching moderation data:', error);
      res.status(500).json({ error: 'Failed to fetch moderation data' });
    }
  } else if (req.method === 'DELETE') {
    // Soft delete a post
    try {
      const { postId } = req.body;

      if (!postId) {
        return res.status(400).json({ error: 'Post ID required' });
      }

      await prisma.post.delete({
        where: { id: postId }
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  } else if (req.method === 'POST') {
    // Mute/unmute user
    try {
      const { fromAddress, toAddress, action } = req.body;

      if (!fromAddress || !toAddress || !action) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get or create users
      const [fromUser, toUser] = await Promise.all([
        prisma.user.upsert({
          where: { walletAddress: fromAddress },
          update: {},
          create: { walletAddress: fromAddress }
        }),
        prisma.user.upsert({
          where: { walletAddress: toAddress },
          update: {},
          create: { walletAddress: toAddress }
        })
      ]);

      if (action === 'mute') {
        await prisma.socialEdge.create({
          data: {
            followerId: fromUser.id,
            followingId: toUser.id,
            edgeType: 'mute'
          }
        });
      } else if (action === 'unmute') {
        await prisma.socialEdge.deleteMany({
          where: {
            followerId: fromUser.id,
            followingId: toUser.id,
            edgeType: 'mute'
          }
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error performing moderation action:', error);
      res.status(500).json({ error: 'Failed to perform action' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
