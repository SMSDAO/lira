import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <>
      <Head>
        <title>Lira Protocol - Quantum-Powered Token Launch Platform</title>
        <meta name="description" content="Launch tokens with quantum oracle intelligence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-neo-darker">
        {/* Header */}
        <header className="border-b border-neo-blue/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-neo-blue">LIRA</h1>
              </div>
              <nav className="hidden md:flex space-x-8">
                <Link href="/dashboard" className="text-gray-300 hover:text-neo-blue transition">
                  Dashboard
                </Link>
                <Link href="/launch" className="text-gray-300 hover:text-neo-blue transition">
                  Launch Token
                </Link>
                <Link href="/agents" className="text-gray-300 hover:text-neo-blue transition">
                  Agents
                </Link>
                <Link href="/admin" className="text-gray-300 hover:text-neo-blue transition">
                  Admin
                </Link>
              </nav>
              <ConnectButton />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neo-purple/20 via-neo-dark to-neo-blue/20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-neo-blue via-neo-purple to-neo-pink">
                Quantum-Powered<br />Token Launches
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
                Launch tokens with AI agents, quantum oracle intelligence, and parallel execution on BASE and Monad
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/launch"
                  className="px-8 py-4 bg-neo-blue text-neo-darker font-bold rounded-lg hover:shadow-aura-lg transition transform hover:scale-105"
                >
                  Launch Your Token
                </Link>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-transparent border-2 border-neo-blue text-neo-blue font-bold rounded-lg hover:bg-neo-blue/10 transition"
                >
                  Explore Dashboard
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-neo-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center mb-12 text-neo-blue">
              Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Auto Token Launch',
                  description: 'Launch tokens instantly with automatic liquidity and smart contract deployment',
                  icon: '🚀',
                },
                {
                  title: 'Quantum Oracle',
                  description: 'Q# powered quantum brain oracle for advanced market intelligence',
                  icon: '⚛️',
                },
                {
                  title: 'Parallel Agents',
                  description: 'Deploy and execute multiple AI agents simultaneously for model building',
                  icon: '🤖',
                },
                {
                  title: 'Smart Wallets',
                  description: 'Integrated wallet with social features and timeline like Zora',
                  icon: '💰',
                },
                {
                  title: 'Admin Control',
                  description: 'Full admin dashboard for fees, settings, billing, and user management',
                  icon: '⚙️',
                },
                {
                  title: 'Multi-Chain',
                  description: 'Production ready on BASE and Monad mainnets with full audit',
                  icon: '🔗',
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="p-6 bg-neo-darker border border-neo-blue/30 rounded-lg hover:shadow-aura transition"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h4 className="text-xl font-bold mb-2 text-neo-blue">{feature.title}</h4>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neo-blue/30 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
            <p>&copy; 2026 Lira Protocol. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
