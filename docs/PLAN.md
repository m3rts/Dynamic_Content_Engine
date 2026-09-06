# Implementation plan and status

Current status: documentation baseline only. All implementation milestones are pending. No prototype, login, provider calls, Figma plugin or CI workflow exists yet.

| Milestone | Deliverable | Exit evidence |
|---|---|---|
| 0 — Architecture review | Review this baseline; resolve meaningful design objections | Decision register updated; shared contracts agreed |
| 1 — Local foundation | Pinned workspace, web/worker, local PostgreSQL, auth, synthetic clients, first UI tokens, fixture mode | Fresh checkout setup works; owner bootstrap; two-client access denial; no outbound runtime calls |
| 2 — Brief to concept | Sources, versioned briefs/profiles, durable jobs, fixtures, reviews and audit | Full offline flow; retry/cancellation/budget tests; revision staleness visible |
| 3 — Provider integration | First live text provider, then second and xAI as needed | Same contract across providers; invalid output and rate-limit tests; usage reconciled; explicit live opt-in |
| 4 — Production | Asset specification and Figma feasibility spike/plugin | Editable sample asset, Thai/font/overflow checks, repeat import, mapping round trip |
| 5 — Learning | CSV staging/mapping, deduplication, metrics, evidence and next brief | Known fixture totals match; missing/zero and overlaps handled; no unsupported causal/sales claims |
| 6 — Local pilot | Real permitted client inputs, operator acceptance and hardening | End-to-end pilot; synthetic second industry; backup restore; documented operating costs |
| 7 — Hosting decision | Hosting plan, secrets/email/TLS/MFA, monitoring, recovery | Explicit owner go-ahead and readiness evidence before provision/deploy |
| 8 — Client access, later | Invitations, sharing scope, client contributor roles and quotas | External-user threat tests, scoped assets and budgets, user acceptance |

Milestones may uncover changes; they are not fixed-date commitments. Do not estimate delivery dates from parallel AI availability alone. Review latency and integration access can be critical dependencies.

## Collaboration allocation

Agree task ownership before parallel work. A useful split after contracts stabilize is interface, domain/worker, and reporting/Figma integration, with a shared human integrator. Codex/Claude/Grok can take any bounded task; no permanent model-specific ownership is assumed. Only one task at a time changes shared contracts/migration ordering unless coordinated. CodeRabbit reviews PRs but does not own architecture or merge authorization.

## Next concrete task

Review ADR-001/003/005 and the runtime modes, then implement milestone 1 only. Do not run a website starter or provision a cloud platform during this documentation phase.
