# SmartWallet Authentication Guide

This guide explains how SmartWallet authentication works in the Lira Protocol and how to configure it as the primary login method.

## Overview

Lira Protocol supports multiple authentication methods:
1. **RainbowKit** - Traditional wallet connection (MetaMask, WalletConnect, etc.)
2. **SmartWallet** - Advanced account abstraction with social login (PRIMARY)
3. **DAO Token Resolution** - Username-based authentication with DAO token mapping

## SmartWallet Integration

### What is SmartWallet?

SmartWallet provides:
- **Account Abstraction**: Gasless transactions and improved UX
- **Social Login**: Login with Google, Twitter, Email
- **Session Keys**: Persistent sessions without repeated wallet approvals
- **Multi-Chain Support**: Works across BASE, Ethereum, and other chains

### Configuration

#### 1. Environment Variables

Add these to your `.env` file:

```env
# Wallet Connect Project ID (required for RainbowKit)
NEXT_PUBLIC_WALLET_CONNECT_ID=your_wallet_connect_project_id

# SmartWallet Configuration (Coinbase Smart Wallet)
NEXT_PUBLIC_SMART_WALLET_ENABLED=true
NEXT_PUBLIC_SMART_WALLET_PROVIDER=coinbase

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_CHAIN_NAME=base
BASE_RPC_URL=https://mainnet.base.org

# DAO Token Resolution
NEXT_PUBLIC_DAO_TOKEN_CONTRACT=0x...
NEXT_PUBLIC_USERNAME_REGISTRY_CONTRACT=0x...

# Session Configuration
SESSION_SECRET=your_secret_key_for_sessions
SESSION_MAX_AGE=604800
```

#### 2. Smart Wallet Setup in `_app.tsx`

The application is configured to support SmartWallet through Wagmi v2 and RainbowKit v2:

```typescript
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'viem/chains';

const config = getDefaultConfig({
  appName: 'Lira Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID!,
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
```

RainbowKit v2 automatically includes Coinbase Smart Wallet in the default wallet list.

### Authentication Flow

#### 1. Initial Connection

```typescript
// User clicks "Connect Wallet"
import { useAccount, useConnect } from 'wagmi';

function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  // SmartWallet is automatically available in connectors
  return (
    <RainbowKitConnectButton />
  );
}
```

#### 2. Session Management

After connection, create a server-side session:

```typescript
// pages/api/auth/session.ts
export default async function handler(req, res) {
  const { address, signature } = req.body;
  
  // Verify signature
  const isValid = await verifySignature(address, signature);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Create session
  const session = await createSession({
    address,
    chainId: req.body.chainId,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  });
  
  res.setHeader('Set-Cookie', `session=${session.token}; HttpOnly; Secure; Path=/`);
  res.json({ success: true, session });
}
```

#### 3. Token Handling

Store authentication tokens securely:

```typescript
// lib/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  address: string | null;
  setAuth: (token: string, address: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      address: null,
      setAuth: (token, address) => set({ token, address }),
      clearAuth: () => set({ token: null, address: null }),
    }),
    {
      name: 'lira-auth',
    }
  )
);
```

#### 4. Logout Flow

```typescript
// Disconnect wallet and clear session
function LogoutButton() {
  const { disconnect } = useDisconnect();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  
  const handleLogout = async () => {
    // Clear server session
    await fetch('/api/auth/logout', { method: 'POST' });
    
    // Disconnect wallet
    disconnect();
    
    // Clear local auth state
    clearAuth();
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

## DAO Token Resolution by Username

### Overview

Users can be identified by usernames that map to DAO tokens, enabling social-style interactions while maintaining on-chain identity.

### Architecture

```
Username → Registry Contract → DAO Token → Wallet Address
```

### Implementation

#### 1. Username Registry Contract

```solidity
// contracts/UsernameRegistry.sol
pragma solidity ^0.8.20;

contract UsernameRegistry {
    mapping(string => address) public usernameToToken;
    mapping(address => string) public tokenToUsername;
    mapping(address => address) public tokenToOwner;
    
    event UsernameRegistered(string username, address indexed token, address indexed owner);
    
    function registerUsername(
        string memory username,
        address daoToken,
        address owner
    ) external {
        require(usernameToToken[username] == address(0), "Username taken");
        require(bytes(tokenToUsername[daoToken]).length == 0, "Token already has username");
        
        usernameToToken[username] = daoToken;
        tokenToUsername[daoToken] = username;
        tokenToOwner[daoToken] = owner;
        
        emit UsernameRegistered(username, daoToken, owner);
    }
    
    function resolveUsername(string memory username) 
        external 
        view 
        returns (address token, address owner) 
    {
        token = usernameToToken[username];
        owner = tokenToOwner[token];
    }
}
```

#### 2. Username Resolution Service

```typescript
// lib/username.ts
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_USERNAME_REGISTRY_CONTRACT!;

