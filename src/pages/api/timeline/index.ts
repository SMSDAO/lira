import type { NextApiRequest, NextApiResponse } from 'next';
import { timeline } from '@/timeline';
import type { TimelineEventType, TimelineEventSeverity } from '@/timeline';
import { apiLimiter } from '@/security/rateLimit';
import { verifySession } from '@/auth/session';

const MAX_LIMIT = 200;

function parsePositiveInt(val: unknown, defaultVal: number, max?: number): number {
  const n = parseInt(String(val), 10);
  if (!Number.isFinite(n) || n < 0) return defaultVal;
  return max !== undefined ? Math.min(n, max) : n;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiLimiter(req, res)) return;

  if (req.method === 'GET') {
    // Auth guard – timeline entries contain user IDs/metadata; require a valid session.
    // Non-admin callers are further scoped to their own userId below.
    const session = await verifySession(req);
    if (!session) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Normalize string|string[] query params – pick first element of arrays
    const rawUserId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
    const rawType = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
    const rawSeverity = Array.isArray(req.query.severity) ? req.query.severity[0] : req.query.severity;
    const { limit, offset } = req.query;

    // Non-admin callers may only query their own events.
    const isAdmin = session.role === 'admin';
    const effectiveUserId = isAdmin ? rawUserId : session.address;

    const filterOpts = {
      userId: effectiveUserId as string | undefined,
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
