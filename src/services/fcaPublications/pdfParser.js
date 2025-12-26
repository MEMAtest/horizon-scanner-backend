/**
 * FCA Publications PDF Parser
 *
 * Extracts text from PDFs using pdf-parse
 * Falls back to basic patterns for initial data extraction
 */

const fs = require('fs').promises;
const path = require('path');
const {
  EXTRACTION_PATTERNS,
  HANDBOOK_PATTERNS,
  PROCESSING_STATUS
} = require('./constants');

// pdf-parse exports PDFParse class
let PDFParseClass;
try {
  const pdfModule = require('pdf-parse');
  PDFParseClass = pdfModule.PDFParse;
  if (!PDFParseClass) {
    console.warn('[PDFParser] pdf-parse PDFParse class not found');
  }
} catch (err) {
  console.warn('[PDFParser] pdf-parse not installed. Run: npm install pdf-parse', err.message);
}

class PDFParser {
  constructor(database, progressTracker) {
    this.db = database;
    this.progressTracker = progressTracker;
    this.parseCount = 0;
    this.failedCount = 0;
  }

  /**
   * Parse a single PDF file
   */
  async parsePdf(filePath) {
    if (!PDFParseClass) {
      throw new Error('pdf-parse library not available');
    }

    try {
      const dataBuffer = await fs.readFile(filePath);

      // PDFParse is a class that takes options with data and verbosity
      const parser = new PDFParseClass({
        data: dataBuffer,
        verbosity: 0 // Suppress warnings
      });

      // getText() returns an object with { text, pages, total }
      const result = await parser.getText();

      return {
        success: true,
        text: result.text,
        pageCount: result.total,
        info: {},
        method: 'pdf-parse'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        method: 'pdf-parse'
      };
    }
  }

  /**
   * Extract basic fields from text using regex patterns
   */
  extractBasicFields(text) {
    const extracted = {
      frn: null,
      fineAmounts: [],
      dates: [],
      entityNames: [],
      handbookReferences: [],
      hasDiscount: false,
      discountPercentage: null
    };

    if (!text) return extracted;

    // Extract FRN
    const frnMatch = text.match(EXTRACTION_PATTERNS.frn);
    if (frnMatch) {
      extracted.frn = frnMatch[1];
    } else {
      const frnAltMatch = text.match(EXTRACTION_PATTERNS.frnAlt);
      if (frnAltMatch) {
        extracted.frn = frnAltMatch[1];
      }
    }

    // Extract fine amounts
    const amountMatches = text.match(EXTRACTION_PATTERNS.fineAmount) || [];
    extracted.fineAmounts = amountMatches.map(match => this.parseCurrency(match));

    // Extract dates
    const dateMatches1 = text.match(EXTRACTION_PATTERNS.dateFormat1) || [];
    const dateMatches2 = text.match(EXTRACTION_PATTERNS.dateFormat2) || [];
    extracted.dates = [...dateMatches1, ...dateMatches2]
      .map(d => this.parseDate(d))
      .filter(d => d !== null);

    // Extract entity names
    const entityMatch = text.match(EXTRACTION_PATTERNS.entityName);
    if (entityMatch) {
      extracted.entityNames.push(entityMatch[1].trim());
    }

    // Individual names
    const individualMatches = text.match(EXTRACTION_PATTERNS.individualName) || [];
    extracted.entityNames.push(...individualMatches.map(m => m.trim()));

    // Extract handbook references
    for (const { pattern } of HANDBOOK_PATTERNS) {
      const matches = text.match(pattern) || [];
      extracted.handbookReferences.push(...matches.map(m => m.toUpperCase().replace(/\s+/g, ' ')));
    }
    extracted.handbookReferences = [...new Set(extracted.handbookReferences)];

    // Check for discount
    const discountMatch = text.match(EXTRACTION_PATTERNS.discountPercent);
    if (discountMatch) {
      extracted.hasDiscount = true;
      extracted.discountPercentage = parseInt(discountMatch[1], 10);
    }

    // Early settlement check
    if (EXTRACTION_PATTERNS.earlySettlement.test(text)) {
      extracted.hasDiscount = true;
    }

    return extracted;
  }

  /**
   * Parse currency string to number
   */
  parseCurrency(text) {
    if (!text) return null;

    let multiplier = 1;
    const lowerText = text.toLowerCase();

    if (lowerText.includes('billion') || lowerText.includes('bn')) {
      multiplier = 1_000_000_000;
    } else if (lowerText.includes('million') || /\dm\b/i.test(text)) {
      multiplier = 1_000_000;
    } else if (lowerText.includes('thousand') || /\dk\b/i.test(text)) {
      multiplier = 1_000;
    }

    // Extract numeric value
    const numMatch = text.replace(/[£,\s]/g, '').match(/[\d.]+/);
    if (!numMatch) return null;

    const value = parseFloat(numMatch[0]);
    if (isNaN(value)) return null;

    return value * multiplier;
  }

  /**
   * Parse date string
   */
  parseDate(text) {
    if (!text) return null;

    const months = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };

    // Try DD Month YYYY
    let match = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (match) {
      const monthNum = months[match[2].toLowerCase()];
      if (monthNum !== undefined) {
        return new Date(Date.UTC(parseInt(match[3]), monthNum, parseInt(match[1])));
      }
    }

