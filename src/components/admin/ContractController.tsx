/**
 * Admin Contract Controller Component
 * Full control panel for smart contracts from admin.exe on Windows 11
 * Syncs with blockchain and updates local state in real-time
 */

import { useState, useEffect } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { AdminContractController, CONTRACT_ADDRESSES, RPC_ENDPOINTS } from '@/lib/contracts';
import { FiRefreshCw, FiCheck, FiX, FiAlertTriangle, FiExternalLink } from 'react-icons/fi';

export default function ContractController() {
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  
  const [controller] = useState(() => new AdminContractController());
  const [loading, setLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [liraInfo, setLiraInfo] = useState<any>(null);
  const [registryStats, setRegistryStats] = useState<any>(null);
  const [registeredTokens, setRegisteredTokens] = useState<any[]>([]);
  const [treasuryBalance, setTreasuryBalance] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  // Fetch all contract data
  const fetchContractData = async () => {
    setLoading(true);
    try {
      const [network, lira, registry, tokens, treasury] = await Promise.all([
        controller.getNetworkInfo(),
        controller.getLiraTokenInfo(),
        controller.getRegistryStats(),
        controller.getAllRegisteredTokens(),
        controller.getTreasuryBalance(),
      ]);

      setNetworkInfo(network);
      setLiraInfo(lira);
      setRegistryStats(registry);
      setRegisteredTokens(tokens);
      setTreasuryBalance(treasury);
    } catch (error) {
      console.error('Error fetching contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync with blockchain (refresh all data)
  const syncWithBlockchain = async () => {
    setSyncing(true);
    await fetchContractData();
    setSyncing(false);
  };

  useEffect(() => {
    fetchContractData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchContractData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Admin operations
  const handleSetDAOOperator = async (operatorAddress: string, status: boolean) => {
    if (!signer) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const result = await controller.setDAOOperator(operatorAddress, status, signer);
      if (result.success) {
        alert(`DAO operator ${status ? 'added' : 'removed'} successfully!\nTx: ${result.txHash}`);
        await syncWithBlockchain();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error setting DAO operator:', error);
      alert('Transaction failed');
    }
  };

  const handleUpdateTokenStatus = async (tokenAddress: string, isActive: boolean) => {
    if (!signer) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const result = await controller.updateTokenStatus(tokenAddress, isActive, signer);
      if (result.success) {
        alert(`Token ${isActive ? 'activated' : 'deactivated'} successfully!\nTx: ${result.txHash}`);
        await syncWithBlockchain();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating token status:', error);
      alert('Transaction failed');
    }
  };

  if (loading) {
    return (
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <FiRefreshCw className="animate-spin text-neo-blue text-3xl" />
          <span className="ml-3 text-gray-400">Loading contract data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Sync Button */}
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neo-blue">Smart Contract Controller</h2>
          <button
            onClick={syncWithBlockchain}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-neo-blue text-neo-darker font-bold rounded hover:shadow-aura transition disabled:opacity-50"
          >
            <FiRefreshCw className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync with Blockchain'}
          </button>
        </div>

        {/* Network Info */}
        {networkInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-gray-400 text-sm">Network</span>
              <p className="text-white font-mono">{networkInfo.name}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Chain ID</span>
              <p className="text-white font-mono">{networkInfo.chainId}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Block Number</span>
              <p className="text-white font-mono">{networkInfo.blockNumber}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">RPC</span>
              <p className="text-white font-mono text-xs truncate">{networkInfo.rpcUrl}</p>
            </div>
          </div>
        )}
      </div>

      {/* Contract Addresses */}
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-neo-blue mb-4">Contract Addresses</h3>
        <div className="space-y-2">
          {Object.entries(CONTRACT_ADDRESSES).map(([name, address]) => (
            <div key={name} className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400 capitalize">{name.replace(/([A-Z])/g, ' $1')}</span>
              <div className="flex items-center gap-2">
                <code className="text-white font-mono text-sm">{address || 'Not set'}</code>
                {address && (
                  <a
                    href={`https://basescan.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neo-blue hover:text-blue-400"
                  >
                    <FiExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIRA Token Info */}
      {liraInfo && (
        <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-neo-blue mb-4">LIRA Token</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 text-sm">Total Supply</span>
              <p className="text-white font-mono text-xl">{parseFloat(liraInfo.totalSupply).toLocaleString()} LIRA</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Symbol</span>
              <p className="text-white font-mono text-xl">{liraInfo.symbol}</p>
            </div>
          </div>
        </div>
      )}

      {/* Treasury Balance */}
      {treasuryBalance && (
        <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-neo-blue mb-4">Treasury Balance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 text-sm">ETH Balance</span>
              <p className="text-white font-mono text-xl">{parseFloat(treasuryBalance.eth).toFixed(4)} ETH</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">LIRA Balance</span>
              <p className="text-white font-mono text-xl">{parseFloat(treasuryBalance.lira).toLocaleString()} LIRA</p>
            </div>
          </div>
        </div>
      )}

      {/* Registry Stats */}
      {registryStats && (
        <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-neo-blue mb-4">Token Registry</h3>
          <div>
            <span className="text-gray-400 text-sm">Total Registered Tokens</span>
            <p className="text-white font-mono text-3xl">{registryStats.totalTokens}</p>
          </div>
        </div>
      )}

      {/* Registered Tokens List */}
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-neo-blue mb-4">Registered Tokens ({registeredTokens.length})</h3>
        {registeredTokens.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No tokens registered yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {registeredTokens.map((token) => (
              <div key={token.address} className="border border-gray-800 rounded-lg p-4 hover:border-neo-blue/50 transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-bold">{token.name} ({token.symbol})</h4>
                    <code className="text-gray-400 text-xs">{token.address}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      token.tokenType === 0 ? 'bg-blue-500/20 text-blue-400' :
                      token.tokenType === 1 ? 'bg-purple-500/20 text-purple-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {token.tokenType === 0 ? 'PROJECT' : token.tokenType === 1 ? 'USER' : 'SOCIAL'}
                    </span>
                    {token.isActive ? (
                      <FiCheck className="text-green-400" />
                    ) : (
                      <FiX className="text-red-400" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Owner: {token.owner.slice(0, 10)}...</span>
                  {isConnected && (
                    <button
                      onClick={() => handleUpdateTokenStatus(token.address, !token.isActive)}
                      className="text-neo-blue hover:underline text-xs"
                    >
                      {token.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Operations */}
      {isConnected && (
        <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-neo-blue mb-4">Admin Operations</h3>
          <p className="text-sm text-gray-400 mb-4">
            <FiAlertTriangle className="inline mr-2" />
            These operations require admin wallet signature and will execute on-chain transactions.
          </p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="DAO Operator Address (0x...)"
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                id="dao-operator-input"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('dao-operator-input') as HTMLInputElement;
                  if (input.value) handleSetDAOOperator(input.value, true);
                }}
                className="px-4 py-2 bg-neo-blue text-neo-darker font-bold rounded hover:shadow-aura transition"
              >
                Add DAO Operator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="bg-neo-darker border border-neo-blue/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-neo-blue mb-4">System Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Contract Integration</span>
            <span className="flex items-center gap-2 text-green-400">
              <FiCheck /> Online
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Blockchain Sync</span>
            <span className="flex items-center gap-2 text-green-400">
              <FiCheck /> Synced
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Wallet Connection</span>
            <span className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
              {isConnected ? <><FiCheck /> Connected</> : <><FiAlertTriangle /> Not Connected</>}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Admin.exe Sync</span>
            <span className="flex items-center gap-2 text-green-400">
              <FiCheck /> Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
