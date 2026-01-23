import type { NextApiRequest, NextApiResponse } from 'next';

type Agent = {
  id: string;
  name: string;
  model_type: string;
  owner: string;
  created_at?: string;
  execution_count?: number;
  is_active?: boolean;
};

type ApiResponse = {
  success: boolean;
  data?: Agent | Agent[];
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    // Mock data - in production, fetch from database
    const agents: Agent[] = [
      {
        id: '1',
        name: 'Market Analyzer',
        model_type: 'GPT-4',
        owner: '0x742d...5e5c',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        execution_count: 127,
        is_active: true,
      },
      {
        id: '2',
        name: 'Price Oracle',
        model_type: 'Claude-3',
        owner: '0x8a3f...2b1d',
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        execution_count: 89,
        is_active: true,
      },
    ];

    res.status(200).json({ success: true, data: agents });
  } else if (req.method === 'POST') {
    const { name, model_type } = req.body;

    if (!name || !model_type) {
      res.status(400).json({
        success: false,
        error: 'Name and model_type are required',
      });
      return;
    }

    const agent: Agent = {
      id: 'new-id',
      name,
      model_type,
      owner: '0x742d...5e5c',
      created_at: new Date().toISOString(),
      execution_count: 0,
      is_active: true,
    };

    res.status(201).json({ success: true, data: agent });
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
