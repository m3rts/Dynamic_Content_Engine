import { z } from "zod";

/** Workflow run lifecycle states from ARCHITECTURE v0.2. */
export const runStateSchema = z.enum([
  "queued",
  "running",
  "awaiting_review",
  "needs_attention",
  "succeeded",
  "failed",
  "cancelled",
]);

export type RunState = z.infer<typeof runStateSchema>;

/** Stage attempt lifecycle states from RUNTIME v0.2. */
export const stageAttemptStateSchema = z.enum([
  "queued",
  "executing",
  "succeeded",
  "failed",
  "cancelled",
  "uncertain",
]);

export type StageAttemptState = z.infer<typeof stageAttemptStateSchema>;

const uuidSchema = z.string().uuid();

/** Subset of the common stage envelope required at foundation. */
export const stageEnvelopeSchema = z
  .object({
    schema_version: z.string().min(1),
    agency_id: uuidSchema,
    client_id: uuidSchema,
    brief_revision_id: uuidSchema,
    input_revision_ids: z.array(uuidSchema).min(1),
    evidence_refs: z.array(z.string().min(1)),
    prompt_version: z.string().min(1),
    model_profile_revision_id: uuidSchema,
    locale: z.string().min(2),
    requested_by: uuidSchema,
    idempotency_key: z.string().min(8).max(128),
  })
  .strict();

export type StageEnvelope = z.infer<typeof stageEnvelopeSchema>;

export function parseStageEnvelope(input: unknown): StageEnvelope {
  return stageEnvelopeSchema.parse(input);
}

export function safeParseStageEnvelope(input: unknown) {
  return stageEnvelopeSchema.safeParse(input);
}
