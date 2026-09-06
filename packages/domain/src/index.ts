import type { RunState } from "@dce/contracts";

const terminalRunStates = new Set<RunState>(["succeeded", "failed", "cancelled"]);

function allowedTargets(from: RunState): readonly RunState[] {
  switch (from) {
    case "queued":
      return ["running", "cancelled"];
    case "running":
      return ["awaiting_review", "needs_attention", "succeeded", "failed", "cancelled"];
    case "awaiting_review":
      return ["running", "succeeded", "failed", "cancelled"];
    case "needs_attention":
      return ["running", "awaiting_review", "failed", "cancelled"];
    case "succeeded":
    case "failed":
    case "cancelled":
      return [];
  }
}

export function canTransitionRunState(from: RunState, to: RunState): boolean {
  if (from === to) {
    return false;
  }

  return allowedTargets(from).includes(to);
}

export function isTerminalRunState(state: RunState): boolean {
  return terminalRunStates.has(state);
}

export function assertRunTransition(from: RunState, to: RunState): void {
  if (!canTransitionRunState(from, to)) {
    throw new Error(`Invalid run transition: ${from} -> ${to}`);
  }
}
