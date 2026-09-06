import { describe, expect, it } from "vitest";

import {
  capabilitiesForRole,
  evaluateMembershipCapability,
  roleCapabilities,
  type Capability,
  type MembershipRole,
} from "./index.js";

const allCapabilities = Object.values(roleCapabilities).flat();
const uniqueCapabilities = [...new Set(allCapabilities)] as Capability[];

const expectedMatrix: Record<MembershipRole, Partial<Record<Capability, boolean>>> = {
  owner: {
    "client.read": true,
    "brief.write": true,
    "concept.write": true,
    "run.create": true,
    "run.cancel": true,
    "report.import": true,
    "review.creative": true,
    "review.claims": true,
    "review.production": true,
    "asset.export": true,
    "client.export": true,
    "client.delete": true,
    "users.manage": true,
    "profiles.publish": true,
    "credentials.manage": true,
    "budgets.manage": true,
    "audit.read": true,
  },
  operator: {
    "client.read": true,
    "brief.write": true,
    "concept.write": true,
    "run.create": true,
    "run.cancel": true,
    "report.import": true,
    "asset.export": true,
    "audit.read": true,
    "review.creative": false,
    "users.manage": false,
    "client.delete": false,
  },
  reviewer: {
    "client.read": true,
    "review.creative": true,
    "review.claims": true,
    "review.production": true,
    "asset.export": true,
    "audit.read": true,
    "run.create": false,
    "report.import": false,
    "users.manage": false,
  },
};

describe("capability matrix", () => {
  for (const role of Object.keys(expectedMatrix) as MembershipRole[]) {
    describe(role, () => {
      for (const capability of uniqueCapabilities) {
        const expected = expectedMatrix[role][capability] ?? false;

        it(`${capability} is ${expected ? "granted" : "denied"}`, () => {
          const granted = capabilitiesForRole(role);
          expect(granted.includes(capability)).toBe(expected);
          expect(evaluateMembershipCapability(role, capability)).toEqual(
            expected ? { allowed: true } : { allowed: false, reason: "missing_capability" },
          );
        });
      }
    });
  }

  it("denies disabled memberships regardless of role", () => {
    expect(
      evaluateMembershipCapability("owner", "client.read", { membershipStatus: "disabled" }),
    ).toEqual({
      allowed: false,
      reason: "disabled_membership",
    });
  });
});
