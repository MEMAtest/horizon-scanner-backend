# Predictive Intelligence Service Refactor (2025-03)

## Scope
- Broke the 1.1k-line `src/services/predictiveIntelligenceService.js` into mixins under `src/services/predictiveIntelligence/` covering shared utilities, statistical aggregation, prediction building, and momentum/alert generation.
- The exported service now focuses on caching and orchestration while reusing the existing `getPredictiveDashboard` API.

## Outcomes
- Topic/authority/sector analytics now live in `stats.js`, velocity/confidence logic in `predictions.js`, and momentum/alert generation in `momentum.js`, making the signal model easier to reason about and extend.
- Shared helpers (tokenization, sector detection, stage detection) moved to `utils.js`, eliminating duplicated inline functions and simplifying future test coverage.
- Confidence drivers and priority lanes retain their legacy semantics so downstream UI/tests remain stable.

## Tests
- `npm test`

## Follow-ups
- Add unit tests for `calculateTopicMetrics`, `buildAuthorityPrediction`, and the momentum classifier to guard against regression in the risk-scoring maths.
- Consider wiring unused caches (`authoritySpotlightCache`, `sectorAnalysisCache`) into feature endpoints or removing them if no longer needed.
