# Lira Protocol - Deployment Guide

This document provides comprehensive instructions for deploying the Lira Protocol to staging and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Health Checks](#health-checks)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Node.js >= 18.0.0
- npm >= 9.0.0
- PHP >= 8.1 with Composer
- Go >= 1.21
- Java >= 17 with Maven
- PostgreSQL >= 14
- Docker & Docker Compose (recommended)
- Git

### Required Accounts
- BASE RPC endpoint (Alchemy, Infura, etc.)
- BaseScan API key (for contract verification)
- WalletConnect Project ID
- AWS/Cloud provider account (for hosting)

## Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/SMSDAO/lira.git
cd lira
```

2. **Create environment file**
```bash
cp .env.example .env
```

3. **Configure .env file**
```env
# Network Configuration
NEXT_PUBLIC_CHAIN_ID=8453
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key

# Database
DATABASE_URL=postgresql://user:password@host:5432/lira

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_ID=your_project_id

# API URLs (update for production)
NEXT_PUBLIC_API_URL=https://api.lira.ai
NEXT_PUBLIC_GO_API_URL=https://go-api.lira.ai
NEXT_PUBLIC_JAVA_API_URL=https://java-api.lira.ai
```

## Database Setup

### Local Development

1. **Install PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

2. **Create database**
```bash
sudo -u postgres psql
CREATE DATABASE lira;
CREATE USER lira_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE lira TO lira_user;
\q
```

3. **Run migrations**
```bash
psql -U lira_user -d lira -f database/schema.sql
```

### Production (AWS RDS)

1. Create PostgreSQL RDS instance
2. Configure security groups
3. Update DATABASE_URL in .env
4. Run migrations remotely

## Smart Contract Deployment

### Testnet Deployment (BASE Sepolia)

1. **Compile contracts**
```bash
npx hardhat compile
```

2. **Run tests**
```bash
npx hardhat test
```

3. **Deploy to testnet**
```powershell
.\scripts\contracts.ps1 -Network baseSepolia -Action deploy
```

Or using Hardhat directly:
```bash
npx hardhat run scripts/deploy/deploy.js --network baseSepolia
```

4. **Verify contracts**
```powershell
.\scripts\contracts.ps1 -Network baseSepolia -Action verify
```

### Mainnet Deployment (BASE)

⚠️ **IMPORTANT**: Complete security audit before mainnet deployment!

1. **Final testing**
```bash
npm run test
npx hardhat coverage
```

2. **Deploy to mainnet**
```powershell
.\scripts\contracts.ps1 -Network base -Action deploy
```

3. **Verify contracts**
```powershell
.\scripts\contracts.ps1 -Network base -Action verify
```

4. **Save contract addresses**
- Addresses saved in `deployments/base-addresses.json`
- Update frontend configuration

## Backend Services

### Docker Deployment (Recommended)

1. **Build and start all services**
```bash
docker-compose up -d
```

2. **Check service health**
```bash
docker-compose ps
docker-compose logs -f
```

### Manual Deployment

#### PHP API

```bash
cd backend/php
composer install --no-dev
php -S 0.0.0.0:8000 -t public
```

For production, use Nginx + PHP-FPM:
```nginx
server {
    listen 80;
    server_name api.lira.ai;
    root /var/www/lira/backend/php/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

#### Go API

```bash
cd backend/go
go build -o lira-go-api cmd/api/main.go
./lira-go-api
```

For production, use systemd:
```ini
[Unit]
Description=Lira Go API
After=network.target

[Service]
Type=simple
User=lira
WorkingDirectory=/opt/lira/backend/go
ExecStart=/opt/lira/backend/go/lira-go-api
Restart=always

[Install]
WantedBy=multi-user.target
```

#### Java API

```bash
cd backend/java
mvn clean package
java -jar target/lira-java-api.jar
```

## Frontend Deployment

### Using Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

3. **Configure environment variables in Vercel dashboard**

### Using Docker

```bash
docker build -f Dockerfile.frontend -t lira-frontend .
docker run -p 3000:3000 lira-frontend
```

### Using PM2

```bash
npm run build
npm install -g pm2
pm2 start npm --name "lira-frontend" -- start
pm2 save
pm2 startup
```

## Production Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Backup strategy in place
- [ ] SSL certificates obtained
- [ ] Domain names configured
- [ ] CDN setup (Cloudflare)

### Security

- [ ] Private keys secured (AWS Secrets Manager)
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] DDoS protection active

### Performance

- [ ] Database indexes optimized
- [ ] Caching strategy implemented
- [ ] CDN for static assets
- [ ] Image optimization
- [ ] Code splitting enabled
- [ ] Lazy loading implemented
- [ ] Gzip compression enabled

### Monitoring

- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Log aggregation (ELK Stack)
- [ ] APM (New Relic/Datadog)
- [ ] Blockchain event monitoring

## Monitoring

### Application Monitoring

1. **Sentry for Error Tracking**
```bash
npm install @sentry/nextjs
```

Configure in `next.config.js`:
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: 'lira-protocol',
  project: 'lira-frontend',
});
```

2. **Health Endpoints**
- Frontend: `https://lira.ai/api/health`
- PHP API: `https://api.lira.ai/api/health`
- Go API: `https://go-api.lira.ai/health`

### Smart Contract Monitoring

1. **Event Monitoring**
```javascript
// Monitor TokenLaunched events
liraFactory.on('TokenLaunched', (token, creator, name) => {
  console.log(`New token launched: ${name} by ${creator}`);
  // Send notification, update database, etc.
});
```

2. **Gas Price Monitoring**
```javascript
const gasPrice = await provider.getGasPrice();
// Alert if gas price too high
```

## Rollback Procedure

In case of issues:

1. **Frontend Rollback**
```bash
vercel rollback
```

2. **Backend Rollback**
```bash
docker-compose down
docker-compose up -d --force-recreate
```

3. **Database Rollback**
```bash
psql -U lira_user -d lira -f database/backup.sql
```

4. **Contract Pause** (Emergency)
```bash
npx hardhat run scripts/emergency-pause.js --network base
```

## Support

For deployment issues:
- GitHub Issues: https://github.com/SMSDAO/lira/issues
- Email: devops@lira.ai
- Discord: [Coming soon]

---

Last Updated: 2026-01-12
