import { describe, expect, it } from "vitest";

import { authenticatedRouteHeaderRule, privateResponseHeaders } from "./cache-headers.js";

describe("browser isolation", () => {
  it("marks authenticated app routes as private and no-store", () => {
    expect(authenticatedRouteHeaderRule.source).toBe("/app/:path*");

    const cacheControl = authenticatedRouteHeaderRule.headers.find(
      (header) => header.key === "Cache-Control",
    );
    expect(cacheControl?.value).toBe(privateResponseHeaders["Cache-Control"]);
  });
});
