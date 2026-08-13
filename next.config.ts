import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  async rewrites() {
    // 旧来の /favicon.ico リクエストは public/favicon.jpg で応答する
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.jpg',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/og-image.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'image/jpeg',
          },
        ],
      },
    ];
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
