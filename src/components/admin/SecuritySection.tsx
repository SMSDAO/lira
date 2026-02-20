import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiShield } from 'react-icons/fi';

interface SecurityData {
  contractAddresses: Record<string, string>;
  daoOperators: string[];
  warnings: Array<{ type: string; message: string; severity: string }>;
  healthChecks: Array<{ name: string; status: string; message: string }>;
  network: { chainId: number; name: string };
}

export default function SecuritySection() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/security');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-neo-blue">Loading security data...</div></div>;
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-400">Failed to load security data</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-neo-blue">Security & Configuration</h3>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertTriangle className="text-red-500 text-xl" />
            <h4 className="font-semibold text-red-400">Security Warnings</h4>
          </div>
          <div className="space-y-2">
            {data.warnings.map((warning, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-red-900/10 rounded">
                <FiAlertTriangle className="text-red-500 mt-0.5" />
                <div>
                  <div className="font-medium text-red-400">{warning.type}</div>
                  <div className="text-red-300/80 text-sm">{warning.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Addresses */}
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <h4 className="font-semibold text-white mb-4">Contract Addresses ({data.network.name})</h4>
        <div className="space-y-3">
          {Object.entries(data.contractAddresses).map(([name, address]) => (
            <div key={name} className="flex items-center justify-between p-3 bg-neo-dark rounded">
              <span className="text-gray-300 font-medium">{name}</span>
              <span className="text-neo-blue font-mono text-sm">{address || 'Not Set'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DAO Operators */}
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <h4 className="font-semibold text-white mb-4">DAO Operators</h4>
        {data.daoOperators.length > 0 ? (
          <div className="space-y-2">
            {data.daoOperators.map((operator, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-neo-dark rounded">
                <span className="text-gray-300 font-mono text-sm">{operator}</span>
                <span className="px-2 py-1 bg-neo-green/20 text-neo-green rounded text-xs">Active</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">No DAO operators configured</div>
        )}
      </div>

      {/* Health Checks */}
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <h4 className="font-semibold text-white mb-4">System Health</h4>
        <div className="space-y-3">
          {data.healthChecks.map((check, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-neo-dark rounded">
              <div className="flex items-center gap-3">
                {check.status === 'OK' ? (
                  <FiCheckCircle className="text-neo-green text-xl" />
                ) : (
                  <FiAlertTriangle className="text-yellow-500 text-xl" />
                )}
                <div>
                  <div className="text-white font-medium">{check.name}</div>
                  <div className="text-gray-400 text-sm">{check.message}</div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded text-sm font-medium ${check.status === 'OK' ? 'bg-neo-green/20 text-neo-green' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {check.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
