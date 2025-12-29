const express = require('express');
const router = express.Router();
const { allowFallback } = require('../helpers');
const handlers = require('./handlers');

router.get('/insights/outcome-analysis', allowFallback, handlers.getOutcomeAnalysis);
router.get('/insights/outcome-breaches/:outcomeType', allowFallback, handlers.getOutcomeBreaches);
router.get('/insights/case-studies', allowFallback, handlers.getCaseStudies);
router.get('/insights/case-studies/:publicationId/similar', allowFallback, handlers.getCaseStudySimilar);
router.get('/insights/risk-indicators', allowFallback, handlers.getRiskIndicators);
router.get('/insights/top-fines', allowFallback, handlers.getTopFines);
router.get('/insights/breach-analysis/:type', allowFallback, handlers.getBreachAnalysis);
router.get('/insights/breach-summary', allowFallback, handlers.getBreachSummary);
router.get('/insights/handbook-stats', allowFallback, handlers.getHandbookStats);
router.get('/insights/rule-citations', allowFallback, handlers.getRuleCitations);
router.get('/handbook/:reference', allowFallback, handlers.getHandbookRule);
router.post('/handbook/batch', allowFallback, handlers.getHandbookBatch);
router.get('/insights/common-findings', allowFallback, handlers.getCommonFindings);
router.get('/insights/fine-modifiers', allowFallback, handlers.getFineModifiers);
router.get('/insights/timeline', allowFallback, handlers.getTimeline);
router.get('/insights/yearly-breakdown', allowFallback, handlers.getYearlyBreakdown);
router.get('/insights/year/:year/detailed', allowFallback, handlers.getYearDetails);
router.get('/insights/reoffenders', allowFallback, handlers.getReoffenders);
router.get('/insights/themes', allowFallback, handlers.getThemes);

module.exports = router;
