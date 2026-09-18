import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@studiocar/contracts", "@studiocar/ui"],
};

export default nextConfig;

