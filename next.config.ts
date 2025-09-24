import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure environment variables are available
  env: {
    MOONSHOT_API_KEY: process.env.MOONSHOT_API_KEY,
    AUTH_PASSWORD: process.env.AUTH_PASSWORD,
  },

  // Netlify deployment optimizations
  trailingSlash: false,

  // Optimize for serverless functions
  serverExternalPackages: ['openai'],
};

export default nextConfig;
