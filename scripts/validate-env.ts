#!/usr/bin/env ts-node

/**
 * Validate required environment variables before build and deployment.
 *
 * Production requirements:
 * - DATABASE_URL must be set
 * - JWT_SECRET and SESSION_SECRET must be set and not placeholder-like
 * - NEXT_PUBLIC_WALLET_CONNECT_ID must be set and valid
 * - ADMIN_ADDRESSES must be set with at least one wallet address
 *
 * UI-only testing is still allowed with NOT_DEPLOYED contract addresses.
 */

interface ValidationRule {
  key: string;
  required: boolean;
  type?: 'string' | 'number' | 'boolean' | 'address';
  pattern?: RegExp;
  description: string;
}

const PRODUCTION_REQUIRED_KEYS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'NEXT_PUBLIC_WALLET_CONNECT_ID',
  'ADMIN_ADDRESSES',
] as const;

const PLACEHOLDER_PATTERNS = [
  /^@.+$/i,
  /^replace_with_/i,
  /^change_me_/i,
  /^your_/i,
  /^example$/i,
  /^placeholder$/i,
  /^test$/i,
  /^todo$/i,
  /^tbd$/i,
  /^YOUR_PROJECT_ID$/i,
  /^NOT_DEPLOYED$/i,
];

const VALIDATION_RULES: ValidationRule[] = [
  {
    key: 'NEXT_PUBLIC_CHAIN_ID',
    required: false,
    type: 'number',
    description: 'Blockchain network chain ID (defaults to 8453)',
  },
  {
    key: 'NEXT_PUBLIC_CHAIN_NAME',
    required: false,
    type: 'string',
    description: 'Blockchain network name (defaults to base)',
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
    description: 'Base mainnet RPC URL',
  },
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
  {
    key: 'NEXT_PUBLIC_WALLET_CONNECT_ID',
    required: true,
    type: 'string',
    description: 'WalletConnect project ID used by RainbowKit',
  },
  {
    key: 'DATABASE_URL',
    required: true,
    type: 'string',
    pattern: /^postgres(?:ql)?:\/\/.+/i,
    description: 'PostgreSQL connection string',
  },
  {
    key: 'JWT_SECRET',
    required: true,
    type: 'string',
    description: 'JWT signing secret',
  },
  {
    key: 'SESSION_SECRET',
    required: true,
    type: 'string',
    description: 'Session signing secret',
  },
  {
    key: 'ADMIN_ADDRESSES',
    required: true,
    type: 'string',
    description: 'Comma-separated admin wallet addresses',
  },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

function isPlaceholderValue(value: string): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed === 'NOT_DEPLOYED') return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function validateAddress(value: string): boolean {
  if (value === 'NOT_DEPLOYED') return true;
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function validateEnvironmentVariable(rule: ValidationRule): ValidationResult['errors'] | null {
  const value = process.env[rule.key];
  const errors: string[] = [];

  if (!value && rule.required) {
    return [`Missing required variable: ${rule.key} - ${rule.description}`];
  }

  if (!value) {
    return null;
  }

  if (rule.key !== 'NEXT_PUBLIC_LIRA_TOKEN' && rule.key !== 'NEXT_PUBLIC_LIRA_REGISTRY' && rule.key !== 'NEXT_PUBLIC_LIRA_PROFILE' && rule.key !== 'NEXT_PUBLIC_LIRA_SOCIAL_GRAPH' && rule.key !== 'NEXT_PUBLIC_FACTORY' && rule.key !== 'NEXT_PUBLIC_USER_FACTORY' && rule.key !== 'NEXT_PUBLIC_ADMIN_WALLET') {
    if (isPlaceholderValue(value)) {
      errors.push(`${rule.key} contains a placeholder value: ${value}`);
    }
  }

  if (rule.type && value) {
    switch (rule.type) {
      case 'number':
        if (Number.isNaN(Number(value))) {
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
      default:
        break;
    }
  }

  if (rule.pattern && value && !rule.pattern.test(value)) {
    errors.push(`${rule.key} does not match the required pattern`);
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

  const nodeEnv = process.env.NODE_ENV || 'development';
  result.info.push(`Environment: ${nodeEnv}`);

  for (const rule of VALIDATION_RULES) {
    const errors = validateEnvironmentVariable(rule);
    if (errors) {
      result.errors.push(...errors);
      result.valid = false;
    } else if (process.env[rule.key]) {
      result.info.push(`✓ ${rule.key}`);
    }
  }

  if (nodeEnv === 'production') {
    for (const key of PRODUCTION_REQUIRED_KEYS) {
      const value = process.env[key];
      if (!value || isPlaceholderValue(value)) {
        result.errors.push(`Production requires a real value for ${key}`);
        result.valid = false;
      }
    }
  }

  if (process.env.NEXT_PUBLIC_LIRA_TOKEN === 'NOT_DEPLOYED' || process.env.NEXT_PUBLIC_FACTORY === 'NOT_DEPLOYED') {
    result.warnings.push('Contract addresses are still placeholders. UI-only testing is allowed, but real deployment requires real addresses.');
  }

  return result;
}

function main() {
  const result = validate();
  const isProduction = (process.env.NODE_ENV || 'development') === 'production';

  if (result.info.length > 0) {
    console.log('ℹ️  Configuration:');
    result.info.forEach((info) => console.log(`   ${info}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach((warning) => console.log(`   ${warning}`));
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach((error) => console.log(`   ${error}`));
    console.log('');

    if (isProduction) {
      console.log('Production environment validation failed. Fix the required variables before continuing.');
      process.exit(1);
    }

    console.log('Validation errors detected in a non-production environment. The app will continue, but deployment will fail until fixed.');
    console.log('');
  }

  console.log('✅ Environment validation passed.');
}

main();
