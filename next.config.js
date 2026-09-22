/** @type {import('next').NextConfig} */
const withIntl = require('next-intl/plugin')('./i18n.ts');

const nextConfig = withIntl({
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
});

module.exports = nextConfig;
