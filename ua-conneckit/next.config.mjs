/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/universal-wallet-web',
  assetPrefix: '/universal-wallet-web/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  webpack: (config, { isServer }) => {
    // Fix HeartbeatWorker.js module issue
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
