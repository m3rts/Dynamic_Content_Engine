import { describe, expect, it } from "vitest";

import {
  parseStageEnvelope,
  runStateSchema,
  safeParseStageEnvelope,
  stageAttemptStateSchema,
} from "./index.js";

const envelopeFixture = {
  schema_version: "stage-envelope/0.1",
  agency_id: "11111111-1111-4111-8111-111111111111",
  client_id: "22222222-2222-4222-8222-222222222222",
  brief_revision_id: "33333333-3333-4333-8333-333333333333",
  input_revision_ids: ["44444444-4444-4444-8444-444444444444"],
  evidence_refs: ["evidence:fixture-001"],
  prompt_version: "prompt-pack/2026-09-01",
  model_profile_revision_id: "55555555-5555-4555-8555-555555555555",
  locale: "en-TH",
  requested_by: "66666666-6666-4666-8666-666666666666",
  idempotency_key: "fixture-idempotency-key",
};

describe("runStateSchema", () => {
  it("accepts documented lifecycle states", () => {
    expect(runStateSchema.parse("awaiting_review")).toBe("awaiting_review");
  });

  it("rejects unknown states", () => {
    expect(runStateSchema.safeParse("pending").success).toBe(false);
  });
});

describe("stageAttemptStateSchema", () => {
  it("accepts uncertain outcomes", () => {
    expect(stageAttemptStateSchema.parse("uncertain")).toBe("uncertain");
  });
});

describe("stageEnvelopeSchema", () => {
  it("parses a valid synthetic envelope", () => {
    expect(parseStageEnvelope(envelopeFixture)).toEqual(envelopeFixture);
  });

  it("rejects non-uuid requested_by values", () => {
    const result = safeParseStageEnvelope({
      ...envelopeFixture,
      requested_by: "browser-user-id",
    });

    expect(result.success).toBe(false);
  });

  it("rejects extra untrusted fields", () => {
    const result = safeParseStageEnvelope({
      ...envelopeFixture,
      actor_claim: "trusted-by-browser",
    });

    expect(result.success).toBe(false);
  });
});
