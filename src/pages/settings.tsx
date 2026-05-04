import Head from 'next/head';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import PixelsLayout from '@ui/PixelsLayout';
import GlassCard from '@ui/GlassCard';
import GlowButton from '@ui/GlowButton';
import GradientText from '@ui/GradientText';
import NeonInput from '@ui/NeonInput';
import { pixelsTabs } from '@/config/pixelsTabs';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <Head>
        <title>Settings — Lira Protocol</title>
      </Head>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold">
            <GradientText>Settings</GradientText>
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Customize your Lira experience.
          </p>
        </motion.div>

        {/* Theme */}
        <GlassCard className="p-6 space-y-4">
          <span className="text-sm font-medium text-white/70">Theme</span>
          <div className="flex gap-3">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all duration-200"
                style={
                  theme === t
                    ? {
                        background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                        color: '#fff',
                        boxShadow: '0 0 16px rgba(124,58,237,0.5)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }
                }
              >
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Layout density */}
        <GlassCard className="p-6 space-y-4">
          <span className="text-sm font-medium text-white/70">Layout Density</span>
          <div className="flex gap-3">
            {(['comfortable', 'compact'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className="flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all duration-200"
                style={
                  density === d
                    ? {
                        background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                        color: '#fff',
                        boxShadow: '0 0 16px rgba(124,58,237,0.5)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }
                }
              >
                {d === 'comfortable' ? '📐 Comfortable' : '📏 Compact'}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* API Key (local dev only) */}
        <GlassCard className="p-6 space-y-4">
          <div>
            <span className="text-sm font-medium text-white/70">API Key</span>
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(245,158,11,0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              Local Dev Only
            </span>
          </div>
          <NeonInput
            type="password"
            placeholder="sk-…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-white/30">
            Your API key is stored locally and never sent to our servers.
          </p>
        </GlassCard>

        {/* Save */}
        <GlowButton onClick={handleSave} size="lg" className="w-full">
          {saved ? '✅ Saved!' : '💾 Save Settings'}
        </GlowButton>
      </div>
    </>
  );
}

SettingsPage.getLayout = function getLayout(page: ReactElement) {
  return <PixelsLayout tabs={pixelsTabs}>{page}</PixelsLayout>;
};
