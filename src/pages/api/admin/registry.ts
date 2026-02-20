import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { 
        type, 
        creator, 
        status = 'active',
        page = '1',
        limit = '20'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};
      
      if (type) {
        where.tokenType = type;
      }
      
      if (creator) {
        where.creatorAddress = creator as string;
      }

      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }

      // Query tokens with stats
      const [tokens, total] = await Promise.all([
        prisma.token.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            stats: true,
            _count: {
              select: { events: true, roles: true }
            }
          }
        }),
        prisma.token.count({ where })
      ]);

      res.status(200).json({
        tokens,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching registry data:', error);
      res.status(500).json({ error: 'Failed to fetch registry data' });
    }
  } else if (req.method === 'PATCH') {
    // Update token status (approve/reject)
    try {
      const { tokenAddress, isActive } = req.body;

      if (!tokenAddress) {
        return res.status(400).json({ error: 'Token address required' });
      }

      const token = await prisma.token.update({
        where: { contractAddress: tokenAddress },
        data: { isActive }
      });

      res.status(200).json({ success: true, token });
    } catch (error) {
      console.error('Error updating token:', error);
      res.status(500).json({ error: 'Failed to update token' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
