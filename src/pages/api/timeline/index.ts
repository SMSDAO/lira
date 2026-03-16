import type { NextApiRequest, NextApiResponse } from 'next';
import { timeline } from '@/timeline';
import type { TimelineEventType, TimelineEventSeverity } from '@/timeline';
import { apiLimiter } from '@/security/rateLimit';

const MAX_LIMIT = 200;

function parsePositiveInt(val: unknown, defaultVal: number, max?: number): number {
  const n = parseInt(String(val), 10);
  if (!Number.isFinite(n) || n < 0) return defaultVal;
  return max !== undefined ? Math.min(n, max) : n;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiLimiter(req, res)) return;

  if (req.method === 'GET') {
    // Normalize string|string[] query params – pick first element of arrays
    const rawUserId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
    const rawType = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
    const rawSeverity = Array.isArray(req.query.severity) ? req.query.severity[0] : req.query.severity;
    const { limit, offset } = req.query;

    const filterOpts = {
      userId: rawUserId as string | undefined,
      type: rawType as TimelineEventType | undefined,
      severity: rawSeverity as TimelineEventSeverity | undefined,
    };
    const events = timeline.list({
      ...filterOpts,
      limit: parsePositiveInt(limit, 50, MAX_LIMIT),
      offset: parsePositiveInt(offset, 0),
    });
    return res.status(200).json({ events, total: timeline.count(filterOpts) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
