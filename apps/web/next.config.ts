import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // ARCHITECTURE v0.2: keep Cache Components disabled at foundation.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  headers: async () => [
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
