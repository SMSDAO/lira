import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/common/DashboardLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { UserRole } from '@/lib/rbac';
import { FiCode, FiBook, FiActivity, FiServer, FiDatabase, FiTerminal } from 'react-icons/fi';

export default function DevPortal() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const userRole = useUserRole();
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'docs' | 'logs'>('overview');

  // Redirect if not authorized
  if (isConnected && userRole !== UserRole.DEV && userRole !== UserRole.ADMIN) {
    router.push('/dashboard');
    return null;
  }

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl text-neo-blue mb-4">Access Restricted</h2>
          <p className="text-gray-400">Connect your wallet to access the developer portal</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Developer Portal - Lira Protocol</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-neo-blue">Developer Portal</h1>
            <p className="text-gray-400 mt-1">API documentation, testing tools, and system internals</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'API Endpoints', value: '24', icon: FiServer, color: 'neo-blue' },
              { label: 'Active Services', value: '3/3', icon: FiActivity, color: 'neo-green' },
              { label: 'Database Tables', value: '14', icon: FiDatabase, color: 'neo-purple' },
              { label: 'Log Entries (24h)', value: '12.4K', icon: FiTerminal, color: 'neo-pink' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6 hover:shadow-aura transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="text-2xl text-neo-blue" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="border-b border-neo-blue/30">
            <nav className="flex space-x-8">
              {[
                { id: 'overview' as const, label: 'Overview', icon: FiCode },
                { id: 'api' as const, label: 'API Reference', icon: FiServer },
                { id: 'docs' as const, label: 'Documentation', icon: FiBook },
                { id: 'logs' as const, label: 'System Logs', icon: FiTerminal },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-neo-blue text-neo-blue'
                      : 'border-transparent text-gray-400 hover:text-neo-blue'
                  }`}
                >
                  <tab.icon className="text-lg" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Links */}
                <div className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-neo-blue mb-4">Quick Links</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'API Documentation', href: '#', badge: 'v1.0' },
                      { label: 'Smart Contract ABIs', href: '#', badge: 'Latest' },
                      { label: 'Database Schema', href: '#', badge: '14 Tables' },
                      { label: 'Environment Setup', href: '#', badge: 'Guide' },
                      { label: 'Testing Suite', href: '#', badge: '33 Tests' },
                    ].map((link, idx) => (
                      <a
                        key={idx}
                        href={link.href}
                        className="flex items-center justify-between p-3 rounded-lg bg-neo-darker hover:bg-neo-darker/80 transition group"
                      >
                        <span className="text-gray-300 group-hover:text-neo-blue">{link.label}</span>
                        <span className="px-2 py-1 text-xs bg-neo-blue/20 text-neo-blue rounded">
                          {link.badge}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* System Health */}
                <div className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-neo-blue mb-4">System Health</h3>
                  <div className="space-y-4">
                    {[
                      { service: 'PHP API', status: 'Operational', uptime: '99.9%', color: 'neo-green' },
                      { service: 'Go API', status: 'Operational', uptime: '99.8%', color: 'neo-green' },
                      { service: 'Java API', status: 'Operational', uptime: '99.7%', color: 'neo-green' },
                      { service: 'PostgreSQL', status: 'Operational', uptime: '100%', color: 'neo-green' },
                    ].map((service, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-neo-darker">
                        <div>
                          <div className="text-white font-medium">{service.service}</div>
                          <div className="text-sm text-gray-400">Uptime: {service.uptime}</div>
                        </div>
                        <div className="px-3 py-1 bg-neo-green/20 text-neo-green text-sm rounded-full">
                          {service.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-neo-blue mb-4">API Endpoints</h3>
                <div className="space-y-4">
                  {[
                    { method: 'GET', path: '/api/agents', description: 'List all AI agents' },
                    { method: 'POST', path: '/api/agents', description: 'Create a new agent' },
                    { method: 'GET', path: '/api/tokens', description: 'List all tokens' },
                    { method: 'POST', path: '/api/launch', description: 'Launch a new token' },
                    { method: 'GET', path: '/api/quantum/predict', description: 'Get quantum predictions' },
                    { method: 'POST', path: '/api/agents/execute', description: 'Execute agent' },
                  ].map((endpoint, idx) => (
                    <div key={idx} className="flex items-start space-x-4 p-4 rounded-lg bg-neo-darker">
                      <span className={`px-3 py-1 text-xs font-bold rounded ${
                        endpoint.method === 'GET' 
                          ? 'bg-neo-blue/20 text-neo-blue' 
                          : 'bg-neo-green/20 text-neo-green'
                      }`}>
                        {endpoint.method}
                      </span>
                      <div className="flex-1">
                        <code className="text-neo-blue">{endpoint.path}</code>
                        <p className="text-gray-400 text-sm mt-1">{endpoint.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-neo-blue mb-4">Documentation</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-400 mb-4">
                    Complete documentation for the Lira Protocol development platform.
                  </p>
                  <div className="space-y-3">
                    {[
                      { title: 'Getting Started', description: 'Quick start guide for developers' },
                      { title: 'Architecture', description: 'System architecture and design patterns' },
                      { title: 'Smart Contracts', description: 'Contract ABIs and deployment guide' },
                      { title: 'API Reference', description: 'Complete API endpoint documentation' },
                      { title: 'Testing', description: 'Test suite and testing guidelines' },
                      { title: 'Deployment', description: 'Deployment procedures and configurations' },
                    ].map((doc, idx) => (
                      <a
                        key={idx}
                        href="#"
                        className="block p-4 rounded-lg bg-neo-darker hover:bg-neo-darker/80 transition"
                      >
                        <h4 className="text-neo-blue font-semibold">{doc.title}</h4>
                        <p className="text-gray-400 text-sm mt-1">{doc.description}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-neo-blue mb-4">Recent System Logs</h3>
                <div className="bg-neo-darker rounded-lg p-4 font-mono text-sm space-y-2 max-h-96 overflow-y-auto">
                  {[
                    { time: '13:42:15', level: 'INFO', message: 'Agent execution completed successfully', service: 'Go API' },
                    { time: '13:41:03', level: 'INFO', message: 'Token launch initiated', service: 'PHP API' },
                    { time: '13:40:22', level: 'INFO', message: 'Quantum prediction requested', service: 'Java API' },
                    { time: '13:39:45', level: 'INFO', message: 'Database connection established', service: 'PostgreSQL' },
                    { time: '13:38:12', level: 'INFO', message: 'User dashboard loaded', service: 'Frontend' },
                  ].map((log, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-gray-300">
                      <span className="text-gray-500">[{log.time}]</span>
                      <span className={log.level === 'INFO' ? 'text-neo-blue' : 'text-neo-pink'}>
                        {log.level}
                      </span>
                      <span className="text-gray-400">{log.service}:</span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
