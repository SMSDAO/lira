import Head from 'next/head';
import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/common/DashboardLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { UserRole } from '@/lib/rbac';
import {
  FiUsers, FiShield, FiAlertTriangle, FiActivity,
  FiToggleLeft, FiDatabase, FiBarChart2, FiClock,
} from 'react-icons/fi';

type Tab = 'overview' | 'users' | 'permissions' | 'wallets' | 'feature-flags' | 'audit' | 'alerts';

const TABS: Array<{ id: Tab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'users', label: 'Users', icon: FiUsers },
  { id: 'permissions', label: 'Permissions', icon: FiShield },
  { id: 'wallets', label: 'Wallets', icon: FiDatabase },
  { id: 'feature-flags', label: 'Feature Flags', icon: FiToggleLeft },
  { id: 'audit', label: 'Audit Log', icon: FiClock },
  { id: 'alerts', label: 'Alerts', icon: FiAlertTriangle },
];

export default function AdminDashboardPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const userRole = useUserRole();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({ users: 0, activeAgents: 0, tokens: 0, revenue: '0' });

  useEffect(() => {
    // Placeholder stats fetch
    setStats({ users: 1_247, activeAgents: 12, tokens: 384, revenue: '$284,392' });
  }, []);

  useEffect(() => {
    if (isConnected && userRole !== UserRole.ADMIN) {
      void router.push('/dashboard');
    }
  }, [isConnected, userRole, router]);

  if (isConnected && userRole !== UserRole.ADMIN) {
    return null;
  }

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h2 className="text-2xl font-bold text-neo-blue mb-3">Admin Access Required</h2>
          <p className="text-gray-400">Connect your admin wallet to continue.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard – Lira Protocol</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neo-blue">Admin Dashboard</h1>
              <p className="text-gray-400 mt-1">System management & governance</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.users.toLocaleString(), icon: FiUsers, cls: 'text-neo-blue' },
              { label: 'Active Agents', value: stats.activeAgents.toString(), icon: FiActivity, cls: 'text-neo-purple' },
              { label: 'Tokens Launched', value: stats.tokens.toString(), icon: FiBarChart2, cls: 'text-neo-green' },
              { label: 'Revenue', value: stats.revenue, icon: FiDatabase, cls: 'text-yellow-400' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-neo-dark border border-neo-blue/20 rounded-xl p-5">
                  <div className={`text-2xl font-bold ${stat.cls}`}>{stat.value}</div>
                  <div className="flex items-center gap-2 mt-1 text-gray-400 text-sm">
                    <Icon className="text-base" /> {stat.label}
                  </div>
                </div>
              );
            })}
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
            {activeTab === 'overview' && <AdminOverviewTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'permissions' && <PermissionsTab />}
            {activeTab === 'wallets' && <WalletsTab />}
            {activeTab === 'feature-flags' && <FeatureFlagsTab />}
            {activeTab === 'audit' && <AuditTab />}
            {activeTab === 'alerts' && <AlertsTab />}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

function AdminOverviewTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">System Overview</h3>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Platform status', value: 'Operational', color: 'text-neo-green' },
          { label: 'Pending flags', value: '0', color: 'text-neo-blue' },
          { label: 'Open alerts', value: '0', color: 'text-neo-blue' },
          { label: 'Banned users', value: '0', color: 'text-red-400' },
        ].map(item => (
          <div key={item.label} className="bg-neo-darker rounded-lg p-4">
            <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-gray-400 text-sm">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">User Management</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search users…"
            className="bg-neo-darker border border-neo-blue/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neo-blue"
          />
        </div>
      </div>
      <p className="text-gray-400 text-sm">No users to display. Connect to a database to load user data.</p>
    </div>
  );
}

function PermissionsTab() {
  const roles = ['guest', 'user', 'creator', 'developer', 'moderator', 'admin', 'super-admin'];
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Roles & Permissions</h3>
      <div className="flex flex-wrap gap-2">
        {roles.map(role => (
          <span key={role} className="px-3 py-1 bg-neo-blue/20 text-neo-blue text-sm rounded-full border border-neo-blue/30">
            {role}
          </span>
        ))}
      </div>
      <p className="text-gray-400 text-sm">Role definitions are managed in <code className="text-neo-blue">src/models/Permission.ts</code>.</p>
    </div>
  );
}

function WalletsTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Wallet Management</h3>
      <p className="text-gray-400 text-sm">No wallets flagged for review.</p>
    </div>
  );
}

function FeatureFlagsTab() {
  const flags = [
    { name: 'image_generation', enabled: true },
    { name: 'dex_scanner', enabled: true },
    { name: 'farcaster_login', enabled: true },
    { name: 'governance_voting', enabled: false },
    { name: 'creator_minting', enabled: true },
  ];
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Feature Flags</h3>
      <div className="space-y-2">
        {flags.map(flag => (
          <div key={flag.name} className="flex justify-between items-center bg-neo-darker rounded-lg p-4">
            <code className="text-gray-300 text-sm">{flag.name}</code>
            <span className={`px-2 py-0.5 text-xs rounded-full ${flag.enabled ? 'bg-neo-green/20 text-neo-green' : 'bg-red-900/30 text-red-400'}`}>
              {flag.enabled ? 'ON' : 'OFF'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Audit Log</h3>
      <p className="text-gray-400 text-sm">Audit entries are stored in memory. Connect to a persistence layer to view historical records.</p>
    </div>
  );
}

function AlertsTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">System Alerts</h3>
      <div className="flex items-center gap-3 bg-neo-green/10 border border-neo-green/30 rounded-lg p-4">
        <span className="text-neo-green text-xl">✓</span>
        <span className="text-neo-green">All systems operational – no active alerts.</span>
      </div>
    </div>
  );
}
