/**
 * FCA Publications API Routes
 *
 * REST API for the publications pipeline
 */

const express = require('express');
const router = express.Router();

// Pipeline instance will be set by the main app
let pipeline = null;

/**
 * Set the pipeline instance
 */
function setPipeline(pipelineInstance) {
  pipeline = pipelineInstance;
}

/**
 * Middleware to ensure pipeline is available
 */
function requirePipeline(req, res, next) {
  if (!pipeline) {
    return res.status(503).json({
      success: false,
      error: 'Publications pipeline not initialized'
    });
  }
  next();
}

// ============================================================
// PIPELINE STATUS & CONTROL
// ============================================================

/**
 * GET /api/publications/status
 * Get pipeline status and statistics
 */
router.get('/status', requirePipeline, async (req, res) => {
  try {
    const status = await pipeline.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/stats
 * Get detailed statistics
 */
router.get('/stats', requirePipeline, async (req, res) => {
  try {
    const stats = await pipeline.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/jobs
 * List pipeline jobs
 */
router.get('/jobs', requirePipeline, async (req, res) => {
  try {
    const { limit = 20, offset = 0, status, type } = req.query;
    const jobs = await pipeline.getJobs({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      jobType: type
    });
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting jobs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// PIPELINE OPERATIONS
// ============================================================

/**
 * POST /api/publications/backfill
 * Start full backfill (admin only)
 */
router.post('/backfill', requirePipeline, async (req, res) => {
  try {
    const { skipStages = [] } = req.body;

    // Start backfill in background
    pipeline.runFullBackfill({ skipStages })
      .then(result => {
        console.log('[PublicationsAPI] Backfill completed:', result);
      })
      .catch(error => {
        console.error('[PublicationsAPI] Backfill failed:', error);
      });

    res.json({
      success: true,
      message: 'Backfill started',
      jobId: pipeline.currentJobId
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error starting backfill:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/publications/backfill/:stage
 * Run specific stage
 */
router.post('/backfill/:stage', requirePipeline, async (req, res) => {
  try {
    const { stage } = req.params;
    const validStages = ['index', 'download', 'parse', 'ai'];

    if (!validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stage. Must be one of: ${validStages.join(', ')}`
      });
    }

    // Start stage in background
    const stageMethod = {
      index: () => pipeline.runIndexStage(req.body),
      download: () => pipeline.runDownloadStage(req.body),
      parse: () => pipeline.runParseStage(req.body),
      ai: () => pipeline.runAIStage(req.body)
    };

    stageMethod[stage]()
      .then(result => {
        console.log(`[PublicationsAPI] Stage ${stage} completed:`, result);
      })
      .catch(error => {
        console.error(`[PublicationsAPI] Stage ${stage} failed:`, error);
      });

    res.json({
      success: true,
      message: `Stage ${stage} started`,
      jobId: pipeline.currentJobId
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error starting stage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/publications/update
 * Run incremental update
 */
router.post('/update', requirePipeline, async (req, res) => {
  try {
    const { maxPages = 10 } = req.body;

    // Start update in background
    pipeline.runIncrementalUpdate({ maxPages })
      .then(result => {
        console.log('[PublicationsAPI] Incremental update completed:', result);
      })
      .catch(error => {
        console.error('[PublicationsAPI] Incremental update failed:', error);
      });

    res.json({
      success: true,
      message: 'Incremental update started',
      jobId: pipeline.currentJobId
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error starting update:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/publications/pause
 * Pause current job
 */
router.post('/pause', requirePipeline, async (req, res) => {
  try {
    pipeline.pause();
    res.json({ success: true, message: 'Pause requested' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/publications/resume
 * Resume paused job
 */
router.post('/resume', requirePipeline, async (req, res) => {
  try {
    pipeline.resume();
    res.json({ success: true, message: 'Resume requested' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/publications/cancel
 * Cancel current job
 */
router.post('/cancel', requirePipeline, async (req, res) => {
  try {
    pipeline.cancel();
    res.json({ success: true, message: 'Cancel requested' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ENFORCEMENT NOTICES
// ============================================================

/**
 * GET /api/publications/notices
 * List enforcement notices with filters
 */
router.get('/notices', requirePipeline, async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      outcome_type,
      breach_type,
      handbook_ref,
      frn,
      min_fine,
      max_fine,
      from_date,
      to_date,
      entity_name
    } = req.query;

    const filters = {};
    if (outcome_type) filters.outcomeType = outcome_type;
    if (breach_type) filters.breachType = breach_type;
    if (handbook_ref) filters.handbookRef = handbook_ref;
    if (frn) filters.frn = frn;
    if (min_fine) filters.minFine = parseFloat(min_fine);
    if (max_fine) filters.maxFine = parseFloat(max_fine);
    if (from_date) filters.fromDate = from_date;
    if (to_date) filters.toDate = to_date;
    if (entity_name) filters.entityName = entity_name;

    const notices = await pipeline.searchNotices(
      filters,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: notices,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: notices.length
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error searching notices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/notices/:id
 * Get single enforcement notice
 */
router.get('/notices/:id', requirePipeline, async (req, res) => {
  try {
    const notice = await pipeline.getNotice(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }

    res.json({ success: true, data: notice });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting notice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/search
 * Full text search
 */
router.get('/search', requirePipeline, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 3 characters'
      });
    }

    const results = await pipeline.searchFullText(q, parseInt(limit));
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('[PublicationsAPI] Error searching:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  router,
  setPipeline
};
