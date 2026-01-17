import Head from 'next/head';
import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/common/DashboardLayout';

export default function UserDashboard() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl text-neo-blue mb-4">Please connect your wallet</h2>
          <p className="text-gray-400">Connect your wallet to access your dashboard</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>User Dashboard - Lira Protocol</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-neo-blue">Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back to Lira Protocol</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'My Tokens', value: '12', color: 'neo-blue' },
              { label: 'Active Agents', value: '5', color: 'neo-purple' },
              { label: 'Total Earnings', value: '$4,231', color: 'neo-green' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6 hover:shadow-aura transition"
              >
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
