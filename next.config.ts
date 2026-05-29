import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow preview iframe origins (space-z.ai preview system)
  allowedDevOrigins: [
    ".space-z.ai",
  ],
  experimental: {},
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
