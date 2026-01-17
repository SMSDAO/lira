/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'lira.ai'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  env: {
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '8453', // BASE mainnet
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_GO_API_URL: process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8080',
    NEXT_PUBLIC_JAVA_API_URL: process.env.NEXT_PUBLIC_JAVA_API_URL || 'http://localhost:8081',
  },
};

module.exports = nextConfig;
