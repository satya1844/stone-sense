/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: {
      root: __dirname, // sets the correct project root
    },
  },
};

module.exports = nextConfig;
