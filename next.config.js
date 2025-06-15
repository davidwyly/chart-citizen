/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Align webpack aliases with tsconfig.json path mappings
    config.resolve.alias = {
      ...config.resolve.alias,
      // Match tsconfig.json: "@/*": ["./*"]
      '@': '.',
      // Specific engine aliases for better organization
      '@engine': './engine',
      '@components': './components',
      '@lib': './lib',
      '@types': './types',
      '@hooks': './hooks',
      // Keep engine-specific aliases for internal engine imports
      '@core': './engine/core',
      '@utils': './engine/utils',
      '@assets': './assets'
    };
    return config;
  }
};

module.exports = nextConfig; 