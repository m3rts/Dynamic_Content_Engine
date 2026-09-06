# Runtime security and data lifecycle

This is a scoped engineering control specification, not certification, legal advice, or evidence that controls already work. Owners and tests are assigned in PLAN. Local real-data handling is M6; public hosting and external-client access have separate gates.

## Threat/control register

| Boundary | Failure | Control and proof |
|---|---|---|
| Browser → web | Forged client IDs, CSRF, stale cache | IDENTITY capability checks; single API boundary; cross-user/cache tests (M1) |
| Queue → worker | Tampered job or overprivileged queue | DATABASE role split and trusted dispatch reload; forged-job tests (M1–2) |
| Sources → model | Prompt injection changes instructions/claims | Typed excerpts, no tools, constrained outputs, adversarial corpus (M2) |
| Worker → provider | Forbidden disclosure or duplicate billing | RUNTIME egress policy, dispatch intent and uncertainty recovery (M3) |
| Output → UI/Figma/export | Active markup or harmful data | Plain-text rendering, bounded slots, safe file handling (when introduced) |
| Human approval → published revision | Approval altered or applied to different content | Immutable revision digest and append-only typed approval events (M2/4) |
| Source/backup → external tools | Client data committed or synced | Git exclusions, sample-only fixtures, permitted local storage and restore/deletion controls (M1/6) |

## Claims and prompt-injection limits (M2)

ApprovedClaimRevision contains exact wording or controlled parameters, supporting evidence, product/locale, validity period, scope/store restrictions and required disclaimer. Models reference claim IDs; renderer inserts the approved wording/parameter values from trusted records. Price/currency/validity slots never accept model-authored replacements. Validate IDs, current validity, evidence ownership and template constraints deterministically at generation and bundle approval. Expired claims make downstream work stale.

Free creative prose can imply unsupported facts beyond a controlled slot. Lexical and optional semantic checks flag it, but are not proofs. Require human factual/brand review of the full copy; unresolved flags block production approval. Do not promise detection of all factual, superlative or implicit claims in arbitrary language. Brand-rule changes originate from an authorized revision editor, never an imported instruction. Test injection in source text, CSV fields and model output; scope and permissions are enforced outside the model.

## Upload/export defaults (at first endpoint)

Initial source context is typed text plus bounded CSV and supplied raster assets; PDF/Office ingestion and archive ingestion are deferred. CSV: UTF-8 (BOM accepted), 10 MB, 100,000 rows, 100 columns, 10 KB maximum field; reject malformed quoting, NUL and invalid encoding. CSV has no reliable magic signature: parse against explicit format/schema. Raster input: PNG/JPEG/WebP only, 20 MB compressed, 25 megapixels decoded and 100 MB processing-memory budget; decode with maintained library, re-encode/strip metadata, reject malformed/over-limit/animated content. Verify binary signature instead of trusting extension or browser MIME. SVG and arbitrary archives are rejected in MVP. Limits are server-enforced before expensive processing and visible in UI.

Generated Figma bundles are bounded JSON + raster files, maximum 50 MB total and manifest checksums; manual packaging uses a known generated format. If a container/archive is used later, enforce entry count, total expanded bytes, compression ratio and path traversal protections before enabling it. No extraction of user-supplied arbitrary archives.

Store under UUID-derived scoped paths, never user paths; private downloads reauthorize and use attachment/nosniff. Any approved inline image preview uses validated raster MIME and authenticated access. No user HTML in app origin. CSV exports quote/escape normally AND neutralize formula-leading `= + - @` and control/whitespace-prefixed variants in text cells; retain typed numeric values and original source separately. Tests include Excel-style formula payloads. Malware scanning is a hosted-upload gate; scanner failure quarantines rather than serves.

## Audit and approval integrity

