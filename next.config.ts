import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Increase timeout for long-running API routes (pipeline execution)
  experimental: {
    serverTimeout: 300000, // 5 minutes for pipeline execution
  },
};

export default nextConfig;
