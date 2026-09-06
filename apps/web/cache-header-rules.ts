export const privateResponseHeaders = {
  "Cache-Control": "private, no-store",
  Pragma: "no-cache",
} as const;

export const authenticatedRouteHeaderRule = {
  source: "/app/:path*",
  headers: Object.entries(privateResponseHeaders).map(([key, value]) => ({
    key,
    value,
  })),
} as const;
