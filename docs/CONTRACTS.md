# Domain, data, and API contracts

These are design contracts, not implemented schemas. Foundation must turn them into validated TypeScript/Zod definitions and SQL with focused compatibility tests.

## Ownership model

An agency contains clients. A user joins an agency; non-owner users receive explicit client memberships. Every client-owned entity stores agency_id and client_id. Composite foreign keys preserve client ownership through relationships. Audit records cover both agency-level and client-level actions. Globally unique IDs are not an access-control mechanism.

| Entity | Essential data |
|---|---|
| Agency / User / Membership | identity reference, role, status, timestamps |
| Client / ClientMembership | agency, brand identity, permitted users and capabilities |
| SourceDocument / Evidence | revision, content hash, source locator, excerpt, rights/provenance, observed or hypothesized status |
| BrandVersion / ProductVersion | versioned rules, facts, approved claims; retail price/currency/validity/availability as optional typed extensions |
| BriefRevision | objective, audience, source references, product/brand revisions, locale, channel, metric and constraints |
| ModelProfileRevision | stage, provider/model ID, capability requirements, generation settings, budget, timeout, permitted fallback |
| WorkflowRun / StageAttempt | actor, client, input hashes, prompt/schema/profile versions, provider request ID, status, usage, estimated/actual cost |
| ConceptRevision / Approval | parent revision, proposition, hypothesis, proof, copy, visual direction, reviewer, decision, rationale |
| AssetSpecRevision / Asset | concept revision, components, copy, dimensions, storage key, checksum, rights, Figma mapping |
| PublishedCreative | platform/account/ad ID, internal asset revision, effective dates; allow multiple ads per asset |
| ReportImport / MetricObservation | file hash, mapping version, ad ID, reporting grain, period, dimensions, metric definitions, raw and normalized values |
| Experiment / Finding | question, variants, primary metric, comparison context, evidence snapshot, limits, next action, reviewer |
| AuditEvent | actor, scope, action, entity, timestamp, request ID; redact sensitive values |

Use UTC timestamps internally, retain source timezone and date-grain semantics, and display client-local times. Store money as decimals with currency; preserve reported source currency. Store counts as nonnegative integers and distinguish missing from zero. Metrics with zero denominator are null/unavailable, not zero percent.

## Common stage envelope

Required fields: schema_version, agency_id, client_id, brief_revision_id, input_revision_ids, evidence_refs, prompt_version, model_profile_revision_id, locale, requested_by, idempotency_key. Server derives trusted scope and actor; it does not accept browser assertions of authority.

Output includes schema_version, run_id, artifact_revision_id, evidence_refs, warnings, and structured payload. Usage includes provider, model, input/output/cached token units where supplied, image/tool charges, rate-card version, estimated flag, and cost currency. Never store hidden reasoning traces.

Concept payload requires title, audience_hypothesis, evidence_status, product_truth, proposition, rationale, headline_options, visual_direction, brand_checks, and proposed_test. Approval pins one revision. Model critique is a review suggestion, not approval or empirical evidence.

## HTTP boundary (planned)

- `POST /api/v1/clients/:clientId/briefs` creates a revisioned brief.
- `POST /api/v1/clients/:clientId/runs` validates inputs/budget and returns 202 with run ID.
- `GET /api/v1/clients/:clientId/runs/:runId` returns scoped status and safe errors.
- `POST /api/v1/clients/:clientId/concepts/:revisionId/reviews` records explicit review.
- `POST /api/v1/clients/:clientId/report-imports` creates staged import; validate/map/confirm before committing observations.
- `GET /api/v1/clients/:clientId/assets/:assetId/bundle` authorizes and exports an approved bundle.

Use typed error codes, request IDs, bounded pagination, upload limits and idempotency keys for command endpoints. Idempotency keys are scoped by actor/client/operation plus request hash; same key with different payload returns conflict. In-process domain calls remain preferred over calling our own HTTP endpoints from the worker.

## Metrics and evidence

CTR = matching click count / impressions. Engagement rate = explicitly defined engagement count / stated denominator. Aggregate counts before computing rates; never average percentages blindly. Different click definitions are separate metrics. Do not pool incompatible platforms, objectives, periods, or audiences.

Import grain includes source account, ad, date period, placement/audience breakdown and metric definition. Use an import hash for exact duplicates and a replacement policy for corrected reports; preserve the original import. Reject or flag overlapping cumulative and daily reports to prevent double counting. Do not sum breakdown totals with their parent totals.

Findings have evidence levels: hypothesis, observational signal, controlled-test finding, or insufficient evidence. Store sample exposure, allocation method, window, confounders, metric definition and review decision. Statistical confidence requires an appropriate experimental design; do not treat repeated impressions as independent users or invent significance thresholds. No sales conclusion without relevant outcome data.

## Design bundle v1

Includes schema_version, bundle_id, client_id, concept_revision_id, asset_spec_revision_id, locale, dimensions, template/component keys and mapping version, copy slots, image references/checksums, typography, required legal copy, approved claim references, and creative lineage IDs. Assets are local bundle files for manual import; authenticated network transfer is a later option. No keys or session credentials are embedded.

Plugin validates the bundle and shows a preview; imports components, loads available fonts, populates slots, checks overflow and missing assets, then returns bundle ID, file reference and node IDs in a result manifest. Repeated import updates only explicitly selected managed frames or creates an intentional new revision; never overwrite unrelated designs.
