import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/common/DashboardLayout';
import BillingSection from '@/components/admin/BillingSection';
import SecuritySection from '@/components/admin/SecuritySection';
import { FiUsers, FiDollarSign, FiActivity, FiBarChart2 } from 'react-icons/fi';

export default function AdminDashboard() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl text-neo-blue mb-4">Please connect your wallet</h2>
          <p className="text-gray-400">Admin access requires wallet connection</p>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    { label: 'Total Users', value: '12,453', icon: FiUsers, change: '+12.5%' },
    { label: 'Total Revenue', value: '$284,392', icon: FiDollarSign, change: '+8.2%' },
    { label: 'Active Agents', value: '847', icon: FiActivity, change: '+23.1%' },
    { label: 'Tokens Launched', value: '1,238', icon: FiBarChart2, change: '+15.7%' },
  ];

  return (
    <>
      <Head>
        <title>Admin Dashboard - Lira Protocol</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-neo-blue">Admin Dashboard</h1>
              <p className="text-gray-400 mt-1">Manage your protocol settings and monitor performance</p>
            </div>
            <button className="px-4 py-2 bg-neo-blue text-neo-darker font-bold rounded-lg hover:shadow-aura transition">
              Export Report
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6 hover:shadow-aura transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="text-neo-blue text-2xl" />
                  <span className="text-neo-green text-sm">{stat.change}</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="border-b border-neo-blue/30">
            <nav className="flex space-x-8">
              {['overview', 'users', 'fees', 'settings', 'billing', 'security'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                    activeTab === tab
                      ? 'border-neo-blue text-neo-blue'
                      : 'border-transparent text-gray-400 hover:text-neo-blue'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neo-blue">System Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Recent Activity</h4>
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-neo-darker rounded">
                          <span className="text-gray-300">Token launch by 0x742d...5e5c</span>
                          <span className="text-gray-500 text-sm">2m ago</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">System Health</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-300">API Performance</span>
                          <span className="text-neo-green">98%</span>
                        </div>
                        <div className="w-full bg-neo-darker rounded-full h-2">
                          <div className="bg-neo-green h-2 rounded-full" style={{ width: '98%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-300">Contract Gas Usage</span>
                          <span className="text-neo-blue">65%</span>
                        </div>
                        <div className="w-full bg-neo-darker rounded-full h-2">
                          <div className="bg-neo-blue h-2 rounded-full" style={{ width: '65%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-300">Storage Capacity</span>
                          <span className="text-neo-purple">42%</span>
                        </div>
                        <div className="w-full bg-neo-darker rounded-full h-2">
                          <div className="bg-neo-purple h-2 rounded-full" style={{ width: '42%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h3 className="text-xl font-bold text-neo-blue mb-4">User Management</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-neo-blue/30">
                      <tr>
                        <th className="pb-3 text-gray-400 font-medium">Address</th>
                        <th className="pb-3 text-gray-400 font-medium">Tokens Launched</th>
                        <th className="pb-3 text-gray-400 font-medium">Agents</th>
                        <th className="pb-3 text-gray-400 font-medium">Status</th>
                        <th className="pb-3 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neo-blue/10">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-neo-darker/50">
                          <td className="py-3 text-gray-300">0x742d...5e5c</td>
                          <td className="py-3 text-gray-300">12</td>
                          <td className="py-3 text-gray-300">5</td>
                          <td className="py-3">
                            <span className="px-2 py-1 bg-neo-green/20 text-neo-green rounded text-xs">
                              Active
                            </span>
                          </td>
                          <td className="py-3">
                            <button className="text-neo-blue hover:text-neo-purple text-sm">
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neo-blue">Fee Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-2">Protocol Fee (%)</label>
                      <input
                        type="number"
                        defaultValue="1"
                        className="w-full bg-neo-darker border border-neo-blue/30 rounded px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">Creator Fee (%)</label>
                      <input
                        type="number"
                        defaultValue="2"
                        className="w-full bg-neo-darker border border-neo-blue/30 rounded px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">Launch Fee (ETH)</label>
                      <input
                        type="number"
                        step="0.001"
                        defaultValue="0.01"
                        className="w-full bg-neo-darker border border-neo-blue/30 rounded px-4 py-2 text-white"
                      />
                    </div>
                    <button className="w-full px-4 py-2 bg-neo-blue text-neo-darker font-bold rounded-lg hover:shadow-aura transition">
                      Update Fees
                    </button>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Fee Collection Stats</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-neo-darker rounded">
                        <div className="text-gray-400 text-sm mb-1">Total Collected</div>
                        <div className="text-2xl font-bold text-neo-green">$284,392</div>
                      </div>
                      <div className="p-4 bg-neo-darker rounded">
                        <div className="text-gray-400 text-sm mb-1">This Month</div>
                        <div className="text-2xl font-bold text-neo-blue">$42,183</div>
                      </div>
                      <div className="p-4 bg-neo-darker rounded">
                        <div className="text-gray-400 text-sm mb-1">Average/Launch</div>
                        <div className="text-2xl font-bold text-neo-purple">$229.76</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && <SecuritySection />}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neo-blue">Protocol Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-neo-darker rounded">
                    <div>
                      <div className="font-semibold text-white">Contract Paused</div>
                      <div className="text-gray-400 text-sm">Pause all contract interactions</div>
                    </div>
                    <button className="px-4 py-2 bg-neo-purple text-white font-bold rounded hover:shadow-aura transition">
                      Toggle
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-neo-darker rounded">
                    <div>
                      <div className="font-semibold text-white">Auto-Approve Agents</div>
                      <div className="text-gray-400 text-sm">Automatically approve new agent creations</div>
                    </div>
                    <button className="px-4 py-2 bg-neo-green text-neo-darker font-bold rounded hover:shadow-aura transition">
                      Enabled
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-neo-darker rounded">
                    <div>
                      <div className="font-semibold text-white">Quantum Oracle</div>
                      <div className="text-gray-400 text-sm">Enable quantum oracle integration</div>
                    </div>
                    <button className="px-4 py-2 bg-neo-blue text-neo-darker font-bold rounded hover:shadow-aura transition">
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
