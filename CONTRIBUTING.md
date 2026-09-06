# Collaboration and review

## Task workflow

1. Read the architecture and current plan. Claim a bounded task with intended files, acceptance criteria, and dependencies in the team's chosen coordination channel. No issue tracker automation is installed.
2. Start a branch from the current main branch, such as `docs/<topic>`, `feat/<topic>`, or `fix/<topic>`. Parallel contributors use separate clones/worktrees, not the same working files.
3. Keep one task per PR. A change to a shared contract must include its consumers or a backward-compatible transition. One contributor owns each migration sequence and lockfile change at a time.
4. Run the checks relevant to the change. Include evidence and limitations. Never turn on real provider calls in default CI.
5. Address CodeRabbit findings with a fix or a reasoned response. A human owner reviews architectural and access-control decisions and merges.
6. Rebase/update after preceding shared changes land. Document the next task and remaining uncertainty.

## Required PR content

- Problem and resulting behavior.
- Architecture/contract references and any decision change.
- Verification performed, with results.
- Migration, rollback, credential, or running-cost impact when applicable.
- Known limitations and follow-up task.

## Handoff record

Include branch and commit, completed scope, changed contracts/files, checks run, unresolved issues, and the next concrete action. Do not use conversation history as the only specification.

## Planned CI

Once implementation starts: formatting, lint, TypeScript checks, meaningful unit tests, PostgreSQL integration tests, production build, migration validation, and focused browser tests for key flows. Add secret scanning and dependency review. CI uses synthetic two-client fixtures and never production keys or data. CodeRabbit remains separate from required deterministic checks. Configure main-branch protections in GitHub after a default branch exists; they are not configured by these documents.

## v0.2 coordination and gates

PLAN's M1 merge gates are mandatory from the first feature PR. The owner remains the human merge authority; CodeRabbit findings are advisory until reconciled. A new dependency addition needs an explicit human approval entry and purpose/version/license review. Each PR cites AC IDs and review-resolution IDs it satisfies, updates the responsible canonical document, and names a single implementation owner plus reviewer. Claim shared contract/migration/lockfile ownership before editing. Include rollback and no-egress verification where relevant. Architecture-only changes validate links, decision IDs and review coverage; do not fabricate runtime test results.
