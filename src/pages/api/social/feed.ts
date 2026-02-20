import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, filter = 'global', page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 100);
  const skip = (pageNum - 1) * limitNum;

  try {
    let posts;
    let total;

    if (filter === 'following' && address && typeof address === 'string') {
      // Get posts from users that the address follows
      const user = await prisma.user.findUnique({
        where: { walletAddress: address.toLowerCase() },
      });

      if (!user) {
        return res.status(200).json({
          posts: [],
          page: pageNum,
          limit: limitNum,
          total: 0,
          hasMore: false,
        });
      }

      // Get IDs of users being followed
      const following = await prisma.socialEdge.findMany({
        where: {
          followerId: user.id,
          edgeType: 'follow',
        },
        select: { followingId: true },
      });

      const followingIds = following.map(f => f.followingId);

      [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            authorId: { in: followingIds },
          },
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.post.count({
          where: {
            authorId: { in: followingIds },
          },
        }),
      ]);
    } else {
      // Global feed - get all posts
      [posts, total] = await Promise.all([
        prisma.post.findMany({
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.post.count(),
      ]);
    }

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls || [],
      author: {
        address: post.author.walletAddress,
        handle: post.author.profile?.handle || 'anonymous',
        avatar: post.author.profile?.avatar || '',
      },
      createdAt: post.createdAt.toISOString(),
      likes: 0, // TODO: Implement likes system
      comments: 0, // TODO: Implement comments system
      shares: 0, // TODO: Implement shares system
    }));

    return res.status(200).json({
      posts: formattedPosts,
      page: pageNum,
      limit: limitNum,
      total,
      hasMore: skip + limitNum < total,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
