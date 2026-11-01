import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  reactStrictMode: true,
  // The seeded SQLite database is read at runtime by every server route.
  // Tracing it explicitly keeps it inside the server bundle on Vercel.
  outputFileTracingIncludes: {
    '/*': ['./data/esg.db'],
  },
};

export default nextConfig;
