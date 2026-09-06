# Client and industry configuration

Design baseline v0.2; implement with M2 contracts, after a minimal M1.5 slice exercises them. No workflow editor or arbitrary user code.

## PipelineDefinitionRevision

A run pins an immutable pipeline revision: ID/version, stage keys, typed input/output schema versions, allowed predecessors, default model-profile references, review requirements and configuration hash. Baseline ships one registered definition. Stages are existing code handlers; configuration cannot introduce executable code, arbitrary URLs or new capabilities. Validate graph acyclicity, schema compatibility, reachable exit, stage count (maximum 20), and required approval barriers. Optional registered stages may be skipped only if no downstream required input or approval is removed. New handler kinds require a code change and review.

`opportunities` is an explicit stage producing audience-tension/product-truth hypotheses with supporting evidence and uncertainty. It does not assert new audience facts. Pipeline changes affect new runs only; active runs retain their revision. Critical policy revocation can halt a pinned run and require migration/reapproval.

## Typed extension packs

An ExtensionPackRevision has stable ID, version, JSON Schema, target entity kinds, localized field labels/help, compatibility range and migration description. Entity revisions store pack ID/version and validated extension_data. Core security, identity, currency, evidence and approval fields cannot be overridden through extensions.

Pilot generic field vocabulary: bounded string, number, boolean, enum, date, money, and lists of bounded simple records. Unknown types/fields, excessive depth (>4), excessive fields (>50 per entity) and invalid schema references are rejected. All schemas are local, allowlisted and disallow remote `$ref` resolution. Generic form renderer supports this vocabulary; complex new interactions require a reviewed code change. Thus ordinary industry fields are configuration-only; the promise is not unlimited arbitrary application customization.

Initial examples: `retail.grocery.v1` (price, validity, store coverage, offer conditions) and `services.subscription.v1` (term, service tier, cancellation conditions). A third synthetic evaluation pack exercises another vertical. Existing entity versions remain readable using their pinned pack; migration creates a new revision with explicit validation and no silent reinterpretation. Pack publication is an owner capability and tested against both old and new fixtures.

## Prompts, rubrics and client overrides

Shared templates/rubrics live as versioned, reviewed files in `config/prompts` and `config/rubrics`. Runtime client overrides are scoped database revisions, not private brand text committed to Git. Precedence: agency defaults → industry pack → client override. A deterministic resolver validates each layer, hashes the resolved template/rubric and records all layer versions. Client overrides affect tone and allowed task settings only; they cannot remove policy, safety/schema validation, spend caps or approval requirements.

Each attempt records pipeline, prompt/rubric, extension and profile revisions plus input hashes and selected source ranges. Store an encrypted/restricted reconstruction bundle containing the exact rendered request (minus credentials) and immutable inputs in client storage. Hashes alone do not reconstruct inputs. Apply the same retention/deletion as source content; a deleted input makes replay unavailable, explicitly. Hidden reasoning traces are never requested/stored.

Policy instructions and typed untrusted excerpts are separate fields/regions. No source document can publish an override, change approved claims or assign permissions. Outputs are proposals until reviewed. Deterministic validation and human review remain necessary even with labelled regions; prompt formatting alone is not a security guarantee.

## Locale and Figma configuration

All UI strings use translation keys from M1, with English base and Thai fixtures; missing translations fall back visibly to English in development and block required locale acceptance in release. Use Intl for numbers, currency and dates. Store UTC, source timezone and client IANA timezone; choose Gregorian calendar explicitly where business reports require it rather than implicitly changing year systems. Test mixed Thai/Latin input, Unicode normalization, search/collation and combining marks; never use byte length as character or layout fit.

Client FigmaLibraryRevision stores file/component keys, slot mappings, font family/style, supported locales/formats and mapping version. Runs/bundles pin it. Agency Space Grotesk and yellow are never inherited into client creative automatically.
