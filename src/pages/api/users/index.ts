import type { NextApiRequest, NextApiResponse } from 'next';

type User = {
  id: number;
  address: string;
  tokens: number;
  agents: number;
  status: string;
  created_at?: string;
};

type ApiResponse = {
  success: boolean;
  data?: User | User[];
  error?: string;
  message?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    // Mock data - in production, fetch from database
    const users: User[] = [
      {
        id: 1,
        address: '0x742d...5e5c',
        tokens: 12,
        agents: 5,
        status: 'active',
      },
      {
        id: 2,
        address: '0x8a3f...2b1d',
        tokens: 8,
        agents: 3,
        status: 'active',
      },
      {
        id: 3,
        address: '0x9c2e...4f7a',
        tokens: 15,
        agents: 7,
        status: 'active',
      },
    ];

    res.status(200).json({ success: true, data: users });
  } else if (req.method === 'POST') {
    const { address } = req.body;

    if (!address) {
      res.status(400).json({
        success: false,
        error: 'Address required',
      });
      return;
    }

    const user: User = {
      id: Math.floor(Math.random() * 9000) + 1000,
      address,
      tokens: 0,
      agents: 0,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    res.status(201).json({ success: true, data: user });
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
