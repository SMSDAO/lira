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
    return res.status(400).json({ error: 'Address required' });
  }

  // Mock data - replace with database queries
  const mockData = {
    created: [
      {
        address: '0xtoken1...',
        name: 'Alice Token',
        symbol: 'ALT',
        type: 'USER',
        holders: 123,
        volume: '12.5 ETH',
      },
    ],
    holding: [
      {
        address: '0xtoken2...',
        name: 'Beta Token',
        symbol: 'BETA',
        balance: '1000',
        value: '0.5 ETH',
      },
    ],
    social: [],
  };

  return res.status(200).json(mockData);
}
