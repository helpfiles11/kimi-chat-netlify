import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify deployment optimizations
  trailingSlash: false,

  // Optimize for serverless functions
  serverExternalPackages: ['openai'],
};

export default nextConfig;
