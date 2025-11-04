# AI Analyzer Refactor (2025-03)

## Scope
- Split the 1.2k-line `src/services/aiAnalyzer.js` into composable modules under `src/services/aiAnalyzer/` covering metadata extraction, Groq client handling, prompt generation, parsing, intelligence enrichment, fallbacks, weekly roundup generation, and health checks.
- The exported service still instantiates a single `EnhancedAIAnalyzer` with the same public methods (`analyzeUpdate`, `generateWeeklyRoundup`, `healthCheck`, etc.), so downstream consumers continue to work unchanged.

## Outcomes
- Clear separation between request plumbing (`client.js`), analysis orchestration (`analysis.js`), enrichment heuristics (`enhancements.js`), and weekly reporting (`weekly.js`), making it easier to add tests or swap providers.
- Centralised constants (Groq models, sector lists, retry defaults) in `constants.js`, removing scattered literals and simplifying configuration tweaks.
- Fallback generation and normalization live in their own modules, reducing the risk of regressions when tweaking heuristics.

## Tests
- `npm test`

## Follow-ups
- Add unit tests around `parseAndValidateAIResponse`, `generateAITags`, and fallback heuristics to lock in the JSON contract.
- Consider moving the unused `authoritySpotlightCache` / `sectorAnalysisCache` logic into feature-specific modules or removing them if no longer required.
