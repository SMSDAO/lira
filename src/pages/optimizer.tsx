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

export default function OptimizerPage() {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOptimize() {
    if (!prompt.trim()) return;
    setLoading(true);
    setOutput('');
    setScore(null);
    // Simulate optimization (replace with real API call)
    await new Promise((r) => setTimeout(r, 1200));
    setOutput(
      `Optimized: ${prompt.trim()}\n\nEnhanced with clarity, precision, and context-aware improvements for maximum AI agent performance.`
    );
    setScore(Math.floor(Math.random() * 15) + 85);
    setLoading(false);
  }

  async function handleRegenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setOutput(
      `Re-optimized: ${prompt.trim()}\n\nAlternate formulation with enhanced semantic structure and agent-friendly directives.`
    );
    setScore(Math.floor(Math.random() * 10) + 88);
    setLoading(false);
  }

  function handleCopy() {
    if (output) navigator.clipboard.writeText(output);
  }

  return (
    <>
      <Head>
        <title>Optimizer — Lira Protocol</title>
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold">
            <GradientText>Prompt Optimizer</GradientText>
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Transform your prompts into precision-engineered instructions.
          </p>
        </motion.div>

        {/* Input panel */}
        <GlassCard className="p-6 space-y-4">
          <label className="block text-sm font-medium text-white/70">
            Your Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            placeholder="Enter your prompt here…"
            className={[
              'w-full rounded-xl px-4 py-3 resize-none',
              'bg-white/[0.05] backdrop-blur-[20px]',
              'border border-white/[0.08]',
              'text-white placeholder-white/30',
              'shadow-[0_10px_30px_rgba(0,0,0,0.4)]',
              'focus:outline-none focus:border-[#7C3AED]/60 focus:shadow-[0_0_20px_rgba(124,58,237,0.5)]',
              'transition-all duration-300',
            ].join(' ')}
          />
          <GlowButton
            onClick={handleOptimize}
            loading={loading}
            size="lg"
            className="w-full"
          >
            ✨ Optimize
          </GlowButton>
        </GlassCard>

        {/* Output panel */}
        {output && (
          <GlassCard className="p-6 space-y-4" glow>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">
                Optimized Output
              </span>
              {score !== null && (
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                    boxShadow: '0 0 12px rgba(124,58,237,0.5)',
                  }}
                >
                  Score: {score}
                </span>
              )}
            </div>
            <pre className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">
              {output}
            </pre>
            <div className="flex gap-3 flex-wrap">
              <GlowButton variant="outline" size="sm" onClick={handleCopy}>
                📋 Copy
              </GlowButton>
              <GlowButton
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                loading={loading}
              >
                🔄 Regenerate
              </GlowButton>
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}

OptimizerPage.getLayout = function getLayout(page: ReactElement) {
  return <PixelsLayout tabs={pixelsTabs}>{page}</PixelsLayout>;
};
