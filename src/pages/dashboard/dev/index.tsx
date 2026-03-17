import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/common/DashboardLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { UserRole } from '@/lib/rbac';
import {
  FiKey, FiCode, FiActivity, FiDownload, FiTerminal, FiBarChart2,
} from 'react-icons/fi';

type Tab = 'overview' | 'api-keys' | 'webhooks' | 'sandbox' | 'logs' | 'metrics' | 'sdk';

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'api-keys', label: 'API Keys', icon: FiKey },
  { id: 'webhooks', label: 'Webhooks', icon: FiCode },
  { id: 'sandbox', label: 'Sandbox', icon: FiTerminal },
  { id: 'logs', label: 'Request Logs', icon: FiActivity },
  { id: 'metrics', label: 'Usage Metrics', icon: FiBarChart2 },
  { id: 'sdk', label: 'SDK', icon: FiDownload },
];

export default function DevDashboardPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const userRole = useUserRole();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (isConnected && userRole !== UserRole.DEV && userRole !== UserRole.ADMIN) {
      void router.push('/dashboard');
    }
  }, [isConnected, userRole, router]);

  if (isConnected && userRole !== UserRole.DEV && userRole !== UserRole.ADMIN) {
    return null;
  }

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h2 className="text-2xl font-bold text-neo-blue mb-3">Developer Access Required</h2>
          <p className="text-gray-400">Connect your developer wallet to continue.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Developer Portal – Lira Protocol</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-neo-blue">Developer Portal</h1>
            <p className="text-gray-400 mt-1">API keys, webhooks, sandbox & metrics</p>
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
            {activeTab === 'overview' && <DevOverviewTab />}
            {activeTab === 'api-keys' && <ApiKeysTab />}
            {activeTab === 'webhooks' && <WebhooksTab />}
            {activeTab === 'sandbox' && <SandboxTab />}
            {activeTab === 'logs' && <LogsTab />}
            {activeTab === 'metrics' && <MetricsTab />}
            {activeTab === 'sdk' && <SdkTab />}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

function DevOverviewTab() {
  const quickLinks = [
    { label: 'API Documentation', href: '/docs/api', icon: FiCode },
    { label: 'SDK Download', href: '#sdk', icon: FiDownload },
    { label: 'Sandbox Testing', href: '#sandbox', icon: FiTerminal },
  ];
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Developer Overview</h3>
      <div className="grid grid-cols-3 gap-4">
        {quickLinks.map(link => {
          const Icon = link.icon;
          return (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 bg-neo-darker rounded-lg p-4 hover:border-neo-blue/40 border border-transparent transition"
            >
              <Icon className="text-neo-blue text-xl" />
              <span className="text-gray-300 text-sm">{link.label}</span>
            </a>
          );
        })}
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
          Generate Key
        </button>
      </div>
      <div className="bg-neo-darker rounded-lg p-4 text-gray-400 text-sm">
        No API keys created yet. Generate a key to start using the Lira API.
      </div>
    </div>
  );
}

function WebhooksTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Webhooks</h3>
        <button className="px-4 py-2 bg-neo-blue text-neo-darker text-sm font-bold rounded-lg hover:shadow-aura transition">
          Add Endpoint
        </button>
      </div>
      <p className="text-gray-400 text-sm">No webhook endpoints configured. Add one to receive real-time event notifications.</p>
    </div>
  );
}

function SandboxTab() {
  const [request, setRequest] = useState('{\n  "method": "GET",\n  "path": "/api/agents"\n}');
  const [response, setResponse] = useState('');

  const execute = () => {
    setResponse('{ "status": 200, "message": "Sandbox response – connect to live API for real data." }');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">API Sandbox</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Request</label>
          <textarea
            value={request}
            onChange={e => setRequest(e.target.value)}
            rows={8}
            className="w-full bg-neo-darker border border-neo-blue/30 rounded-lg p-3 text-sm font-mono text-white focus:outline-none focus:border-neo-blue resize-none"
          />
          <button
            onClick={execute}
            className="mt-2 px-4 py-2 bg-neo-blue text-neo-darker text-sm font-bold rounded-lg hover:shadow-aura transition"
          >
            Send
          </button>
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Response</label>
          <pre className="bg-neo-darker border border-neo-blue/30 rounded-lg p-3 text-sm font-mono text-neo-green h-48 overflow-auto">
            {response || '// Response will appear here…'}
          </pre>
        </div>
      </div>
    </div>
  );
}

function LogsTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Request Logs</h3>
      <p className="text-gray-400 text-sm">Request logs are only available in a live session. Connect to the observability endpoint for historical data.</p>
    </div>
  );
}

function MetricsTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Usage Metrics</h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'API calls today', value: '0' },
          { label: 'Avg latency', value: '–' },
          { label: 'Error rate', value: '0%' },
        ].map(m => (
          <div key={m.label} className="bg-neo-darker rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-neo-blue">{m.value}</div>
            <div className="text-gray-400 text-sm">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SdkTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">SDK Download</h3>
      <div className="bg-neo-darker rounded-lg p-6 space-y-4">
        <p className="text-gray-300 text-sm">Install the Lira TypeScript SDK via npm:</p>
        <pre className="bg-black/50 rounded p-3 text-neo-blue text-sm font-mono">npm install @lira/sdk</pre>
        <p className="text-gray-300 text-sm">Quick-start:</p>
        <pre className="bg-black/50 rounded p-3 text-neo-blue text-sm font-mono">{`import { LiraClient } from '@lira/sdk';\nconst client = new LiraClient({ apiKey: 'YOUR_KEY' });`}</pre>
      </div>
    </div>
  );
}
