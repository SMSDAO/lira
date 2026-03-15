import type { NextApiRequest, NextApiResponse } from 'next';
import { JOB_DEFINITIONS } from '@/jobs';
import { apiLimiter } from '@/security/rateLimit';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiLimiter(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({ jobs: JOB_DEFINITIONS });
}
