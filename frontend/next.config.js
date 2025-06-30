/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // allow public logo without optimization
  }
};

module.exports = nextConfig;
