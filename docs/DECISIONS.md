# Architecture decision register v0.2

Date: 6 September 2026. Architectural author/accountable documentation lead: Codex. Product owner: m3rts. Review inputs: Tech VP (Claude) and QA/QC/InfoSec (Grok). Owner authorized processing both reviews and rebuilding the architecture in this conversation. This establishes a **revised design baseline**, not an implemented or independently security-approved system. The Tech VP approved v0.2 at ed1ebfc on 6 September 2026, as relayed by the owner. A separate renewed QA/QC/InfoSec approval has not been recorded. Subsequent review-status and CodeRabbit clarifications do not imply a new reviewer approval.

Historical ADR-001–010 were authored on 6 September 2026 by Codex; reviewer names were absent then and are backfilled here as review inputs, not retroactive approvals. [Original v0.1 register](history/DECISIONS-v0.1.md) is preserved unchanged for history. Its unresolved list/status terminology does not override current documents.

Status vocabulary: **user requirement**, **revised design baseline**, **verified implementation**, **superseded**. None is verified implementation yet. All rows below share the date/author/review-input metadata above. ADR-002/004/007 retain user-requirement status; other rows are revised design baseline. Changing one requires a dated rationale, consequences, reviewer and migration/rollback plan.

| ADR | Decision | Rationale | Alternatives / tradeoff | Migration / rollback |
|---|---|---|---|---|
| ADR-001 | TypeScript across web/worker/plugin; Rust deferred | One contract language; revisit only for measured need | Rust backend/mixed stacks add interface work | No runtime migration; change later requires a new ADR |
| ADR-002 | Local until explicitly authorized hosting | Owner requirement; two runtime modes stay distinct | Hosted-first conflicts with requested development | No deployment to roll back; later environment changes gated M7 |
| ADR-003 | Modular monolith + worker + PostgreSQL/pg-boss | Reduce services while keeping durable I/O | Redis/microservices deferred; shared DB needs pool limits | Queue schema migration tested under restricted runtime role |
| ADR-004 | Stage-specific models and versioned client configuration | Reusable core with traceable provider selection | Single provider or client forks rejected | Pin profiles/pipelines; change active defaults only for new runs |
| ADR-005 | Better Auth locally; app-owned capabilities | Offline login and stable identity seam | Hosted IdP deferred, not required for local auth | Link issuer/subject to internal ID; never migrate via email matching |
| ADR-006 | User-run Figma plugin, manual bundle first | Editable output with explicit editor boundary | Unattended plugin/server canvas editing excluded | Version bundles; preserve prior managed frames |
| ADR-007 | Space Grotesk; yellow/black/white agency UI | Owner branding; #FFD600 provisional | Client creative uses separate brand configuration | Token changes and Thai font acceptance tested |
| ADR-008 | Local filesystem with later S3 adapter | No cloud dependency during development | Premature cloud assets excluded | Checksummed manifest migration and consistent restore |
| ADR-009 | Scoped repositories plus RLS and role separation | Defense in depth without privileged client worker | Queue data and auth cannot share blanket client RLS | Scoped grants/transactions and partition access tested |
| ADR-010 | CSV-first response learning | Available reports do not prove sales lift | Platform connectors and causal overclaims excluded | Pin mapping/dataset revisions and recompute findings |
| ADR-011 | Internal provider cost controls in scope; client billing excluded | Resolve Grok OBJ-04 | Removing reserves would permit uncontrolled spend | Version ledger/rate cards; never rewrite settled usage |
| ADR-012 | Worker exclusively drains content-free outbox | Close crash window and specify ownership | Web enqueue after commit rejected | Stable dispatch/effect keys tolerate duplicate delivery |
| ADR-013 | API route handlers are sole client mutation boundary | One auth/CSRF policy and no private shared cache | Client Server Actions prohibited initially | Recheck pinned framework settings and cache/logout tests |
| ADR-014 | Controlled provider egress inside worker | Enforce class/provider/cost before every model request | Arbitrary SDK/network calls prohibited | Roll back profiles/policies; keep disclosure ledger |
| ADR-015 | Versioned pipeline, bounded extensions and prompt/rubric packs | Concrete reuse without a workflow editor | Arbitrary executable config/untyped metadata rejected | Read old versions; create new revisions for migrations |
| ADR-016 | Quality evaluation with human anchor | Contract validity is insufficient evidence of creativity | Model-judge score alone cannot approve work | Keep baseline pointer and held-out comparisons |
| ADR-017 | Monthly metric partitions at table introduction | Accept early schema choice with explicit maintenance costs | Single large unpartitioned table remains simpler but less aligned with retention | Partition-key uniqueness/FKs; test maintain/restore; no claim of free scale |
| ADR-018 | Issuer/subject linked identities and typed multi-approvals | Avoid email identity coupling; preserve enterprise options | Single external subject or overwritten reviewer field rejected | Use additive linked identities and append-only events |
| ADR-019 | Reservation uncertainty retained conservatively | Resolve worker-dies-after-billing case | TTL-only auto-release rejected | Sweeper/reconciliation append ledger adjustments |
| ADR-020 | Thin end-to-end slice and early Figma/Thai spike | Validate contracts and external assumptions early | Horizontal-only delivery defers risk | Spikes do not bypass two-client/offline gates |
| ADR-021 | Append-only events with limited hash-chain assurance | Detect ordinary mutation; state DB-admin limitation | Hash chain alone is not non-repudiation | Separate retention grants; hosted external digest anchor |
| ADR-022 | Privacy lifecycle before real data, enterprise features later | No blanket legal assertions or premature hosting | Unbounded retention and silent provider deletion claims rejected | Deletion receipts/backup expiry/restore replay preserve honesty |
| ADR-023 | Provider quotas plus conservative adaptive concurrency | Do not confuse CPU count with provider limits | Neither fixed 2 forever nor unmeasured 16 by default | Start 2, pilot ceiling 8; tune with metrics and ledger |
| ADR-024 | Required CI and human merge ownership from M1 | Three coding contributors need deterministic gates | CodeRabbit-only gate rejected | No merge around broken checks; record platform limitations |

## Implementation decisions with explicit gates

Package versions/native queue timeout mapping: foundation lead, M1–2 compatibility tests. Exact client fonts/yellow: owner/production lead, M1-F/UI acceptance. Provider accounts/models/quotas: owner/provider lead, M3 opt-in. CSV definitions: data lead, M1.5/M5. Privacy/retention: owner, M6. Hosting/email/enterprise auth: owner/operations lead, M7–8. PLAN records safe behavior while these inputs are absent; none permits an implicit authorization bypass.
