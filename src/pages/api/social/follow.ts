import type { NextApiRequest, NextApiResponse } from 'next';

// Mock social graph - replace with database
const mockFollows: Record<string, Set<string>> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { follower, target, action } = req.body;

  if (!follower || !target) {
    return res.status(400).json({ error: 'Follower and target required' });
  }

  const followerKey = follower.toLowerCase();
  const targetKey = target.toLowerCase();

  if (!mockFollows[followerKey]) {
    mockFollows[followerKey] = new Set();
  }

  if (action === 'follow') {
    mockFollows[followerKey].add(targetKey);
    return res.status(200).json({ 
      message: 'Followed successfully',
      following: Array.from(mockFollows[followerKey]) 
    });
  }

  if (action === 'unfollow') {
    mockFollows[followerKey].delete(targetKey);
    return res.status(200).json({ 
      message: 'Unfollowed successfully',
      following: Array.from(mockFollows[followerKey]) 
    });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
