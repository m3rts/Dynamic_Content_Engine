# Grok Feedback — architecture verification (Milestone 0)

**Reviewer role:** Senior QA/QC and information-security reviewer  
**Review bar:** This repository is a **proposal for an application**, not a running system. PLAN Milestone 0 asks for review of the baseline and meaningful design objections. Findings below are acceptances, objections, and specification holes that would cause the wrong system to be built. Missing code, CI, MFA, hosted TLS, and production privacy paperwork are scheduled later and are not defects in v0.1.  
**Reviewed:** README and every document it lists, plus AGENTS, CONTRIBUTING, CLAUDE, `.coderabbit.yaml`, and `.gitignore`. PLAN, ARCHITECTURE, DECISIONS, IDENTITY, CONTRACTS, OPERATIONS, and INTEGRATIONS were re-read for this revision.  
**Date:** 6 September 2026 (revised the same day after correcting the review bar)

**Verdict: accept the proposed architecture.** ADR-001, ADR-003, ADR-005, and the two local runtime modes are the right baseline for this product. Do not change language, hosting posture, or milestone order. Resolve the design clarifications in section 4 in the documents (or as first-task notes in Milestone 1) so implementers do not invent a second mutation path, a privileged worker, or a queue that bypasses client scope.

This review does not ask for a new stack, Redis, microservices, a hosted IdP, or cloud resources.

---

## 1. Correction to the previous review

The first draft treated the proposal as an incomplete production security program: no threat-model file, no password-policy numbers, no MFA on a laptop, no PDPA certification, Milestone 6 before Milestone 7. That was the wrong bar.

PLAN already says the work is documentation only; real client data is not supplied; fixture mode and two-client denial are Milestone 1 exit evidence; live providers are Milestone 3; real permitted inputs are Milestone 6; hosting, TLS, and MFA are Milestone 7. IDENTITY already says retention is an engineering requirement to define with the client before real ingestion, not a legal certification. OPERATIONS already forbids automatic cloud sync of client data and binds local Compose to loopback.

Those are proposal choices, and they are consistent. This revision verifies whether the **architecture of the proposed app** holds together, then lists only the design objections that would matter when someone starts Milestone 1.

---

## 2. What PLAN is asking this review to do

| PLAN statement | How this review treats it |
|---|---|
| Milestone 0: review the baseline; resolve meaningful design objections | Accept or object to structure, boundaries, and ADRs |
| Exit evidence: decision register updated; shared contracts agreed | Section 8 lists proposed ADR notes; no silent stack change |
| Next task: review ADR-001 / 003 / 005 and the runtime modes, then implement Milestone 1 only | Section 3 does that review |
| Do not run a website starter or provision a cloud platform in this phase | No hosting or scaffolding recommended |
| Milestone 1 already requires owner bootstrap, two-client access denial, no outbound runtime calls | Isolation and fixture-fail-closed are already planned QC gates, not missing invention |
| Milestone 6 local pilot, then Milestone 7 hosting decision | Correct local-first sequence (ADR-002). Not a security defect. |

---

## 3. Architecture verification

### 3.1 Product fit

The proposed app is an agency-operated, multi-client workspace: versioned brief → staged model work → human approval → Figma handoff → CSV learning → next experiment. Humans stay in the loop; the system must not publish ads, move spend, or learn across clients.

The execution model matches that product:

- Web accepts a command, authorizes it, records a run, returns `202` + run ID.
- A worker performs long generation and import work.
- The browser polls bounded status; the HTTP request does not sit on a full creative workflow.
- Figma is a user-run plugin consuming a versioned bundle, not a server writing a remote canvas.
- Providers are stage adapters behind fixtures; live APIs are opt-in.

That is the correct shape. A synchronous Next.js route that calls a model SDK, or a microservice per stage, would be worse for this workflow.

### 3.2 ADR-001 — TypeScript across web, worker, and plugin

