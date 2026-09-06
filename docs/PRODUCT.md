# Product baseline

## Confirmed requirements

The owner operates the system for multiple clients. Client login and generation may follow later. Inputs are business category objectives, broad agency personas, brand guidelines, product facts, and individual-creative reports containing impressions, clicks, and engagement. Core needs are stronger ideas and deciding what to change after launch. Different model providers must be selectable per stage. First pilot: a supermarket chain in Thailand. No real client identity or dataset has been supplied.

## First complete workflow

1. Select a client; save versioned brand guidance, persona sources, category goal, and product facts.
2. Create a brief that separates sourced observations from proposed motivations.
3. Generate structured concept alternatives through a selected model profile.
4. Review, edit, reject, or approve a specific concept revision.
5. Produce an asset specification; assemble editable assets in Figma through a user-run plugin.
6. Register published creative identifiers manually; import creative-level CSV reports.
7. Compute metrics; summarize evidence and confounders; propose the next test.
8. An operator chooses the next experiment and creates a new brief.

## MVP boundaries

Include two-client isolation even when only one real client is used. Include stage-specific model profiles, immutable run provenance, human reviews, structured design exports, report mapping, and auditable learning. Begin with manual context entry and CSV; rich PDF/slide extraction can follow. Upload handling is bounded and uses explicit formats/limits.

Exclude automatic ad publishing, autonomous spend changes, always-on optimization, unattended Figma editing, video production, self-hosted large models, cross-client learning, billing, and client self-registration. Future self-service requires a separate readiness milestone.

## Acceptance criteria

- A supermarket brief and a synthetic non-retail brief complete the same workflow without code changes for industry-specific fields.
- Fixture mode completes brief → concept → approval → design export → report → next-test flow without external network calls after initial installation.
- Changing the provider profile for one stage does not alter downstream schemas; invalid outputs are rejected visibly.
- Users cannot access another client's records, files, job status, search results, or exports without assignment.
- Editing an approved concept creates a new revision requiring review; old assets preserve their original lineage.
- Re-importing an identical report does not double count metrics.
- Figma output uses editable elements and reports missing fonts/components rather than claiming success.
- Findings say what the available data supports, including an insufficient-evidence state; no inference of sales lift from clicks alone.

Report comparisons need platform, placement, audience, dates, objective, paid/organic, click definition, and engagement definition where available. Missing context lowers confidence; raw totals alone do not identify causal creative effects.
