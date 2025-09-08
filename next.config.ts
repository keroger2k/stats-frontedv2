import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stats-api.36technology.com',
        port: '',
        pathname: '/api/teams/*/avatar',
      },
    ],
  },
};

export default nextConfig;
