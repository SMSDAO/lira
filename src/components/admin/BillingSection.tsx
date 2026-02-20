import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiDollarSign, FiTrendingUp } from 'react-icons/fi';

interface BillingData {
  summary: {
    totalFees: number;
    totalTransactions: number;
    averageFee: number;
    period: string;
  };
  feesByToken: Array<{
    tokenAddress: string;
    tokenName: string;
    totalFees: number;
    transactionCount: number;
  }>;
  chartData: Array<{
    date: string;
    fees: number;
    transactions: number;
  }>;
  configuration: {
    protocolFeePercent: number;
    creatorFeePercent: number;
    launchFeeEth: string;
  };
}

export default function BillingSection() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [config, setConfig] = useState({
    protocolFeePercent: 1,
    creatorFeePercent: 2,
    launchFeeEth: '0.01'
  });

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/billing');
      const result = await response.json();
      setData(result);
      if (result.configuration) {
        setConfig(result.configuration);
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeeConfig = async () => {
    try {
      setUpdating(true);
      const response = await fetch('/api/admin/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (response.ok) {
        await fetchBillingData();
        alert('Fee configuration updated successfully');
      } else {
        alert('Failed to update fee configuration');
      }
    } catch (error) {
      console.error('Failed to update config:', error);
      alert('Error updating configuration');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-neo-blue">Loading billing data...</div></div>;
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-400">Failed to load billing data</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-neo-blue">Fee Management & Revenue</h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <FiDollarSign className="text-neo-green text-2xl" />
            <FiTrendingUp className="text-neo-green" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            ${data.summary.totalFees.toFixed(2)}
          </div>
          <div className="text-gray-400 text-sm">Total Fees Collected</div>
        </div>

        <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
          <div className="text-3xl font-bold text-white mb-1">{data.summary.totalTransactions}</div>
          <div className="text-gray-400 text-sm">Total Transactions</div>
        </div>

        <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
          <div className="text-3xl font-bold text-white mb-1">${data.summary.averageFee.toFixed(2)}</div>
          <div className="text-gray-400 text-sm">Average Fee</div>
        </div>
      </div>

      {/* Fee Chart */}
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <h4 className="font-semibold text-white mb-4">Fees Over Time</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #3b82f6' }} labelStyle={{ color: '#cbd5e1' }} />
            <Legend />
            <Line type="monotone" dataKey="fees" stroke="#3b82f6" name="Fees ($)" />
            <Line type="monotone" dataKey="transactions" stroke="#8b5cf6" name="Transactions" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Fees by Token */}
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <h4 className="font-semibold text-white mb-4">Fees by Token</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-neo-blue/30">
              <tr>
                <th className="pb-3 text-gray-400 font-medium">Token</th>
                <th className="pb-3 text-gray-400 font-medium">Address</th>
                <th className="pb-3 text-gray-400 font-medium text-right">Fees</th>
                <th className="pb-3 text-gray-400 font-medium text-right">Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neo-blue/10">
              {data.feesByToken.map((token, idx) => (
                <tr key={idx} className="hover:bg-neo-dark/50">
                  <td className="py-3 text-white font-medium">{token.tokenName}</td>
                  <td className="py-3 text-gray-400 font-mono text-sm">{token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}</td>
                  <td className="py-3 text-neo-green text-right font-bold">${token.totalFees.toFixed(2)}</td>
                  <td className="py-3 text-gray-300 text-right">{token.transactionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Configuration */}
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <h4 className="font-semibold text-white mb-4">Fee Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 mb-2 text-sm">Protocol Fee (%)</label>
            <input type="number" value={config.protocolFeePercent} onChange={(e) => setConfig({ ...config, protocolFeePercent: parseFloat(e.target.value) })} className="w-full bg-neo-dark border border-neo-blue/30 rounded px-4 py-2 text-white focus:border-neo-blue outline-none" min="0" max="10" step="0.1" />
          </div>
          <div>
            <label className="block text-gray-400 mb-2 text-sm">Creator Fee (%)</label>
            <input type="number" value={config.creatorFeePercent} onChange={(e) => setConfig({ ...config, creatorFeePercent: parseFloat(e.target.value) })} className="w-full bg-neo-dark border border-neo-blue/30 rounded px-4 py-2 text-white focus:border-neo-blue outline-none" min="0" max="10" step="0.1" />
          </div>
          <div>
            <label className="block text-gray-400 mb-2 text-sm">Launch Fee (ETH)</label>
            <input type="text" value={config.launchFeeEth} onChange={(e) => setConfig({ ...config, launchFeeEth: e.target.value })} className="w-full bg-neo-dark border border-neo-blue/30 rounded px-4 py-2 text-white focus:border-neo-blue outline-none" />
          </div>
        </div>
        <button onClick={updateFeeConfig} disabled={updating} className="mt-4 px-6 py-2 bg-neo-blue text-neo-darker font-bold rounded-lg hover:shadow-aura transition disabled:opacity-50">
          {updating ? 'Updating...' : 'Update Fee Configuration'}
        </button>
      </div>
    </div>
  );
}
