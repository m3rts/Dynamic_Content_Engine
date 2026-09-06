import { describe, expect, it } from "vitest";

import { createTraceContext, createTraceId, isValidTraceId } from "./index.js";

describe("trace identifiers", () => {
  it("creates stable-format trace IDs", () => {
    const traceId = createTraceId(new Date("2026-09-06T02:30:00.000Z"));

    expect(isValidTraceId(traceId)).toBe(true);
    expect(traceId.startsWith("trace_")).toBe(true);
  });

  it("returns unique trace and span IDs", () => {
    const first = createTraceContext();
    const second = createTraceContext();

    expect(first.traceId).not.toEqual(second.traceId);
    expect(first.spanId).not.toEqual(second.spanId);
  });
});
