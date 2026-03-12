# LIRA Protocol - Production Deployment Guide

## Overview

LIRA is configured for production deployment with Node 24+, PM2 process management, and automated Vercel deployment with dynamic environment configuration.

## System Requirements

- **Node.js**: >= 24.0.0
- **npm**: >= 10.0.0
- **PM2**: Latest (for local production)
- **OS**: Windows 11, Linux, macOS
- **Database**: PostgreSQL 14+

## Quick Start

### Production with PM2

```bash
npm install
npm run build
npm run pm2:start  # Starts web + indexer
npm run pm2:monit  # Monitor
npm run pm2:logs   # View logs
```

### Vercel Deployment

1. Push to main branch
2. Add environment variables in Vercel dashboard
3. Auto-deploys with dynamic injection

### Windows 11 Admin

1. Download `lira-admin-windows.zip` from CI artifacts
2. Extract and run `admin.exe`
3. Or use PM2: `npm run pm2:start`

## Environment Configuration

See `.env.example` for all variables. Use `@placeholder` format for Vercel.

Required variables:
- `DATABASE_URL`
- `NEXT_PUBLIC_RPC_BASE_MAINNET`
- `NEXT_PUBLIC_LIRA_TOKEN`
- `JWT_SECRET`
- `NEXT_PUBLIC_WALLET_CONNECT_ID`

## PM2 Commands

```bash
npm run pm2:start    # Start services
npm run pm2:stop     # Stop services
npm run pm2:restart  # Restart services
npm run pm2:logs     # View logs
npm run pm2:monit    # Interactive monitor
```

## Database Setup

```bash
# Create database
createdb lira

# Apply schema to database (development)
npm run db:push

# Or run migrations (production/CI)
npm run db:migrate:deploy

# Seed data
npm run db:seed
```

> **Note**: If upgrading from a previous version, always run `npm run db:migrate:deploy` (production) or `npm run db:push` (development) to apply any schema changes (e.g., new unique constraints or columns) before starting the application. Skipping this step will cause runtime errors.

## Monitoring

Logs are in `./logs/`:
- `pm2-out.log` - Application output
- `pm2-error.log` - Application errors
- `indexer-out.log` - Indexer output
- `indexer-error.log` - Indexer errors

## Troubleshooting

### Port in use
```bash
lsof -i :3000          # Unix
netstat -ano | findstr :3000  # Windows
```

### Reset PM2
```bash
pm2 kill
npm run pm2:start
```

### Database issues
```bash
npm run db:studio  # Open Prisma Studio
psql $DATABASE_URL # Test connection
```

## Support

- Issues: https://github.com/SMSDAO/lira/issues
- Docs: /docs/*.md in repository
