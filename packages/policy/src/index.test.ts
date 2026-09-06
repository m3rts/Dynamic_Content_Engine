import { describe, expect, it } from "vitest";

import { evaluateCapability, type Capability } from "./index.js";

describe("evaluateCapability", () => {
  it("allows operations when the capability is granted", () => {
    expect(evaluateCapability(["client.read", "run.create"], "run.create")).toEqual({
      allowed: true,
    });
  });

  it("denies missing capabilities without throwing", () => {
    expect(evaluateCapability(["client.read"], "client.delete")).toEqual({
      allowed: false,
      reason: "missing_capability",
    });
  });

  it("rejects unknown capability names", () => {
    expect(evaluateCapability(["client.read"], "not.real" as Capability)).toEqual({
      allowed: false,
      reason: "unknown_capability",
    });
  });
});
