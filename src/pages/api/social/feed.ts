import type { NextApiRequest, NextApiResponse} from 'next';

// Mock feed data - replace with database queries
const mockPosts = [
  {
    id: 1,
    author: '0x742d35cc6634c0532925a3b844bc9e7595f0e5e5',
    authorHandle: 'alice',
    content: 'Just launched my first token on LIRA! 🚀',
    timestamp: '2026-02-10T12:00:00Z',
    likes: 42,
    comments: 5,
  },
  {
    id: 2,
    author: '0x123...',
    authorHandle: 'bob',
    content: 'LIRA SOCIAL is amazing! Love the on-chain profiles.',
    timestamp: '2026-02-10T11:30:00Z',
    likes: 23,
    comments: 3,
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type = 'global', page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;

  const paginatedPosts = mockPosts.slice(start, end);

  return res.status(200).json({
    posts: paginatedPosts,
    page: pageNum,
    limit: limitNum,
    total: mockPosts.length,
    hasMore: end < mockPosts.length,
  });
}
