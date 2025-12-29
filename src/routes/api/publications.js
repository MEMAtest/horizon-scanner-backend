/**
 * FCA Publications API Routes
 * Aggregates publications sub-routers.
 */

const express = require('express');
const router = express.Router();

const statusRoutes = require('./publications/status');
const pipelineRoutes = require('./publications/pipeline');
const noticesRoutes = require('./publications/notices');
const insightsRoutes = require('./publications/insights');
const entityRoutes = require('./publications/entity');
const summaryRoutes = require('./publications/summary');
const { setPipeline } = require('./publications/helpers');

router.use(statusRoutes);
router.use(pipelineRoutes);
router.use(noticesRoutes);
router.use(insightsRoutes);
router.use(entityRoutes);
router.use(summaryRoutes);

module.exports = {
  router,
  setPipeline
};
