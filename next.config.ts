import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Production optimizations
  output: 'standalone',
  images: {
    unoptimized: true
  }
};

export default nextConfig;