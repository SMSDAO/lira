#!/usr/bin/env ts-node

/**
 * Auto-claim Base Sepolia testnet faucet
 * Usage: npm run faucet:claim
 */

import { ethers } from 'ethers';
import axios from 'axios';

const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const MIN_BALANCE = ethers.parseEther('0.1'); // Minimum balance threshold

interface FaucetConfig {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

// Available faucets for Base Sepolia
const FAUCETS: FaucetConfig[] = [
  {
    name: 'Coinbase Faucet',
    url: 'https://faucet.quicknode.com/base/sepolia',
    method: 'GET',
  },
  {
    name: 'Alchemy Faucet',
    url: 'https://sepoliafaucet.com',
    method: 'GET',
  },
];

async function getBalance(address: string): Promise<bigint> {
  try {
    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
    const balance = await provider.getBalance(address);
    return balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

async function claimFaucet(address: string, faucet: FaucetConfig): Promise<boolean> {
  try {
    console.log(`   Attempting ${faucet.name}...`);
    
    const config: any = {
      method: faucet.method,
      url: faucet.url,
      headers: faucet.headers || {
        'Content-Type': 'application/json',
      },
    };

    if (faucet.method === 'POST' && faucet.body) {
      config.data = { ...faucet.body, address };
    }

    const response = await axios(config);
    
    if (response.status === 200) {
      console.log(`   ✅ Successfully requested from ${faucet.name}`);
      return true;
    } else {
      console.log(`   ⚠️  ${faucet.name} returned status ${response.status}`);
      return false;
    }
  } catch (error: any) {
    if (error.response?.status === 429) {
      console.log(`   ⏰ ${faucet.name} rate limit reached`);
    } else {
      console.log(`   ❌ ${faucet.name} error: ${error.message}`);
    }
    return false;
  }
}

async function waitForBalance(
  address: string,
  initialBalance: bigint,
  timeout: number = 60000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const currentBalance = await getBalance(address);
      
      if (currentBalance > initialBalance) {
        console.log(`   ✅ Balance updated: ${ethers.formatEther(currentBalance)} ETH`);
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    } catch (error) {
      // Continue waiting
    }
  }
  
  return false;
}

async function main() {
  console.log('💧 Base Sepolia Faucet Auto-Claim\n');

  // Get admin wallet address
  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET || process.env.ADMIN_WALLET;
  
  if (!adminWallet) {
    console.error('❌ Admin wallet address not found!');
    console.error('   Set NEXT_PUBLIC_ADMIN_WALLET or ADMIN_WALLET environment variable');
    console.error('   Or run: npm run wallet:generate');
    process.exit(1);
  }

  console.log('📍 Wallet:', adminWallet);

  // Check current balance
  console.log('💰 Checking current balance...');
  const currentBalance = await getBalance(adminWallet);
  console.log(`   Current: ${ethers.formatEther(currentBalance)} ETH`);
  console.log(`   Minimum: ${ethers.formatEther(MIN_BALANCE)} ETH`);
  console.log('');

  // Check if balance is sufficient
  if (currentBalance >= MIN_BALANCE) {
    console.log('✅ Balance is sufficient, no need to claim from faucet');
    process.exit(0);
  }

  console.log('⚠️  Balance below minimum threshold');
  console.log('🚀 Attempting to claim from faucets...\n');

  // Try each faucet
  let claimed = false;
  for (const faucet of FAUCETS) {
    const result = await claimFaucet(adminWallet, faucet);
    
    if (result) {
      claimed = true;
      
      console.log('   ⏳ Waiting for transaction confirmation...');
      const updated = await waitForBalance(adminWallet, currentBalance, 120000);
      
      if (updated) {
        console.log('   ✅ Funds received!');
        break;
      } else {
        console.log('   ⏰ Transaction pending (may take a few minutes)');
      }
    }
    
    // Wait between attempts to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (!claimed) {
    console.log('\n⚠️  Could not automatically claim from faucets');
    console.log('   Manual options:');
    console.log('   1. Coinbase Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet');
    console.log('   2. Alchemy Faucet: https://sepoliafaucet.com');
    console.log('   3. QuickNode Faucet: https://faucet.quicknode.com/base/sepolia');
    console.log(`   Address: ${adminWallet}`);
    process.exit(1);
  }

  console.log('\n✅ Auto-claim completed successfully!');
  
  // Final balance check
  const finalBalance = await getBalance(adminWallet);
  console.log(`💰 Final balance: ${ethers.formatEther(finalBalance)} ETH`);
  
  if (finalBalance >= MIN_BALANCE) {
    console.log('✅ Ready for contract deployment!');
  } else {
    console.log('⚠️  Balance still below minimum, may need additional funds');
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
