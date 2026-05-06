import Head from 'next/head';
import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import PixelsLayout from '@ui/PixelsLayout';
import GlassCard from '@ui/GlassCard';
import GradientText from '@ui/GradientText';
import { pixelsTabs } from '@/config/pixelsTabs';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function WalletPage() {
  const { address, isConnected } = useAccount();

  const truncate = (addr: string) =>
    `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return (
    <>
      <Head>
        <title>Wallet — Lira Protocol</title>
      </Head>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold">
            <GradientText>Wallet</GradientText>
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Manage your wallet and NFT status.
          </p>
        </motion.div>

        {/* Connect card */}
        <GlassCard className="p-6 space-y-4" glow={isConnected}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/70">
              {isConnected ? 'Connected Wallet' : 'Connect Wallet'}
            </span>
            {isConnected && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: 'rgba(34,197,94,0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(34,197,94,0.3)',
                }}
              >
                ● Online
              </span>
            )}
          </div>

          {isConnected && address ? (
            <div className="space-y-3">
              <div
                className="px-4 py-3 rounded-xl text-sm font-mono text-white/80"
                style={{
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.25)',
                }}
              >
                {truncate(address)}
              </div>
              <ConnectButton />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(37,99,235,0.2))',
                  boxShadow: '0 0 20px rgba(124,58,237,0.3)',
                }}
              >
                💼
              </div>
              <p className="text-sm text-white/50 text-center">
                Connect your wallet to view your portfolio and NFT status.
              </p>
              <ConnectButton />
            </div>
          )}
        </GlassCard>

        {/* Tier badge */}
        <GlassCard className="p-6 space-y-4">
          <span className="text-sm font-medium text-white/70">Tier Status</span>
          <div className="flex items-center gap-4">
            <div
              className="px-5 py-2 rounded-full font-bold text-sm"
              style={
                isConnected
                  ? {
                      background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                      boxShadow: '0 0 16px rgba(124,58,237,0.5)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)',
                    }
              }
            >
              {isConnected ? '⚡ Pro' : '🔒 Free'}
            </div>
            <p className="text-xs text-white/40">
              {isConnected
                ? 'Full access to all features'
                : 'Connect wallet to unlock Pro features'}
            </p>
          </div>
        </GlassCard>

        {/* NFT Status */}
        <GlassCard className="p-6 space-y-3">
          <span className="text-sm font-medium text-white/70">NFT Status</span>
          {isConnected ? (
            <div className="grid grid-cols-2 gap-3">
              {['Lira Genesis #001', 'DAO Pass #42'].map((nft) => (
                <div
                  key={nft}
                  className="p-3 rounded-xl text-xs text-white/60 text-center"
                  style={{
                    background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}
                >
                  🎴 {nft}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">
              Connect wallet to view your NFTs.
            </p>
          )}
        </GlassCard>
      </div>
    </>
  );
}

WalletPage.getLayout = function getLayout(page: ReactElement) {
  return <PixelsLayout tabs={pixelsTabs}>{page}</PixelsLayout>;
};