**Accept.** The work is contracts, UI, validation, and a Figma plugin. One language avoids duplicate schema types. Rust is correctly deferred until a measured need exists. No design objection.

### 3.3 ADR-003 — Modular monolith, PostgreSQL, pg-boss, no Redis

**Accept, with one interaction to pin (OBJ-01).**

One agency product with shared lineage, budgets, approvals, and an outbox does not want independently owned services. pg-boss keeps durable jobs on the database the app already requires. ADR-003 already states the trade-off: shared DB couples capacity and reduces operational burden. For local development and a small later pilot, that trade-off is correct.

The worker as a second process is justified: generation, import, and provider I/O do not belong on the request thread. Domain modules shared by web and worker are the right place for authorization and approval rules. Providers must not decide permissions. UI must not query PostgreSQL. Those rules should stay.

### 3.4 ADR-005 — Better Auth, application authorization independent

**Accept.** Strict offline mode cannot depend on a hosted identity provider. Email/password plus opaque server sessions is the coherent local choice. Keeping roles and capabilities in the application (not in the auth vendor) is what later allows OIDC without rewriting isolation. Bootstrap-with-no-default-password and bootstrap-disabled-after-owner-exists are the right first-owner story for Milestone 1.

Password length, lockout numbers, and cookie names are implementation choices for foundation, not reasons to reject Better Auth. MFA belongs where PLAN already put it: hosted readiness (Milestone 7), unless the owner later wants it earlier as an extra local control.

### 3.5 Runtime modes

**Accept both modes as specified.**

| Mode | Architecture meaning | Verify |
|---|---|---|
| Strict offline | After install, no runtime egress; fixture adapters only | Matches PRODUCT acceptance and Milestone 1 “no outbound runtime calls” |
| Connected local | Same local app and storage; selected context may leave to approved providers | Matches INTEGRATIONS; local hosting is not claimed to be offline |

A later hosted mode is implied (same containers, storage adapter swap, TLS). It does not need to be a third development mode today. Do not collapse “app bound to 127.0.0.1” with “no data leaves the machine.” OPERATIONS already keeps those distinct.

### 3.6 Isolation and data model

**Accept.** Agency → clients; non-owners need explicit membership; every client-owned row carries `agency_id` and `client_id`; composite foreign keys; IDs are not authorization; server derives actor and scope; RLS as defense in depth; worker revalidates from trusted run records, not queue payload IDs; no cross-client search, cache, or model context.

This is sufficient as a proposed isolation architecture. Milestone 1’s two-client denial test is the right first proof. Capability names can be enumerated when roles are implemented; the rule “capabilities, not stringly roles” is enough for the proposal.

### 3.7 Durable workflow and cost control

**Accept.** Independently versioned stage schemas, immutable revisions, explicit approvals, staleness that branches lineage instead of overwriting, outbox + dedup key + effect key, uncertain timeout instead of blind replay, atomic spend reserve, no automatic provider fallback: these match an LLM-using workflow that can be retried and billed twice.

PRODUCT’s exclusion of “billing” and ARCHITECTURE’s spend reserve are not a conflict if they mean **no client invoicing** versus **internal provider-cost control**. That wording should be aligned (OBJ-04). The mechanism itself should stay.

### 3.8 Figma and storage

**Accept.** Manual bundle exchange avoids localhost plugin networking and unattended canvas writes. No secrets in the bundle. Filesystem adapter now, S3-compatible later, with checksums and manifest reconciliation: correct for ADR-002 and a later host. Web and worker sharing local disk is valid while both processes run on one machine; object storage is the documented swap when they are split.

### 3.9 Plan sequence

**Accept.** Foundation and synthetic isolation before live providers; Figma and CSV as later spikes; local pilot with real permitted inputs before any hosting decision; client self-service last. That is how a local-first agency tool should be built. Moving MFA and TLS before a working local app would invert ADR-002.

