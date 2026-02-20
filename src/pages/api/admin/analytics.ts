import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { tokenAddress, period = '30d' } = req.query;

      // Calculate date range
      const now = new Date();
      const periodMap: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '365d': 365
      };
      const daysAgo = periodMap[period as string] || 30;
      const fromDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      if (tokenAddress) {
        // Single token analytics
        const [token, events, stats] = await Promise.all([
          prisma.token.findUnique({
            where: { contractAddress: tokenAddress as string },
            include: {
              roles: {
                take: 10,
                orderBy: { balance: 'desc' },
                include: { user: true }
              }
            }
          }),
          prisma.tokenEvent.findMany({
            where: {
              tokenAddress: tokenAddress as string,
              createdAt: { gte: fromDate }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
          }),
          prisma.tokenStat.findUnique({
            where: { tokenAddress: tokenAddress as string }
          })
        ]);

        // Group events by day
        const eventsByDay = events.reduce((acc, event) => {
          const day = event.createdAt.toISOString().split('T')[0];
          if (!acc[day]) acc[day] = { date: day, count: 0 };
          acc[day].count += 1;
          return acc;
        }, {} as Record<string, any>);

        res.status(200).json({
          token,
          stats,
          events: events.slice(0, 20),
          eventsByDay: Object.values(eventsByDay),
          topHolders: token?.roles || []
        });
      } else {
        // Overall analytics
        const [
          totalTokens,
          activeTokens,
          totalEvents,
          topTokens
        ] = await Promise.all([
          prisma.token.count(),
          prisma.token.count({ where: { isActive: true } }),
          prisma.tokenEvent.count({ where: { createdAt: { gte: fromDate } } }),
          prisma.tokenStat.findMany({
            orderBy: { transactionCount: 'desc' },
            take: 10,
            include: { token: true }
          })
        ]);

        res.status(200).json({
          summary: {
            totalTokens,
            activeTokens,
            totalEvents,
            period
          },
          topTokens
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
