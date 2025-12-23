/**
 * FCA Publications Pipeline Orchestrator
 *
 * Coordinates all stages of the scraping pipeline
 */

const PublicationsDatabase = require('./database');
const SearchScraper = require('./searchScraper');
const PDFDownloader = require('./pdfDownloader');
const PDFParser = require('./pdfParser');
const AIClassifier = require('./aiClassifier');
const ProgressTracker = require('./progressTracker');
const { JOB_TYPES, JOB_STATUS } = require('./constants');

class PipelineOrchestrator {
  constructor(options = {}) {
    this.connectionString = options.connectionString || process.env.DATABASE_URL;
    this.initialized = false;

    // Components (initialized lazily)
    this.db = null;
    this.progressTracker = null;
    this.searchScraper = null;
    this.pdfDownloader = null;
    this.pdfParser = null;
    this.aiClassifier = null;

    // State
    this.currentJobId = null;
    this.isPaused = false;
    this.isCancelled = false;
  }

  /**
   * Initialize all components
   */
  async initialize() {
    if (this.initialized) return;

    console.log('[Pipeline] Initializing...');

    // Initialize database
    this.db = new PublicationsDatabase(this.connectionString);
    await this.db.initialize();

    // Initialize progress tracker
    this.progressTracker = new ProgressTracker(this.db);

    // Initialize stage components
    this.searchScraper = new SearchScraper(this.db, this.progressTracker);
    this.pdfDownloader = new PDFDownloader(this.db, this.progressTracker);
    this.pdfParser = new PDFParser(this.db, this.progressTracker);
    this.aiClassifier = new AIClassifier(this.db, this.progressTracker);

    // Initialize storage directories
    await this.pdfDownloader.initialize();

    this.initialized = true;
    console.log('[Pipeline] Initialization complete');
  }

