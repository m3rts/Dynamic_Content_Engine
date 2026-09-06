import { describe, expect, it } from "vitest";

import { privateResponseHeaders } from "./cache-headers";

describe("privateResponseHeaders", () => {
  it("disables shared caching for authenticated API responses", () => {
    expect(privateResponseHeaders).toEqual({
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
    });
  });
});
