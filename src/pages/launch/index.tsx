import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/common/DashboardLayout';
import toast from 'react-hot-toast';

export default function LaunchToken() {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    supply: '',
    description: '',
  });
  const [isLaunching, setIsLaunching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLaunching(true);
    
    try {
      // Simulate token launch
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Token launched successfully!');
      setFormData({ name: '', symbol: '', supply: '', description: '' });
    } catch (error) {
      toast.error('Failed to launch token');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <>
      <Head>
        <title>Launch Token - Lira Protocol</title>
      </Head>

      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-neo-blue">Launch Your Token</h1>
            <p className="text-gray-400 mt-1">Deploy your token with automatic liquidity on BASE</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neo-dark border border-neo-blue/30 rounded-lg p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neo-darker border border-neo-blue/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neo-blue transition"
                  placeholder="My Token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Symbol
                </label>
                <input
                  type="text"
                  required
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full bg-neo-darker border border-neo-blue/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neo-blue transition"
                  placeholder="MTK"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Supply
                </label>
                <input
                  type="number"
                  required
                  value={formData.supply}
                  onChange={(e) => setFormData({ ...formData, supply: e.target.value })}
                  className="w-full bg-neo-darker border border-neo-blue/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neo-blue transition"
                  placeholder="1000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full bg-neo-darker border border-neo-blue/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neo-blue transition"
                  placeholder="Describe your token..."
                />
              </div>

              <div className="bg-neo-darker border border-neo-purple/30 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Launch Fee</span>
                  <span className="text-white">0.01 ETH</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Protocol Fee</span>
                  <span className="text-white">1%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Creator Fee</span>
                  <span className="text-white">2%</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLaunching || !isConnected}
                className="w-full px-6 py-4 bg-neo-blue text-neo-darker font-bold rounded-lg hover:shadow-aura-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLaunching ? 'Launching...' : 'Launch Token'}
              </button>
            </form>
          </motion.div>

          <div className="bg-neo-dark/50 border border-neo-blue/20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-neo-blue mb-3">What happens next?</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-neo-blue mr-2">•</span>
                <span>Your token contract will be deployed to BASE mainnet</span>
              </li>
              <li className="flex items-start">
                <span className="text-neo-blue mr-2">•</span>
                <span>Initial liquidity will be automatically set up</span>
              </li>
              <li className="flex items-start">
                <span className="text-neo-blue mr-2">•</span>
                <span>Token will be listed on your dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="text-neo-blue mr-2">•</span>
                <span>Social features will be enabled (timeline, posts)</span>
              </li>
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