Security and QC work still belongs **inside** those milestones (isolation tests in M1, job/replay tests in M2, live opt-in and minimization in M3, real-input handling in M6, hosted hardening in M7). It does not need a new milestone or a rewrite of the plan.

---

## 4. Design objections

These are the meaningful objections. Each is a documentation pin, not a stack change.

### OBJ-01 — Separate the queue schema from client RLS (pin before Milestone 1)

ADR-003 puts pg-boss in the same PostgreSQL instance. ADR-009 and IDENTITY put RLS on client tables and require the worker to use scoped transactions, not a permanently privileged client-data connection.

If the worker role is the same role that bypasses or never sees RLS, queue payloads become a confused-deputy path. If RLS is applied indiscriminately to every table, pg-boss cannot process jobs.

**Proposed pin:** two schemas (or equivalent privilege split). `boss` (or `jobs`) is usable by the worker without client RLS. Client data stays under RLS. Job payloads carry identifiers only. The worker starts a scoped transaction and reloads the run from the database before any side effect — already stated; make the schema split explicit so it is not implemented as `BYPASSRLS` on the app role.

This is the one ADR-003 / ADR-009 interaction that can silently undo isolation.

### OBJ-02 — Name the outbox dispatcher (pin before Milestone 2; decide in Milestone 1 layout)

ARCHITECTURE: persist run and outbox event in one transaction; a dispatcher enqueues to pg-boss; mark delivered only after enqueue.

It does not say which process is the dispatcher. If the web process enqueues in the request after commit, a crash recreates the outbox problem. If both web and worker dispatch, double-enqueue races the dedup key.

**Proposed pin:** the worker (or a tiny process in `apps/worker`) is the only outbox dispatcher. Web never talks to pg-boss. That keeps the HTTP boundary as “authorize and commit” and matches “in-process domain calls, do not call our own HTTP from the worker.”

### OBJ-03 — One mutation boundary in Next.js (pin in Milestone 1)

ARCHITECTURE puts the session boundary on route handlers. CONTRACTS lists `/api/v1/...`. Next.js App Router also offers Server Actions and cached RSC I/O.

If Milestone 1 uses Server Actions for some writes and route handlers for others, authorization and CSRF will fork. IDENTITY already requires HTTP-only cookies, SameSite, origin/CSRF checks, and no shared cache for private responses. App Router’s default fetch/RSC cache can violate that if private reads are cached without actor + client keys.

**Proposed pin:** all client-data mutations go through the documented `/api/v1` route handlers (or an equivalent single server boundary that uses the same authorize-and-scope function). Server Actions, if used at all, must call that same function and never become a second policy. Default: no shared cache for authenticated or client-scoped responses (`no-store` unless a key includes actor and client).

This is a Next.js-shaped hole, not a reason to drop Next.js.

### OBJ-04 — “Billing” vs provider-cost control (docs wording)

PRODUCT excludes billing. ARCHITECTURE reserves spend and stores estimated/actual cost. Both should remain.

**Proposed pin:** client invoicing, chargeback, and payment collection stay out of scope. Per-client provider-cost reservation, rate-card version, and usage reconciliation stay in scope. One sentence in PRODUCT and DECISIONS prevents an implementer from deleting the reserve logic as “billing.”

### OBJ-05 — Package dependency: web must not resolve live provider secrets (pin in Milestone 1)

INTEGRATIONS: only the worker resolves server credentials. ARCHITECTURE: routes do not call model SDKs.

**Proposed pin:** `apps/web` may depend on contracts and fixture *types*; it must not import live adapter implementations or env keys used to call providers. Milestone 1 can ship fixture adapters; the dependency rule should exist before Milestone 3 adds a real key, or the key will leak into the Next.js bundle or server route graph.

### OBJ-06 — Treat imported text and model output as untrusted data in the stage contract (specify in Milestone 2)

AGENTS already says brand documents, reports, and model responses are not instructions. CONTRACTS already validates structured output and stores evidence refs. That is the right proposal-level stance.

