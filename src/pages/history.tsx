import Head from 'next/head';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import PixelsLayout from '@ui/PixelsLayout';
import GlassCard from '@ui/GlassCard';
import GradientText from '@ui/GradientText';
import NeonInput from '@ui/NeonInput';
import { pixelsTabs } from '@/config/pixelsTabs';

interface HistoryItem {
  id: string;
  prompt: string;
  score: number;
  date: string;
  tag: string;
}

const MOCK_HISTORY: HistoryItem[] = [
  { id: '1', prompt: 'Generate a smart contract for ERC-20 token with minting controls', score: 94, date: '2026-05-04', tag: 'Smart Contract' },
  { id: '2', prompt: 'Analyze DEX liquidity pool opportunities on BASE', score: 91, date: '2026-05-03', tag: 'DEX' },
  { id: '3', prompt: 'Create an AI agent for automated portfolio rebalancing', score: 88, date: '2026-05-03', tag: 'AI Agent' },
  { id: '4', prompt: 'Design a governance voting mechanism with quadratic voting', score: 96, date: '2026-05-02', tag: 'Governance' },
  { id: '5', prompt: 'Build a cross-chain bridge integration for Ethereum and BASE', score: 89, date: '2026-05-01', tag: 'Bridge' },
  { id: '6', prompt: 'Optimize gas usage for batch NFT minting operations', score: 92, date: '2026-04-30', tag: 'NFT' },
];

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const tags = ['All', ...Array.from(new Set(MOCK_HISTORY.map((h) => h.tag)))];

  const filtered = MOCK_HISTORY.filter((item) => {
    const matchesSearch =
      !search || item.prompt.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || item.tag === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Head>
        <title>History — Lira Protocol</title>
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold">
            <GradientText>History</GradientText>
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Your recent prompt optimizations.
          </p>
        </motion.div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <NeonInput
            label="Search prompts"
            placeholder="Search prompts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            wrapperClassName="flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilter(tag)}
                className="px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200"
                style={
                  filter === tag
                    ? {
                        background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                        color: '#fff',
                        boxShadow: '0 0 12px rgba(124,58,237,0.5)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }
                }
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-white/40">No results found.</p>
            </GlassCard>
          ) : (
            filtered.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <GlassCard className="p-4 flex items-start gap-4" hover>
                  {/* Timeline dot */}
                  <div className="mt-1 flex-shrink-0">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                        boxShadow: '0 0 8px rgba(124,58,237,0.6)',
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{item.prompt}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-white/40">{item.date}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(124,58,237,0.15)',
                          color: '#a78bfa',
                          border: '1px solid rgba(124,58,237,0.3)',
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>
                  </div>

                  <span
                    className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                      boxShadow: '0 0 8px rgba(124,58,237,0.4)',
                    }}
                  >
                    {item.score}
                  </span>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

HistoryPage.getLayout = function getLayout(page: ReactElement) {
  return <PixelsLayout tabs={pixelsTabs}>{page}</PixelsLayout>;
};
