# Dynamic Content Engine

A client-agnostic agency workspace for turning business objectives, audience evidence, and brand guidance into creative concepts, editable assets, and evidence-informed next experiments.

**Status: M1 foundation in progress — pinned workspace and CI landed; application runtime not yet implemented.** Architecture baseline v0.2 was approved at ed1ebfc on 6 September 2026. Updated 6 September 2026.

## Start here

1. [Product scope and acceptance criteria](docs/PRODUCT.md)
2. [Architecture and execution model](docs/ARCHITECTURE.md)
3. [Data and integration contracts](docs/CONTRACTS.md)
4. [Login, permissions, and client isolation](docs/IDENTITY.md)
5. [Local operation, server sizing, and costs](docs/OPERATIONS.md)
6. [APIs, credentials, and Figma](docs/INTEGRATIONS.md)
7. [Design system](docs/DESIGN.md)
8. [Implementation plan and handoffs](docs/PLAN.md)
9. [Architecture decisions](docs/DECISIONS.md)
10. [Sources and pricing references](docs/SOURCES.md)

Review changes first in [Review resolution](docs/REVIEW_RESOLUTION.md) and [Changelog](CHANGELOG.md). Detailed specifications: [Database](docs/DATABASE.md), [Runtime and egress](docs/RUNTIME.md), [Customization](docs/CUSTOMIZATION.md), [Creative evaluation](docs/EVALS.md), [Security and retention](docs/SECURITY.md), and [Glossary](docs/GLOSSARY.md). Original reviewer feedback is preserved in [Feedback](Feedback/).

All contributors, including Codex, Claude, and Grok, must read [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md). CodeRabbit review guidance lives in [.coderabbit.yaml](.coderabbit.yaml).

## Current constraints

- Agency-operated first; client self-service later.
- TypeScript modular application and background worker are the proposed baseline; Rust is deferred.
- Develop locally. No hosting, deployment workflows, cloud resources, or paid calls in the initial foundation.
- Strict offline mode uses fixtures. Live provider calls are a separate opt-in mode: local hosting does not make external APIs offline.
- Shared UI uses Space Grotesk with yellow, black, and white. Client creative assets use each client's own brand.
- Thailand supermarket is the first pilot, not a restriction embedded in the domain model.
- Impressions, clicks, and engagement support response learning; they do not establish sales impact.

There are no runnable application commands yet. The foundation workspace supports deterministic checks only.

## Foundation setup (M1)

Requires Node.js 22.12+ and pnpm 9.15.9 (see `.nvmrc` and `packageManager` in `package.json`).

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

Implemented checks: Prettier, ESLint, TypeScript project references, Vitest unit tests, dependency-boundary scan, internal documentation link validation, and secret scanning in CI. PostgreSQL integration tests, production build, and browser isolation tests are planned for later M1 tasks once the database and web app exist.
