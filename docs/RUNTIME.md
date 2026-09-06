# Execution, egress and cost lifecycle

Design requirements; numerical settings are conservative pilot defaults, not measured guarantees. Foundation verifies pg-boss APIs for the pinned release before claiming any timeout/lease behavior.

## Dispatch ownership and idempotency

Only worker dispatcher loops claim pending control records (short transaction, skip locked, bounded batch). Web never enqueues. Multiple worker instances use claim leases and stable dedup keys; enqueue-success/mark-delivered crashes can cause duplicate delivery, so attempt effect keys and fencing protect app effects independently. See DATABASE for metadata-only lookup and scoped business access.

HTTP idempotency records keep request hash, scope, operation and result ID for 30 days. Return the original result for identical retries, 409 for differing payloads. Persist a compact tombstone through the longer of 90 days or linked nonterminal work; expired known keys return `IDEMPOTENCY_EXPIRED`, requiring an intentional new key. After tombstone expiry a reused key is new; clients must generate unique keys. Durable run/asset/import effect keys persist with their records and are not substitutes for HTTP retention. Deleting a client removes linked keys under retention policy.

WorkflowRun adds `needs_attention` for uncertain outcomes. StageAttempt states: queued, executing, succeeded, failed, cancelled, uncertain. Human review waits do not hold a worker lease or DB connection. Each execution claim has a monotonically increasing fence; writes check that fence and allowed state. A stale executor cannot commit an asset or dispatch another paid request.

## Timing and failures

Initial text request hard deadline 120 seconds including bounded connection setup; execution watchdog 180 seconds; job expiration/recovery eligibility 240 seconds. Heartbeat every 15 seconds, watchdog sweep every 30 seconds. These are application deadlines; do not invent a separate native visibility-timeout API if pg-boss does not expose one. M2 maps native expiration/retry settings to this ordering and tests it with process kills. Longer image/import stages require separate validated profiles and are not squeezed into text deadlines.

No open database transaction while awaiting a provider. Retry confirmed pre-dispatch failures or documented nonbillable transient rejection at most twice with 2s/8s backoff plus jitter; honor Retry-After. Do not retry auth errors. A schema-repair generation is a new paid attempt with fresh budget, max one repair. Record requested and actual model, repair/retry parent and cause.

Once dispatch may have occurred, timeout/worker death becomes uncertain. Queue redelivery reconciles; it must not repeat the external call. Query provider request status when supported. Otherwise operator reconciliation records usage evidence or explicitly authorizes a new run with duplicate-billing risk visible. Cancellation stops future stages; it cannot promise to reverse a provider charge.

## Budget reservation lifecycle

Reservation carries agency/client/run/attempt, amount/currency, rate-card version, owner fence, reserved_at, expires_at and state: reserved, dispatched, settled, released or uncertain. Atomic agency/client/run/period checks reserve worst-case configured input/output/tool costs before dispatch, with conservative margin; all concurrent callers share the same ledger. Warn at soft threshold (80% default), refuse new dispatch at hard cap (100%). Soft warnings never override hard caps. Provider-side account caps are additional controls, not assumed perfectly instantaneous.

Undispatched reservations expire after 10 minutes: sweeper releases only if a locked attempt proves no dispatch-intent event exists and fences the attempt out. Immediately before network I/O, mark dispatched and append dispatch intent atomically. A crash after intent but before actual send is conservatively uncertain. Dispatched/uncertain reservations never auto-release merely because TTL elapsed. Reconcile known usage exactly once; if unavailable, retain worst-case cost against budget and show an owner action. Late usage adjusts the ledger even after cancellation; exceeded caps block further work and alert. Reconciliation itself is idempotent and audited. Period caps use configured billing timezone; reservations stay attributed to the original period even if settled later.

## Mandatory model egress broker (M3)

One internal module owns provider credentials and is the sole network transport for model operations, including evals, repairs, status lookups and image downloads. Inputs: trusted scope and attempt, stage/profile, provider/model, data classes, byte count, purpose, reservation and trace. In order: verify connected mode; actor/client policy; pipeline/profile compatibility; selected/redacted context; active reservation; shared provider limit; append dispatch event; perform allowlisted call; append outcome and settle usage. Failure to record required dispatch audit fails closed.

No client-provided base URLs, redirects to arbitrary hosts, URL fetch tools, browsing or autonomous tools in MVP generation. Provider-generated media URLs are allowlisted and validated before fetching; later connectors/email have separate named adapters and policy, not an exemption for arbitrary fetch. Strict offline forbids all external runtime transports, including fonts/telemetry, regardless of API configuration.

Fallback requires both a versioned client allowlist and an explicit profile fallback list, plus operator consent for the affected run. Validate data class and cost afresh; reserve for the actual replacement. Store requested_model and actual_model distinctly. No hidden cross-provider fallback and no fallback after uncertain billing without explicit reconciliation/new-run consent.

## Throughput and connection budgets

Start network-job admission at 2 locally, allow a measured increase up to 8 for the pilot; memory-heavy image/import jobs remain 1 per worker. Concurrency is a safety bound, not the provider quota mechanism. A PostgreSQL-backed shared limiter per credential/provider accounts for request and estimated token windows, configured below verified account limits; reconcile actual usage and apply Retry-After. Missing live quota configuration blocks live dispatch. Circuit breaker opens after 5 retryable transport/provider failures in 60s, cools down 60s and admits one probe; quota responses use their retry window instead.

Initial DB pools: web app 5, auth 3, worker app 5, queue 3, control 2; no connection held for remote I/O. Reserve administrative headroom; validate totals against DB max_connections and pg-boss needs. Pool wait target <100ms p95 for pilot; queue default retention 7 days completed / 30 days failed metadata, business lineage governed separately. Monitor queue dead tuples/autovacuum and row count.

## Tracing and logs

Server issues a trace ID at request admission, validates any incoming trace only as untrusted correlation metadata, and propagates through outbox, job, attempts, provider request IDs and audit. Never use trace IDs for authorization. JSON logger uses allowlisted fields with redaction before sinks; prompts, outputs, cookies, raw uploads, email addresses and provider keys are excluded. Store reconstructable model inputs only in scoped artifact storage with retention/access rules, not operational logs. Trace metadata retention defaults to 30 days and cannot override client deletion policy.
