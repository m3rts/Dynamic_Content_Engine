# Agency application design system

Confirmed direction: modern interface, Space Grotesk, yellow/black/white. This applies to the agency application. Generated client assets use their own brand configuration.

## Proposed tokens

| Token | Value | Use |
|---|---|---|
| accent | #FFD600 | Primary action background, selection markers, highlights |
| ink | #111111 | Main text, navigation, strong surfaces |
| paper | #FFFFFF | Main work surface |
| canvas | #F5F5F5 | Secondary surfaces |
| border | #D9D9D9 | Quiet structural boundaries |
| muted | #595959 | Secondary text on light backgrounds |

The yellow is provisional until the owner supplies an exact brand value. Use black text on yellow; never white text on yellow. Yellow alone must not carry text, focus or status on white. Pair focus rings with a dark outline and statuses with labels/icons. Error/success semantic colors may supplement the primary palette where needed.

Use Space Grotesk for Latin UI text, self-host licensed font files so runtime works offline. Preserve the font license. Space Grotesk is not the Thai font plan: bundle and validate a Thai-capable fallback such as Noto Sans Thai before Thai UI/creative preview work. Inspect real Thai strings, mixed-script baselines and wrapping; no fake translations.

Body text 16px; regular labels 14px; secondary metadata 12–13px. Line height roughly 1.5. Use a consistent 4px spacing scale, 8px control radius and 12px panels. Prefer crisp borders and restrained shadows over glass effects and decorative gradients. Validate contrast and 200% text zoom.

## Working surface

Desktop: black navigation rail, clear client switcher, white central workspace, yellow primary action. Navigation: Briefs, Concepts, Production, Learning, and Settings. Stage progress and review status remain visible. No marketing hero between the operator and their work.

Concept comparisons show distinct propositions, evidence status, visual direction, model/profile and review actions. Detail views expose sources and lineage. Model settings use clear stage names and compatible model choices, with estimated cost and connection state. “Fixture / sample output” must be unmistakable.

Provide empty/error/loading/success states, keyboard operation, labelled fields, visible focus, reduced-motion support and responsive layouts. Tables can scroll on small screens with accessible headers; actions must not disappear. Aim for WCAG 2.2 AA and verify against current standard during implementation.

Use structured text/layout placeholders for concept direction until real images exist; do not imply generated artwork is available. Never show fabricated performance as live client data. The app should foreground the decision and next action, not technical orchestration details.

Font source: [Space Grotesk repository and license](https://github.com/floriankarsten/space-grotesk).

## Enforced implementation rules (M1 onward)

Components use semantic tokens, not ad-hoc foreground/background combinations. Required design checks reject white-on-yellow/yellow-on-white text and yellow-only focus/status. Test contrast from actual token pairs: normal text ≥4.5:1, large text ≥3:1, relevant controls/focus ≥3:1; validate the chosen accessibility standard with rendered states rather than treating token lint as complete coverage. Automated checks plus keyboard/200%-zoom/browser QA must pass before UI acceptance.

All UI text uses translation keys and locale-aware formatting as defined in CUSTOMIZATION. Self-host Space Grotesk and a licensed Thai-capable fallback with license files; no runtime font CDN. Brand fonts in client Figma output are a separate permission/availability check. Pending exact owner yellow remains #FFD600 and is labelled provisional in the decision register.
