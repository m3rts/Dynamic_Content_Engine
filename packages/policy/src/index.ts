export type Capability =
  | "client.read"
  | "brief.write"
  | "concept.write"
  | "run.create"
  | "run.cancel"
  | "report.import"
  | "review.creative"
  | "review.claims"
  | "review.production"
  | "asset.export"
  | "client.export"
  | "client.delete"
  | "users.manage"
  | "profiles.publish"
  | "credentials.manage"
  | "budgets.manage"
  | "audit.read";

export type MembershipRole = "owner" | "operator" | "reviewer";

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: "missing_capability" | "unknown_capability" | "disabled_membership" };

const knownCapabilities = new Set<Capability>([
  "client.read",
  "brief.write",
  "concept.write",
  "run.create",
  "run.cancel",
  "report.import",
  "review.creative",
  "review.claims",
  "review.production",
  "asset.export",
  "client.export",
  "client.delete",
  "users.manage",
  "profiles.publish",
  "credentials.manage",
  "budgets.manage",
  "audit.read",
]);

/** Capability grants by membership role (IDENTITY v0.2 M1 table). */
export const roleCapabilities: Readonly<Record<MembershipRole, readonly Capability[]>> = {
  owner: [
    "client.read",
    "brief.write",
    "concept.write",
    "run.create",
    "run.cancel",
    "report.import",
    "review.creative",
    "review.claims",
    "review.production",
    "asset.export",
    "client.export",
    "client.delete",
    "users.manage",
    "profiles.publish",
    "credentials.manage",
    "budgets.manage",
    "audit.read",
  ],
  operator: [
    "client.read",
    "brief.write",
    "concept.write",
    "run.create",
    "run.cancel",
    "report.import",
    "asset.export",
    "audit.read",
  ],
  reviewer: [
    "client.read",
    "review.creative",
    "review.claims",
    "review.production",
    "asset.export",
    "audit.read",
  ],
};

export function capabilitiesForRole(role: MembershipRole): readonly Capability[] {
  return roleCapabilities[role];
}

/** Pure capability evaluation; authorization context is supplied by callers. */
export function evaluateCapability(
  granted: readonly Capability[],
  required: Capability,
): PolicyDecision {
  if (!knownCapabilities.has(required)) {
    return { allowed: false, reason: "unknown_capability" };
  }

  if (!granted.includes(required)) {
    return { allowed: false, reason: "missing_capability" };
  }

  return { allowed: true };
}

export function evaluateMembershipCapability(
  role: MembershipRole,
  required: Capability,
  options: { membershipStatus?: "active" | "disabled" } = {},
): PolicyDecision {
  if (options.membershipStatus === "disabled") {
    return { allowed: false, reason: "disabled_membership" };
  }

  return evaluateCapability(capabilitiesForRole(role), required);
}
