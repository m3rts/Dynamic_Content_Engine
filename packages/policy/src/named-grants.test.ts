import { describe, expect, it } from "vitest";

import {
  evaluateMembershipCapability,
  namedGrantCapabilities,
  resolveMembershipCapabilities,
} from "./index.js";

describe("named capability grants", () => {
  it("does not grant approval capabilities to reviewers by role alone", () => {
    for (const capability of namedGrantCapabilities) {
      expect(evaluateMembershipCapability("reviewer", capability)).toEqual({
        allowed: false,
        reason: "missing_capability",
      });
    }
  });

  it("grants approval capabilities only when explicitly named", () => {
    expect(
      evaluateMembershipCapability("reviewer", "review.claims", {
        namedGrants: ["review.claims"],
      }),
    ).toEqual({ allowed: true });

    expect(
      evaluateMembershipCapability("reviewer", "review.production", {
        namedGrants: ["review.production"],
      }),
    ).toEqual({ allowed: true });

    expect(
      evaluateMembershipCapability("reviewer", "review.production", {
        namedGrants: ["review.claims"],
      }),
    ).toEqual({
      allowed: false,
      reason: "missing_capability",
    });
  });

  it("ignores named grants that are not approval capabilities", () => {
    expect(resolveMembershipCapabilities("reviewer", ["users.manage", "review.claims"])).toEqual([
      "client.read",
      "review.creative",
      "asset.export",
      "audit.read",
      "review.claims",
    ]);
  });

  it("keeps owner approval capabilities without named grants", () => {
    expect(evaluateMembershipCapability("owner", "review.claims")).toEqual({ allowed: true });
    expect(evaluateMembershipCapability("owner", "review.production")).toEqual({ allowed: true });
  });
});
