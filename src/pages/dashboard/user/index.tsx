import Head from 'next/head';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/common/DashboardLayout';
import { FiUser, FiCreditCard, FiKey, FiShield, FiActivity, FiBell, FiSettings } from 'react-icons/fi';

type Tab = 'profile' | 'wallets' | 'api-keys' | 'security' | 'activity' | 'notifications' | 'billing' | 'settings';

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'profile', label: 'Profile', icon: FiUser },
  { id: 'wallets', label: 'Wallets', icon: FiCreditCard },
  { id: 'api-keys', label: 'API Keys', icon: FiKey },
  { id: 'security', label: 'Security', icon: FiShield },
  { id: 'activity', label: 'Activity', icon: FiActivity },
  { id: 'notifications', label: 'Notifications', icon: FiBell },
  { id: 'settings', label: 'Settings', icon: FiSettings },
];

export default function UserDashboardPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h2 className="text-2xl font-bold text-neo-blue mb-3">Connect your wallet</h2>
          <p className="text-gray-400">Connect a wallet to access your dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>User Dashboard – Lira Protocol</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-neo-blue">My Dashboard</h1>
            <p className="text-gray-400 mt-1 font-mono text-sm">{address}</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-neo-blue/20 pb-2">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-neo-blue/20 text-neo-blue border border-neo-blue/40'
                      : 'text-gray-400 hover:text-neo-blue'
                  }`}
                >
                  <Icon className="text-base" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="bg-neo-dark border border-neo-blue/20 rounded-xl p-6">
            {activeTab === 'profile' && <ProfileTab address={address!} />}
            {activeTab === 'wallets' && <WalletsTab address={address!} />}
            {activeTab === 'api-keys' && <ApiKeysTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'activity' && <ActivityTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

function ProfileTab({ address }: { address: string }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Profile</h3>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neo-blue to-neo-purple flex items-center justify-center text-2xl font-bold text-white">
          {address.slice(2, 4).toUpperCase()}
        </div>
        <div>
          <div className="text-white font-medium">{address.slice(0, 6)}…{address.slice(-4)}</div>
          <div className="text-gray-400 text-sm">Lira User</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {[
          { label: 'Tokens', value: '0' },
          { label: 'NFTs', value: '0' },
          { label: 'Reputation', value: '0' },
        ].map(stat => (
          <div key={stat.label} className="bg-neo-darker rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-neo-blue">{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletsTab({ address }: { address: string }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Connected Wallets</h3>
      <div className="bg-neo-darker rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="text-white font-mono text-sm">{address}</div>
          <div className="text-gray-400 text-xs mt-1">Primary wallet • Base</div>
        </div>
        <span className="px-3 py-1 bg-neo-blue/20 text-neo-blue text-xs rounded-full">Active</span>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">API Keys</h3>
        <button className="px-4 py-2 bg-neo-blue text-neo-darker text-sm font-bold rounded-lg hover:shadow-aura transition">
          + New Key
        </button>
      </div>
      <p className="text-gray-400 text-sm">No API keys yet. Create one to start building.</p>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Security</h3>
      <div className="space-y-3">
        {[
          { label: 'Two-factor authentication', status: 'Disabled', color: 'text-red-400' },
          { label: 'Session timeout', status: '30 minutes', color: 'text-neo-blue' },
          { label: 'Login notifications', status: 'Enabled', color: 'text-neo-green' },
        ].map(item => (
          <div key={item.label} className="flex justify-between items-center bg-neo-darker rounded-lg p-4">
            <span className="text-gray-300">{item.label}</span>
            <span className={`text-sm font-medium ${item.color}`}>{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
      <p className="text-gray-400 text-sm">No recent activity recorded.</p>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Notifications</h3>
      <p className="text-gray-400 text-sm">No unread notifications.</p>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Settings</h3>
      <div className="space-y-3">
        {[
          { label: 'Email notifications', value: true },
          { label: 'On-chain alerts', value: true },
          { label: 'Marketing emails', value: false },
        ].map(item => (
          <div key={item.label} className="flex justify-between items-center bg-neo-darker rounded-lg p-4">
            <span className="text-gray-300">{item.label}</span>
            <div className={`w-10 h-5 rounded-full transition ${item.value ? 'bg-neo-blue' : 'bg-gray-600'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
