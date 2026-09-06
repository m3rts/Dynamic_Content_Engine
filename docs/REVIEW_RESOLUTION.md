# Review resolution — architecture v0.2

Date: 6 September 2026. Prepared by Codex under the owner's authorization to process both reviews. This is a **design disposition**. The Tech VP approved v0.2 at ed1ebfc on 6 September 2026, as relayed by the owner; a separate renewed QA/QC/InfoSec approval has not been recorded. Runtime controls remain unimplemented and unverified. Both reviews remain verbatim in [Grok feedback](../Feedback/1_Grok_Feedback.md) and [Claude feedback](../Feedback/2_CLAUDE_FEEDBACK.md). Their references to `docs/Grok_Feedback.md` are historical; actual files use the links here.

Every actionable recommendation and summary section is mapped below. Repeated recommendations in Claude's §11/§13 are cross-covered by their originating sections. Accepted means specified in design; adapted means the objective is retained with an explicit technical correction; deferred means its enabling gate is explicit, not an invisible backlog.

## Disposition matrix

| ID | Review reference | Disposition | Canonical specification | Gate | Accountable role | Evidence required |
|---|---|---|---|---|---|---|
| G-01 | Grok OBJ-01 | Accepted with trusted scope bootstrap | [DATABASE.md](DATABASE.md) | M1 | Foundation/data lead | Queue role cannot read client tables; forged job denied |
| G-02 | Grok OBJ-02 | Accepted: worker-only dispatcher | [RUNTIME.md](RUNTIME.md) | M1–2 | Worker lead | Enqueue/commit crash and duplicate-delivery tests |
| G-03 | Grok OBJ-03 | Accepted: sole client mutation boundary, private no-store | [ARCHITECTURE.md](ARCHITECTURE.md) | M1 | Foundation lead | Cross-session/client/prefetch/logout browser tests |
| G-04 | Grok OBJ-04 | Accepted: cost control stays; client billing excluded | [PRODUCT.md](PRODUCT.md) | M0/M2 | Domain lead | AC-09 and reservation tests |
| G-05 | Grok OBJ-05 | Accepted: no live imports/keys in web | [ARCHITECTURE.md](ARCHITECTURE.md) | M1 | Foundation lead | Dependency and bundle secret checks |
| G-06 | Grok OBJ-06 | Accepted; formatting is not injection-proof | [SECURITY.md](SECURITY.md) | M2 | Domain lead | Adversarial source/output fixtures; no model tools |
| G-07 | Grok OBJ-07 | Accepted: local real-data gate remains M6 | [SECURITY.md](SECURITY.md) | M6 | Owner/integration lead | Permissions, disk/backup/retention/restore evidence |
| G-08 | Grok §6 nits | Accepted: numbered ACs, capabilities, ADR metadata, review paths, ignore rules | [PRODUCT.md](PRODUCT.md) | M0–1 | Foundation lead | AC IDs; matrix tests; contributor/config review |
| G-09 | Grok §§3/5/7/8/9/10 | Retained baseline and milestone-based controls; new ADR numbering reconciled | [DECISIONS.md](DECISIONS.md) | M0 | Codex | 24 current decision entries; historical register retained |
| C-01 | Claude §4.1 separation/tools/rendering/provenance | Accepted as runtime rules | [SECURITY.md](SECURITY.md) | M2 | Domain lead | Typed untrusted fields; escaped rendering; scoped evidence |
| C-02 | Claude §4.1 claim allowlisting | Adapted: deterministic controlled slots plus human free-copy review | [SECURITY.md](SECURITY.md) | M2/4 | Domain/production lead | Reject invalid/expired claim IDs; unresolved flags block approval |
| C-03 | Claude §4.2 egress broker | Accepted as worker module, not a service; no line-count promise | [RUNTIME.md](RUNTIME.md) | M3 | Provider lead | Denied class/provider cannot dispatch; append-only events |
| C-04 | Claude §4.3 upload handling | Accepted with explicit format-aware limits; CSV has no magic bytes | [SECURITY.md](SECURITY.md) | First upload/M5 | Data lead | Malformed/oversize/SVG/traversal cases; scanner before hosted uploads |
| C-05 | Claude §4.3 CSV formulas | Accepted for exported text cells | [SECURITY.md](SECURITY.md) | First CSV export | Data lead | Formula/control-prefix cases; numeric semantics preserved |
| C-06 | Claude §4.3 append-only audit | Accepted with scoped reads and separate retention role | [DATABASE.md](DATABASE.md) | M1–2 | Data lead | Runtime UPDATE/DELETE denied; outcome appends event |
| C-07 | Claude §4.3 approval hash chain | Accepted with DB-admin limitation and later external anchor | [SECURITY.md](SECURITY.md) | M2/4/7 | Domain lead | Revision digest, chain/revocation check; anchor verification before hosting |
| C-08 | Claude §4.3 step-up and HTTP throttling | Accepted with pilot defaults | [IDENTITY.md](IDENTITY.md) | M1 | Identity lead | Recent-auth and quota boundaries; no silent owner bypass |
| C-09 | Claude §4.3 headers | Accepted with framework-compatible CSP and hosted-only HSTS | [SECURITY.md](SECURITY.md) | M1/7 | Foundation lead | Header/CSP behavior against pinned framework |
| C-10 | Claude §4.4 caching flags | Adapted: invariant and pinned-version verification, not obsolete flags | [ARCHITECTURE.md](ARCHITECTURE.md) | M1 | Foundation lead | No shared private cache across route/client/session states |
| C-11 | Claude §4.5 supply chain | Accepted; dependency approvals, SHA pins, scanning and SBOM | [PLAN.md](PLAN.md) | M1 onward | Foundation lead | Required CI checks and human dependency sign-off |
| C-12 | Claude §5.1 partitions/grain/staging | Accepted monthly schema; temporary scoped COPY staging instead of shared unlogged table | [DATABASE.md](DATABASE.md) | M1.5/M5 | Data lead | Partition keys/uniqueness, scope, overlap and crash tests |
| C-13 | Claude §5.1 preaggregation/indexes/volume | Accepted explicit on-read baseline; index exceptions documented | [DATABASE.md](DATABASE.md) | M5 | Data lead | Representative volume bytes/EXPLAIN/latency report |
| C-14 | Claude §5.2 queue pressure | Accepted pools, retention/autovacuum and evidence-triggered split | [OPERATIONS.md](OPERATIONS.md) | M2/5 | Operations lead | Queue retention/pool saturation measurement |
| C-15 | Claude §5.3 8–16 concurrency | Adapted: start 2, measure up to 8; shared quotas and memory lanes | [RUNTIME.md](RUNTIME.md) | M3 | Provider lead | Rate/token/budget admission across workers; load profile |
| C-16 | Claude §5.4 reservation orphans | Accepted; uncertain costs not freed on expiry | [RUNTIME.md](RUNTIME.md) | M2–3 | Worker lead | Kill after billing; late usage settles once |
| C-17 | Claude §5.5 pooling | Accepted transaction-local scope; no mandatory PgBouncer | [DATABASE.md](DATABASE.md) | M1 | Data lead | Rollback/reuse/owner/tenant pool leak tests |
| C-18 | Claude §5.5 streaming/limits | Accepted bounded streaming contract | [SECURITY.md](SECURITY.md) | M1.5/M5 | Data lead | Peak-memory and limit tests |
| C-19 | Claude §5.5 timeout ordering | Adapted application deadlines; pinned pg-boss semantics tested | [RUNTIME.md](RUNTIME.md) | M2 | Worker lead | Watchdog/fence recovery cannot repeat ambiguous paid call |
| C-20 | Claude §6 golden set/deterministic evals | Accepted; fixtures do not prove live prompt quality | [EVALS.md](EVALS.md) | M2 | Domain/eval lead | 24 briefs, held-out cases, negative/regression report |
| C-21 | Claude §6 rubric/human/live drift | Accepted with allowed-provider constraint and manual paid opt-in | [EVALS.md](EVALS.md) | M3 | Provider/eval lead | Blind baseline comparison, cost and rollback evidence |
| C-22 | Claude §6 prompt artifacts/reconstruction | Accepted scoped request bundle plus versions; no prompts in logs | [CUSTOMIZATION.md](CUSTOMIZATION.md) | M2 | Domain lead | Reconstruct request; deletion marks replay unavailable |
| C-23 | Claude §7.1 pipeline registry | Accepted one registered graph; no workflow editor | [CUSTOMIZATION.md](CUSTOMIZATION.md) | M2 | Domain lead | Graph/schema/approval compatibility and pinned-run test |
| C-24 | Claude §7.2 typed extensions | Accepted bounded field vocabulary and validated schema versions | [CUSTOMIZATION.md](CUSTOMIZATION.md) | M2 | Domain/UI lead | Retail/non-retail forms without new code; old-version reads |
| C-25 | Claude §7.3 layering | Accepted agency → industry → client; policy cannot be overridden | [CUSTOMIZATION.md](CUSTOMIZATION.md) | M2 | Domain lead | Resolver hashes and negative override tests |
| C-26 | Claude §7.4 Figma/locale | Accepted configured library mapping, i18n and Intl from M1 | [CUSTOMIZATION.md](CUSTOMIZATION.md) | M1/4 | UI/production lead | Thai mixed-script and locale-format fixtures |
| C-27 | Claude §8.1 thin full path | Accepted as M1.5; retains second-client negative tests | [PLAN.md](PLAN.md) | M1.5 | Integration lead | One persisted synthetic story across every main contract |
| C-28 | Claude §8.2 early Figma spike | Accepted M1-F alongside foundation; connected-only | [INTEGRATIONS.md](INTEGRATIONS.md) | M1-F | Production lead | Font/Thai/overflow/import evidence and fallback disposition |
| C-29 | Claude §8.3 effort and scope | Scope narrowed; reviewer time estimates not adopted as commitments | [PLAN.md](PLAN.md) | M1.5 reforecast | Owner/integration lead | Task estimates based on measured slices and access dependencies |
| C-30 | Claude §8.4 CI/protection | Accepted before feature merge, account limitations explicit | [PLAN.md](PLAN.md) | M1 | Foundation/owner | Required checks/protection verified or manual limitation recorded |
| C-31 | Claude §9.1 opportunity | Defined in workflow, glossary and pipeline | [GLOSSARY.md](GLOSSARY.md) | M0/M2 | Codex/domain lead | Consistent stage key and typed output |
| C-32 | Claude §9.2 ADR metadata | Backfilled actual author/date; review input not approval | [DECISIONS.md](DECISIONS.md) | M0 | Codex | Original register retained and dated current table |
| C-33 | Claude §9.3 task ownership | Accountable roles; actual contributor claims before work | [PLAN.md](PLAN.md) | Each task | Owner/integration lead | Handoff includes branch/files/checks; no implied agent dispatch |
| C-34 | Claude §9.4 glossary | Added | [GLOSSARY.md](GLOSSARY.md) | M0 | Codex | Shared terms linked from README |
| C-35 | Claude §9.5 fallback | Both profile and client permission plus explicit run consent | [RUNTIME.md](RUNTIME.md) | M3 | Provider lead | Actual model/cost visible; denied fallback blocked |
| C-36 | Claude §9.6 deletion/export | Planned authorized asynchronous endpoints and residual-copy states | [CONTRACTS.md](CONTRACTS.md) | M6 | Identity/data lead | Scope/step-up/purge/receipt tests |
| C-37 | Claude §9.7 idempotency retention | 30-day result, ≥90-day tombstone; durable effect keys separate | [RUNTIME.md](RUNTIME.md) | M2 | Domain lead | Conflict/expiry/retry behavior tested |
| C-38 | Claude §9.8 doc versions | Added root changelog and historical decision snapshot | [DECISIONS.md](DECISIONS.md) | M0 | Codex | v0.1/v0.2 history and review traceability |
| C-39 | Claude §9.9 restore | Recurring monthly/material-change drills; common snapshot and deletion replay | [OPERATIONS.md](OPERATIONS.md) | M6 onward | Operations lead | Dated checksum reconciliation report |
| C-40 | Claude §9.10 yellow contrast | Accepted semantic token checks plus rendered accessibility tests | [DESIGN.md](DESIGN.md) | M1 onward | UI lead | Forbidden pairs rejected; focus/zoom/keyboard evidence |
| C-41 | Claude §10 enterprise identity | Adapted issuer+subject link table; SSO/SCIM deferred to M8 | [IDENTITY.md](IDENTITY.md) | M1 seam/M8 | Identity lead | No email business keys; deprovision tests when enabled |
| C-42 | Claude §10 privacy mechanics | Accepted register/classification/retention/export/deletion; legal scope reviewed on actual data | [SECURITY.md](SECURITY.md) | M6 | Owner/privacy reviewer | Provider residual copies and backup expiry disclosed |
| C-43 | Claude §10 separation of duties | Multi-type events now; distinct/legal/delegated approval policy later | [IDENTITY.md](IDENTITY.md) | M2/M8 | Domain/identity lead | Policy can require separate reviewer without schema rewrite |
| C-44 | Claude §10 cross-client statistics | Deferred future opt-in proposal, no enabled exemption | [SECURITY.md](SECURITY.md) | Future separate ADR | Owner/privacy reviewer | No cross-client content/metrics collection in pilot |
| C-45 | Claude §10 tracing/logging | Adapted server-issued trace; allowlisted redacted logs | [RUNTIME.md](RUNTIME.md) | M1 onward | Foundation lead | Trace propagated; secret/content sentinel absent from sinks |
| C-46 | Claude §§1–3/11–13 synthesis and revised priority list | Mapped to rows above; no pre-code enterprise-program expansion | [PLAN.md](PLAN.md) | M0 onward | Codex/integration lead | Stages introduce their own controls; withdrawn gates stay withdrawn |

