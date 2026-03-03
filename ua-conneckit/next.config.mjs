/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/universal-wallet-web',
  assetPrefix: '/universal-wallet-web/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
