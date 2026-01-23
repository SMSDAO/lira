import type { NextApiRequest, NextApiResponse } from 'next';

type Agent = {
  id: string;
  name: string;
  model_type: string;
  owner: string;
  created_at: string;
  execution_count: number;
  is_active: boolean;
};

type ApiResponse = {
  success: boolean;
  data?: Agent;
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    const { id } = req.query;

    // Mock data - in production, fetch from database
    const agent: Agent = {
      id: id as string,
      name: 'Market Analyzer',
      model_type: 'GPT-4',
      owner: '0x742d...5e5c',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      execution_count: 127,
      is_active: true,
    };

    res.status(200).json({ success: true, data: agent });
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
