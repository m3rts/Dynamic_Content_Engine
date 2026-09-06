# Architecture decision register

Status vocabulary: user requirement, proposed baseline, accepted implementation, superseded. All technology choices below are proposed baseline until validated in implementation; user requirements are explicitly marked.

| ID | Status | Decision and consequence |
|---|---|---|
| ADR-001 | Proposed baseline | TypeScript across web/worker/plugin. Rust deferred because current workload is integration-heavy; revisit only for measured needs or team capability. |
| ADR-002 | User requirement | Local development until functioning application and hosting authorization. No deployment automation now. |
| ADR-003 | Proposed baseline | Modular monolith plus worker and PostgreSQL/pg-boss. Avoid Redis/microservices initially; shared DB couples capacity but reduces operational burden. |
| ADR-004 | User requirement | Configurable model per stage, client-agnostic workflow, source/decision lineage. |
| ADR-005 | Proposed baseline | Better Auth locally, replacing earlier managed-auth suggestion. Reduces external runtime dependency but requires operating authentication securely. Keep app roles independent. |
| ADR-006 | Proposed baseline | User-run Figma plugin for editable canvas output. Manual bundle exchange first; unattended canvas production excluded. |
| ADR-007 | User requirement | Space Grotesk and yellow/black/white for agency UI; exact yellow remains provisional. |
| ADR-008 | Proposed baseline | Filesystem assets locally, S3 adapter later. Migration requires checksums/manifest and DB metadata reconciliation. |
| ADR-009 | Proposed baseline | Client-scoped domain records and defense-in-depth RLS; owner agency access explicit. |
| ADR-010 | Proposed baseline | CSV metrics first; no sales-lift claims from response-only metrics. |

For a new decision, append a dated entry with problem, alternatives, decision, status, owner/reviewer, consequences and migration/rollback. Never erase superseded decisions; link their replacements. Do not independently choose a different stack in an agent-specific instruction file.

## Unresolved before implementation milestones

- Exact framework/library versions and auth/queue compatibility: resolve in foundation.
- Exact company yellow and Thai fallback font: confirm/validate in UI milestone.
- Selected live models, budgets, provider data permissions: resolve before live adapters.
- Report metric definitions and Figma library/component access: resolve in integration spikes.
- Hosting provider/region, MFA configuration, real email and retention: resolve before hosting.
