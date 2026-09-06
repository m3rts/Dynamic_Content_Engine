# Technical references

Checked 6 September 2026. Sources support specific capability/pricing statements; architecture and sizing remain engineering proposals. Re-check versions, model access, plans and prices when implementing or purchasing.

- [Next.js App Router](https://nextjs.org/docs/app): application framework reference.
- [pg-boss](https://github.com/timgit/pg-boss): PostgreSQL-backed Node job processing; application effects still require idempotency.
- [Better Auth introduction](https://better-auth.com/docs/introduction) and [email/password](https://better-auth.com/docs/authentication/email-password): local authentication library reference; security configuration must be verified at implementation.
- [Figma Plugin API overview](https://developers.figma.com/docs/plugins/): editable document access, user initiation, no background plugin operation and font/component constraints.
- [OpenAI API pricing](https://developers.openai.com/api/docs/pricing): current model, tool and image rates; do not hard-code illustrative costs as quotations.
- [Anthropic API pricing](https://platform.claude.com/docs/en/about-claude/pricing): token/cache pricing and other billing considerations.
- [xAI model reference](https://docs.x.ai/developers/models): verify chosen model ID, capability, account access and rate before integration; no xAI numeric quote asserted here.
- [DigitalOcean Droplet pricing](https://www.digitalocean.com/pricing/droplets): $24 and $48 example Basic VM prices used in OPERATIONS; region and plan availability may differ.
- [Space Grotesk](https://github.com/floriankarsten/space-grotesk): font source and license.
- [CodeRabbit path instructions](https://docs.coderabbit.ai/configuration/path-instructions): repository review guidance configuration. GitHub app installation and branch protections remain separate settings.

The GitHub repository was verified empty through authenticated repository metadata before this documentation baseline was authored. No existing code or application behavior was assumed.

## v0.2 verification references

- [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html): ownership/bypass and policy semantics; controls remain to be tested with actual roles.
- [PostgreSQL partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html): partition-key/unique-constraint considerations; operational design is ours.
- [pg-boss documentation](https://pgboss.io/): verify pinned release API/grants; RUNTIME timings are application defaults, not asserted native option names.
- [Better Auth database concepts](https://better-auth.com/docs/concepts/database): identity/account integration reference.
- [Next.js caching](https://nextjs.org/docs/app/guides/caching-without-cache-components): runtime configuration must match the chosen version; no assumption of historical defaults.
- [OWASP prompt injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) and [upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html): threat/control references, not guarantees of elimination.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): contrast, keyboard and other accessibility criteria; conformance requires actual UI verification.

Review source copies are linked and hashed in REVIEW_RESOLUTION. No additional hosting/model-price claims were introduced in v0.2. Thresholds, workload examples and capacity estimates are explicit planning assumptions, to be replaced with implementation measurements.
