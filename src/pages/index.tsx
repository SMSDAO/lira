import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { motion } from 'framer-motion';
import PixelsLayout from '@ui/PixelsLayout';
import GlassCard from '@ui/GlassCard';
import GradientText from '@ui/GradientText';
import { pixelsTabs } from '@/config/pixelsTabs';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const recentPrompts = [
  { text: 'Generate a smart contract for ERC-20 token with minting controls', score: 94, tag: 'Smart Contract' },
  { text: 'Analyze DEX liquidity pool opportunities on BASE', score: 91, tag: 'DEX' },
  { text: 'Create an AI agent for automated portfolio rebalancing', score: 88, tag: 'AI Agent' },
];

export default function Home() {
  const router = useRouter();
  const [quickPrompt, setQuickPrompt] = useState('');
  return (
    <>
      <Head>
        <title>Lira Protocol — Quantum-Powered Token Launch Platform</title>
        <meta name="description" content="Launch tokens with quantum oracle intelligence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <p className="text-white/40 text-sm font-medium tracking-widest uppercase">
            Welcome back
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            <GradientText>LIRA Protocol</GradientText>
          </h1>
          <p className="text-white/50 text-base max-w-md">
            Quantum-powered token launches, AI agents, and DAO management on BASE.
          </p>
        </motion.div>

        {/* Wallet connect */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <GlassCard className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-white/70">Wallet</p>
              <p className="text-xs text-white/40">Connect to unlock all features</p>
            </div>
            <ConnectButton />
          </GlassCard>
        </motion.div>

        {/* Quick optimize input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <GlassCard className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
              Quick Optimize
            </h2>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="quick-optimize-prompt"
                className="text-sm font-medium text-white/70"
              >
                Your Prompt
              </label>
              <textarea
                id="quick-optimize-prompt"
                rows={3}
                placeholder="Enter a prompt to optimize…"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                className={[
                  'w-full rounded-xl px-4 py-3 resize-none',
                  'bg-white/[0.05] backdrop-blur-[20px]',
                  'border border-white/[0.08]',
                  'text-white placeholder-white/30 text-sm',
                  'focus:outline-none focus:border-[#7C3AED]/60 focus:shadow-[0_0_20px_rgba(124,58,237,0.5)]',
                  'transition-all duration-300',
                ].join(' ')}
              />
            </div>
            <button
              onClick={() => {
                const trimmed = quickPrompt.trim();
                const query = trimmed ? `?prompt=${encodeURIComponent(trimmed)}` : '';
                router.push(`/optimizer${query}`);
              }}
              className="block w-full text-center px-6 py-3 text-base rounded-xl font-semibold bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300"
            >
              ✨ Go to Optimizer
            </button>
          </GlassCard>
        </motion.div>

        {/* Recent prompts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
            Recent Prompts
          </h2>
          {recentPrompts.map((item, idx) => (
            <GlassCard key={idx} className="p-4 flex items-center gap-4" hover>
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                  boxShadow: '0 0 8px rgba(124,58,237,0.6)',
                }}
              />
              <p className="flex-1 text-sm text-white/70 truncate">{item.text}</p>
              <span
                className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                  boxShadow: '0 0 8px rgba(124,58,237,0.4)',
                }}
              >
                {item.score}
              </span>
            </GlassCard>
          ))}
          <Link
            href="/history"
            className="block text-center text-xs text-white/30 hover:text-white/60 transition-colors pt-2"
          >
            View all history →
          </Link>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="space-y-3"
        >
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
            Platform
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: '🚀', label: 'Token Launch', href: '/launch' },
              { icon: '🤖', label: 'AI Agents', href: '/agents' },
              { icon: '📊', label: 'Dashboard', href: '/dashboard' },
              { icon: '⚛️', label: 'Quantum Oracle', href: '/dev' },
              { icon: '🔗', label: 'Registry', href: '/registry' },
              { icon: '🌐', label: 'Social', href: '/social' },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <GlassCard className="p-4 flex flex-col items-center gap-2 text-center h-full" hover>
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-medium text-white/60">{item.label}</span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

Home.getLayout = function getLayout(page: ReactElement): ReactNode {
  return (
    <PixelsLayout
      tabs={pixelsTabs}
      topBarContent={
        <div className="flex items-center justify-between gap-2">
          <ConnectButton showBalance={false} />
        </div>
      }
    >
      {page}
    </PixelsLayout>
  );
};

