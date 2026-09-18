import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    "@studiocar/config",
    "@studiocar/contracts",
    "@studiocar/database",
    "@studiocar/ui",
  ],
};

export default nextConfig;
