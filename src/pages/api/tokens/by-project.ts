import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Token address required' });
  }

  // Mock data - replace with database
  const mockData = {
    token: {
      address,
      name: 'Project Token',
      symbol: 'PROJ',
      totalSupply: '1000000',
      creator: '0x123...',
    },
    subtokens: [],
    stats: {
      holders: 456,
      volume: '100 ETH',
      transactions: 1234,
    },
  };

  return res.status(200).json(mockData);
}