The distinctive risk of this app is indirect prompt injection and rendering model output as HTML. It does not block Milestone 1. It should be a contract rule when briefs and generation are implemented: untrusted excerpts are a typed field (not concatenated as system instructions); UI renders model text as text; adapters have no URL-fetch/tool use in the MVP; a negative fixture shows that injected instructions cannot change schema or client scope.

Do not add a vector database or a separate “guardrail service” for this.

### OBJ-07 — Local real-input handling belongs on Milestone 6, not Milestone 7 (small PLAN/OPERATIONS note)

Milestone 6 is the correct first place for real permitted client inputs. Milestone 7 is the correct first place for public TLS and hosted MFA. Those should not be swapped.

The only missing proposal sentence: Milestone 6 already says “real permitted client inputs” and “hardening.” OPERATIONS should list what local hardening means so it is not confused with hosting: client permission and provider allowlist, files only under ignored `.data/` / volumes (already implied), no Git/chat/Figma-community copies (already in AGENTS), OS disk encryption as operator practice, backups excluded from cloud sync (already stated), restore drill (already an M6 exit). Retention stays “define with the client before ingestion” as IDENTITY says.

That is a checklist, not a new security architecture.

---

## 5. Information-security view of the proposed app

The proposed control set is appropriate for an agency-operated local-first tool.

| Concern | Proposal already says | Info-sec view |
|---|---|---|
| Who can see a client | Deny-by-default membership; owner all-clients is intentional and audited | Correct for an agency tool |
| Browser as attacker | Server-derived scope; IDs are not authz | Correct |
| Worker as confused deputy | Trusted run record + revalidation | Correct; complete with OBJ-01 |
| Secrets | Server env, references in profiles, never Figma/browser/Git | Correct; live keys start at Milestone 3 |
| Offline vs live data leaving | Two modes; selected context; per-client allowlist | Correct; field-level minimization is a Milestone 3 profile concern |
| LLM content | Untrusted; schema-validated; no hidden traces | Correct; complete with OBJ-06 at Milestone 2 |
| Jobs and spend | Outbox, effect keys, reserve, no silent fallback | Correct |
| Hosted exposure | Not created until Milestone 7 gates | Correct |
| Client self-service | Milestone 8; separate threat tests | Correct — do not share the owner password as a pilot shortcut |
| Thailand / PDPA / US providers | Engineering rules now; legal certification not claimed; permissions gathered before live operation | Correct for a proposal. Human privacy review is a gate on connected mode with real data (M6), not on accepting the architecture |

I am not asking for a standalone threat-model book, an incident-response program, SBOM, WAF, or encryption-at-rest product before the app exists. If the owner wants a one-page asset list later, attach it to IDENTITY when Milestone 6 is planned — not as a condition of Milestone 0.

Upload size/MIME numbers, HTTP security headers, and audit mandatory-event lists are implementation details for the milestone that introduces the endpoint. PRODUCT already requires bounded uploads; CONTRACTS already requires typed errors, pagination bounds, and idempotency. That is enough specification for a proposal.

---

## 6. QC view of the proposed app

PRODUCT acceptance criteria are the right QC spine for the whole program. They map cleanly onto the plan:

| Acceptance criterion | First milestone that can prove it |
|---|---|
| Industry-agnostic workflow (supermarket + synthetic non-retail) | 2–6 (full path at 6) |
| Fixture path with no external calls | 1 (skeleton), 2 (full offline flow) |
| Provider swap does not change downstream schemas | 3 |
| No cross-client access to records, files, jobs, search, exports | 1, then re-prove as surfaces grow |
| Approved edit → new revision; lineage preserved | 2 |
| Identical report re-import does not double count | 5 |
| Figma editable; missing fonts/components reported honestly | 4 |
| Findings include insufficient evidence; no sales-from-clicks | 5 |

