import type { NextConfig } from 'next';

/**
 * iSchoolie is deployed as a **statically exported** Next.js app on Firebase
 * Hosting. That choice is deliberate: SSR (`next start`, App Hosting) needs a
 * Node/Blaze runtime, and Cloud Functions are Blaze-only. All data access is
 * client-side Firebase SDK, so the export contains no server secrets.
 *
 * Consequence: routes must not use dynamic segments (unknown at build time).
 * Entity detail pages read ids from the query string instead.
 */
const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: false,
  images: { unoptimized: true },
  eslint: {
    // Linting is run explicitly (`npm run lint`); the strict typecheck is part
    // of the build gate via `npm run verify`.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
