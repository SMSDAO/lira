#!/usr/bin/env ts-node

/**
 * Generate environment files for different deployment stages
 * Usage: npm run env:generate [environment]
 */

import * as fs from 'fs';
import * as path from 'path';

interface EnvironmentConfig {
  name: string;
  filename: string;
  chainId: string;
  chainName: string;
  rpcUrl: string;
  contracts?: {
    liraToken?: string;
    registry?: string;
    profile?: string;
    socialGraph?: string;
    factory?: string;
    userFactory?: string;
  };
}

const environments: Record<string, EnvironmentConfig> = {
  local: {
    name: 'Local Development',
    filename: '.env.local',
    chainId: '31337', // Hardhat
    chainName: 'localhost',
    rpcUrl: 'http://127.0.0.1:8545',
  },
  beta: {
    name: 'Beta (Base Sepolia)',
    filename: '.env.beta',
    chainId: '84532',
    chainName: 'base-sepolia',
    rpcUrl: 'https://sepolia.base.org',
  },
  production: {
    name: 'Production (Base Mainnet)',
    filename: '.env.production',
    chainId: '8453',
    chainName: 'base',
    rpcUrl: 'https://mainnet.base.org',
  },
};

function generateEnvFile(config: EnvironmentConfig): string {
  const lines: string[] = [
    `# ${config.name} Environment`,
    `# Generated: ${new Date().toISOString()}`,
    '',
    '# Network Configuration',
    `NEXT_PUBLIC_CHAIN_ID=${config.chainId}`,
    `NEXT_PUBLIC_CHAIN_NAME=${config.chainName}`,
    `NEXT_PUBLIC_RPC_URL=${config.rpcUrl}`,
    '',
  ];

  if (config.name.includes('Sepolia')) {
    lines.push('# Base Sepolia');
    lines.push(`NEXT_PUBLIC_RPC_BASE_SEPOLIA=${config.rpcUrl}`);
    lines.push('NEXT_PUBLIC_RPC_BASE_MAINNET=https://mainnet.base.org');
  } else if (config.name.includes('Mainnet')) {
    lines.push('# Base Mainnet');
    lines.push(`NEXT_PUBLIC_RPC_BASE_MAINNET=${config.rpcUrl}`);
    lines.push('NEXT_PUBLIC_RPC_BASE_SEPOLIA=https://sepolia.base.org');
  } else {
    lines.push('# Local Network');
    lines.push('NEXT_PUBLIC_RPC_BASE_SEPOLIA=https://sepolia.base.org');
    lines.push('NEXT_PUBLIC_RPC_BASE_MAINNET=https://mainnet.base.org');
  }

  lines.push('');
  lines.push('# Contract Addresses');
  
  if (config.contracts) {
    lines.push(`NEXT_PUBLIC_LIRA_TOKEN=${config.contracts.liraToken || 'NOT_DEPLOYED'}`);
    lines.push(`NEXT_PUBLIC_LIRA_REGISTRY=${config.contracts.registry || 'NOT_DEPLOYED'}`);
    lines.push(`NEXT_PUBLIC_LIRA_PROFILE=${config.contracts.profile || 'NOT_DEPLOYED'}`);
    lines.push(`NEXT_PUBLIC_LIRA_SOCIAL_GRAPH=${config.contracts.socialGraph || 'NOT_DEPLOYED'}`);
    lines.push(`NEXT_PUBLIC_FACTORY=${config.contracts.factory || 'NOT_DEPLOYED'}`);
    lines.push(`NEXT_PUBLIC_USER_FACTORY=${config.contracts.userFactory || 'NOT_DEPLOYED'}`);
  } else {
    lines.push('NEXT_PUBLIC_LIRA_TOKEN=NOT_DEPLOYED');
    lines.push('NEXT_PUBLIC_LIRA_REGISTRY=NOT_DEPLOYED');
    lines.push('NEXT_PUBLIC_LIRA_PROFILE=NOT_DEPLOYED');
    lines.push('NEXT_PUBLIC_LIRA_SOCIAL_GRAPH=NOT_DEPLOYED');
    lines.push('NEXT_PUBLIC_FACTORY=NOT_DEPLOYED');
    lines.push('NEXT_PUBLIC_USER_FACTORY=NOT_DEPLOYED');
  }

  lines.push('');
  lines.push('# WalletConnect');
  lines.push('NEXT_PUBLIC_WALLET_CONNECT_ID=your_wallet_connect_project_id');
  lines.push('');
  lines.push('# Admin Configuration');
  lines.push('NEXT_PUBLIC_ADMIN_WALLET=0x0000000000000000000000000000000000000000');
  lines.push('');
  lines.push('# Database');
  lines.push('DATABASE_URL=postgresql://user:password@localhost:5432/lira');
  lines.push('');
  lines.push('# API Configuration');
  lines.push('NEXT_PUBLIC_API_URL=http://localhost:8000');
  lines.push('');
  lines.push('# Security');
  lines.push('JWT_SECRET=change_this_in_production');
  lines.push('SESSION_SECRET=change_this_in_production');
  lines.push('');
  lines.push('# Features');
  lines.push('ENABLE_SOCIAL_FEATURES=true');
  lines.push('ENABLE_QUANTUM_ORACLE=true');
  lines.push('');

  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const envName = args[0] || 'local';

  if (!environments[envName]) {
    console.error(`Unknown environment: ${envName}`);
    console.error(`Available: ${Object.keys(environments).join(', ')}`);
    process.exit(1);
  }

  const config = environments[envName];
  const content = generateEnvFile(config);
  const filepath = path.join(process.cwd(), config.filename);

  // Check if file exists
  if (fs.existsSync(filepath)) {
    console.log(`⚠️  File ${config.filename} already exists`);
    console.log('   Backup created as ${config.filename}.backup');
    fs.copyFileSync(filepath, `${filepath}.backup`);
  }

  // Write new file
  fs.writeFileSync(filepath, content);
  console.log(`✅ Generated ${config.filename} for ${config.name}`);
  console.log(`   Chain ID: ${config.chainId}`);
  console.log(`   RPC: ${config.rpcUrl}`);
  console.log('');
  console.log('⚠️  Remember to:');
  console.log('   1. Update contract addresses after deployment');
  console.log('   2. Set WalletConnect project ID');
  console.log('   3. Configure database URL');
  console.log('   4. Update JWT and session secrets');
}

main();
