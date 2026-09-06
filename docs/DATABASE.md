# Database, queue privileges and reporting

Design baseline v0.2. D1/SQLite, Redis and independent data services are not introduced. PostgreSQL owns durable records. All counts and capacities below are engineering assumptions to test.

## Schemas and credentials (M1)

| Schema | Contents | Access |
|---|---|---|
| `auth` | Better Auth users, credentials, sessions and account links | auth adapter role only; not queue/worker |
| `app` | Client-owned business records and membership relations | scoped web/worker roles, RLS for client-owned tables |
| `control` | Content-free outbox/dispatch registry, maintenance cursors, shared rate buckets | narrowly granted functions; no general client-content access |
| `boss` | pg-boss-managed queue tables | dedicated queue runtime role; separate queue migrator |
| `audit` | Scoped immutable business, approval and egress events | INSERT and scoped SELECT only for relevant runtime roles |

Runtime roles have no superuser, schema ownership, BYPASSRLS, schema CREATE, TRUNCATE, or membership in migration roles. Migration credentials are separate, invoked explicitly and absent from normal app/worker environments. Queue schema is not subject to client RLS. pg-boss schema installation/upgrades run under queue migration credentials; runtime grants must be verified against the pinned version and fail foundation if it requires broad privileges. Do not solve compatibility by giving the worker app-owner rights.

Client tables enforce agency/client composite foreign keys. Reads and writes use `USING` and `WITH CHECK` policies as applicable. Apply FORCE RLS on client tables; partitions are accessed only through their parent and receive no direct runtime grants. Authentication/global identity tables need restricted grants and audited administrative functions rather than artificial client IDs. RLS semantics and partition constraint limits: [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html).

## Trusted scope without a bootstrap loophole

Web validates session and membership, then in one transaction writes the RLS-protected run and a `control.dispatch_record`. The dispatch record contains only dispatch/run/attempt IDs, agency/client/actor IDs, immutable input hash, trace ID, permitted job kind and lifecycle metadata. A narrow insertion function validates that the referenced run exists under the caller's current authorized scope and matches all supplied IDs. No prompt/content/secrets enter control or boss.

The queue role can claim pending dispatch records and resolve a dispatch ID via bounded functions; it cannot SELECT app tables. Worker compares the queue reference with the authoritative dispatch record, then uses its separate app pool with parameterized transaction-local actor/agency/client settings. It reloads the run through RLS and rechecks membership, state, revision and capability before any effect. Mismatched/stale/forged records are denied and audited. Missing actor authorization cancels user-triggered work. System retention/recovery jobs use an explicit narrow service principal and separate audited policy, never an absent-user bypass.

`SET LOCAL` or parameterized `set_config(..., true)` must occur inside the transaction containing every scoped query. No session-level scope, global client object or connection reused with unreset settings. Tests cover success, exception, rollback, concurrent clients, owner vs operator and pool reuse. PgBouncer is not required locally; if introduced later use transaction mode and rerun these tests. RLS is defense against query/scope mistakes; custom settings do not protect against total compromise of a trusted app process. A compromised worker holding both pools remains a trust-boundary risk, addressed with minimal credentials and egress controls.

Audit event updates/deletes are denied; reconciliation appends a new event. Scoped read access remains available for authorized audit views. A separate offline retention credential can delete expired data under audited policy; normal worker scheduling requests retention work but cannot borrow that credential.

## Reporting table decision (M1.5 prototype, M5 complete)

Create `metric_observation` range-partitioned monthly on `period_start` when introduced. This accepts the review's early schema decision without claiming partitioning is free or mandatory for tiny datasets. Maintain current and next three months, create older partitions only for validated imports under an explicit maintenance task. Reject unsupported dates into staged-error state; no unbounded default partition. Partition maintenance failure pauses affected imports and alerts the operator.

Primary/dedup keys include partition key: `(agency_id, client_id, period_start, observation_id)` and a unique logical grain including source account/ad, start/end period, dimension hash, metric-definition version and active dataset revision. References to observations include period_start, or point to unpartitioned report/dataset revisions. Do not assume global uniqueness can be enforced on an ID alone across partitions. Direct child access is denied. Indexes for client queries begin with agency/client then creative/date or import ID. Global maintenance indexes are justified separately, not forced into an inappropriate client-prefix rule.

Imports stream into a session-local temporary staging table with fixed column types using COPY FROM STDIN. Use no server-file COPY privilege and no globally readable unlogged staging table. Staging contains one authorized import, is disposable on crash, and never enters worker logs. Validate encoding, grain, limits and mappings, then publish in one bounded transaction under client scope. Keep the raw allowed upload to retry. The M1.5 twenty-row case uses the same typed contract; M5 validates the full bulk pathway.

A dataset revision selects active import contributions. Identical hashes are idempotent; corrected reports create a superseding revision with an atomic active pointer. Overlapping cumulative/daily or total/breakdown grains cannot both contribute. Historical findings retain their dataset revision. Deletion/retention may remove historical data; mark those findings evidence-unavailable rather than inventing reproducibility.

Compute aggregates on read over compatible raw counts for the pilot. No stored rate averaging or automatic rollups. Introduce versioned daily rollups only if measured Learning queries miss the target after indexing and bounded queries; rollups pin the dataset/mapping revision and rebuild affected periods on correction/deletion. This is a recorded optimization, not a new source of truth.

## Volume assumptions and migration proof

Rows/year = clients × active creatives/client × reporting days × breakdown combinations × metric rows/combination. Baseline example: 10 × 200 × 365 × 5 × 3 = 10.95M rows. Stress example: 20 × 500 × 365 × 10 × 3 = 109.5M. At an illustrative measured-later 0.5–1 KB per row including indexes: roughly 5.5–11 GB and 55–110 GB, before WAL, staging and backups. Actual report grains may be far smaller. M5 loads a synthetic representative volume, records EXPLAIN/query times, row/index bytes and peak import memory, and updates OPERATIONS.

Migrations use expand/backfill/contract where compatibility matters, are serialized by one owner, and run on a restored synthetic database in CI. Validate RLS grants, partition creation, corrections and restore before schema acceptance. No automatic destructive rollback: preserve backups, prefer forward fixes, and document any data-losing reversal explicitly.

### Privileged function boundary

Any control/auth/maintenance function needing SECURITY DEFINER is owned by a dedicated non-login role with only required table privileges, uses a fixed trusted search_path and qualified names, contains no caller-controlled dynamic SQL, and has PUBLIC execute revoked. Grant execute only to the relevant named role. Validate all referenced actor/agency/client/run relationships and return bounded metadata, not arbitrary rows. Tests attempt crafted IDs, missing scope, altered search_path and unauthorized invocation. Prefer ordinary invoker functions wherever elevated access is unnecessary.

Control is not a bucket for sensitive prompts or raw audit data. Keep dispatch metadata minimal and expire terminal records after the durable idempotency/lineage policy permits. Required missing metadata pauses execution; no fallback to trusting the queue payload. Auth-to-domain user provisioning uses an explicit idempotent service with an audit event, never implicit email matching.
