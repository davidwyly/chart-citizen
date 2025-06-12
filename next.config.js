/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './engine',
      '@core': './engine/core',
      '@components': './engine/components',
      '@utils': './engine/utils',
      '@assets': './assets',
      '@types': './engine/types'
    };
    return config;
  }
};

module.exports = nextConfig; 