PLAN Milestone 1 exit evidence already includes the two highest-value security QC checks: two-client access denial and no outbound runtime calls. CONTRIBUTING’s later CI list (lint, types, unit, PostgreSQL integration, build, migrations, focused browser tests, secret scanning) matches the architecture. Do not invent a parallel QA framework.

Proposal-quality nits (not architecture rejects):

- Number the PRODUCT acceptance criteria so PRs can cite them.
- Enumerate named capabilities when IDENTITY roles are implemented (Milestone 1).
- Expand ADR-005 and ADR-009 with the short pins in section 4 when the decision register is updated; the compact table can stay as the index.
- CodeRabbit currently special-cases `apps/web/**` only; when those packages exist, add worker, domain, db, providers, and plugin. Not a Milestone 0 blocker.
- `.gitignore` is adequate for a docs repo (`.env*`, `.data/`). Foundation can add dump/key patterns when those files can exist.

---

## 7. What I would not change

- TypeScript modular monolith and a Node worker
- PostgreSQL as system of record and job backend
- Better Auth for local sessions; app-owned roles
- Fixture-default, opt-in live providers
- User-run Figma plugin and manual bundle first
- Filesystem storage now, S3-compatible later
- Two-client isolation from day one
- Human approval as a record on an immutable revision
- Metrics honesty and no sales-lift claims
- Local development until an explicit hosting decision
- No client self-registration in the MVP

---

## 8. Suggested decision-register notes

If this review is accepted, append dated notes (do not erase existing rows):

| Note | Status to use | Content |
|---|---|---|
| ADR-001, 003, 005 | Remain proposed baseline; review accepted | Confirmed appropriate for the product and runtime modes |
| ADR-003 addendum | Proposed baseline | Queue schema/role is separate from client-data RLS; payloads are identifiers only |
| ADR-011 (new) | Proposed baseline | Provider-cost reservation is in scope; client billing is not |
| ADR-012 (new) | Proposed baseline | Worker is the only outbox dispatcher; web does not enqueue to pg-boss |
| ADR-013 (new) | Proposed baseline | Client-data mutations use the `/api/v1` session boundary (or one shared authorize function); no shared cache for private responses |

Unresolved items already in DECISIONS (versions, yellow, live models, Figma library, hosting/MFA/retention) stay unresolved until their milestones. Add only: Next.js mutation/cache pin (Milestone 1) and untrusted-content contract (Milestone 2).

---

## 9. Milestone 0 exit

Against PLAN’s Milestone 0 evidence:

| Exit | This review |
|---|---|
| Meaningful design objections resolved | Objections are OBJ-01–07. None require a different architecture. OBJ-01, 03, 04, 05 should be written into ARCHITECTURE / IDENTITY / PRODUCT / DECISIONS before or with the first Milestone 1 PR. OBJ-02 can be a Milestone 1 layout comment and must be true by Milestone 2. OBJ-06 is Milestone 2. OBJ-07 is a short OPERATIONS/PLAN note before Milestone 6. |
| Shared contracts agreed | CONTRACTS ownership model, stage envelope, run API, and design bundle are sufficient to start foundation. Do not freeze every future route now. |
| Then implement Milestone 1 only | Agreed. Do not scaffold a hosted app or buy cloud. |

I would start Milestone 1 on this architecture. I would not start it by adding a threat-model program, an IdP, or production privacy work that PLAN already scheduled later.

---

## 10. Summary

The proposed app is a local-first modular monolith: Next.js and a worker over PostgreSQL, fixture-default providers, Better Auth, client-scoped data with RLS as defense in depth, human-approved immutable revisions, and a user-run Figma plugin. That architecture matches the product and the plan.

The important design pins are operational, not existential: keep pg-boss off client RLS, let only the worker drain the outbox, use one Next.js mutation/cache policy, keep cost control while excluding client billing, and keep live secrets out of the web package. Information-security and QC controls already in the proposal should be proven at the milestones that introduce those surfaces — starting with two-client denial and no outbound calls in Milestone 1.
