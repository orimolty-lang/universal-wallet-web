import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/universal-wallet-web',
  assetPrefix: '/universal-wallet-web/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@farcaster/mini-app-solana': path.join(__dirname, 'privy-farcaster-stub.js'),
    };
    // Fix HeartbeatWorker.js module issue
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