    // Try DD/MM/YYYY
    match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      return new Date(Date.UTC(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1])));
    }

    return null;
  }

  /**
   * Detect document type from content
   */
  detectDocumentType(text) {
    const lowerText = text.toLowerCase().substring(0, 2000);

    if (lowerText.includes('final notice')) return 'final_notice';
    if (lowerText.includes('decision notice')) return 'decision_notice';
    if (lowerText.includes('warning notice')) return 'warning_notice';
    if (lowerText.includes('supervisory notice')) return 'supervisory_notice';
    if (lowerText.includes('prohibition order')) return 'prohibition_order';

    return 'other';
  }

  /**
   * Detect outcome type from content
   */
  detectOutcomeType(text) {
    const lowerText = text.toLowerCase();

    // Check for specific outcomes
    if (/financial penalty|imposes? a fine|penalty of £/i.test(text)) {
      return 'fine';
    }
    if (/prohibition order|prohibited from/i.test(text)) {
      return 'prohibition';
    }
    if (/cancel.{0,20}permission|permission.{0,20}cancel/i.test(text)) {
      return 'cancellation';
    }
    if (/public censure|censured/i.test(text)) {
      return 'censure';
    }
    if (/restriction|restrict.{0,20}permission/i.test(text)) {
      return 'restriction';
    }
    if (/voluntary requirement|vreq/i.test(text)) {
      return 'voluntary_requirement';
    }
    if (/warning notice/i.test(text)) {
      return 'warning';
    }
    if (/supervisory notice/i.test(text)) {
      return 'supervisory_notice';
    }

    return 'other';
  }

  /**
   * Process a single publication
   */
  async processPublication(publication) {
    // Handle both camelCase and snake_case field names (DB returns snake_case)
    const publication_id = publication.publicationId || publication.publication_id;
    const pdf_local_path = publication.pdfLocalPath || publication.pdf_local_path;
    const document_type = publication.documentType || publication.document_type;

    if (!pdf_local_path) {
      console.log(`[PDFParser] No local path for ${publication_id}`);
      return { success: false, reason: 'no_path' };
    }

    // Check file exists
    try {
      await fs.access(pdf_local_path);
    } catch {
      console.log(`[PDFParser] File not found: ${pdf_local_path}`);
      await this.db.updatePublicationStatus(publication_id, PROCESSING_STATUS.PARSE_FAILED, {
        errorMessage: 'PDF file not found'
      });
      return { success: false, reason: 'file_not_found' };
    }

    await this.db.updatePublicationStatus(publication_id, PROCESSING_STATUS.PARSING);

    try {
      console.log(`[PDFParser] Parsing: ${publication_id}`);

      // Parse PDF
      const parseResult = await this.parsePdf(pdf_local_path);

      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      const { text, pageCount } = parseResult;

      // Extract basic fields
      const extracted = this.extractBasicFields(text);

      // Store full text
      await this.db.storeFullText(publication_id, text);

      // Update publication record
      await this.db.updatePublicationStatus(publication_id, PROCESSING_STATUS.PARSED, {
        rawTextLength: text.length,
        pageCount: pageCount,
        parseMethod: 'pdf-parse'
      });

      this.parseCount++;
      console.log(`[PDFParser] Parsed ${publication_id}: ${text.length} chars, ${pageCount} pages`);

      return {
        success: true,
        text,
        textLength: text.length,
        pageCount,
        extracted
      };

    } catch (error) {
      this.failedCount++;
      console.error(`[PDFParser] Failed ${publication_id}:`, error.message);

      await this.db.incrementRetryCount(publication_id, error.message);

      // Check if max retries exceeded
      if (publication.retry_count >= 2) {
        await this.db.updatePublicationStatus(publication_id, PROCESSING_STATUS.PARSE_FAILED);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Process batch of publications
   */
  async processBatch(publications, options = {}) {
    const { onProgress = null, jobId = null } = options;

    const results = {
      successful: 0,
      failed: 0,
      skipped: 0
    };

    for (let i = 0; i < publications.length; i++) {
      const pub = publications[i];
      const result = await this.processPublication(pub);

      if (result.success) {
        results.successful++;
      } else if (result.reason === 'no_path' || result.reason === 'file_not_found') {
        results.skipped++;
      } else {
        results.failed++;
      }

      if (onProgress) {
        onProgress({
          processed: i + 1,
          total: publications.length,
          current: pub.publication_id,
          ...results
        });
      }

      if (this.progressTracker && jobId) {
        await this.progressTracker.updateProgress(jobId, {
          processedItems: i + 1,
          failedItems: results.failed
        });
      }
    }

    return results;
  }

  /**
   * Process all pending parses
   */
  async processAllPending(options = {}) {
    const { batchSize = 50, onBatchComplete = null, jobId = null } = options;

    let totalResults = {
      successful: 0,
      failed: 0,
      skipped: 0
    };

    let batch;
    let batchNumber = 0;

    while (true) {
      batch = await this.db.getPendingParses(batchSize);

      if (batch.length === 0) {
        console.log('[PDFParser] No more pending parses');
        break;
      }

      batchNumber++;
      console.log(`[PDFParser] Processing batch ${batchNumber} (${batch.length} items)`);

      const batchResults = await this.processBatch(batch, { jobId });

      totalResults.successful += batchResults.successful;
      totalResults.failed += batchResults.failed;
      totalResults.skipped += batchResults.skipped;

      if (onBatchComplete) {
        onBatchComplete({
          batchNumber,
          batchResults,
          totalResults
        });
      }
    }

    console.log(`[PDFParser] Parse complete:`, totalResults);
    return totalResults;
  }

  /**
   * Get parser statistics
   */
  getStats() {
    return {
      parseCount: this.parseCount,
      failedCount: this.failedCount
    };
  }
}

module.exports = PDFParser;
