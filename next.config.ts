import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Work around the Next.js 16 DevTools Segment Explorer crash on Windows.
  devIndicators: false,
  distDir: process.env.VOWLY_STABLE === "1" ? ".next-stable" : ".next",
};

export default nextConfig;
