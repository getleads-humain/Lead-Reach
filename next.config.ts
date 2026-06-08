import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
