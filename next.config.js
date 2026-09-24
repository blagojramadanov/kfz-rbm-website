/** @type {import('next').NextConfig} */
const withIntl = require('next-intl/plugin')('./i18n.ts');

const nextConfig = withIntl({
  experimental: {
    // Photos are uploaded one per server action call (resized in the browser first).
    // Default limit is 1 MB; Vercel functions accept at most 4.5 MB per request.
    serverActions: { bodySizeLimit: "4mb" },
  },
  async redirects() {
    return [
      // Old placeholder route ("coming soon"); the real listing is /fahrzeuge.
      { source: "/:locale(de|en|mk)/vehicles", destination: "/:locale/fahrzeuge", permanent: false },
    ];
  },
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
