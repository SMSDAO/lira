#!/usr/bin/env ts-node

/**
 * Generate admin wallet for deployment and operations
 * Usage: npm run wallet:generate
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface WalletInfo {
  address: string;
  privateKey: string;
  mnemonic: string;
  publicKey: string;
  created: string;
}

function encrypt(text: string, password: string): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(64);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    authTag: authTag.toString('hex'),
    encrypted,
  });
}

function generateWallet(): WalletInfo {
  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || '',
    publicKey: wallet.publicKey,
    created: new Date().toISOString(),
  };
}

function saveWalletInfo(wallet: WalletInfo, encrypt: boolean = true) {
  const walletDir = path.join(process.cwd(), '.wallet');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(walletDir)) {
    fs.mkdirSync(walletDir, { recursive: true });
  }

  // Save encrypted private key
  if (encrypt) {
    const password = process.env.WALLET_PASSWORD || crypto.randomBytes(32).toString('hex');
    const encryptedKey = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(password.slice(0, 32)),
      Buffer.from(password.slice(32, 48))
    );
    // Note: In production, use proper key management (KMS, Vault, etc.)
    console.log('⚠️  Store this password securely:');
    console.log(`   ${password}`);
  }

  // Save wallet info (without private key in plain text)
  const publicInfo = {
    address: wallet.address,
    publicKey: wallet.publicKey,
    created: wallet.created,
  };

  fs.writeFileSync(
    path.join(walletDir, 'admin-wallet.json'),
    JSON.stringify(publicInfo, null, 2)
  );

  // Save to .env format
  const envContent = `
# Admin Wallet Configuration
# Generated: ${wallet.created}
NEXT_PUBLIC_ADMIN_WALLET=${wallet.address}
ADMIN_PRIVATE_KEY=${wallet.privateKey}
ADMIN_MNEMONIC="${wallet.mnemonic}"
`;

  fs.writeFileSync(
    path.join(walletDir, 'admin-wallet.env'),
    envContent
  );

  // Update .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let gitignoreContent = '';
  
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }

  if (!gitignoreContent.includes('.wallet')) {
    fs.appendFileSync(gitignorePath, '\n# Wallet files\n.wallet/\n*.wallet.json\n*.wallet.env\n');
  }
}

async function checkBalance(wallet: WalletInfo, rpcUrl: string): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(wallet.address);
    return ethers.formatEther(balance);
  } catch (error) {
    return 'Unable to fetch';
  }
}

async function main() {
  console.log('🔐 Generating Admin Wallet...\n');

  // Check if wallet already exists
  const walletPath = path.join(process.cwd(), '.wallet', 'admin-wallet.json');
  if (fs.existsSync(walletPath)) {
    console.log('⚠️  Admin wallet already exists!');
    console.log('   Delete .wallet/ directory to generate a new one.\n');
    
    const existing = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    console.log('📍 Existing wallet address:', existing.address);
    console.log('   Created:', existing.created);
    
    process.exit(0);
  }

  // Generate new wallet
  const wallet = generateWallet();

  console.log('✅ Wallet Generated Successfully!\n');
  console.log('📍 Address:', wallet.address);
  console.log('🔑 Public Key:', wallet.publicKey);
  console.log('📅 Created:', wallet.created);
  console.log('');

  // Check balances on different networks
  console.log('💰 Checking balances...');
  
  const networks = [
    { name: 'Base Sepolia', rpc: 'https://sepolia.base.org' },
    { name: 'Base Mainnet', rpc: 'https://mainnet.base.org' },
  ];

  for (const network of networks) {
    const balance = await checkBalance(wallet, network.rpc);
    console.log(`   ${network.name}: ${balance} ETH`);
  }
  console.log('');

  // Save wallet
  saveWalletInfo(wallet);

  console.log('💾 Wallet saved to .wallet/admin-wallet.json');
  console.log('   Environment variables saved to .wallet/admin-wallet.env');
  console.log('');
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('   1. Keep the private key and mnemonic SECRET');
  console.log('   2. Never commit .wallet/ to git (added to .gitignore)');
  console.log('   3. Use environment variables or secure key management in production');
  console.log('   4. Fund this wallet on testnet before deploying contracts');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Fund wallet on Base Sepolia:');
  console.log(`      https://www.coinbase.com/faucets/base-ethereum-goerli-faucet`);
  console.log('   2. Add to Vercel environment variables:');
  console.log(`      NEXT_PUBLIC_ADMIN_WALLET=${wallet.address}`);
  console.log('   3. For production, use hardware wallet or MPC');
  console.log('');

  // Display mnemonic (user should save it securely)
  console.log('🔐 Mnemonic (SAVE THIS SECURELY):');
  console.log('   ' + wallet.mnemonic);
  console.log('');
}

main().catch((error) => {
  console.error('Error generating wallet:', error);
  process.exit(1);
});
