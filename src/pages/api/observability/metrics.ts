import type { NextApiRequest, NextApiResponse } from 'next';
import { metrics } from '@/observability/metrics';
import { apiLimiter } from '@/security/rateLimit';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiLimiter(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Increment request counter
  metrics.inc('lira_http_requests_total', { path: '/api/observability/metrics', method: 'GET' });

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  return res.status(200).send(metrics.export());
}
