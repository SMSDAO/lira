/**
 * TradeOS Registry dashboard.
 *
 * Displays deployed Lira smart contracts with real-time yield and risk metrics.
 * Data is fetched via a REST endpoint and refreshed via a WebSocket stream.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { ContractMetrics, ContractStatus, RiskLevel } from '@lira/types';

// ──────────────────────────────────────────────────────────────────────────────
// Mock / seed data (replaced by real API in production)
// ──────────────────────────────────────────────────────────────────────────────

const SEED_CONTRACTS: ContractMetrics[] = [
  {
    address: '0x1111111111111111111111111111111111111111',
    name: 'ETH/USDC Yield Vault',
    status: 'active',
    apy: 14.2,
    tvl: 2_500_000n,
    riskScore: 22,
    riskLevel: 'low',
    lastExecution: new Date(Date.now() - 3 * 60 * 1000),
    chainId: 84532,
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    name: 'BTC Margin Strategy',
    status: 'active',
    apy: 31.7,
    tvl: 980_000n,
    riskScore: 68,
    riskLevel: 'high',
    lastExecution: new Date(Date.now() - 12 * 60 * 1000),
    chainId: 84532,
  },
  {
    address: '0x3333333333333333333333333333333333333333',
    name: 'Stablecoin Ladder',
    status: 'paused',
    apy: 8.1,
    tvl: 5_000_000n,
    riskScore: 9,
    riskLevel: 'low',
    lastExecution: new Date(Date.now() - 60 * 60 * 1000),
    chainId: 84532,
  },
  {
    address: '0x4444444444444444444444444444444444444444',
    name: 'Volatile DeFi Basket',
    status: 'active',
    apy: 52.0,
    tvl: 340_000n,
    riskScore: 88,
    riskLevel: 'critical',
    lastExecution: new Date(Date.now() - 2 * 60 * 1000),
    chainId: 84532,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function formatTvl(tvl: bigint): string {
  const n = Number(tvl);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function formatDate(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const STATUS_BADGE: Record<ContractStatus, string> = {
  active:     'bg-green-500/20 text-green-400 border-green-500/40',
  paused:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  expired:    'bg-gray-500/20 text-gray-400 border-gray-500/40',
  liquidated: 'bg-red-500/20 text-red-400 border-red-500/40',
};

const RISK_COLOR: Record<RiskLevel, string> = {
  low:      'text-green-400',
  medium:   'text-yellow-400',
  high:     'text-orange-400',
  critical: 'text-red-400',
};

function RiskBar({ score }: { score: number }) {
  const level: RiskLevel = score < 25 ? 'low' : score < 50 ? 'medium' : score < 75 ? 'high' : 'critical';
  const color =
    score < 25 ? 'bg-green-500' : score < 50 ? 'bg-yellow-500' : score < 75 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-mono ${RISK_COLOR[level]}`}>{score}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Contract row
// ──────────────────────────────────────────────────────────────────────────────

function ContractRow({ contract }: { contract: ContractMetrics }) {
  const short = `${contract.address.slice(0, 6)}…${contract.address.slice(-4)}`;
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition">
      <td className="py-3 px-4">
        <div className="font-semibold text-sm text-white">{contract.name}</div>
        <div className="text-xs text-gray-500 font-mono">{short}</div>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_BADGE[contract.status]}`}>
          {contract.status}
        </span>
      </td>
      <td className="py-3 px-4 text-right font-mono text-sm text-neo-blue">
        {contract.apy.toFixed(1)}%
      </td>
      <td className="py-3 px-4 text-right font-mono text-sm text-white">
        {formatTvl(contract.tvl)}
      </td>
      <td className="py-3 px-4" style={{ minWidth: 140 }}>
        <RiskBar score={contract.riskScore} />
      </td>
      <td className="py-3 px-4 text-right text-xs text-gray-500">
        {formatDate(contract.lastExecution)}
      </td>
    </tr>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Summary stats strip
// ──────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 rounded-lg border border-neo-blue/20 bg-neo-dark p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold font-mono text-neo-blue">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main registry
// ──────────────────────────────────────────────────────────────────────────────

export default function RegistryDashboard() {
  const [contracts, setContracts] = useState<ContractMetrics[]>(SEED_CONTRACTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [live, setLive] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Simulate real-time updates (WebSocket in production)
  useEffect(() => {
    if (!live) return;
    const interval = setInterval(() => {
      setContracts(prev =>
        prev.map(c => ({
          ...c,
          apy: parseFloat(Math.max(0, c.apy + (Math.random() - 0.5) * 0.4).toFixed(1)),
          riskScore: Math.min(100, Math.max(0, c.riskScore + Math.round((Math.random() - 0.5) * 3))),
          lastExecution: c.status === 'active' && Math.random() > 0.8 ? new Date() : c.lastExecution,
        })),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [live]);

  // In production, connect to real WebSocket
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) return;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = (ev: MessageEvent) => {
        try {
          const update: ContractMetrics = JSON.parse(ev.data as string);
          setContracts(prev => prev.map(c => (c.address === update.address ? update : c)));
        } catch {
          // ignore malformed messages
        }
      };
      return () => ws.close();
    } catch {
      // WebSocket not available in this environment
    }
  }, []);

  const filtered = contracts.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalTvl = contracts.reduce((sum, c) => sum + c.tvl, 0n);
  const avgApy = contracts.reduce((sum, c) => sum + c.apy, 0) / (contracts.length || 1);
  const activeCount = contracts.filter(c => c.status === 'active').length;
  const highRiskCount = contracts.filter(c => c.riskScore >= 75).length;

  return (
    <div className="flex flex-col gap-6 p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neo-blue">TradeOS Registry</h2>
          <p className="text-xs text-gray-500 mt-0.5">Deployed Lira contracts · real-time metrics</p>
        </div>
        <button
          onClick={() => setLive(l => !l)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition
            ${live
              ? 'border-green-500/40 bg-green-500/10 text-green-400'
              : 'border-gray-600 bg-gray-800 text-gray-400'
            }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          {live ? 'Live' : 'Paused'}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Total TVL" value={formatTvl(totalTvl)} sub="across all contracts" />
        <StatCard label="Avg. APY" value={`${avgApy.toFixed(1)}%`} sub="blended yield" />
        <StatCard label="Active" value={String(activeCount)} sub={`of ${contracts.length} contracts`} />
        <StatCard label="High Risk" value={String(highRiskCount)} sub="score ≥ 75" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          className="bg-neo-darker border border-neo-blue/20 rounded px-3 py-1.5 text-sm text-white
            placeholder-gray-600 focus:outline-none focus:border-neo-blue/50 w-52"
          placeholder="Search contracts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {(['all', 'active', 'paused', 'expired', 'liquidated'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded border transition
              ${statusFilter === s
                ? 'border-neo-blue bg-neo-blue/20 text-neo-blue'
                : 'border-gray-700 bg-neo-dark text-gray-400 hover:border-neo-blue/40'
              }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-white/10 bg-neo-dark overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-500 text-xs uppercase">
              <th className="text-left py-2 px-4 font-medium">Contract</th>
              <th className="text-left py-2 px-4 font-medium">Status</th>
              <th className="text-right py-2 px-4 font-medium">APY</th>
              <th className="text-right py-2 px-4 font-medium">TVL</th>
              <th className="py-2 px-4 font-medium text-center">Risk Score</th>
              <th className="text-right py-2 px-4 font-medium">Last Exec</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-600 py-12">
                  No contracts match your filter
                </td>
              </tr>
            ) : (
              filtered.map(c => <ContractRow key={c.address} contract={c} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
