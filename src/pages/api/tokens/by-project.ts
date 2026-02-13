import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, creator } = req.query;

  if (!address && !creator) {
    return res.status(400).json({ error: 'Contract address or creator address required' });
  }

  try {
    let token;

    if (address && typeof address === 'string') {
      // Find token by contract address
      token = await prisma.token.findUnique({
        where: { contractAddress: address.toLowerCase() },
        include: {
          stats: true,
          events: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          userRoles: {
            take: 10,
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
            orderBy: { balance: 'desc' },
          },
        },
      });

      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }

      // Find subtokens (if this is a main token)
      const subtokens = await prisma.token.findMany({
        where: {
          metadata: {
            path: ['parentToken'],
            equals: token.contractAddress,
          },
        },
        include: {
          stats: true,
        },
        take: 20,
      });

      return res.status(200).json({
        token: {
          address: token.contractAddress,
          name: token.name,
          symbol: token.symbol,
          type: token.tokenType,
          creator: token.creatorAddress,
          totalSupply: token.totalSupply,
          maxSupply: token.maxSupply,
          decimals: token.decimals,
          description: token.metadata?.description || '',
          website: token.metadata?.website || '',
          twitter: token.metadata?.twitter || '',
          discord: token.metadata?.discord || '',
          createdAt: token.createdAt.toISOString(),
        },
        stats: token.stats ? {
          holders: token.stats.holderCount,
          volume: token.stats.totalVolume,
          marketCap: token.stats.marketCap,
          transactions: token.stats.transactionCount,
          lastUpdated: token.stats.updatedAt.toISOString(),
        } : null,
        recentEvents: token.events.map(e => ({
          type: e.eventType,
          data: e.eventData,
          txHash: e.txHash,
          timestamp: e.createdAt.toISOString(),
        })),
        topHolders: token.userRoles.map(r => ({
          address: r.user.walletAddress,
          handle: r.user.profile?.handle || null,
          balance: r.balance || '0',
          percentage: token.stats?.holderCount 
            ? ((parseFloat(r.balance || '0') / parseFloat(token.totalSupply)) * 100).toFixed(2)
            : '0',
        })),
        subtokens: subtokens.map(st => ({
          address: st.contractAddress,
          name: st.name,
          symbol: st.symbol,
          type: st.tokenType,
          holders: st.stats?.holderCount || 0,
        })),
      });
    }

    if (creator && typeof creator === 'string') {
      // Find all tokens by creator
      const tokens = await prisma.token.findMany({
        where: { creatorAddress: creator.toLowerCase() },
        include: {
          stats: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        tokens: tokens.map(t => ({
          address: t.contractAddress,
          name: t.name,
          symbol: t.symbol,
          type: t.tokenType,
          holders: t.stats?.holderCount || 0,
          volume: t.stats?.totalVolume || '0',
          createdAt: t.createdAt.toISOString(),
        })),
      });
    }

    return res.status(400).json({ error: 'Invalid query parameters' });
  } catch (error) {
    console.error('Error fetching project tokens:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
