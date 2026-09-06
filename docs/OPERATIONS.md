# Local operation, capacity, and cost plan

Planning date: 6 September 2026. USD estimates, excluding taxes, exchange rates, staff time, existing computer/electricity and existing software seats. No services purchased and no deployment authorized.

## Two development modes

**Strict offline:** after dependencies/container images/fonts are installed, web, worker, PostgreSQL, mail sink and files run locally. Fixture providers return labelled sample responses. Network egress is blocked in offline verification. No real Figma or hosted model integration is promised offline.

**Connected local:** identical local app/storage, with explicit permission/configuration to contact selected model APIs and use Figma. The app remains unhosted, but selected input data leaves the machine. GitHub/CodeRabbit/other coding assistants also require connectivity independently of the running app.

## Local machine

Recommend an existing modern 4+ core machine with 16 GB RAM and 30–50 GB free SSD. 8 GB can support a constrained fixture setup, but containers, editors and browsers compete for memory. 32 GB is comfortable for multiple checkouts and tooling. These are planning estimates, not measured requirements. No GPU needed with fixtures or external model APIs. Self-hosting large text/image models is outside this sizing.

Allocate roughly 2–4 GB to PostgreSQL/services and leave headroom for the web build, worker and browser. Start network-job admission at 2; RUNTIME defines measured increases, separate memory-heavy limits and shared provider quotas. Stream imports and enforce file limits instead of loading arbitrary reports/images into memory.

Planned developer contract (not runnable yet): install pinned dependencies; copy `.env.example`; start Compose database/mail services bound to 127.0.0.1; apply migrations; interactively bootstrap owner; run web and worker; seed synthetic clients explicitly. Proposed script names are `dev`, `db:migrate`, `owner:bootstrap`, `test`, `test:integration`, and `build`. Foundation must implement and document the exact commands and shutdown/restore steps.

Persist local files under ignored `.data/` and named database volumes. Never mount a developer home directory into containers. Keep backups outside Git; test database and matching asset-manifest restoration. Distinct checkouts need separate ports, database names and asset directories. No automatic cloud backup/sync of client data.

## Future server envelope — do not buy yet

| Stage | Starting envelope | Expected use |
|---|---|---|
| Local development | Existing 16 GB machine, 30–50 GB free | One operator, fixtures/light live tests |
| Small private pilot | 2 vCPU, 4 GB RAM, 80 GB SSD | 1–5 active users, 1–2 concurrent API jobs; build images elsewhere |
| Comfortable agency pilot | 4 vCPU, 8 GB RAM, 160 GB SSD | Several clients/users, more import and job headroom |
| Expanded service | App/worker separated from managed DB; object storage | Size from measured concurrency, queue age, memory and asset growth |

A single VM can initially run app, worker and database but is a single point of failure and requires patching and off-machine backups. A managed DB costs more and reduces some operations work. Test before choosing. Consider Singapore proximity for Thailand users; verify region availability and client requirements at purchase.

