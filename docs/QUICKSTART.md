# Lira Protocol - Quick Start Guide

Get up and running with Lira Protocol in under 10 minutes!

## Prerequisites

- Node.js 18+ and npm 9+
- A web browser with MetaMask or Coinbase Wallet
- (Optional) WalletConnect Project ID for production

## 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/SMSDAO/lira.git
cd lira

# Install dependencies
npm install
```

## 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your settings
```

### Minimum Configuration

```env
# Required: Wallet Connect (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLET_CONNECT_ID=your_project_id_here

# Chain Configuration (BASE mainnet)
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_CHAIN_NAME=base

# For Admin Access (add your wallet address)
ADMIN_ADDRESSES=0xYourWalletAddressHere
```

## 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 4. Connect Your Wallet

1. Click "Connect Wallet" in the top right
2. Choose your wallet (MetaMask, Coinbase Wallet, WalletConnect, etc.)
3. Approve the connection
4. You're in!

## 5. Explore the Platform

### User Dashboard (`/dashboard`)
- View your portfolio
- See token holdings
- Track agent activity
- Monitor earnings

### Launch Token (`/launch`)
- Create your own token
- Set name, symbol, supply
- Deploy to BASE network

### AI Agents (`/agents`)
- Create AI agents
- Execute quantum predictions
- Manage agent settings

### Admin Dashboard (`/admin`)  
*Only visible if your wallet is in `ADMIN_ADDRESSES`*
- Manage users
- Configure fees
- View system health
- Control settings

### Dev Portal (`/dev`)  
*Only visible if your wallet is in `DEV_ADDRESSES` or `ADMIN_ADDRESSES`*
- API documentation
- System logs
- Health monitoring
- Database schema

## What's Next?

### Deploy a Token
1. Go to `/launch`
2. Fill in token details
3. Click "Launch Token"
4. Confirm transaction
5. Your token is live on BASE!

### Create an AI Agent
1. Go to `/agents`
2. Click "Create Agent"
3. Configure agent settings
4. Deploy and execute

### Become an Admin
Add your wallet address to `ADMIN_ADDRESSES` in `.env.local`:
```env
ADMIN_ADDRESSES=0xYourAddress,0xOtherAdmin
```
Restart the server and refresh your browser.

## Common Issues

### "Connect Wallet" Button Not Working
- Make sure MetaMask or compatible wallet is installed
- Check that WalletConnect Project ID is set correctly
- Try refreshing the page

### Can't See Admin/Dev Dashboards
- Verify your wallet address is in the correct env variable
- Addresses must match exactly (including case)
- Restart the development server after changing `.env.local`

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_ID` | Yes | WalletConnect Project ID |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | Chain ID (8453 for BASE) |
| `ADMIN_ADDRESSES` | No | Comma-separated admin wallet addresses |
| `DEV_ADDRESSES` | No | Comma-separated developer wallet addresses |

See `.env.example` for the complete list.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Deploying to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

## Need Help?

- **Documentation**: Check `/docs` folder for detailed guides
- **Issues**: Open an issue on GitHub
- **Security**: See SECURITY_AUDIT.md for security guidelines

## Architecture Overview

```
Frontend (Next.js/React)
  ↓
Wallet Connection (RainbowKit + Wagmi)
  ↓
Smart Contracts (BASE Network)
  ↓
Backend APIs (PHP/Go/Java)
  ↓
Database (PostgreSQL)
```

## Key Features

✅ **Multi-Wallet Support** - MetaMask, Coinbase, WalletConnect, and more  
✅ **Smart Wallet** - Gasless transactions with Coinbase Smart Wallet  
✅ **Role-Based Access** - User, Admin, and Developer roles  
✅ **Token Launcher** - One-click token deployment  
✅ **AI Agents** - Quantum-powered intelligent agents  
✅ **Multi-Chain** - BASE mainnet and testnet support  

## Additional Resources

- **Main Documentation**: [docs/README.md](./README.md)
- **API Reference**: [docs/API.md](./API.md)
- **SmartWallet Guide**: [docs/SMARTWALLET_AUTH.md](./SMARTWALLET_AUTH.md)
- **RBAC System**: [docs/RBAC_DASHBOARDS.md](./RBAC_DASHBOARDS.md)
- **Deployment**: [docs/VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

---

**Ready to build?** 🚀

Start with `npm run dev` and begin exploring the platform!

**Questions?** Open an issue or check the documentation.

---

*Last Updated: 2026-01-20*  
*Version: 1.0.0*
