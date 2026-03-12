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
    if (address && typeof address === 'string') {
      // Find token by contract address
      const token = await prisma.token.findUnique({
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

      const tokenMeta = token.metadata as Record<string, string> | null;
      const stat = token.stats[0];

      return res.status(200).json({
        token: {
          address: token.contractAddress,
          name: token.name,
          symbol: token.symbol,
          type: token.tokenType,
          creator: token.creatorAddress,
          totalSupply: token.totalSupply?.toString() || '0',
          decimals: token.decimals,
          description: tokenMeta?.description || '',
          website: tokenMeta?.website || '',
          twitter: tokenMeta?.twitter || '',
          discord: tokenMeta?.discord || '',
          createdAt: token.createdAt.toISOString(),
        },
        stats: stat ? {
          holders: stat.holderCount,
          volume: stat.volumeTotal?.toString() || '0',
          marketCap: stat.marketCap?.toString() || null,
          transactions: stat.transactionCount,
          lastUpdated: stat.lastUpdated.toISOString(),
        } : null,
        recentEvents: token.events.map(e => ({
          type: e.eventType,
          data: e.metadata,
          txHash: e.transactionHash,
          timestamp: e.createdAt.toISOString(),
        })),
        topHolders: token.userRoles.map(r => ({
          address: r.user.walletAddress,
          handle: r.user.handle || null,
          balance: r.balance?.toString() || '0',
          percentage: (stat?.holderCount && token.totalSupply && token.totalSupply.toString() !== '0')
            ? ((parseFloat(r.balance?.toString() || '0') / parseFloat(token.totalSupply.toString())) * 100).toFixed(2)
            : '0',
        })),
        subtokens: subtokens.map(st => ({
          address: st.contractAddress,
          name: st.name,
          symbol: st.symbol,
          type: st.tokenType,
          holders: st.stats[0]?.holderCount || 0,
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
          holders: t.stats[0]?.holderCount || 0,
          volume: t.stats[0]?.volumeTotal?.toString() || '0',
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

