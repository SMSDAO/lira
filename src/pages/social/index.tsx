import Head from 'next/head';
import { useState } from 'react';
import DashboardLayout from '@/components/common/DashboardLayout';
import NeoCard from '@/components/neo/NeoCard';
import NeoButton from '@/components/neo/NeoButton';
import { FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi';

interface Post {
  id: number;
  author: string;
  authorHandle: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
}

export default function SocialFeed() {
  const [feedType, setFeedType] = useState<'following' | 'global'>('global');
  const [posts] = useState<Post[]>([
    {
      id: 1,
      author: '0x742d...',
      authorHandle: 'alice',
      content: 'Just launched my first token on LIRA! 🚀',
      timestamp: '2h ago',
      likes: 42,
      comments: 5,
    },
    {
      id: 2,
      author: '0x123...',
      authorHandle: 'bob',
      content: 'LIRA SOCIAL is amazing!',
      timestamp: '4h ago',
      likes: 23,
      comments: 3,
    },
  ]);

  return (
    <>
      <Head>
        <title>LIRA SOCIAL - Feed</title>
      </Head>

      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-neo-blue">LIRA SOCIAL</h1>
            <div className="flex gap-2">
              <NeoButton
                variant={feedType === 'global' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFeedType('global')}
              >
                Global
              </NeoButton>
              <NeoButton
                variant={feedType === 'following' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFeedType('following')}
              >
                Following
              </NeoButton>
            </div>
          </div>

          <NeoCard className="p-6">
            <textarea
              className="w-full bg-neo-darker border border-neo-blue/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neo-blue resize-none"
              rows={3}
              placeholder="What's happening on LIRA?"
            />
            <div className="flex justify-end mt-4">
              <NeoButton size="sm">Post</NeoButton>
            </div>
          </NeoCard>

          <div className="space-y-4">
            {posts.map((post) => (
              <NeoCard key={post.id} className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-neo-blue to-neo-purple rounded-full flex items-center justify-center font-bold">
                    {post.authorHandle[0].toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-white">@{post.authorHandle}</span>
                      <span className="text-gray-500 text-sm">{post.author}</span>
                      <span className="text-gray-500 text-sm">· {post.timestamp}</span>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{post.content}</p>
                    
                    <div className="flex gap-6 text-gray-400">
                      <button className="flex items-center gap-2 hover:text-neo-blue transition">
                        <FiHeart />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-neo-blue transition">
                        <FiMessageCircle />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-neo-blue transition">
                        <FiShare2 />
                      </button>
                    </div>
                  </div>
                </div>
              </NeoCard>
            ))}
          </div>

          <div className="text-center">
            <NeoButton variant="secondary">Load More</NeoButton>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
