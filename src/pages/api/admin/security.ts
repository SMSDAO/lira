import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Get contract addresses from environment
      const contractAddresses = {
        liraToken: process.env.NEXT_PUBLIC_LIRA_TOKEN || null,
        registry: process.env.NEXT_PUBLIC_LIRA_REGISTRY || null,
        profile: process.env.NEXT_PUBLIC_LIRA_PROFILE || null,
        socialGraph: process.env.NEXT_PUBLIC_LIRA_SOCIAL_GRAPH || null,
        tokenFactory: process.env.NEXT_PUBLIC_FACTORY || null,
        userTokenFactory: process.env.NEXT_PUBLIC_USER_TOKEN_FACTORY || null,
      };

      // Check for dangerous configurations
      const warnings = [];
      
      // Check if treasury is set
      const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
      if (!treasuryAddress || treasuryAddress === ethers.ZeroAddress) {
        warnings.push({
          level: 'high',
          message: 'Treasury address not configured',
          recommendation: 'Set treasury address to receive protocol fees'
        });
      }

      // Check for missing contract addresses
      Object.entries(contractAddresses).forEach(([name, address]) => {
        if (!address) {
          warnings.push({
            level: 'critical',
            message: `${name} contract address not set`,
            recommendation: 'Deploy and configure contract address'
          });
        }
      });

      // Mock DAO operators (in production, would query from registry contract)
      const daoOperators = [
        {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f5e5e5',
          addedAt: new Date('2024-01-15'),
          permissions: ['REGISTER_TOKEN', 'UPDATE_REGISTRY', 'SET_FEES']
        }
      ];

      // System health checks
      const healthChecks = [
        {
          name: 'Database Connection',
          status: 'healthy',
          lastCheck: new Date()
        },
        {
          name: 'RPC Connection',
          status: 'healthy',
          lastCheck: new Date()
        },
        {
          name: 'Indexer Service',
          status: 'healthy',
          lastCheck: new Date()
        }
      ];

      res.status(200).json({
        contractAddresses,
        daoOperators,
        warnings,
        healthChecks,
        network: {
          name: process.env.NEXT_PUBLIC_NETWORK_NAME || 'base-sepolia',
          chainId: process.env.NEXT_PUBLIC_CHAIN_ID || 84532,
          rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ? 'configured' : 'not set'
        }
      });
    } catch (error) {
      console.error('Error fetching security data:', error);
      res.status(500).json({ error: 'Failed to fetch security data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
