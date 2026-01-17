import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/common/DashboardLayout';
import { FiCpu, FiPlay, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AgentsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const agents = [
    {
      id: 1,
      name: 'Market Analyzer',
      modelType: 'GPT-4',
      executions: 1247,
      status: 'active',
      created: '2 days ago',
    },
    {
      id: 2,
      name: 'Price Oracle',
      modelType: 'Claude-3',
      executions: 892,
      status: 'active',
      created: '5 days ago',
    },
    {
      id: 3,
      name: 'Sentiment Analyzer',
      modelType: 'Llama-2',
      executions: 534,
      status: 'paused',
      created: '1 week ago',
    },
  ];

  const handleExecuteAgent = (_agentId: number) => {
    toast.success('Agent execution started!');
  };

  return (
    <>
      <Head>
        <title>AI Agents - Lira Protocol</title>
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-neo-blue">AI Agents</h1>
              <p className="text-gray-400 mt-1">Manage and execute your AI agents with quantum intelligence</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-neo-blue text-neo-darker font-bold rounded-lg hover:shadow-aura transition"
            >
              Create Agent
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Agents', value: '12' },
              { label: 'Active Now', value: '8' },
              { label: 'Executions Today', value: '247' },
              { label: 'Success Rate', value: '98.5%' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-neo-dark border border-neo-blue/30 rounded-lg p-4 hover:shadow-aura transition"
              >
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, idx) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6 hover:shadow-aura transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-neo-blue to-neo-purple rounded-lg flex items-center justify-center">
                      <FiCpu className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{agent.name}</h3>
                      <p className="text-sm text-gray-400">{agent.modelType}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      agent.status === 'active'
                        ? 'bg-neo-green/20 text-neo-green'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Executions</span>
                    <span className="text-white font-medium">{agent.executions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Created</span>
                    <span className="text-white font-medium">{agent.created}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExecuteAgent(agent.id)}
                    disabled={agent.status === 'paused'}
                    className="flex-1 px-4 py-2 bg-neo-blue/20 text-neo-blue border border-neo-blue/50 rounded-lg hover:bg-neo-blue/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <FiPlay className="text-sm" />
                    <span>Execute</span>
                  </button>
                  <button className="px-4 py-2 bg-neo-darker border border-neo-blue/30 rounded-lg hover:bg-neo-dark transition">
                    <FiSettings />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Execute Panel */}
          <div className="bg-neo-dark border border-neo-blue/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-neo-blue mb-4">Batch Execute</h3>
            <p className="text-gray-400 mb-4">Execute multiple agents in parallel with quantum optimization</p>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Enter input data..."
                className="flex-1 bg-neo-darker border border-neo-blue/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neo-blue transition"
              />
              <button className="px-6 py-2 bg-neo-purple text-white font-bold rounded-lg hover:shadow-aura transition">
                Execute All Active
              </button>
            </div>
          </div>

          {/* Create Agent Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neo-dark border border-neo-blue rounded-lg p-8 max-w-lg w-full mx-4"
              >
                <h2 className="text-2xl font-bold text-neo-blue mb-4">Create New Agent</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Agent Name</label>
                    <input
                      type="text"
                      className="w-full bg-neo-darker border border-neo-blue/30 rounded px-4 py-2 text-white"
                      placeholder="My Agent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Model Type</label>
                    <select className="w-full bg-neo-darker border border-neo-blue/30 rounded px-4 py-2 text-white">
                      <option>GPT-4</option>
                      <option>Claude-3</option>
                      <option>Llama-2</option>
                      <option>Quantum Oracle</option>
                    </select>
                  </div>
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 bg-neo-darker border border-neo-blue/30 rounded-lg text-gray-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        toast.success('Agent created successfully!');
                        setShowCreateModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-neo-blue text-neo-darker font-bold rounded-lg hover:shadow-aura transition"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
