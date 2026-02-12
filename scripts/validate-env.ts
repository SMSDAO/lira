#!/usr/bin/env ts-node

/**
 * Validate environment variables before build
 * Usage: npm run env:validate
 */

interface ValidationRule {
  key: string;
  required: boolean;
  type?: 'string' | 'number' | 'boolean' | 'address';
  pattern?: RegExp;
  description: string;
}

const VALIDATION_RULES: ValidationRule[] = [
  // Network Configuration
  {
    key: 'NEXT_PUBLIC_CHAIN_ID',
    required: true,
    type: 'number',
    description: 'Blockchain network chain ID',
  },
  {
    key: 'NEXT_PUBLIC_CHAIN_NAME',
    required: true,
    type: 'string',
    description: 'Blockchain network name',
  },
  {
    key: 'NEXT_PUBLIC_RPC_BASE_SEPOLIA',
    required: false,
    type: 'string',
    pattern: /^https?:\/\/.+/,
    description: 'Base Sepolia RPC URL',
  },
  {
    key: 'NEXT_PUBLIC_RPC_BASE_MAINNET',
    required: false,
    type: 'string',
    pattern: /^https?:\/\/.+/,
    description: 'Base Mainnet RPC URL',
  },
  
  // Contract Addresses (optional for development)
  {
    key: 'NEXT_PUBLIC_LIRA_TOKEN',
    required: false,
    type: 'address',
    description: 'LIRA token contract address',
  },
  {
    key: 'NEXT_PUBLIC_LIRA_REGISTRY',
    required: false,
    type: 'address',
    description: 'LIRA registry contract address',
  },
  {
    key: 'NEXT_PUBLIC_LIRA_PROFILE',
    required: false,
    type: 'address',
    description: 'LIRA profile contract address',
  },
  {
    key: 'NEXT_PUBLIC_LIRA_SOCIAL_GRAPH',
    required: false,
    type: 'address',
    description: 'LIRA social graph contract address',
  },
  {
    key: 'NEXT_PUBLIC_FACTORY',
    required: false,
    type: 'address',
    description: 'Token launch factory contract address',
  },
  {
    key: 'NEXT_PUBLIC_USER_FACTORY',
    required: false,
    type: 'address',
    description: 'User token factory contract address',
  },
  
  // WalletConnect
  {
    key: 'NEXT_PUBLIC_WALLET_CONNECT_ID',
    required: true,
    type: 'string',
    description: 'WalletConnect project ID',
  },
  
  // Database (required for production)
  {
    key: 'DATABASE_URL',
    required: process.env.NODE_ENV === 'production',
    type: 'string',
    pattern: /^postgresql:\/\/.+/,
    description: 'PostgreSQL database URL',
  },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

function validateAddress(value: string): boolean {
  // Check if it's a valid Ethereum address or "NOT_DEPLOYED"
  if (value === 'NOT_DEPLOYED') return true;
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function validateEnvironmentVariable(rule: ValidationRule): ValidationResult['errors'] | null {
  const value = process.env[rule.key];
  const errors: string[] = [];

  // Check if required and missing
  if (rule.required && !value) {
    return [`Missing required variable: ${rule.key} - ${rule.description}`];
  }

  // Skip validation if not set and not required
  if (!value && !rule.required) {
    return null;
  }

  // Type validation
  if (rule.type && value) {
    switch (rule.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push(`${rule.key} must be a number, got: ${value}`);
        }
        break;
      
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          errors.push(`${rule.key} must be 'true' or 'false', got: ${value}`);
        }
        break;
      
      case 'address':
        if (!validateAddress(value)) {
          errors.push(`${rule.key} must be a valid Ethereum address or NOT_DEPLOYED, got: ${value}`);
        }
        break;
    }
  }

  // Pattern validation
  if (rule.pattern && value && !rule.pattern.test(value)) {
    errors.push(`${rule.key} does not match required pattern`);
  }

  return errors.length > 0 ? errors : null;
}

function validate(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  console.log('🔍 Validating environment variables...\n');

  // Check Node environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  result.info.push(`Environment: ${nodeEnv}`);

  // Validate each rule
  for (const rule of VALIDATION_RULES) {
    const errors = validateEnvironmentVariable(rule);
    
    if (errors) {
      result.errors.push(...errors);
      result.valid = false;
    } else if (process.env[rule.key]) {
      result.info.push(`✓ ${rule.key}`);
    } else if (!rule.required) {
      result.warnings.push(`Optional: ${rule.key} not set - ${rule.description}`);
    }
  }

  // Special warnings
  if (process.env.NEXT_PUBLIC_LIRA_TOKEN === 'NOT_DEPLOYED') {
    result.warnings.push('Contracts not deployed - application may have limited functionality');
  }

  if (process.env.JWT_SECRET === 'change_this_in_production' && nodeEnv === 'production') {
    result.errors.push('JWT_SECRET must be changed in production!');
    result.valid = false;
  }

  return result;
}

function main() {
  const result = validate();

  // Print info
  if (result.info.length > 0) {
    console.log('ℹ️  Configuration:');
    result.info.forEach(info => console.log(`   ${info}`));
    console.log('');
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }

  // Print errors
  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(error => console.log(`   ${error}`));
    console.log('');
    console.log('Environment validation failed!');
    process.exit(1);
  }

  console.log('✅ Environment validation passed!\n');
  process.exit(0);
}

// Run validation
main();
