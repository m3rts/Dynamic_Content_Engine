import "../../scripts/load-root-env.mjs";
import type { NextConfig } from "next";

import { authenticatedRouteHeaderRule } from "./cache-header-rules";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@dce/i18n", "@dce/ui"],
  experimental: {
    // ARCHITECTURE v0.2: keep Cache Components disabled at foundation.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  headers: async () => [
    authenticatedRouteHeaderRule,
    {
      source: "/api/v1/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "Pragma", value: "no-cache" },
      ],
    },
  ],
};

export default nextConfig;
