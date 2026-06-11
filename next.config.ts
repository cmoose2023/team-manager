import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Amplify Hosting SSR (Compute platform)
  output: "standalone",
};

export default nextConfig;
