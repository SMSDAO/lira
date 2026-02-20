/**
 * PM2 Configuration for LIRA Protocol
 * Manages Next.js application in production without Docker
 * Compatible with Node 24+ on Windows 11 and Unix systems
 * 
 * For Windows 11 admin.exe:
 * - Automatically syncs with blockchain contracts
 * - Manages full app state across web + indexer + contracts
 * - Real-time contract event monitoring
 */

module.exports = {
  apps: [
    {
      name: 'lira-web',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Public RPC endpoints (no secrets) for Vercel compatibility
        NEXT_PUBLIC_RPC_BASE_MAINNET: process.env.NEXT_PUBLIC_RPC_BASE_MAINNET || 'https://mainnet.base.org',
        NEXT_PUBLIC_RPC_BASE_SEPOLIA: process.env.NEXT_PUBLIC_RPC_BASE_SEPOLIA || 'https://sepolia.base.org',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_RPC_BASE_MAINNET: process.env.NEXT_PUBLIC_RPC_BASE_MAINNET || 'https://mainnet.base.org',
        NEXT_PUBLIC_RPC_BASE_SEPOLIA: process.env.NEXT_PUBLIC_RPC_BASE_SEPOLIA || 'https://sepolia.base.org',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        NEXT_PUBLIC_RPC_BASE_SEPOLIA: 'https://sepolia.base.org',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
    },
    {
      name: 'lira-indexer',
      script: 'npm',
      args: 'run dev',
      cwd: './indexer',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        INDEXER_NETWORK: 'base-mainnet',
        // Auto-sync with contracts for Windows 11 admin.exe
        CONTRACT_SYNC_ENABLED: 'true',
        CONTRACT_SYNC_INTERVAL: '15000', // 15 seconds
      },
      error_file: './logs/indexer-error.log',
      out_file: './logs/indexer-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'production.server.com',
      ref: 'origin/main',
      repo: 'git@github.com:SMSDAO/lira.git',
      path: '/var/www/lira',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
    },
  },
};
