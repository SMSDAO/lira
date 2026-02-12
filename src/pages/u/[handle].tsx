import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/common/DashboardLayout';
import NeoCard from '@/components/neo/NeoCard';
import NeoButton from '@/components/neo/NeoButton';
import { FiGlobe, FiTwitter, FiMessageCircle } from 'react-icons/fi';

interface Profile {
  address: string;
  handle: string;
  bio: string;
  website: string;
  twitter: string;
  followingCount: number;
  followerCount: number;
}

export default function UserProfile() {
  const router = useRouter();
  const { handle } = router.query;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (handle) {
      // Mock data - replace with API call
      setProfile({
        address: '0x742d35cc6634c0532925a3b844bc9e7595f0e5e5',
        handle: handle as string,
        bio: 'Building on LIRA 🚀',
        website: 'https://example.com',
        twitter: '@alice',
        followingCount: 42,
        followerCount: 123,
      });
      setLoading(false);
    }
  }, [handle]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-neo-blue text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl text-red-500">Profile not found</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.handle} - LIRA Profile</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <NeoCard className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-32 h-32 bg-gradient-to-br from-neo-blue to-neo-purple rounded-full flex items-center justify-center text-4xl font-bold">
                {profile.handle[0].toUpperCase()}
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-neo-blue mb-2">@{profile.handle}</h1>
                <p className="text-gray-400 text-sm mb-4">{profile.address}</p>
                
                {profile.bio && <p className="text-gray-300 mb-4">{profile.bio}</p>}

                <div className="flex gap-6 mb-4">
                  <div>
                    <span className="text-white font-bold">{profile.followingCount}</span>
                    <span className="text-gray-400 ml-1">Following</span>
                  </div>
                  <div>
                    <span className="text-white font-bold">{profile.followerCount}</span>
                    <span className="text-gray-400 ml-1">Followers</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <NeoButton variant="primary" size="sm">Follow</NeoButton>
                  <NeoButton variant="secondary" size="sm">
                    <FiMessageCircle className="inline mr-2" />Message
                  </NeoButton>
                </div>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h2 className="text-xl font-bold text-neo-blue mb-4">Tokens</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-neo-darker rounded border border-neo-blue/30">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-gray-400 text-sm">Created</div>
              </div>
              <div className="p-4 bg-neo-darker rounded border border-neo-blue/30">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-gray-400 text-sm">Holding</div>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h2 className="text-xl font-bold text-neo-blue mb-4">Recent Activity</h2>
            <div className="text-gray-400 text-center py-8">No activity yet</div>
          </NeoCard>
        </div>
      </DashboardLayout>
    </>
  );
}