  /**
   * Ensure initialization
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Run Stage 1: Index all publications from search
   */
  async runIndexStage(options = {}) {
    await this.ensureInitialized();

    const { resume = true, maxPages = null, onProgress = null } = options;

    // Check for existing running job
    let job;
    let startPage = 1;

    if (resume) {
      const checkpoint = await this.progressTracker.getCheckpoint(JOB_TYPES.INDEX_SCRAPE);
      if (checkpoint.canResume) {
        console.log(`[Pipeline] Resuming index scrape from page ${checkpoint.lastPage}`);
        job = await this.progressTracker.getJob(checkpoint.jobId);
        startPage = (checkpoint.lastStartParam || 1) + 10;
        this.currentJobId = checkpoint.jobId;
      }
    }

    if (!job) {
      job = await this.progressTracker.createJob(JOB_TYPES.INDEX_SCRAPE);
      this.currentJobId = job.job_id;
    }

    try {
      const result = await this.searchScraper.scrapeAllPages({
        startPage,
        maxPages,
        jobId: this.currentJobId,
        onPageComplete: async (progress) => {
          if (this.isPaused || this.isCancelled) {
            throw new Error(this.isCancelled ? 'Job cancelled' : 'Job paused');
          }
          if (onProgress) onProgress({ stage: 'index', ...progress });
        }
      });

      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.COMPLETED);
      return result;

    } catch (error) {
      if (error.message === 'Job paused') {
        await this.progressTracker.pauseJob(this.currentJobId);
        throw error;
      } else if (error.message === 'Job cancelled') {
        await this.progressTracker.cancelJob(this.currentJobId);
        throw error;
      }

      await this.progressTracker.logError(this.currentJobId, error);
      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.FAILED);
      throw error;
    }
  }

  /**
   * Run Stage 2: Download all PDFs
   */
  async runDownloadStage(options = {}) {
    await this.ensureInitialized();

    const { batchSize = 50, onProgress = null } = options;

    const job = await this.progressTracker.createJob(JOB_TYPES.PDF_DOWNLOAD);
    this.currentJobId = job.job_id;

    try {
      const result = await this.pdfDownloader.downloadAllPending({
        batchSize,
        jobId: this.currentJobId,
        onBatchComplete: (progress) => {
          if (this.isPaused || this.isCancelled) {
            throw new Error(this.isCancelled ? 'Job cancelled' : 'Job paused');
          }
          if (onProgress) onProgress({ stage: 'download', ...progress });
        }
      });

      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.COMPLETED);
      return result;

    } catch (error) {
      if (error.message === 'Job paused' || error.message === 'Job cancelled') {
        throw error;
      }
      await this.progressTracker.logError(this.currentJobId, error);
      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.FAILED);
      throw error;
    }
  }

  /**
   * Run Stage 3: Parse all PDFs
   */
  async runParseStage(options = {}) {
    await this.ensureInitialized();

    const { batchSize = 50, onProgress = null } = options;

    const job = await this.progressTracker.createJob(JOB_TYPES.PDF_PARSE);
    this.currentJobId = job.job_id;

    try {
      const result = await this.pdfParser.processAllPending({
        batchSize,
        jobId: this.currentJobId,
        onBatchComplete: (progress) => {
          if (this.isPaused || this.isCancelled) {
            throw new Error(this.isCancelled ? 'Job cancelled' : 'Job paused');
          }
          if (onProgress) onProgress({ stage: 'parse', ...progress });
        }
      });

      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.COMPLETED);
      return result;

    } catch (error) {
      if (error.message === 'Job paused' || error.message === 'Job cancelled') {
        throw error;
      }
      await this.progressTracker.logError(this.currentJobId, error);
      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.FAILED);
      throw error;
    }
  }

  /**
   * Run Stage 4: AI classification
   */
  async runAIStage(options = {}) {
    await this.ensureInitialized();

    const { batchSize = 25, onProgress = null } = options;

    const job = await this.progressTracker.createJob(JOB_TYPES.AI_PROCESS);
    this.currentJobId = job.job_id;

    try {
      const result = await this.aiClassifier.processAllPending({
        batchSize,
        jobId: this.currentJobId,
        onBatchComplete: (progress) => {
          if (this.isPaused || this.isCancelled) {
            throw new Error(this.isCancelled ? 'Job cancelled' : 'Job paused');
          }
          if (onProgress) onProgress({ stage: 'ai', ...progress });
        }
      });

      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.COMPLETED);
      return result;

    } catch (error) {
      if (error.message === 'Job paused' || error.message === 'Job cancelled') {
        throw error;
      }
      await this.progressTracker.logError(this.currentJobId, error);
      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.FAILED);
      throw error;
    }
  }

  /**
   * Run full backfill pipeline
   */
  async runFullBackfill(options = {}) {
    await this.ensureInitialized();

    const { onProgress = null, skipStages = [] } = options;

    console.log('[Pipeline] Starting full backfill...');

    const job = await this.progressTracker.createJob(JOB_TYPES.FULL_BACKFILL);
    this.currentJobId = job.job_id;

    const results = {
      index: null,
      download: null,
      parse: null,
      ai: null
    };

    try {
      // Stage 1: Index
      if (!skipStages.includes('index')) {
        console.log('[Pipeline] Stage 1: Indexing publications...');
        results.index = await this.runIndexStage({
          onProgress: (p) => onProgress?.({ ...p, overallStage: 1, totalStages: 4 })
        });
      }

      // Stage 2: Download
      if (!skipStages.includes('download')) {
        console.log('[Pipeline] Stage 2: Downloading PDFs...');
        results.download = await this.runDownloadStage({
          onProgress: (p) => onProgress?.({ ...p, overallStage: 2, totalStages: 4 })
        });
      }

      // Stage 3: Parse
      if (!skipStages.includes('parse')) {
        console.log('[Pipeline] Stage 3: Parsing PDFs...');
        results.parse = await this.runParseStage({
          onProgress: (p) => onProgress?.({ ...p, overallStage: 3, totalStages: 4 })
        });
      }

      // Stage 4: AI Classification
      if (!skipStages.includes('ai')) {
        console.log('[Pipeline] Stage 4: AI Classification...');
        results.ai = await this.runAIStage({
          onProgress: (p) => onProgress?.({ ...p, overallStage: 4, totalStages: 4 })
        });
      }

      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.COMPLETED);
      console.log('[Pipeline] Full backfill complete!');

      return results;

    } catch (error) {
      console.error('[Pipeline] Backfill failed:', error.message);
      await this.progressTracker.logError(this.currentJobId, error);
      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.FAILED);
      throw error;
    }
  }

  /**
   * Run incremental update (daily)
   */
  async runIncrementalUpdate(options = {}) {
    await this.ensureInitialized();

    const { maxPages = 10, onProgress = null } = options;

    console.log('[Pipeline] Starting incremental update...');

    const job = await this.progressTracker.createJob(JOB_TYPES.INCREMENTAL_UPDATE);
    this.currentJobId = job.job_id;

    try {
      // Scrape recent publications
      const indexResult = await this.searchScraper.scrapeRecent({ maxPages });

      if (indexResult.totalNew > 0) {
        // Download new PDFs
        await this.pdfDownloader.downloadAllPending({ batchSize: indexResult.totalNew });

        // Parse new PDFs
        await this.pdfParser.processAllPending({ batchSize: indexResult.totalNew });

        // AI classify new documents
        await this.aiClassifier.processAllPending({ batchSize: indexResult.totalNew });
      }

      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.COMPLETED);
      console.log(`[Pipeline] Incremental update complete: ${indexResult.totalNew} new publications`);

      return indexResult;

    } catch (error) {
      await this.progressTracker.logError(this.currentJobId, error);
      await this.progressTracker.completeJob(this.currentJobId, JOB_STATUS.FAILED);
      throw error;
    }
  }

  /**
   * Pause current job
   */
  pause() {
    this.isPaused = true;
    console.log('[Pipeline] Pause requested');
  }

  /**
   * Resume paused job
   */
  resume() {
    this.isPaused = false;
    console.log('[Pipeline] Resume requested');
  }

  /**
   * Cancel current job
   */
  cancel() {
    this.isCancelled = true;
    console.log('[Pipeline] Cancel requested');
  }

  /**
   * Get pipeline status
   */
  async getStatus() {
    await this.ensureInitialized();

    const [pipelineStats, statusCounts, progressSummary] = await Promise.all([
      this.db.getPipelineStats(),
      this.db.getStatusCounts(),
      this.progressTracker.getProgressSummary()
    ]);

    // Get current job if running
    let currentJob = null;
    if (this.currentJobId) {
      currentJob = await this.progressTracker.getJob(this.currentJobId);
      if (currentJob?.status === JOB_STATUS.RUNNING) {
        currentJob.estimate = await this.progressTracker.estimateCompletion(this.currentJobId);
      }
    }

    return {
      pipeline: pipelineStats,
      statusCounts,
      jobs: progressSummary,
      currentJob,
      components: {
        searchScraper: this.searchScraper?.getStats(),
        pdfDownloader: this.pdfDownloader?.getStats(),
        pdfParser: this.pdfParser?.getStats(),
        aiClassifier: this.aiClassifier?.getStats()
      }
    };
  }

  /**
   * Get recent jobs
   */
  async getJobs(options = {}) {
    await this.ensureInitialized();
    return this.progressTracker.getJobs(options);
  }

  /**
   * Search enforcement notices
   */
  async searchNotices(filters, limit = 50, offset = 0) {
    await this.ensureInitialized();
    return this.db.searchEnforcementNotices(filters, limit, offset);
  }

  /**
   * Get single notice
   */
  async getNotice(publicationId) {
    await this.ensureInitialized();
    return this.db.getEnforcementNotice(publicationId);
  }

  /**
   * Full text search
   */
  async searchFullText(query, limit = 20) {
    await this.ensureInitialized();
    return this.db.searchFullText(query, limit);
  }

  /**
   * Get statistics
   */
  async getStats() {
    await this.ensureInitialized();

    const [pipeline, breaches, yearly] = await Promise.all([
      this.db.getPipelineStats(),
      this.db.getBreachStats(),
      this.db.getYearlyStats()
    ]);

    return { pipeline, breaches, yearly };
  }

  /**
   * Close connections
   */
  async close() {
    if (this.db) {
      await this.db.close();
    }
    this.initialized = false;
    console.log('[Pipeline] Connections closed');
  }
}

module.exports = PipelineOrchestrator;
