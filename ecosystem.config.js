/**
 * PM2 Configuration for LIRA Protocol
 * Manages Next.js application in production without Docker
 * Compatible with Node 24+ on Windows 11 and Unix systems
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
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
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
      args: 'run',
      cwd: './indexer',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        INDEXER_NETWORK: 'base-mainnet',
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
