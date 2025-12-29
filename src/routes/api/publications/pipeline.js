/**
 * Publications API - Pipeline Operations
 * Endpoints for backfill, update, and job control
 */

const express = require('express');
const router = express.Router();
const { getPipeline, requirePipeline } = require('./helpers');

// In-memory job status tracking
const jobStatus = new Map();
const JOB_STATUS_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clean up old job statuses
 */
function cleanupOldJobs() {
  const now = Date.now();
  for (const [jobId, job] of jobStatus.entries()) {
    if (now - job.createdAt > JOB_STATUS_EXPIRY) {
      jobStatus.delete(jobId);
    }
  }
}

/**
 * Create a new job and track its status
 */
function createJob(type, metadata = {}) {
  cleanupOldJobs();
  const jobId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  jobStatus.set(jobId, {
    jobId,
    type,
    status: 'running',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    progress: 0,
    metadata,
    result: null,
    error: null
  });
  return jobId;
}

/**
 * Update job status
 */
function updateJob(jobId, updates) {
  const job = jobStatus.get(jobId);
  if (job) {
    Object.assign(job, updates, { updatedAt: Date.now() });
  }
}

/**
 * GET /api/publications/jobs/:jobId
 * Get job status
 */
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobStatus.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or expired'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/jobs
 * List all recent jobs
 */
router.get('/jobs', async (req, res) => {
  try {
    cleanupOldJobs();
    const jobs = Array.from(jobStatus.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20); // Last 20 jobs

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/publications/backfill
 * Start full backfill (admin only)
 */
router.post('/backfill', requirePipeline, async (req, res) => {
  try {
    const pipeline = getPipeline();
    const { skipStages = [] } = req.body;

    const jobId = createJob('backfill', { skipStages });

    // Start backfill in background
    pipeline.runFullBackfill({ skipStages })
      .then(result => {
        console.log(`✅ Backfill ${jobId} completed:`, result);
        updateJob(jobId, { status: 'completed', result, progress: 100 });
      })
      .catch(error => {
        console.error(`❌ Backfill ${jobId} failed:`, error);
        updateJob(jobId, { status: 'failed', error: error.message });
      });

    res.json({
      success: true,
      message: 'Backfill started',
      jobId,
      statusUrl: `/api/publications/jobs/${jobId}`
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
    const pipeline = getPipeline();
    const { stage } = req.params;
    const validStages = ['index', 'download', 'parse', 'ai'];

    if (!validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stage. Must be one of: ${validStages.join(', ')}`
      });
    }

    const jobId = createJob(`stage-${stage}`, { stage, ...req.body });

    // Start stage in background
    const stageMethod = {
      index: () => pipeline.runIndexStage(req.body),
      download: () => pipeline.runDownloadStage(req.body),
      parse: () => pipeline.runParseStage(req.body),
      ai: () => pipeline.runAIStage(req.body)
    };

    stageMethod[stage]()
      .then(result => {
        console.log(`✅ Stage ${stage} ${jobId} completed:`, result);
        updateJob(jobId, { status: 'completed', result, progress: 100 });
      })
      .catch(error => {
        console.error(`❌ Stage ${stage} ${jobId} failed:`, error);
        updateJob(jobId, { status: 'failed', error: error.message });
      });

    res.json({
      success: true,
      message: `Stage ${stage} started`,
      jobId,
      statusUrl: `/api/publications/jobs/${jobId}`
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
    const pipeline = getPipeline();
    const { maxPages = 10 } = req.body;

    const jobId = createJob('update', { maxPages });

    // Start update in background
    pipeline.runIncrementalUpdate({ maxPages })
      .then(result => {
        console.log(`✅ Incremental update ${jobId} completed:`, result);
        updateJob(jobId, { status: 'completed', result, progress: 100 });
      })
      .catch(error => {
        console.error(`❌ Incremental update ${jobId} failed:`, error);
        updateJob(jobId, { status: 'failed', error: error.message });
      });

    res.json({
      success: true,
      message: 'Incremental update started',
      jobId,
      statusUrl: `/api/publications/jobs/${jobId}`
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error starting update:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/publications/refresh
 * Manual data refresh endpoint (for sidebar button)
 */
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Publications manual refresh triggered');

    const pipeline = getPipeline();
    // If pipeline is available, run incremental update
    if (pipeline) {
      const jobId = createJob('refresh', { maxPages: 5 });

      pipeline.runIncrementalUpdate({ maxPages: 5 })
        .then(result => {
          console.log(`✅ Refresh ${jobId} completed:`, result);
          updateJob(jobId, { status: 'completed', result, progress: 100 });
        })
        .catch(error => {
          console.error(`❌ Refresh ${jobId} failed:`, error);
          updateJob(jobId, { status: 'failed', error: error.message });
        });

      res.json({
        success: true,
        message: 'Data refresh started',
        jobId,
        statusUrl: `/api/publications/jobs/${jobId}`,
        timestamp: new Date().toISOString()
      });
    } else {
      // No pipeline, but still report success (data already exists)
      res.json({
        success: true,
        message: 'Data is current',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('[PublicationsAPI] Refresh error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to refresh data'
    });
  }
});

/**
 * POST /api/publications/pause
 * Pause current job
 */
router.post('/pause', requirePipeline, async (req, res) => {
  try {
    const pipeline = getPipeline();
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
    const pipeline = getPipeline();
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
    const pipeline = getPipeline();
    pipeline.cancel();
    res.json({ success: true, message: 'Cancel requested' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
