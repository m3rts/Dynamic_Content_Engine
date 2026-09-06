# Login and user management

## Baseline

Use Better Auth with PostgreSQL for local email/password authentication and opaque server-managed sessions. This supersedes the earlier conversational suggestion to require managed identity: an external login dependency conflicts with strict offline operation. Keep application authorization independent so an OIDC/managed identity option can be added later through a decision record. Better Auth handles credential verification/hashing; do not implement cryptography or password storage ourselves.

No public sign-up initially. An interactive local bootstrap creates the first owner with an entered password; never ship a fixed default password. Bootstrap must stop working after the owner exists. Local invitation/reset mail goes to a local mail sink, not real recipients. In connected/hosted use, enable verified email delivery and time-limited, single-use reset/invitation tokens. Hash stored invitation tokens and revoke sessions on account disablement or sensitive changes.

## Roles and scope

| Role | Allowed scope |
|---|---|
| Agency owner | All agency clients; user/role administration; integrations; budgets; approvals |
| Agency operator | Assigned clients; briefs, generation, report import, asset specs; no role or secret administration |
| Reviewer | Assigned clients; view artifacts, comment, approve/reject; no provider credential access |
| Client contributor (future) | Own assigned client, draft/generate within budget; cannot grant access or approve by default |
| Client viewer (future) | Own assigned client and explicitly shared artifacts only |

Roles map to named capabilities, not scattered role string comparisons. Initial owner may both generate and approve. Enforced separation of duties can be added per client. Agency owner access across clients is intentional and audited; all other access is explicit and deny-by-default.

## Enforcement

- Require authenticated actor and verified membership on every server mutation/read and asset download.
- Client ID comes from the authorized context; validate target entity belongs to it. Use scoped repositories plus composite foreign keys.
- Add PostgreSQL row-level security for client tables as defense in depth. Use a non-owner app DB role without BYPASSRLS, FORCE RLS where applicable, transaction-local scope and tests for pooled-connection leakage. Separate migration credentials. Owner policy must explicitly allow agency scope; never use an arbitrary wildcard from the browser.
- Worker derives scope from trusted run records and revalidates current access before effects. Queue payload IDs alone are insufficient. Worker uses scoped transactions, not a permanently privileged client-data connection.
- No cross-client search, caches, retrieval, assets or model context. Include client and authorization-relevant keys in caches; disable shared caching for private responses.
- Use HTTP-only session cookies, SameSite and origin/CSRF checks; Secure cookies in TLS environments. Local HTTP exception limited to loopback development.
- Configure expiry, logout, session revocation, login throttling and generic authentication errors. Test reset replay, expired invites, disabled users and permission changes.
- Hosted readiness requires MFA for owners/admins, recovery procedure, audited role changes, and tested backup restoration.

## Secrets and data

Provider keys initially live in ignored server environment files with restrictive file permissions. Model profiles contain credential references, never secret values. A later multi-credential UI requires encrypted storage, a key kept outside the database, rotation, and redaction. Do not expose keys to Figma or browser storage.

Store client source material locally; send only the selected context in connected mode under each client's allowed-provider policy. No automatic cross-client reuse. Define retention/deletion with the client before real production ingestion; account for backups and provider copies. This is an engineering requirement, not a legal compliance certification.

Coding assistants and CodeRabbit are development tools, not app users. Their subscriptions/login sessions are not runtime API credentials or application authentication.

## Stable identity seam and capability table (M1)

Business references use immutable internal user IDs, never email addresses. Use a separate linked-identity record with `issuer`, `external_subject_id`, internal user ID and unique `(issuer, external_subject_id)`; provider subject alone is not globally unique. Integrate with Better Auth account records rather than duplicating password/identity ownership. Account linking requires authenticated verified ownership and is audited; never auto-link solely on email. This supports multiple identities per user and later OIDC/SAML. SCIM is deferred to M8 and must revoke memberships/sessions/queued work via the same audited services. Verify chosen auth library/plugin licensing and support before promising enterprise protocols.

| Capability | Owner | Assigned operator | Assigned reviewer | Future client contributor | Future client viewer |
|---|---|---|---|---|---|
| client.read | Agency clients | Assigned | Assigned | Assigned and shared | Assigned and shared |
| brief.write / concept.write | Yes | Yes | No | Yes | No |
| run.create / run.cancel | Yes | Yes within client | No | Own runs within client | No |
| report.import | Yes | Yes | No | No | No |
| review.creative / review.claims / review.production | Yes | No | Yes when specifically granted | No | No |
| asset.export | Yes | Approved assets | Approved assets | Explicitly shared approved assets | Explicitly shared approved assets |
| client.export / client.delete | Yes, step-up | No | No | No | No |
| users.manage / profiles.publish / credentials.manage / budgets.manage | Yes, step-up | No | No | No | No |
| audit.read | Yes | Own operational events | Review-related events | Own/shared events | No |

Future columns define the seam only; they are disabled until M8. Named grants are authoritative: a reviewer role alone must not automatically grant factual/legal expertise. Agency owner can generate and approve in the pilot. Policies can require distinct reviewer vs author and multiple approval types without changing the Approval entity. Delegation, if later enabled, has expiry and scope; all approval checks use current policy at production gate as well as the pinned revision record.

Authentication defaults: library password handling, minimum 12 characters/max 128 (verify supported limits), no composition tricks or shipped default. Login throttle 5 failed attempts/account per 15 minutes plus 30/IP; progressive cooldown with recovery rather than permanent account lock. Session lifetime 7 days, idle timeout 12 hours; step-up within 5 minutes for sensitive operations. Single-use invite expiry 24h, password-reset expiry 30min. All values are testable configuration with documented changes. Bootstrap uses a transaction/unique guard to prevent two first owners; has no network endpoint.

Better Auth owns session validation and CSRF protections for auth routes; application route wrapper checks Origin and CSRF for cookie-authenticated mutations. Hosted sessions require TLS/Secure/HttpOnly/SameSite=Lax and exact allowed origins. Local HTTP only on 127.0.0.1/localhost. M7 requires owner/admin MFA, tested recovery codes stored by the owner outside the app, real sender verification, reset abuse tests and session revocation. M8 adds enterprise identity tests only when enabled.

Application quotas default to 120 reads/minute/actor, 30 writes/minute/actor/client, 10 generation starts/hour/client (including retries started as new runs), and 2 simultaneous imports/client; return 429 with retry guidance. These supplement shared provider limits in RUNTIME. Owner can lower limits; increases must respect hard spend caps. Test the capability table over two agencies, two clients, active/disabled memberships, API endpoints, worker commands and storage downloads. Exhaustive generated tests validate the matrix, while separately authored negative tests prevent a mistaken table being its own only oracle.

DATABASE is canonical for queue/RLS role separation and transaction-local scope. SECURITY is canonical for append-only audit, approval types, retention/export/deletion. Later identity integration must not loosen these policies.
