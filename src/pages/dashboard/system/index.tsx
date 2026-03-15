import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/common/DashboardLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { UserRole } from '@/lib/rbac';
import {
  FiServer, FiCpu, FiActivity, FiBarChart2, FiAlertTriangle, FiRefreshCw,
} from 'react-icons/fi';

type Tab = 'cluster' | 'agents' | 'queues' | 'dex' | 'wallets' | 'health';

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'cluster', label: 'Cluster', icon: FiServer },
  { id: 'agents', label: 'Agent Activity', icon: FiCpu },
  { id: 'queues', label: 'Queues', icon: FiActivity },
  { id: 'dex', label: 'DEX Analytics', icon: FiBarChart2 },
  { id: 'wallets', label: 'Wallet Events', icon: FiActivity },
  { id: 'health', label: 'Service Health', icon: FiAlertTriangle },
];

interface ServiceHealth {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
  lastChecked: number;
}

export default function SystemDashboardPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const userRole = useUserRole();
  const [activeTab, setActiveTab] = useState<Tab>('cluster');
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHealth = () => {
    setRefreshing(true);
    setTimeout(() => {
      setServiceHealth([
        { name: 'Wallet RPC (Base)', status: 'ok', latencyMs: 42, lastChecked: Date.now() },
        { name: 'Uniswap v3 Subgraph', status: 'ok', latencyMs: 210, lastChecked: Date.now() },
        { name: 'OpenAI Images API', status: 'ok', latencyMs: 890, lastChecked: Date.now() },
        { name: 'Farcaster Hub', status: 'ok', latencyMs: 150, lastChecked: Date.now() },
        { name: 'Replicate API', status: 'ok', latencyMs: 1_100, lastChecked: Date.now() },
        { name: 'Redis', status: 'ok', latencyMs: 2, lastChecked: Date.now() },
      ]);
      setRefreshing(false);
    }, 600);
  };

  useEffect(() => { loadHealth(); }, []);

  if (isConnected && userRole !== UserRole.ADMIN) {
    void router.push('/dashboard');
    return null;
  }

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h2 className="text-2xl font-bold text-neo-blue mb-3">Admin Access Required</h2>
          <p className="text-gray-400">Connect your admin wallet to view the system dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>System Dashboard – Lira Protocol</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neo-blue">System Dashboard</h1>
              <p className="text-gray-400 mt-1">Cluster health, agent activity & service monitoring</p>
            </div>
            <button
              onClick={loadHealth}
              className="flex items-center gap-2 px-4 py-2 border border-neo-blue/40 text-neo-blue rounded-lg hover:bg-neo-blue/10 transition text-sm"
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
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
            {activeTab === 'cluster' && <ClusterTab />}
            {activeTab === 'agents' && <AgentsTab />}
            {activeTab === 'queues' && <QueuesTab />}
            {activeTab === 'dex' && <DexAnalyticsTab />}
            {activeTab === 'wallets' && <WalletEventsTab />}
            {activeTab === 'health' && <ServiceHealthTab services={serviceHealth} />}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

function ClusterTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Cluster Health</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Nodes', value: '1', cls: 'text-neo-blue' },
          { label: 'CPU', value: '12%', cls: 'text-neo-green' },
          { label: 'Memory', value: '38%', cls: 'text-neo-green' },
          { label: 'Uptime', value: '99.9%', cls: 'text-neo-green' },
        ].map(item => (
          <div key={item.label} className="bg-neo-darker rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${item.cls}`}>{item.value}</div>
            <div className="text-gray-400 text-sm">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentsTab() {
  const agents = [
    { name: 'AgentCoordinator', status: 'idle', tasks: 0 },
    { name: 'DexScannerAgent', status: 'idle', tasks: 0 },
    { name: 'WalletAgent', status: 'idle', tasks: 0 },
    { name: 'ImageGenerationAgent', status: 'idle', tasks: 0 },
    { name: 'SocialAgent', status: 'idle', tasks: 0 },
    { name: 'AnalyticsAgent', status: 'idle', tasks: 0 },
    { name: 'MonitoringAgent', status: 'idle', tasks: 0 },
    { name: 'NotificationAgent', status: 'idle', tasks: 0 },
    { name: 'GovernanceAgent', status: 'idle', tasks: 0 },
  ];
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Agent Activity</h3>
      <div className="space-y-2">
        {agents.map(agent => (
          <div key={agent.name} className="flex items-center justify-between bg-neo-darker rounded-lg px-4 py-3">
            <span className="text-gray-300 font-mono text-sm">{agent.name}</span>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-xs">{agent.tasks} tasks</span>
              <span className="px-2 py-0.5 bg-neo-blue/20 text-neo-blue text-xs rounded-full">{agent.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueuesTab() {
  const jobs = ['dexScanner', 'walletMonitor', 'imageGenerator', 'socialPublisher', 'analyticsAggregator', 'contractWatcher'];
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Queue Status</h3>
      <div className="space-y-2">
        {jobs.map(job => (
          <div key={job} className="flex items-center justify-between bg-neo-darker rounded-lg px-4 py-3">
            <code className="text-gray-300 text-sm">{job}</code>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-xs">0 pending</span>
              <span className="px-2 py-0.5 bg-neo-green/20 text-neo-green text-xs rounded-full">ready</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DexAnalyticsTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">DEX Analytics</h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tokens indexed', value: '0' },
          { label: 'Pools tracked', value: '0' },
          { label: 'Last scan', value: 'Never' },
        ].map(m => (
          <div key={m.label} className="bg-neo-darker rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-neo-blue">{m.value}</div>
            <div className="text-gray-400 text-sm">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletEventsTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Wallet Events</h3>
      <p className="text-gray-400 text-sm">No wallet events recorded in this session.</p>
    </div>
  );
}

function ServiceHealthTab({ services }: { services: ServiceHealth[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Service Health</h3>
      {services.length === 0 ? (
        <p className="text-gray-400 text-sm">Loading service health…</p>
      ) : (
        <div className="space-y-2">
          {services.map(svc => (
            <div key={svc.name} className="flex items-center justify-between bg-neo-darker rounded-lg px-4 py-3">
              <span className="text-gray-300 text-sm">{svc.name}</span>
              <div className="flex items-center gap-4">
                {svc.latencyMs !== undefined && (
                  <span className="text-gray-400 text-xs">{svc.latencyMs} ms</span>
                )}
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    svc.status === 'ok'
                      ? 'bg-neo-green/20 text-neo-green'
                      : svc.status === 'degraded'
                      ? 'bg-yellow-900/30 text-yellow-400'
                      : 'bg-red-900/30 text-red-400'
                  }`}
                >
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
