# Evaluation and creative quality

Owner: integration lead; reviewer: Tech VP role; product judgments: agency owner. All evaluation code/results are pending. Build deterministic gates with M2 and live comparison with M3. Evals assess quality and regressions, not causal sales performance.

## Golden corpus

Start with 24 synthetic briefs: 8 grocery retail, 8 subscription services, 8 home products; include Thai and mixed-language copy, conflicting facts, sparse personas and expired prices. Separate tuning cases from a held-out set (18 development, 6 held out), plus adversarial cases. Expected properties replace exact expected creative prose. Never copy real client material into fixtures or PRs. Record corpus/version/licensing and evaluation configuration.

## Deterministic gates

Every PR affecting prompts, schemas, profiles, templates or adapters runs fixture contract tests in `packages/evals`: required fields and valid schema, evidence references in the same client/revision, approved-claim IDs and exact controlled slots, format constraints, Unicode handling, known duplicate outputs, policy preservation, malformed output, safe render, scope denial and budget behavior. Required security/schema gates must all pass. Copy character limits are only preflight; actual font/dimension overflow is verified in layout/Figma tests. Semantic distinctiveness, truthfulness and script/language quality cannot be guaranteed by regex, token counts or fixture success.

Fixtures prove system plumbing and deterministic validators, not how a new live model/prompt will behave. A prompt/model release therefore needs a budgeted live eval or an explicit recorded owner waiver that leaves the change experimental and out of production defaults. No automatic paid evaluation in normal CI.

## Rubric and human anchor

Score 1–5 with anchored definitions for audience relevance, evidence grounding, product connection, brand adherence, clarity, distinctiveness and usable execution. Score 1 = fails the criterion, 3 = usable with material edits, 5 = usable with minor/no edits; each dimension also has examples in its versioned rubric. Critical false claims/brand violations are fail flags, not averaged away.

Optional reviewer model can use a different provider only when that client's policy permits it; otherwise use an allowed reviewer or humans. Counterbalance presentation order and hide generator identity. Reviewer-model output is a signal, not approval. Agency operator blind-compares baseline and candidate; this measures informed preference, not objective audience truth. Record disagreements and calibrate automated scores against human judgments.

## Release comparison

Record generator/profile/model resolution, provider request IDs, prompt/rubric/corpus versions, sampling settings, timestamp, per-stage cost/latency, validity, refusal/failure rate, repair count, duplication flags and human ratings. Use matched briefs and more than one sample (initially 3 per brief when budget permits); disclose variance and sample size. No claim of statistical superiority from a small benchmark.

Initial gate: no critical policy violations, all deterministic checks pass, no unexplained drop in valid/usable outputs, and owner review of held-out comparisons. Freeze numeric creative-quality thresholds only after baseline data exists. A live eval run requires previewed maximum cost, explicit dispatch, test-client scope, egress policy and normal reservation controls. Default live drift check is manually initiated before a model/profile becomes the default and after provider changes; no scheduled paid job is enabled now.

## Failures and rollback

Failed critical checks block promotion. Keep prior prompt/profile revisions and an active-default pointer; rollback changes the pointer for new runs, preserves old lineage, and flags affected pending artifacts for review. Provider drift behind a fixed ID is still possible: retain outputs/time/model metadata, investigate user reports and compare against the held-out baseline. If no safe baseline model remains available, pause generation rather than silently switch.

## Acceptance evidence

M2: corpus manifest, deterministic report, adversarial failures handled, no-egress proof. M3: same corpus across two allowed providers, cost reconciliation, blind sample review, documented model choice and rollback demonstration. M6: operator tracks concept acceptance, edit effort, time to approved concept and campaign-learning usefulness; engagement results remain separate from offline creative scores.
