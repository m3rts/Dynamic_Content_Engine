import { describe, expect, it } from "vitest";

describe("auth proxy", () => {
  it("exposes handler for Better Auth Next.js integration", async () => {
    process.env.BETTER_AUTH_SECRET ??= "test-secret-with-enough-length-123456";
    process.env.BETTER_AUTH_URL ??= "http://127.0.0.1:3000";
    process.env.AUTH_DATABASE_URL ??=
      "postgresql://dce_auth:dce_auth@127.0.0.1:5432/dce";

    const { auth, getAuth } = await import("./auth");
    expect("handler" in auth).toBe(true);
    expect(typeof getAuth().handler).toBe("function");
  });
});