DigitalOcean currently lists example Basic VMs at $24/month (2 vCPU/4 GiB/80 GiB) and $48/month (4 vCPU/8 GiB/160 GiB). These are source-backed reference prices, not a vendor commitment. [VM pricing](https://www.digitalocean.com/pricing/droplets).

## Monthly planning budgets

| Scenario | Infrastructure | AI allowance | Indicative total |
|---|---:|---:|---:|
| Fully offline development | $0 incremental hosting | $0 | $0, excluding existing equipment/tools |
| Connected-local pilot | $0 hosting | $20–100 spending cap | $20–100 |
| Small hosted pilot, later | $35–75 | $50–150 | $85–225 |
| Comfortable hosted agency pilot, later | $70–150 | $100–500 | $170–650 |

Infrastructure ranges are estimates combining a $24/$48 VM with approximately $10–30 backups/storage and $0–25 email/monitoring/domain monthly allowance; the larger envelope includes extra storage/operations headroom. Managed database, commercial authentication/support, large egress and high availability may exceed these ranges. Figma seats, GitHub/CodeRabbit and coding-assistant subscriptions are separate existing/new seat costs to confirm from account plans.

AI allowances are budgets, not predicted bills or provider quotes. Estimate each stage as `(input_tokens × input_rate + output_tokens × output_rate) / 1,000,000`, plus caching, images, tools, retries and any other billable units. Store the applicable provider rate-card version. Do not assume all providers report the same units or that visible answer tokens equal all billed output.

Worked illustration: 100 briefs × 6 calls = 600 calls; at 8,000 input + 2,000 output tokens/call gives 4.8M input and 1.2M output. At an assumed planning rate of $3/M input and $15/M output, text costs $32.40; 25% rerun reserve makes $40.50. At assumed $10/$50 rates the same workload is $108 before reruns. 200 generated images at a deliberately illustrative $0.10–0.30 each adds $20–60. These image rates are assumptions, not verified product prices; replace with the chosen model's size/quality pricing before enabling generation. Provider reference pages are in SOURCES.

## Disk growth

Example: 10 clients × 100 retained assets/month × 3 MB = 3 GB/month. Twelve months is 36 GB before originals, variants, reports and backups; two additional full backup copies would bring that illustrative asset footprint to 108 GB. Set retention, storage quotas and archive policy; do not assume an 80 GB server remains sufficient indefinitely.

## Hosted readiness and monitoring

Before hosting: owner approval, TLS, MFA/admin recovery, secrets provisioning, real email/reset validation, rate limits, client-isolation tests, restore drill, deployment rollback and migration compatibility. Proposed pilot recovery targets: up to 24 hours data loss with daily backups, recovery within one business day; validate before promising service levels.

Monitor health, queue age, failures, provider latency, reserved/actual spend, DB connections, disk, memory and backup age. Alert before storage reaches 80% and investigate sustained memory pressure or jobs exceeding intended wait time. Set exact response-time and throughput targets after measuring the first vertical slice; do not claim user capacity from CPU count alone.

## v0.2 operations addendum

DATABASE now models metric-row growth as well as assets: 10.95M rows/year in an illustrative 10-client breakdown scenario, about 5.5–11 GB including indexes at the assumed row footprint; this is not measured capacity. Raw files, queue churn, WAL, backups and corrected dataset revisions add overhead. Recompute from the client's actual CSV before buying server space. The existing VM prices and monthly budgets remain planning references, not promises that those envelopes meet larger workloads.

RUNTIME defines separate pool caps, network/import admission, shared provider quotas and retention. Pilot target for ordinary scoped reads <500ms p95 and Learning query <2s p95 at the documented representative dataset; generation has asynchronous progress rather than an HTTP latency promise. M5 records hardware, dataset, concurrency and cold/warm timings. Investigate sustained pool wait >100ms p95, disk >80%, memory >80% or queue growth beyond expected provider throttling. Optimize measured queries/retention first. Queue-only pressure that still degrades reads after pool/autovacuum tuning triggers a decision to move queue storage to a separate DB; it is a known option, not an automatic split or necessarily the first bottleneck.

Local ports proposed: web 127.0.0.1:3000, PostgreSQL 127.0.0.1:5432, mail UI 127.0.0.1:8025. Override per checkout. Service DB credentials use least privilege roles; generated secrets live in ignored env files. `DATABASE_URL` must never point to a production system for local tests. Compose starts database/mail only; web/worker processes run locally or in defined dev containers. Installation may use network; offline-runtime verification begins after assets/dependencies exist.

Backups: daily encrypted consistent database dump/snapshot plus manifest-addressed immutable assets; pause writes/retention briefly or capture a verifiable common snapshot boundary. Maintain checksum inventory and log the backup run result without content. Proposed recovery point ≤24h and recovery within one business day remain targets, not an SLA. Restore drill before M6, then monthly and after material schema/storage changes. Record backup ID, timestamps, restored row/asset counts/checksums and deletion-manifest replay. Test in an isolated environment with providers/email disabled; resume only after client isolation checks.

Retention jobs run daily but maintenance/deletion privileges remain separate from general worker access; see SECURITY. Local backups stay on approved encrypted nonsynced storage. Hosted backup copies and digest anchors require separate access controls and verified retention. On suspected cross-client exposure or credential compromise: disable live dispatch, revoke affected credentials/sessions, preserve redacted audit evidence, scope impacted clients/data, restore/repair, and have the owner coordinate any contractual notices. Do not automatically send client notifications from an agent.

No Kubernetes, WAF subscription, hosted identity plan, paid telemetry or GPU is required for the pilot. External Figma/provider/evaluation usage is opt-in and costed separately; model-eval spend uses the same cap ledger. Choose hosting only after M6 measurement and M7 authorization.

### Maintenance execution and data custody (M6)

The same worker codebase exposes a separate `maintenance:run` command for partition lifecycle, retention, deletion and backup reconciliation. This is a planned command, not implemented. It executes under a dedicated maintenance/service identity with only its reviewed function grants; retention credentials never enter the web or ordinary job-executor environment. An owner-installed local scheduler invokes it daily when the real-data pilot starts; missed runs alert and block claims of enforced retention. Scheduling is not installed or enabled by this architecture change. The process enumerates due work through bounded control functions, takes client scope from authoritative records, rechecks legal holds/policy and records every result. The ordinary worker only creates authorized maintenance requests and reads status.

Local source/request/artifact storage inherits OS full-disk encryption and access restrictions for the M6 gate; backups are independently encrypted. Hosted object storage must have encryption, private access and key-management/rotation verified at M7. Do not put raw credentials or cryptographic keys in reconstruction bundles; replay retrieves only an authorized input snapshot and uses current approved credentials. Replay is a new billed run with new consent/budget, never automatic on restore.
