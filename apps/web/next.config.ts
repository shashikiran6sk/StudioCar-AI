import type { NextConfig } from "next";

import { createSecurityHeaders } from "./src/server/security/create-security-headers";
import { SECURITY_HEADERS_SOURCE } from "./src/server/security/security-headers.constants";

const nextConfig: NextConfig = {
  headers: () =>
    Promise.resolve([
      {
        headers: createSecurityHeaders(process.env.NODE_ENV),
        source: SECURITY_HEADERS_SOURCE,
      },
    ]),
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
