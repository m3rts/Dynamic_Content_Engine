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
