# Common Styles Refactor (2025-03)

## Scope
- Replaced the 1.6k-line `src/routes/templates/commonStyles.js` with a modular style system under `src/views/commonStyles/`.
- Split fonts/head links, base layout, sidebar blocks, typography, UI components, responsive rules, enhancements, utilities, and view-specific styles into focused generators.
- New aggregator in `src/routes/templates/commonStyles.js` stitches the sections while preserving the exact CSS output.

## Outcomes
- Each style module now lives under 400 lines, making updates (e.g., sidebar tweaks or timeline styling) far easier.
- Shared helper functions can be imported by future page-specific bundles without touching the main aggregator.
- Maintains original links to `/css/professional-theme.css` and class names, so existing pages continue to render identically.

## Tests
- `npm test`
- `node scripts/run-smart-briefing-smoke.js` *(continues to rely on cached JSON fallback; OpenRouter access still required to restore AI-generated narratives.)*

## Follow-ups
- Consider migrating these style blocks into static CSS assets for HTTP caching once refactors settle.
- Continue decomposing other large files (`src/services/analyticsService.js`, `src/services/webScraperService.js`, etc.) using the same modular approach.
