/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Security configurations
  poweredByHeader: false, // Remove X-Powered-By header
  
  // Image optimization
  images: {
    unoptimized: true, // allow public logo without optimization
    domains: [], // Add allowed external image domains if needed
  },

  // Security headers (additional to middleware)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
    ];
  },

  // Environment-specific redirects and rewrites
  async redirects() {
    return [
      // Force HTTPS in production
      ...(process.env.NODE_ENV === 'production' ? [
        {
          source: '/admin',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://uap-board-voting.vercel.app/admin',
          permanent: true,
        },
      ] : []),
    ];
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
    };
    return config;
  },

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
