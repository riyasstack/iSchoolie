import type { NextConfig } from 'next';

/**
 * iSchoolie runs on a Node server: WorkOS AuthKit completes the OAuth callback
 * in a route handler, and identity data is read from Postgres through server
 * routes. A static export (`output: 'export'`) cannot do either, so it is gone.
 *
 * The remaining data domains still read Firestore from the browser until they
 * are ported; that does not require a static host.
 */
const nextConfig: NextConfig = {
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
