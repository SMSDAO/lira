import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Get query parameters for filtering
      const { 
        startDate, 
        endDate, 
        tokenAddress, 
        period = '30d' 
      } = req.query;

      // Calculate date range based on period
      const now = new Date();
      const periodMap: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '365d': 365,
        'all': 3650 // 10 years
      };
      
      const daysAgo = periodMap[period as string] || 30;
      const fromDate = startDate 
        ? new Date(startDate as string)
        : new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const toDate = endDate ? new Date(endDate as string) : now;

      // Query fee collections
      const feeCollections = await prisma.feeCollection.findMany({
        where: {
          collectedAt: {
            gte: fromDate,
            lte: toDate
          },
          ...(tokenAddress && {
            tokenAddress: tokenAddress as string
          })
        },
        orderBy: {
          collectedAt: 'desc'
        },
        include: {
          token: {
            select: {
              name: true,
              symbol: true,
              contractAddress: true
            }
          }
        }
      });

      // Calculate summary statistics
      const totalFees = feeCollections.reduce((sum, fee) => 
        sum + parseFloat(fee.amount || '0'), 0
      );

      const feesByToken = feeCollections.reduce((acc, fee) => {
        const addr = fee.tokenAddress;
        if (!acc[addr]) {
          acc[addr] = {
            tokenAddress: addr,
            tokenName: fee.token?.name || 'Unknown',
            tokenSymbol: fee.token?.symbol || '???',
            totalAmount: 0,
            count: 0
          };
        }
        acc[addr].totalAmount += parseFloat(fee.amount || '0');
        acc[addr].count += 1;
        return acc;
      }, {} as Record<string, any>);

      // Group by day for charts
      const feesByDay = feeCollections.reduce((acc, fee) => {
        const day = fee.collectedAt.toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = {
            date: day,
            amount: 0,
            count: 0
          };
        }
        acc[day].amount += parseFloat(fee.amount || '0');
        acc[day].count += 1;
        return acc;
      }, {} as Record<string, any>);

      const chartData = Object.values(feesByDay).sort((a: any, b: any) => 
        a.date.localeCompare(b.date)
      );

      // Get current system settings for fee configuration
      const systemSettings = await prisma.systemSetting.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        summary: {
          totalFees,
          totalTransactions: feeCollections.length,
          averageFee: feeCollections.length > 0 
            ? totalFees / feeCollections.length 
            : 0,
          period: `${period}`,
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString()
        },
        feesByToken: Object.values(feesByToken),
        chartData,
        recentCollections: feeCollections.slice(0, 10),
        configuration: {
          protocolFeePercent: systemSettings?.value?.protocolFeePercent || 1,
          creatorFeePercent: systemSettings?.value?.creatorFeePercent || 2,
          launchFeeETH: systemSettings?.value?.launchFeeETH || 0.01,
          treasuryAddress: systemSettings?.value?.treasuryAddress || null
        }
      });
    } catch (error) {
      console.error('Error fetching billing data:', error);
      res.status(500).json({ error: 'Failed to fetch billing data' });
    }
  } else if (req.method === 'PUT') {
    // Update fee configuration
    try {
      const { protocolFeePercent, creatorFeePercent, launchFeeETH, treasuryAddress } = req.body;

      // Validation
      if (protocolFeePercent && (protocolFeePercent < 0 || protocolFeePercent > 100)) {
        return res.status(400).json({ error: 'Protocol fee must be between 0 and 100%' });
      }
      if (creatorFeePercent && (creatorFeePercent < 0 || creatorFeePercent > 100)) {
        return res.status(400).json({ error: 'Creator fee must be between 0 and 100%' });
      }
      if (launchFeeETH && launchFeeETH < 0) {
        return res.status(400).json({ error: 'Launch fee must be positive' });
      }

      // Update or create system settings
      const existingSettings = await prisma.systemSetting.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      const updatedValue = {
        ...(existingSettings?.value as any || {}),
        ...(protocolFeePercent !== undefined && { protocolFeePercent }),
        ...(creatorFeePercent !== undefined && { creatorFeePercent }),
        ...(launchFeeETH !== undefined && { launchFeeETH }),
        ...(treasuryAddress !== undefined && { treasuryAddress })
      };

      const systemSetting = await prisma.systemSetting.create({
        data: {
          key: 'fee_configuration',
          value: updatedValue
        }
      });

      res.status(200).json({
        success: true,
        configuration: systemSetting.value
      });
    } catch (error) {
      console.error('Error updating fee configuration:', error);
      res.status(500).json({ error: 'Failed to update fee configuration' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
