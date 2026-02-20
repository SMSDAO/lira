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
        }
      });

      // Calculate summary statistics
      const totalFees = feeCollections.reduce((sum, fee) => 
        sum + parseFloat(fee.amount.toString()), 0
      );

      const feesByToken = feeCollections.reduce((acc, fee) => {
        const addr = fee.tokenAddress;
        if (!acc[addr]) {
          acc[addr] = {
            tokenAddress: addr,
            tokenName: 'Token', // Can be enriched by joining with Token table if needed
            tokenSymbol: '???',
            totalFees: 0, // Match component expectation
            transactionCount: 0 // Match component expectation
          };
        }
        acc[addr].totalFees += parseFloat(fee.amount.toString());
        acc[addr].transactionCount += 1;
        return acc;
      }, {} as Record<string, any>);

      // Group by day for charts
      const feesByDay = feeCollections.reduce((acc, fee) => {
        const day = fee.collectedAt.toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = {
            date: day,
            fees: 0, // Match component expectation
            transactions: 0 // Match component expectation
          };
        }
        acc[day].fees += parseFloat(fee.amount.toString());
        acc[day].transactions += 1;
        return acc;
      }, {} as Record<string, any>);

      const chartData = Object.values(feesByDay).sort((a: any, b: any) => 
        a.date.localeCompare(b.date)
      );

      // Get current system settings for fee configuration
      const feeConfigSetting = await prisma.systemSetting.findUnique({
        where: { key: 'fee_configuration' }
      });
      
      let feeConfig = {
        protocolFeePercent: 1,
        creatorFeePercent: 2,
        launchFeeEth: '0.01',
        treasuryAddress: null
      };
      
      if (feeConfigSetting) {
        try {
          const parsed = JSON.parse(feeConfigSetting.value);
          feeConfig = { ...feeConfig, ...parsed };
        } catch (e) {
          console.error('Failed to parse fee configuration:', e);
        }
      }

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
        configuration: feeConfig
      });
    } catch (error) {
      console.error('Error fetching billing data:', error);
      res.status(500).json({ error: 'Failed to fetch billing data' });
    }
  } else if (req.method === 'PUT') {
    // Update fee configuration
    try {
      const { protocolFeePercent, creatorFeePercent, launchFeeEth, treasuryAddress } = req.body;

      // Validation
      if (protocolFeePercent !== undefined && (protocolFeePercent < 0 || protocolFeePercent > 100)) {
        return res.status(400).json({ error: 'Protocol fee must be between 0 and 100%' });
      }
      if (creatorFeePercent !== undefined && (creatorFeePercent < 0 || creatorFeePercent > 100)) {
        return res.status(400).json({ error: 'Creator fee must be between 0 and 100%' });
      }
      if (launchFeeEth !== undefined && parseFloat(launchFeeEth) < 0) {
        return res.status(400).json({ error: 'Launch fee must be positive' });
      }

      // Get existing configuration
      const existingConfig = await prisma.systemSetting.findUnique({
        where: { key: 'fee_configuration' }
      });

      let currentConfig = {
        protocolFeePercent: 1,
        creatorFeePercent: 2,
        launchFeeEth: '0.01',
        treasuryAddress: null
      };

      if (existingConfig) {
        try {
          currentConfig = { ...currentConfig, ...JSON.parse(existingConfig.value) };
        } catch (e) {
          console.error('Failed to parse existing config:', e);
        }
      }

      // Merge updates
      const updatedConfig = {
        ...currentConfig,
        ...(protocolFeePercent !== undefined && { protocolFeePercent }),
        ...(creatorFeePercent !== undefined && { creatorFeePercent }),
        ...(launchFeeEth !== undefined && { launchFeeEth }),
        ...(treasuryAddress !== undefined && { treasuryAddress })
      };

      // Upsert system setting
      await prisma.systemSetting.upsert({
        where: { key: 'fee_configuration' },
        update: {
          value: JSON.stringify(updatedConfig),
          description: 'Protocol fee configuration'
        },
        create: {
          key: 'fee_configuration',
          value: JSON.stringify(updatedConfig),
          description: 'Protocol fee configuration',
          category: 'billing'
        }
      });

      res.status(200).json({
        success: true,
        configuration: updatedConfig
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
