import type { NextApiRequest, NextApiResponse } from 'next';

type Token = {
  id: number;
  name: string;
  symbol: string;
  contract: string;
  supply: string;
  creator: string;
  status: string;
  launched_at?: string;
};

type ApiResponse = {
  success: boolean;
  data?: Token | Token[];
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    // Mock data - in production, fetch from database
    const tokens: Token[] = [
      {
        id: 1,
        name: 'MyToken',
        symbol: 'MTK',
        contract: '0x1234...5678',
        supply: '1000000',
        creator: '0x742d...5e5c',
        status: 'active',
      },
      {
        id: 2,
        name: 'CoolToken',
        symbol: 'COOL',
        contract: '0x8765...4321',
        supply: '500000',
        creator: '0x8a3f...2b1d',
        status: 'active',
      },
    ];

    res.status(200).json({ success: true, data: tokens });
  } else if (req.method === 'POST') {
    const { name, symbol, supply, creator } = req.body;

    if (!name || !symbol || !supply) {
      res.status(400).json({
        success: false,
        error: 'Name, symbol, and supply required',
      });
      return;
    }

    // Generate random contract address
    const randomBytes = Array.from({ length: 20 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
    ).join('');

    const token: Token = {
      id: Math.floor(Math.random() * 9000) + 1000,
      name,
      symbol,
      contract: `0x${randomBytes}`,
      supply,
      creator: creator || '0x0000000000000000000000000000000000000000',
      status: 'pending',
      launched_at: new Date().toISOString(),
    };

    res.status(201).json({ success: true, data: token });
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