## Integrity and completion boundary

55 disposition rows cover Grok OBJ-01–07 and proposal nits, Claude's detailed sections and revised priority/synthesis. Source snapshots are unchanged:

- `1_Grok_Feedback.md` SHA-256: `450bf5cbdf03b512ef6f07f2f0e69b4e2bc5af5e7ce044f012bb088d11cdbf62`
- `2_CLAUDE_FEEDBACK.md` SHA-256: `86fa5dc6a95ae06ca0e63fd9b3705c7edce3444f7dee306ee7761e1a45ebd372`

Architecture changes are documented; every implementation proof remains pending. Remaining external inputs have accountable owners, deadlines and fail-closed defaults in PLAN's external-input register. Do not represent “all feedback processed” as “no possible bugs/security gaps” or permission to provision/deploy. New findings belong in a dated follow-up, with the relevant canonical document updated in the same PR.

## Post-review clarifications — 6 September 2026

The owner relayed the Tech VP's approval of ed1ebfc, including feedback hash/link verification. Two nonblocking residuals were CI-first sequencing and stale review status; PLAN and current status text now reflect them. The original 55-row matrix remains unchanged.

CodeRabbit's five comments on PR #1 were verified against the documents and addressed: external API edge originates at Egress; pipeline skipping cannot remove mandatory controls; Run and StageAttempt have distinct glossary entries; local secrets require owner-only storage and exclusion from application backups/sync; M1.5 explicitly uses synthetic clients. These are clarifications of the baseline, not new application behavior or evidence of implemented security. CI remains the first foundation task.
