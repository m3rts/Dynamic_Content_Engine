import { describe, expect, it } from "vitest";

import { assertFixtureMode } from "./dispatcher.js";

describe("fixture dispatcher guard", () => {
  it("requires strict fixture mode", () => {
    const previous = process.env.DCE_FIXTURE_MODE;
    process.env.DCE_FIXTURE_MODE = "strict";
    expect(() => assertFixtureMode()).not.toThrow();
    process.env.DCE_FIXTURE_MODE = "live";
    expect(() => assertFixtureMode()).toThrow(/DCE_FIXTURE_MODE=strict/);
    if (previous === undefined) {
      delete process.env.DCE_FIXTURE_MODE;
    } else {
      process.env.DCE_FIXTURE_MODE = previous;
    }
  });
});
