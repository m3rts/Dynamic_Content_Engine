# Implementation plan v0.2

Status: Tech VP approved the architecture at ed1ebfc on 6 September 2026, as relayed by the owner; implementation pending. Owner-authorized feedback processing is not a claim of completed controls. No app, live integrations or hosted service exists. [REVIEW_RESOLUTION](REVIEW_RESOLUTION.md) maps every review section to a decision/gate.

Accountable lead for this documentation revision: Codex. Product owner/merge authority: m3rts. Implementation ownership below is by role; an actual contributor must claim the role before a task starts. Tech VP and QA/QC/InfoSec are review roles, not automatically dispatched agents. Nobody should start overlapping work based on a role label alone.

| Milestone | Accountable role | Deliverable | Required evidence |
|---|---|---|---|
| M0 — revised architecture | Codex; owner reviews | v0.2 decisions, contracts, glossary and review disposition | Link/consistency checks, every review mapped; remaining feasibility inputs have gates |
| M1 — local foundation | Foundation lead | Pinned workspace, web/auth, DB roles, worker skeleton, fixture mode, tokens/i18n, CI | Fresh checkout; atomic owner bootstrap; two-client/two-agency denial and pool/cache tests; no-egress test; protected feature-merge gate |
| M1-F — Figma/Thai spike | Production lead | Isolated connected test using synthetic Thai text and one template | Font/component/text/overflow/reimport evidence; named unresolved private-library cases; no real client data |
| M1.5 — thin full path | Integration lead | One brief → opportunity → fixture concept → review → manual asset spec → 20-row CSV → finding | Each contract exercised and persisted; second synthetic client remains inaccessible; zero paid calls; label placeholder production clearly |
| M2 — creative workflow | Domain lead | Versioned packs, reviews, outbox/recovery/budget logic, corpus and deterministic evals | AC-05/09/10/11; injection and process-kill cases; claim slots; prompt reconstruction and rollback |
| M3 — connected providers | Provider lead | Two text adapters through egress, policy/classification, shared limiter and reconciliation | AC-03/13; invalid/denied/uncertain cases; live budgeted comparisons and human review; no secret imports in web |
| M4 — production | Production lead | Approved bundle, editable Figma output and mapping | AC-07; scoped repeat import; claim validity, approval integrity and Thai layout checks |
| M5 — reporting/learning | Data lead | Bulk CSV staging, partition lifecycle, dataset revisions, metrics/finding workflow | AC-06/08; overlap/correction/limits; representative volume benchmark; no unsupported causal claims |
| M6 — local pilot | Integration lead + owner | Narrow client pilot, data lifecycle and operating runbook | AC-01/02/04/14; client permission/retention/privacy review; operator acceptance; consistent DB/assets restore and deletion replay |
| M7 — hosting decision | Operations lead + owner | Hosting/security plan only until authorized | Explicit provision approval; TLS/MFA/email/recovery; scanner; monitoring; supply-chain gates; measured sizing |
| M8 — client access (later) | Identity lead + owner | Optional SSO/SCIM, sharing and self-service | External-user access/deprovision/separation tests and account-specific protocol support |

M1-F can run independently during foundation; no existing agent is assigned automatically. M1.5 validates interfaces early without claiming the full M4/M5 capabilities. Never mark AC-02's full workflow proven by M1's skeleton test. M1.5 uses one synthetic client for the sample story and a second synthetic tenant for negative tests. Real client data remains deferred to M6 after rights, retention and privacy review.

## M1 task order

1. Foundation lead lands CI and the merge-protection setup first, alongside the minimal pinned workspace needed to execute meaningful checks. Record exact stable dependency versions/compatibility, package manager/runtime pins and dependency approvals. Do not add application features ahead of this gate.
2. Data lead defines scoped schema/grants and control-function contracts; one person owns migration ordering. Prove queue runtime privilege requirements before accepting role grants.
3. Identity lead wires bootstrap/session/capabilities to a single API boundary; shared tests cover pool/caching and denied storage access.
4. Interface lead applies design tokens, translation keys and local fonts; worker lead adds fixture-only dispatcher skeleton with no provider keys.
5. Integration lead verifies fresh checkout/offline workflow and claims M1.5. No live integration or hosting sneaks into M1.

## Required merge gates

Before any feature merge to main: required format/lint/typecheck/unit tests, relevant PostgreSQL integration tests, dependency boundaries, secret scan and production build. Add browser isolation test as soon as the first authenticated page exists; thereafter required. Pin CI actions by full commit SHA; restrict workflow permissions to read by default; fork PRs get no secrets. SBOM/license/dependency scan accompanies build; unresolved critical exploitable dependency findings block release. Package additions require explicit human approval recorded in the PR; routine updates within the agreed stack still require normal review/checks. CodeRabbit is advisory and cannot approve a failed deterministic gate.

If account plan cannot enforce branch protection, owner must document that platform limitation and use a manual no-merge-until-checks procedure; no claim of protected main. CI/branch settings are not activated by this document.

## Pilot scope and effort

Commit to one operator, one real client and synthetic others; manual context/CSV; two live text adapters; one registered workflow/template family; supplied images. Later: third+ provider adapters, image generation, rich documents, ad-platform connectors, workflow editor, enterprise identities, benchmarks and client billing (billing remains excluded absent a new decision).

The Tech VP's 4–6-week foundation and 9–15-month full-program estimates are review opinions, not accepted project commitments. The earlier architecture also supplied no validated schedule. After M1-F/M1.5, estimate bounded tasks from measured work, record dependencies/access delays, and reforecast with owner. Multi-agent availability does not eliminate review/integration bottlenecks.

## External-input register

| Input/decision | Responsible party | Needed by | Safe behavior while absent |
|---|---|---|---|
| Exact supported package versions/queue settings | Foundation lead | M1 first feature | Validate spike; no privileged workaround |
| Exact yellow/Thai brand fonts | Owner/production lead | UI/M1-F acceptance | Provisional #FFD600; licensed fallback; no client-font claim |
| Figma account/library permission | Owner | M1-F/private-template proof | Synthetic accessible template; private case explicitly blocked |
| Representative ad CSV/definitions | Owner/data lead | M1.5 design; M5 acceptance | Synthetic grain; no live metric confidence claims |
| Provider account/access/quotas/budgets | Owner/provider lead | M3 | Fixture only, no paid requests |
| Client rights, data policy/retention | Owner/privacy reviewer | M6 | Synthetic data only |
| Hosting vendor/region, email/MFA/recovery | Owner/operations lead | M7 | Remain local; no cloud resources |

No unresolved item is silently assumed satisfied. Closing an architectural finding means the design and its verification owner/gate exist; runtime proof remains pending until its milestone.
