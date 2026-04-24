import type { NextApiRequest, NextApiResponse } from 'next';
import { metrics } from '@/observability/metrics';
import { apiLimiter } from '@/security/rateLimit';
import { verifySession } from '@/auth/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiLimiter(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Prometheus metrics can expose operational details; restrict to admin sessions.
  const session = await verifySession(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  // Increment request counter
  metrics.inc('lira_http_requests_total', { path: '/api/observability/metrics', method: 'GET' });

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  return res.status(200).send(metrics.export());
}
