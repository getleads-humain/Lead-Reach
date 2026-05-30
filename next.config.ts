import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: "output: standalone" was removed because it causes chunk hash
  // mismatches between the RSC server renderer and the static chunk files,
  // resulting in 500 errors on dynamic pages. Use "next start" instead.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Increase timeout for long-running API routes (pipeline execution)
  // Note: serverTimeout was removed in Next.js 16; use maxDuration for serverless
  // or a custom middleware timeout for long-running API routes
  experimental: {},
  // Allow the standalone server to read the .env file from the project root
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
