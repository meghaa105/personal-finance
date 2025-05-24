/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  },
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  pageExtensions: ['js', 'jsx'],
  poweredByHeader: false
}

nextConfig.webpack = (config, { isServer }) => {
  // Add a rule to handle .node files
  config.module.rules.push({
    test: /\.node$/,
    use: 'node-loader',
  });

  // Return the modified config
  return config;
};

module.exports = nextConfig;