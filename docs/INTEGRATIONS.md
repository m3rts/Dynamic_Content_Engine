# APIs and account setup

No keys are needed to review the architecture or build fixture mode. Never paste passwords/API keys into chat, source code or issues. Configure secrets locally when the relevant integration milestone begins.

| Integration | When needed | Credentials/setup |
|---|---|---|
| OpenAI API | Optional live stage provider | API project, billing/limits, server-side key; Responses adapter |
| Anthropic API | Optional live stage provider | API workspace, billing/limits, server-side key; Messages adapter |
| xAI API | Optional live stage provider | API account, billing/limits, server-side key; adapter based on verified current endpoint |
| Figma plugin | Editable asset production | Figma account, development plugin and accessible fonts/components; no model keys in plugin |
| Figma REST | Later metadata/library integration where supported | Scoped OAuth or development token, verified scopes/rate limits; not a generic canvas-write engine |
| Email | Local mail sink first; hosted invitations later | No external credentials locally; SMTP/API credentials and sender domain when hosted |
| Asset storage | Filesystem first | No cloud account initially; scoped S3-compatible credentials later |
| Reporting platforms | CSV first | No ad-platform API required; connectors later need advertiser/account access |
| GitHub and CodeRabbit | Shared source/review | Existing repository/app permissions; keep runtime credentials out of review services |

Chat-product subscriptions and developer-assistant sessions are not automatically usable as metered runtime APIs. Confirm account-level API access and spending limits separately.

## Model adapter boundary

Each adapter advertises supported input modalities, structured output capability, generation options, usage reporting, cancellation/retrieval support, rate limits and errors. Stage profiles select a provider and explicit model identifier; never silently select “latest.” Store profile revisions and resolved model IDs. Revalidate availability and pricing before enabling a profile.

Suggested initial adapter contract: `validateProfile`, `estimateCost`, `generateStructured`, `normalizeUsage`, and optional `retrieveRequest` / `cancelRequest`. Image generation has a separate typed operation; do not pretend every text provider supports it. Each receives immutable scoped context and a timeout, returns schema-validated output with provider request ID, or a normalized error. Unsupported parameters fail before billing. Only the worker can resolve server credentials.

Begin with fixtures and one live text adapter, then add a second provider to prove interchangeability, then xAI/other required providers. This order limits integration debugging without restricting the model registry. Compare models using the same brief and rubric; human preference and campaign evidence are separate evaluations.

## Figma boundary

The intended MVP is a manually invoked plugin importing an approved design bundle in an open file. It creates/updates editable nodes and returns a mapping manifest. Do not promise a server can continuously edit arbitrary canvases through REST. Figma documents that plugins require user initiation and cannot run in the background. [Plugin overview](https://developers.figma.com/docs/plugins/).

A feasibility milestone must validate component access, font availability/loading, Thai text shaping, image import, overflow and repeat-import behavior. Start with manual bundle/result exchange to avoid localhost networking assumptions. Later use narrowly scoped, short-lived pairing credentials if direct transfer is needed; verify allowed origins and plugin network permissions. Review any OAuth scopes at that time.

## Information to gather before live operation

Client brand guide and rights-cleared product assets; representative persona sources; anonymized sample ad report with definitions; Figma template/library access; desired languages and approval roles; monthly model cap; agency owner email; permitted providers and data-sharing boundaries. The current documents use no real client data.
