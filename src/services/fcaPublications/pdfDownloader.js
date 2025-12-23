/**
 * FCA Publications PDF Downloader
 *
 * Rate-limited PDF download with retry logic and concurrent downloads
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const {
  FCA_BASE_URL,
  RATE_LIMITS,
  STORAGE_PATHS,
  HTTP_CONFIG,
  PROCESSING_STATUS,
  DOCUMENT_TYPES
} = require('./constants');

class PDFDownloader {
  constructor(database, progressTracker, options = {}) {
    this.db = database;
    this.progressTracker = progressTracker;
    this.baseDir = options.baseDir || path.join(process.cwd(), STORAGE_PATHS.pdfBase);

    // Rate limiting state
    this.requestTimes = [];
    this.activeDownloads = 0;
    this.downloadCount = 0;
    this.failedCount = 0;
  }

  /**
   * Initialize storage directories
   */
  async initialize() {
    const dirs = [
      this.baseDir,
      path.join(this.baseDir, 'final-notices'),
      path.join(this.baseDir, 'decision-notices'),
      path.join(this.baseDir, 'warnings'),
      path.join(this.baseDir, 'supervisory-notices'),
      path.join(this.baseDir, 'other'),
      path.join(this.baseDir, 'temp')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    console.log('[PDFDownloader] Storage directories initialized');
  }

  /**
   * Delay helper
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check and wait for rate limit
   */
  async waitForRateLimit() {
    const now = Date.now();
    const hourAgo = now - 3600000;

    // Clean old entries
    this.requestTimes = this.requestTimes.filter(t => t > hourAgo);

    // Check hourly limit
    if (this.requestTimes.length >= RATE_LIMITS.maxPdfDownloadsPerHour) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = oldestRequest + 3600000 - now + 1000;
      console.log(`[PDFDownloader] Hourly limit reached, waiting ${Math.ceil(waitTime / 1000)}s`);
      await this.delay(waitTime);
      this.requestTimes = this.requestTimes.filter(t => t > Date.now() - 3600000);
    }

    // Check concurrent limit
    while (this.activeDownloads >= RATE_LIMITS.maxConcurrentDownloads) {
      await this.delay(100);
    }

    this.requestTimes.push(Date.now());
  }

  /**
   * Get storage path for document type
   */
  getStoragePath(documentType, filename) {
    let subdir = 'other';

    switch (documentType) {
      case 'final_notice':
        subdir = 'final-notices';
        break;
      case 'decision_notice':
        subdir = 'decision-notices';
        break;
      case 'warning_notice':
        subdir = 'warnings';
        break;
      case 'supervisory_notice':
        subdir = 'supervisory-notices';
        break;
    }

    return path.join(this.baseDir, subdir, filename);
  }

  /**
   * Generate safe filename from URL
   */
  generateFilename(url, publicationId) {
    // Extract filename from URL
    const urlParts = url.split('/');
    let filename = urlParts[urlParts.length - 1];

    // Clean filename
    filename = filename
      .replace(/[^a-zA-Z0-9\-_.]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();

    // Ensure .pdf extension
    if (!filename.endsWith('.pdf')) {
      filename += '.pdf';
    }

    // Add publication ID prefix for uniqueness
    const shortId = publicationId.replace('FCA-', '').substring(0, 20);
    return `${shortId}_${filename}`;
  }

  /**
   * Download single PDF
   */
  async downloadPdf(publication) {
    const { publicationId, pdfUrl, documentType } = publication;

    if (!pdfUrl) {
      console.log(`[PDFDownloader] No PDF URL for ${publicationId}`);
      await this.db.updatePublicationStatus(publicationId, PROCESSING_STATUS.SKIPPED, {
        errorMessage: 'No PDF URL available'
      });
      return { success: false, reason: 'no_url' };
    }

    // Ensure full URL
    const fullUrl = pdfUrl.startsWith('http')
      ? pdfUrl
      : `${FCA_BASE_URL}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`;

    // Generate storage path
    const filename = this.generateFilename(fullUrl, publicationId);
    const storagePath = this.getStoragePath(documentType, filename);

    // Check if already downloaded
    try {
      await fs.access(storagePath);
      console.log(`[PDFDownloader] Already downloaded: ${filename}`);
      await this.db.updatePublicationStatus(publicationId, PROCESSING_STATUS.DOWNLOADED, {
        pdfLocalPath: storagePath
      });
      return { success: true, path: storagePath, cached: true };
    } catch {
      // File doesn't exist, proceed with download
    }

    await this.waitForRateLimit();

    this.activeDownloads++;
    await this.db.updatePublicationStatus(publicationId, PROCESSING_STATUS.DOWNLOADING);

    try {
      console.log(`[PDFDownloader] Downloading: ${filename}`);

      const response = await axios.get(fullUrl, {
        headers: {
          ...HTTP_CONFIG.headers,
          'Accept': 'application/pdf,*/*'
        },
        timeout: 60000, // 60 second timeout for large PDFs
        responseType: 'arraybuffer',
        maxRedirects: 5
      });

      // Verify it's a PDF
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      // Write to file
      await fs.writeFile(storagePath, response.data);
      const fileSize = response.data.length;

      // Update database
      await this.db.updatePublicationStatus(publicationId, PROCESSING_STATUS.DOWNLOADED, {
        pdfLocalPath: storagePath,
        pdfSizeBytes: fileSize
      });

      this.downloadCount++;
      console.log(`[PDFDownloader] Downloaded: ${filename} (${Math.round(fileSize / 1024)}KB)`);

      // Rate limit delay
      await this.delay(RATE_LIMITS.pdfDownloadDelay);

      return { success: true, path: storagePath, size: fileSize };

    } catch (error) {
      this.failedCount++;
      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.message;

      console.error(`[PDFDownloader] Failed ${filename}: ${errorMessage}`);

      await this.db.incrementRetryCount(publicationId, errorMessage);

      // Check if max retries exceeded
      if (publication.retry_count >= RATE_LIMITS.maxRetries - 1) {
        await this.db.updatePublicationStatus(publicationId, PROCESSING_STATUS.DOWNLOAD_FAILED);
      }

      return { success: false, error: errorMessage };

    } finally {
      this.activeDownloads--;
    }
  }

  /**
   * Download batch of PDFs with concurrency control
   */
  async downloadBatch(publications, options = {}) {
    const { onProgress = null, jobId = null } = options;

    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      cached: 0
    };

    // Process with limited concurrency
    const queue = [...publications];
    const inProgress = new Set();

    while (queue.length > 0 || inProgress.size > 0) {
      // Start new downloads up to concurrency limit
      while (queue.length > 0 && inProgress.size < RATE_LIMITS.maxConcurrentDownloads) {
        const publication = queue.shift();
        const promise = this.downloadPdf(publication)
          .then(result => {
            if (result.success) {
              if (result.cached) {
                results.cached++;
              } else {
                results.successful++;
              }
            } else if (result.reason === 'no_url') {
              results.skipped++;
            } else {
              results.failed++;
            }
            return result;
          })
          .finally(() => {
            inProgress.delete(promise);
          });

        inProgress.add(promise);
      }

      // Wait for at least one to complete
      if (inProgress.size > 0) {
        await Promise.race(inProgress);
      }

      // Progress callback
      if (onProgress) {
        const processed = results.successful + results.failed + results.skipped + results.cached;
        onProgress({
          processed,
          total: publications.length,
          ...results
        });
      }

      // Update progress tracker
      if (this.progressTracker && jobId) {
        const processed = results.successful + results.failed + results.skipped + results.cached;
        await this.progressTracker.updateProgress(jobId, {
          processedItems: processed,
          failedItems: results.failed
        });
      }
    }

    return results;
  }

  /**
   * Download all pending publications
   */
  async downloadAllPending(options = {}) {
    const {
      batchSize = 50,
      onBatchComplete = null,
      jobId = null
    } = options;

    let totalResults = {
      successful: 0,
      failed: 0,
      skipped: 0,
      cached: 0
    };

    let batch;
    let batchNumber = 0;

    while (true) {
      batch = await this.db.getPendingDownloads(batchSize);

      if (batch.length === 0) {
        console.log('[PDFDownloader] No more pending downloads');
        break;
      }

      batchNumber++;
      console.log(`[PDFDownloader] Processing batch ${batchNumber} (${batch.length} items)`);

      const batchResults = await this.downloadBatch(batch, { jobId });

      // Aggregate results
      totalResults.successful += batchResults.successful;
      totalResults.failed += batchResults.failed;
      totalResults.skipped += batchResults.skipped;
      totalResults.cached += batchResults.cached;

      if (onBatchComplete) {
        onBatchComplete({
          batchNumber,
          batchResults,
          totalResults
        });
      }
    }

    console.log(`[PDFDownloader] Download complete:`, totalResults);
    return totalResults;
  }

  /**
   * Retry failed downloads
   */
  async retryFailed(maxRetries = 3) {
    const query = `
      SELECT * FROM fca_publications_index
      WHERE status = $1
        AND retry_count < $2
        AND pdf_url IS NOT NULL
      ORDER BY retry_count ASC, scraped_at DESC
      LIMIT 100
    `;

    const failed = await this.db.pool.query(query, [
      PROCESSING_STATUS.DOWNLOAD_FAILED,
      maxRetries
    ]);

    if (failed.rows.length === 0) {
      console.log('[PDFDownloader] No failed downloads to retry');
      return { retried: 0 };
    }

    console.log(`[PDFDownloader] Retrying ${failed.rows.length} failed downloads`);

    // Reset status to pending for retry
    for (const row of failed.rows) {
      await this.db.updatePublicationStatus(row.publication_id, PROCESSING_STATUS.PENDING);
    }

    const results = await this.downloadBatch(failed.rows);
    return { retried: failed.rows.length, results };
  }

  /**
   * Get downloader statistics
   */
  getStats() {
    return {
      downloadCount: this.downloadCount,
      failedCount: this.failedCount,
      activeDownloads: this.activeDownloads,
      requestsLastHour: this.requestTimes.length
    };
  }
}

module.exports = PDFDownloader;