const client = createPublicClient({
  chain: base,
  transport: http(),
});

export async function resolveUsername(username: string) {
  const result = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'resolveUsername',
    args: [username],
  });
  
  return {
    token: result[0],
    owner: result[1],
  };
}

export async function getUsernameByToken(token: string) {
  const result = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'tokenToUsername',
    args: [token],
  });
  
  return result;
}
```

#### 3. Login with Username

```typescript
// components/UsernameLogin.tsx
import { useState } from 'react';
import { resolveUsername } from '@/lib/username';
import { useConnect } from 'wagmi';

export function UsernameLogin() {
  const [username, setUsername] = useState('');
  const { connect } = useConnect();
  
  const handleLogin = async () => {
    // Resolve username to DAO token and owner
    const { token, owner } = await resolveUsername(username);
    
    // Connect with the resolved owner address
    // In practice, user still needs to sign with their wallet
    connect();
    
    // Store username context
    sessionStorage.setItem('lira_username', username);
    sessionStorage.setItem('lira_dao_token', token);
  };
  
  return (
    <div>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

### Authentication Context

Combine wallet connection with username resolution:

```typescript
// lib/auth-context.ts
import { createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { getUsernameByToken, resolveUsername } from './username';

interface AuthContext {
  address: string | undefined;
  username: string | null;
  daoToken: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContext>({
  address: undefined,
  username: null,
  daoToken: null,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const [username, setUsername] = useState<string | null>(null);
  const [daoToken, setDaoToken] = useState<string | null>(null);
  
  useEffect(() => {
    if (address) {
      // Try to load from session first
      const storedUsername = sessionStorage.getItem('lira_username');
      const storedToken = sessionStorage.getItem('lira_dao_token');
      
      if (storedUsername && storedToken) {
        setUsername(storedUsername);
        setDaoToken(storedToken);
      }
    } else {
      setUsername(null);
      setDaoToken(null);
      sessionStorage.removeItem('lira_username');
      sessionStorage.removeItem('lira_dao_token');
    }
  }, [address]);
  
  return (
    <AuthContext.Provider
      value={{
        address,
        username,
        daoToken,
        isAuthenticated: !!address,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

## Security Considerations

### 1. Session Security
- Use `HttpOnly` cookies for session tokens
- Set `Secure` flag in production
- Implement CSRF protection
- Use short session expiry times

### 2. Signature Verification
Always verify wallet signatures on the server:

```typescript
import { verifyMessage } from 'viem';

async function verifySignature(address: string, signature: string, message: string) {
  const recoveredAddress = await verifyMessage({
    address,
    message,
    signature,
  });
  
  return recoveredAddress.toLowerCase() === address.toLowerCase();
}
```

### 3. Rate Limiting
Implement rate limiting for authentication endpoints:

```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts',
});
```

### 4. Username Security
- Validate username format (alphanumeric, length limits)
- Check for offensive/reserved usernames
- Rate limit username registration
- Require signature for username changes

## Testing

### Local Testing

1. **Start development server**:
```bash
npm run dev
```

2. **Connect with test wallet**:
- Use MetaMask with BASE Sepolia testnet
- Or use Coinbase Smart Wallet

3. **Test username resolution**:
```typescript
// Test in browser console
const result = await fetch('/api/username/resolve?username=alice');
console.log(await result.json());
```

### Integration Tests

```typescript
// __tests__/auth.test.ts
import { resolveUsername } from '@/lib/username';

describe('Username Resolution', () => {
  it('resolves username to token', async () => {
    const result = await resolveUsername('alice');
    expect(result.token).toBeDefined();
    expect(result.owner).toBeDefined();
  });
  
  it('handles non-existent username', async () => {
    await expect(resolveUsername('nonexistent')).rejects.toThrow();
  });
});
```

## Troubleshooting

### SmartWallet Not Appearing
- Check RainbowKit version (should be v2+)
- Verify Wallet Connect Project ID is set
- Check browser console for errors
- Ensure you're on a supported chain

### Session Expires Too Quickly
- Increase `SESSION_MAX_AGE` in environment variables
- Implement token refresh mechanism
- Check cookie settings in production

### Username Resolution Fails
- Verify contract address is correct
- Check network (should be BASE mainnet/testnet)
- Ensure RPC endpoint is working
- Check contract is deployed and accessible

## Best Practices

1. **Always use HTTPS in production**
2. **Implement proper error handling**
3. **Log authentication events**
4. **Use environment-specific configurations**
5. **Regular security audits**
6. **Keep dependencies updated**
7. **Test across different wallets**
8. **Monitor authentication metrics**

---

**Last Updated**: 2026-01-20  
**Version**: 1.0.0  
**Maintainer**: SMSDAO Team
