import type { RunState } from "@dce/contracts";
import { describe, expect, it } from "vitest";

import { assertRunTransition, canTransitionRunState, isTerminalRunState } from "./index.js";

describe("canTransitionRunState", () => {
  it("allows queue dispatch", () => {
    expect(canTransitionRunState("queued", "running")).toBe(true);
  });

  it("allows human review waits without holding execution forever", () => {
    expect(canTransitionRunState("running", "awaiting_review")).toBe(true);
    expect(canTransitionRunState("awaiting_review", "running")).toBe(true);
  });

  it("blocks transitions from terminal states", () => {
    const terminalStates: RunState[] = ["succeeded", "failed", "cancelled"];

    for (const state of terminalStates) {
      expect(canTransitionRunState(state, "running")).toBe(false);
      expect(isTerminalRunState(state)).toBe(true);
    }
  });

  it("throws on invalid transitions", () => {
    expect(() => assertRunTransition("succeeded", "running")).toThrow(
      "Invalid run transition: succeeded -> running",
    );
  });
});
