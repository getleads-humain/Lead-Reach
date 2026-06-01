import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: "output: standalone" was removed because it causes chunk hash
  // mismatches between the RSC server renderer and the static chunk files,
  // resulting in 500 errors on dynamic pages. Use "next start" instead.
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
