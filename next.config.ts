import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['lib/editor'],
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
};

export default nextConfig;
