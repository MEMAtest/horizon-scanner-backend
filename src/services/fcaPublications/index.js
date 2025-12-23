/**
 * FCA Publications Module
 *
 * Comprehensive scraping and analysis of FCA enforcement publications
 *
 * @module fcaPublications
 */

const PipelineOrchestrator = require('./pipelineOrchestrator');
const PublicationsDatabase = require('./database');
const SearchScraper = require('./searchScraper');
const PDFDownloader = require('./pdfDownloader');
const PDFParser = require('./pdfParser');
const AIClassifier = require('./aiClassifier');
const ProgressTracker = require('./progressTracker');
const constants = require('./constants');

/**
 * Create and initialize a pipeline instance
 *
 * @param {Object} options - Configuration options
 * @param {string} options.connectionString - Database connection string
 * @returns {Promise<PipelineOrchestrator>} Initialized pipeline
 */
async function createPipeline(options = {}) {
  const pipeline = new PipelineOrchestrator(options);
  await pipeline.initialize();
  return pipeline;
}

/**
 * Quick start function for common operations
 */
const quickStart = {
  /**
   * Run full backfill
   */
  async backfill(options = {}) {
    const pipeline = await createPipeline(options);
    try {
      return await pipeline.runFullBackfill(options);
    } finally {
      await pipeline.close();
    }
  },

  /**
   * Run incremental update
   */
  async update(options = {}) {
    const pipeline = await createPipeline(options);
    try {
      return await pipeline.runIncrementalUpdate(options);
    } finally {
      await pipeline.close();
    }
  },

  /**
   * Get pipeline status
   */
  async status(options = {}) {
    const pipeline = await createPipeline(options);
    try {
      return await pipeline.getStatus();
    } finally {
      await pipeline.close();
    }
  },

  /**
   * Search enforcement notices
   */
  async search(filters, options = {}) {
    const pipeline = await createPipeline(options);
    try {
      return await pipeline.searchNotices(filters);
    } finally {
      await pipeline.close();
    }
  }
};

module.exports = {
  // Main orchestrator
  PipelineOrchestrator,

  // Individual components
  PublicationsDatabase,
  SearchScraper,
  PDFDownloader,
  PDFParser,
  AIClassifier,
  ProgressTracker,

  // Constants and configuration
  constants,
  ...constants,

  // Helper functions
  createPipeline,
  quickStart
};
