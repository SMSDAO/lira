/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'lira.ai',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'gateway.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  turbopack: {},
  env: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '8453', // BASE mainnet
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ui': path.resolve(__dirname, 'packages/ui'),
    };
    return config;
  },
};

module.exports = nextConfig;
