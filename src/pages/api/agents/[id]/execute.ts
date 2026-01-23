import type { NextApiRequest, NextApiResponse } from 'next';

type ExecutionResult = {
  agent_id: string;
  output: string;
  confidence: number;
  timestamp: string;
};

type ApiResponse = {
  success: boolean;
  data?: ExecutionResult;
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'POST') {
    const { id } = req.query;
    const { input_data } = req.body;

    if (!input_data) {
      res.status(400).json({
        success: false,
        error: 'input_data is required',
      });
      return;
    }

    // Simulate agent execution
    const result: ExecutionResult = {
      agent_id: id as string,
      output: `Analyzed: ${input_data}`,
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({ success: true, data: result });
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