Separate append-only events from mutable operational projections. Egress intent/outcome are separate events sharing a call ID. Audit actor/scope, login outcomes, membership changes, run/approval/profile changes, exports, deletion, budget reconciliation and denied sensitive operations. Do not put content/secrets in events. Normal roles have scoped SELECT/INSERT as needed; UPDATE/DELETE denied.

Approval events include type (creative, factual_claims, production; future legal), revision hash, policy revision, reviewer and time. Multiple events per revision are allowed. Revocation appends an event. Chain events per client with a locked sequence and canonical payload hash; verify on export. An owner with database-admin access could rewrite a whole chain, so this is tamper evidence against ordinary modifications, not independent non-repudiation. Hosted readiness anchors daily chain digests in a separately controlled backup/retention store. No blockchain or extra service required locally.

## Provider policy and privacy operations

Data classes: synthetic, public-approved, client-confidential, personal, restricted. Source records carry a class; a context inherits the highest applicable restrictions. Unknown classification denies live egress. Per-client policy names allowed providers/models/regions where supported, purpose and allowed classes. M3 defaults to synthetic/public-approved only. Personal/restricted inputs remain prohibited for pilot generation unless a later reviewed policy explicitly allows them. Egress minimizes selected fields; no whole-source forwarding merely because available.

Maintain a client-visible provider/sub-processor register before real data: provider, purpose, transmitted classes, hosting/processing location as verified, retention/deletion terms, contract reference and owner approval. Legal roles and jurisdictional obligations must be assessed from the actual contract/data; do not assume every vendor or Thai marketing task automatically has the same legal status. No legal certification is asserted.

Authorized client export is a background operation producing a scoped encrypted/private manifest, records and assets, excluding secrets and other clients. Download expires after 24 hours, job checks current access, and every access is audited. Data deletion is an owner-confirmed background operation: pause new work, revoke shares, cancel queued jobs, reconcile in-flight provider uncertainty, enumerate records/files, purge scoped content, issue supported provider deletion requests and record residual copies/expiry. Do not call deletion complete if a provider copy is unconfirmed; expose partial/pending outcomes.

Before M6, each client must choose source/output retention and any legal hold. Pilot proposed default for approval: 90 days source/prompt bundles, 12 months approved assets/findings, 30 days export-job metadata and logs (download artifacts themselves 24h), rolling 30-day encrypted backups; contract overrides are explicit. Retention jobs run daily via the maintenance principal, honor holds and produce audit summaries. Backups age out rather than promising surgical edits; a restored backup is quarantined until deletion manifests are replayed and scope/assets reconciled. Privacy deletion can remove evidence needed for replay: flag loss honestly. Audit retains minimal pseudonymous metadata only for the approved period; do not retain identifiable hashes forever by default.

Cross-client content learning remains prohibited. Anonymized statistical benchmarks are a future opt-in product proposal only, not an enabled exception: require separate privacy/design approval, contract consent, cohort-size/re-identification analysis, suppression and revocation rules before aggregation. No benchmark data collection is introduced for the pilot.

## Local real-input gate (M6)

Owner verifies client permission, source rights, provider/class allowlist, retention schedule, OS full-disk encryption, locked device, approved nonsynced `.data`/volumes/backups, and restore evidence. No real data in Git, coding-assistant chat, public Figma community or screenshot fixtures. Use private authorized Figma files only. This gate is independent of later public TLS/MFA; real local data is not presumed safe merely because the app is unhosted.

## HTTP/browser baseline

M1 uses exact origin checks, no wildcard credentialed CORS, frame-ancestors 'none', nosniff and Referrer-Policy: no-referrer for private pages. Production CSP uses nonces/hashes for required framework scripts, restricts connect/img/font sources to required origins and avoids unsafe-inline; verify with the pinned Next version rather than breaking auth or weakening silently. Development-only tooling exceptions are explicit and cannot leak into a hosted build. Add HSTS only with hosted TLS. Secrets scans inspect client bundles/build output and fixtures, not just source strings. No inline preview of untrusted HTML/SVG.
