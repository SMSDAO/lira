# Vercel Deployment Guide for Lira Protocol

This guide explains how to deploy the Lira Protocol application to Vercel at lira-social.vercel.app.

## Prerequisites

- Vercel account with access to the SMSDAO organization (if applicable)
- GitHub repository connected to Vercel
- Required environment variables and secrets (see below)

## Deployment Configuration

The application is configured for Vercel deployment using the `vercel.json` configuration file at the root of the repository.

### Build Configuration

- **Framework**: Next.js 14
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher

## Required Environment Variables

Set these environment variables in your Vercel project settings (Project Settings → Environment Variables):

### Core Configuration
```
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_CHAIN_NAME=base
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### API Endpoints
```
NEXT_PUBLIC_API_URL=https://your-php-api.vercel.app
NEXT_PUBLIC_GO_API_URL=https://your-go-api.vercel.app
NEXT_PUBLIC_JAVA_API_URL=https://your-java-api.vercel.app
```

### Wallet Connect
```
NEXT_PUBLIC_WALLET_CONNECT_ID=your_wallet_connect_project_id
```

### Smart Contract Addresses (after deployment)
```
NEXT_PUBLIC_LIRA_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS=0x...
```

### Admin Configuration
```
ADMIN_ADDRESSES=0x...comma,separated,list
```

### Optional: Feature Flags
```
ENABLE_QUANTUM_ORACLE=true
ENABLE_SOCIAL_FEATURES=true
ENABLE_AUTO_LAUNCH=true
ENABLE_AGENT_EXECUTION=true
```

## Deployment Steps

### 1. Connect GitHub Repository

1. Go to Vercel Dashboard
2. Click "New Project"
3. Import the `SMSDAO/lira` repository
4. Select the repository and click "Import"

### 2. Configure Project Settings

1. **Framework Preset**: Next.js
2. **Root Directory**: ./
3. **Build Command**: `npm run build`
4. **Output Directory**: Leave default (`.next`)

### 3. Set Environment Variables

Go to Project Settings → Environment Variables and add all required variables listed above.

**Important**: 
- Add variables for Production, Preview, and Development environments
- Sensitive values should be added as "Secret" type
- `NEXT_PUBLIC_*` variables are exposed to the browser

### 4. Deploy

Click "Deploy" - Vercel will:
1. Clone the repository
2. Install dependencies
3. Run the build process
4. Deploy to `lira-social.vercel.app`

## Domain Configuration

### Custom Domain: lira-social.vercel.app

1. Go to Project Settings → Domains
2. Add domain: `lira-social.vercel.app`
3. Follow Vercel's instructions to configure DNS

### Production Domain

After initial deployment, you can configure a custom production domain:
1. Add domain in Vercel dashboard
2. Update DNS records as instructed
3. Enable automatic HTTPS

## Backend Services

**Note**: Vercel primarily hosts the Next.js frontend. The backend services (PHP, Go, Java) need separate deployment:

### Option 1: Serverless Functions (Recommended)
- Convert PHP/Go/Java backends to Vercel Serverless Functions
- Place in `/api` directory following Vercel API routes pattern

### Option 2: External Hosting
- Deploy backends to separate services (Railway, Fly.io, AWS, etc.)
- Update `NEXT_PUBLIC_API_URL` variables to point to hosted backends

### Option 3: Hybrid Approach
- Host simple endpoints as Vercel functions
- Use external services for complex/heavy operations

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Commits to `main` branch → `lira-social.vercel.app`
- **Preview**: Pull requests → Unique preview URLs

### Branch Configuration

Configure deployment branches:
1. Go to Project Settings → Git
2. Production Branch: `main`
3. Enable automatic deployments for PRs

## Build Optimization

### Performance Tips

1. **Enable Image Optimization**: Already configured in `next.config.js`
2. **Use Vercel Analytics**: Enable in project settings
3. **Configure Caching**: Headers set in `vercel.json`

### Build Time Optimization

```json
// In vercel.json
{
  "github": {
    "silent": true
  }
}
```

## Monitoring and Debugging

### View Deployment Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click on a deployment
4. View "Build Logs" and "Function Logs"

### Common Issues

#### Build Failures
- Check build logs for errors
- Verify all dependencies are in `package.json`
- Ensure environment variables are set correctly

#### Runtime Errors
- Check function logs
- Verify API endpoints are accessible
- Check CORS configuration

#### Performance Issues
- Enable Vercel Analytics
- Review Core Web Vitals
- Optimize images and assets

## Security Considerations

### Environment Variables
- Never commit secrets to repository
- Use Vercel Environment Variables for all sensitive data
- Rotate secrets regularly

### Headers
Security headers are configured in `vercel.json`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### CORS Configuration
Configure CORS for API routes if needed:
```typescript
// pages/api/example.ts
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://lira-social.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  // ... rest of handler
}
```

## Testing Deployment

### Before Going Live

1. **Test Preview Deployment**: Create a PR and test preview URL
2. **Verify Environment Variables**: Check all variables are set correctly
3. **Test Wallet Connection**: Ensure WalletConnect works
4. **Test All Pages**: Navigate through dashboard, launch, agents, admin
5. **Check Mobile Responsiveness**: Test on different devices

### Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] Wallet connection works
- [ ] Navigation functions properly
- [ ] Admin dashboard accessible
- [ ] API calls succeed
- [ ] No console errors
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Custom domain configured

## Rollback Procedure

If issues arise after deployment:

1. Go to Vercel Dashboard
2. Find previous successful deployment
3. Click "..." menu
4. Select "Promote to Production"

## Support and Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js on Vercel**: https://vercel.com/docs/frameworks/nextjs
- **Vercel Support**: https://vercel.com/support

## Additional Notes

### Smart Contracts
Smart contracts must be deployed separately to BASE/Monad networks before frontend deployment. Update contract addresses in environment variables after deployment.

### Database
If using PostgreSQL, consider:
- Vercel Postgres
- External hosted database (AWS RDS, Railway, etc.)
- Ensure connection strings are set correctly

### Quantum Oracle
Q# quantum services require separate hosting or integration through external APIs.

---

**Status**: Ready for Deployment  
**Last Updated**: 2026-01-20  
**Maintainer**: SMSDAO Team
