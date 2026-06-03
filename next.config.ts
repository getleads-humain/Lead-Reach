import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed "output: standalone" — it requires node .next/standalone/server.js
  // and causes "next start" to warn. Standard output works with next start.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow preview iframe origins (space-z.ai preview system)
  // Uses ** wildcard to match all subdomains (e.g., preview-chat-xxx.space-z.ai)
  // Next.js supports micromatch-style wildcards: * = single segment, ** = multi-segment
  allowedDevOrigins: [
    "**.space-z.ai",
    "**.space.chatglm.site",
  ],
  experimental: {},
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
