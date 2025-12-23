/**
 * FCA Publications Progress Tracker
 *
 * Handles checkpoint/resume functionality for long-running jobs
 */

const { JOB_STATUS, JOB_TYPES } = require('./constants');

class ProgressTracker {
  constructor(database) {
    this.db = database;
  }

  /**
   * Generate unique job ID
   */
  generateJobId(jobType) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${jobType}-${timestamp}-${random}`;
  }

  /**
   * Create a new job
   */
  async createJob(jobType, totalItems = 0) {
    const jobId = this.generateJobId(jobType);

    const query = `
      INSERT INTO fca_scraping_progress (
        job_id, job_type, total_items, status
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.db.pool.query(query, [
      jobId,
      jobType,
      totalItems,
      JOB_STATUS.RUNNING
    ]);

    console.log(`[ProgressTracker] Created job ${jobId} (${jobType})`);
    return result.rows[0];
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId, updates) {
    const setFields = [];
    const values = [jobId];
    let paramIndex = 2;

    const fieldMappings = {
      processedItems: 'processed_items',
      failedItems: 'failed_items',
      skippedItems: 'skipped_items',
      lastProcessedId: 'last_processed_id',
      lastPageScraped: 'last_page_scraped',
      lastStartParam: 'last_start_param',
      totalItems: 'total_items',
      status: 'status',
      lastError: 'last_error'
    };

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMappings[key];
      if (dbField && value !== undefined) {
        setFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.lastError) {
      setFields.push('last_error_at = CURRENT_TIMESTAMP');
    }

    if (setFields.length === 0) return;

    // Calculate items per minute
    if (updates.processedItems) {
      setFields.push(`items_per_minute = (
        SELECT
          CASE
            WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) > 60
            THEN $${paramIndex}::numeric / (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) / 60)
            ELSE $${paramIndex}::numeric
          END
        FROM fca_scraping_progress WHERE job_id = $1
      )`);
      values.push(updates.processedItems);
      paramIndex++;
    }

    const query = `
      UPDATE fca_scraping_progress
      SET ${setFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = $1
    `;

    await this.db.pool.query(query, values);
  }

  /**
   * Log an error for a job
   */
  async logError(jobId, error, itemId = null) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || error,
      itemId,
      stack: error.stack
    };

    const query = `
      UPDATE fca_scraping_progress
      SET error_log = error_log || $2::jsonb,
          last_error = $3,
          last_error_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE job_id = $1
    `;

    await this.db.pool.query(query, [
      jobId,
      JSON.stringify([errorEntry]),
      errorEntry.message
    ]);
  }

  /**
   * Complete a job
   */
  async completeJob(jobId, status = JOB_STATUS.COMPLETED) {
    const query = `
      UPDATE fca_scraping_progress
      SET status = $2,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE job_id = $1
      RETURNING *
    `;

    const result = await this.db.pool.query(query, [jobId, status]);
    console.log(`[ProgressTracker] Job ${jobId} completed with status: ${status}`);
    return result.rows[0];
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    const query = 'SELECT * FROM fca_scraping_progress WHERE job_id = $1';
    const result = await this.db.pool.query(query, [jobId]);
    return result.rows[0];
  }

  /**
   * Get latest job by type
   */
  async getLatestJob(jobType) {
    const query = `
      SELECT * FROM fca_scraping_progress
      WHERE job_type = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await this.db.pool.query(query, [jobType]);
    return result.rows[0];
  }

  /**
   * Get running job by type (for resume)
   */
  async getRunningJob(jobType) {
    const query = `
      SELECT * FROM fca_scraping_progress
      WHERE job_type = $1 AND status = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await this.db.pool.query(query, [jobType, JOB_STATUS.RUNNING]);
    return result.rows[0];
  }

  /**
   * Get checkpoint for resuming
   */
  async getCheckpoint(jobType) {
    const runningJob = await this.getRunningJob(jobType);

    if (runningJob) {
      return {
        jobId: runningJob.job_id,
        resumeFrom: runningJob.last_processed_id,
        lastPage: runningJob.last_page_scraped,
        lastStartParam: runningJob.last_start_param,
        processedItems: runningJob.processed_items,
        canResume: true
      };
    }

    return { canResume: false };
  }

  /**
   * Get all jobs with pagination
   */
  async getJobs(options = {}) {
    const { limit = 20, offset = 0, status = null, jobType = null } = options;

    let query = 'SELECT * FROM fca_scraping_progress WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (jobType) {
      query += ` AND job_type = $${paramIndex}`;
      values.push(jobType);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await this.db.pool.query(query, values);
    return result.rows;
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId) {
    return this.completeJob(jobId, JOB_STATUS.CANCELLED);
  }

  /**
   * Pause a running job
   */
  async pauseJob(jobId) {
    const query = `
      UPDATE fca_scraping_progress
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = $1 AND status = $3
      RETURNING *
    `;

    const result = await this.db.pool.query(query, [
      jobId,
      JOB_STATUS.PAUSED,
      JOB_STATUS.RUNNING
    ]);

    if (result.rows.length === 0) {
      throw new Error('Job not found or not running');
    }

    console.log(`[ProgressTracker] Job ${jobId} paused`);
    return result.rows[0];
  }

  /**
   * Resume a paused job
   */
  async resumeJob(jobId) {
    const query = `
      UPDATE fca_scraping_progress
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = $1 AND status = $3
      RETURNING *
    `;

    const result = await this.db.pool.query(query, [
      jobId,
      JOB_STATUS.RUNNING,
      JOB_STATUS.PAUSED
    ]);

    if (result.rows.length === 0) {
      throw new Error('Job not found or not paused');
    }

    console.log(`[ProgressTracker] Job ${jobId} resumed`);
    return result.rows[0];
  }

  /**
   * Get overall progress summary
   */
  async getProgressSummary() {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM fca_scraping_progress WHERE status = 'running') as running_jobs,
        (SELECT COUNT(*) FROM fca_scraping_progress WHERE status = 'completed') as completed_jobs,
        (SELECT COUNT(*) FROM fca_scraping_progress WHERE status = 'failed') as failed_jobs,
        (SELECT SUM(processed_items) FROM fca_scraping_progress WHERE status = 'completed') as total_processed,
        (SELECT MAX(completed_at) FROM fca_scraping_progress WHERE status = 'completed') as last_completion
    `;

    const result = await this.db.pool.query(query);
    return result.rows[0];
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(daysToKeep = 30) {
    const query = `
      DELETE FROM fca_scraping_progress
      WHERE status IN ($1, $2, $3)
        AND completed_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * $4
      RETURNING job_id
    `;

    const result = await this.db.pool.query(query, [
      JOB_STATUS.COMPLETED,
      JOB_STATUS.FAILED,
      JOB_STATUS.CANCELLED,
      daysToKeep
    ]);

    console.log(`[ProgressTracker] Cleaned up ${result.rows.length} old jobs`);
    return result.rows.length;
  }

  /**
   * Estimate completion time
   */
  async estimateCompletion(jobId) {
    const job = await this.getJob(jobId);

    if (!job || !job.items_per_minute || job.items_per_minute <= 0) {
      return null;
    }

    const remaining = job.total_items - job.processed_items;
    const minutesRemaining = remaining / job.items_per_minute;
    const estimatedCompletion = new Date(Date.now() + minutesRemaining * 60 * 1000);

    return {
      remainingItems: remaining,
      minutesRemaining: Math.ceil(minutesRemaining),
      estimatedCompletion,
      itemsPerMinute: job.items_per_minute
    };
  }
}

module.exports = ProgressTracker;
