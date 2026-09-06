import type { NextConfig } from 'next';

import path from 'path';

const nextConfig: NextConfig = {
  // Required for Docker multi-stage build: creates a self-contained server.js
  output: 'standalone',
  // Trace deps from monorepo root so workspace packages are included in standalone
  outputFileTracingRoot: path.resolve(__dirname, '../../'),
  experimental: {
    reactCompiler: true,
  },
  images: {
    remotePatterns: [
      // MinIO-served media (dev: localhost:9000, prod: internal service or CDN host)
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
