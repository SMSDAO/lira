import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address required' });
  }

  try {
    const addressKey = address.toLowerCase();

    // Find or create user
    const user = await prisma.user.findUnique({
      where: { walletAddress: addressKey },
    });

    if (!user) {
      // Return empty data for non-existent users
      return res.status(200).json({
        created: [],
        holding: [],
        social: [],
      });
    }

    // Get tokens created by this user
    const createdTokens = await prisma.token.findMany({
      where: { creatorAddress: addressKey },
      include: {
        stats: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get tokens held by this user
    const holdingRoles = await prisma.userTokenRole.findMany({
      where: {
        userId: user.id,
        role: 'holder',
      },
      include: {
        token: {
          include: {
            stats: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get social tokens (USER or SOCIAL type)
    const socialTokens = await prisma.token.findMany({
      where: {
        tokenType: { in: ['USER', 'SOCIAL'] },
        userRoles: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        stats: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatToken = (token: any, stats: any) => ({
      address: token.contractAddress,
      name: token.name,
      symbol: token.symbol,
      type: token.tokenType,
      holders: stats?.holderCount || 0,
      volume: stats?.totalVolume || '0',
      marketCap: stats?.marketCap || '0',
      createdAt: token.createdAt.toISOString(),
    });

    return res.status(200).json({
      created: createdTokens.map(t => formatToken(t, t.stats)),
      holding: holdingRoles.map(r => ({
        ...formatToken(r.token, r.token.stats),
        balance: r.balance || '0',
        value: r.valueUsd || '0',
      })),
      social: socialTokens.map(t => formatToken(t, t.stats)),
    });
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
