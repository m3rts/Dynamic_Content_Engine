export type Capability =
  | "client.read"
  | "client.write"
  | "client.export"
  | "client.delete"
  | "run.create"
  | "run.cancel";

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: "missing_capability" | "unknown_capability" };

const knownCapabilities = new Set<Capability>([
  "client.read",
  "client.write",
  "client.export",
  "client.delete",
  "run.create",
  "run.cancel",
]);

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
