import type { NextConfig } from "next";

import { loadRepositoryEnvironment } from "./src/server/environment/load-repository-environment";
import { createSecurityHeaders } from "./src/server/security/create-security-headers";
import { resolveLocalStorageOrigin } from "./src/server/security/resolve-local-storage-origin";
import { SECURITY_HEADERS_SOURCE } from "./src/server/security/security-headers.constants";

// Before anything reads configuration: the repository-root `.env.local` is the
// one settings file, and values already in the environment always win.
loadRepositoryEnvironment(process.cwd());

const nextConfig: NextConfig = {
  headers: () =>
    Promise.resolve([
      {
        headers: createSecurityHeaders(
          process.env.NODE_ENV,
          resolveLocalStorageOrigin(process.env),
        ),
        source: SECURITY_HEADERS_SOURCE,
      },
    ]),
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    "@studiocar/config",
    "@studiocar/contracts",
    "@studiocar/database-runtime",
    "@studiocar/observability",
    "@studiocar/ui",
  ],
};

export default nextConfig;
