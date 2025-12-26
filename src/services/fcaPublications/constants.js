/**
 * FCA Publications Scraper - Constants and Configuration
 *
 * Central configuration for the entire publications pipeline
 */

// Base URLs
const FCA_BASE_URL = 'https://www.fca.org.uk';
const FCA_PUBLICATIONS_SEARCH = `${FCA_BASE_URL}/publications/search-results`;

// Search parameters
const SEARCH_CONFIG = {
  baseUrl: FCA_PUBLICATIONS_SEARCH,
  resultsPerPage: 10,
  defaultCategory: 'notices and decisions-decision notices',

  // Filter parameters
  filters: {
    finalNotices: 'notices and decisions-final notices',
    decisionNotices: 'notices and decisions-decision notices',
    warnings: 'notices and decisions-warning notices',
    supervisoryNotices: 'notices and decisions-supervisory notices',
    all: 'notices and decisions'
  },

  // Sort options
  sortBy: {
    newest: 'date_desc',
    oldest: 'date_asc',
    relevant: 'relevance'
  }
};

// Rate limiting configuration
const RATE_LIMITS = {
  // Delays between requests (milliseconds)
  searchPageDelay: 2000,        // 2 seconds between search page requests
  pdfDownloadDelay: 1000,       // 1 second between PDF downloads (increased speed)
  aiProcessingDelay: 200,       // 200ms between AI calls (fast mode)
  retryDelay: 5000,             // 5 seconds before retry
  errorBackoff: 30000,          // 30 seconds after error burst

  // Concurrent limits
  maxConcurrentDownloads: 3,    // Reduced to prevent DB overload
  maxConcurrentAICalls: 8,      // Increased for faster processing
  maxConcurrentParses: 5,

  // Hourly limits (disabled for backfill - set very high)
  maxRequestsPerHour: 100000,   // Effectively disabled
  maxPdfDownloadsPerHour: 100000, // Effectively disabled for fast backfill
  maxAICallsPerHour: 50000,     // High limit for DeepSeek backfill

  // Retry configuration
  maxRetries: 3,
  retryBackoffMultiplier: 2,    // Exponential backoff
  maxRetryDelay: 60000          // Max 1 minute between retries
};

// Batch sizes for processing
const BATCH_SIZES = {
  indexBatch: 100,              // Records to index before checkpoint
  downloadBatch: 50,            // PDFs to download in one batch
  parseBatch: 50,               // PDFs to parse in one batch
  aiBatch: 100,                 // Documents for AI processing (increased for speed)
  dbInsertBatch: 100            // Records to insert at once
};

// File storage paths (relative to project root)
const STORAGE_PATHS = {
  pdfBase: 'data/pdfs',
  finalNotices: 'data/pdfs/final-notices',
  decisionNotices: 'data/pdfs/decision-notices',
  warnings: 'data/pdfs/warnings',
  supervisoryNotices: 'data/pdfs/supervisory-notices',
  other: 'data/pdfs/other',
  temp: 'data/pdfs/temp'
};

// Document type mapping
const DOCUMENT_TYPES = {
  'final notices': 'final_notice',
  'final notice': 'final_notice',
  'decision notices': 'decision_notice',
  'decision notice': 'decision_notice',
  'warning notices': 'warning_notice',
  'warning notice': 'warning_notice',
  'supervisory notices': 'supervisory_notice',
  'supervisory notice': 'supervisory_notice',
  'prohibition orders': 'prohibition_order',
  'prohibition order': 'prohibition_order',
  'handbook notices': 'handbook_notice',
  'handbook notice': 'handbook_notice',
  'default': 'other'
};

// Outcome types for classification
const OUTCOME_TYPES = [
  'fine',
  'prohibition',
  'cancellation',
  'restriction',
  'censure',
  'public_statement',
  'warning',
  'supervisory_notice',
  'voluntary_requirement',
  'other'
];

// Breach categories for AI classification
const BREACH_CATEGORIES = [
  'AML',
  'MARKET_ABUSE',
  'SYSTEMS_CONTROLS',
  'CLIENT_MONEY',
  'CONDUCT',
  'MIS_SELLING',
  'PRUDENTIAL',
  'REPORTING',
  'GOVERNANCE',
  'FINANCIAL_CRIME',
  'PRINCIPLES',
  'COMPLAINTS',
  'FINANCIAL_PROMOTIONS',
  'APPROVED_PERSONS'
];

// Handbook section patterns for extraction
const HANDBOOK_PATTERNS = [
  { pattern: /PRIN\s*\d+(\.\d+)*/gi, section: 'PRIN' },
  { pattern: /SYSC\s*\d+(\.\d+)*/gi, section: 'SYSC' },
  { pattern: /COBS\s*\d+(\.\d+)*/gi, section: 'COBS' },
  { pattern: /ICOBS\s*\d+(\.\d+)*/gi, section: 'ICOBS' },
  { pattern: /MCOB\s*\d+(\.\d+)*/gi, section: 'MCOB' },
  { pattern: /CASS\s*\d+(\.\d+)*/gi, section: 'CASS' },
  { pattern: /SUP\s*\d+(\.\d+)*/gi, section: 'SUP' },
  { pattern: /DEPP\s*\d+(\.\d+)*/gi, section: 'DEPP' },
  { pattern: /EG\s*\d+(\.\d+)*/gi, section: 'EG' },
  { pattern: /MAR\s*\d+(\.\d+)*/gi, section: 'MAR' },
  { pattern: /APER\s*\d+(\.\d+)*/gi, section: 'APER' },
  { pattern: /COCON\s*\d+(\.\d+)*/gi, section: 'COCON' },
  { pattern: /FIT\s*\d+(\.\d+)*/gi, section: 'FIT' },
  { pattern: /TC\s*\d+(\.\d+)*/gi, section: 'TC' },
  { pattern: /GENPRU\s*\d+(\.\d+)*/gi, section: 'GENPRU' },
  { pattern: /BIPRU\s*\d+(\.\d+)*/gi, section: 'BIPRU' },
  { pattern: /IFPRU\s*\d+(\.\d+)*/gi, section: 'IFPRU' },
  { pattern: /DISP\s*\d+(\.\d+)*/gi, section: 'DISP' },
  { pattern: /CONC\s*\d+(\.\d+)*/gi, section: 'CONC' },
  { pattern: /CMCOB\s*\d+(\.\d+)*/gi, section: 'CMCOB' }
];

// Regex patterns for data extraction
const EXTRACTION_PATTERNS = {
  // Firm Reference Number
  frn: /FRN\s*:?\s*(\d{6})/gi,
  frnAlt: /(?:firm reference number|registration number)\s*:?\s*(\d{6})/gi,

  // Fine amounts
  fineAmount: /£\s*[\d,]+(?:\.\d{2})?(?:\s*(?:million|m|bn|billion))?/gi,
  fineNumeric: /(?:fine|penalty|financial penalty)\s+(?:of\s+)?£?\s*([\d,]+(?:\.\d{2})?)\s*(?:million|m)?/gi,

  // Dates
  dateFormat1: /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
  dateFormat2: /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
  dateFormat3: /(\d{4})-(\d{2})-(\d{2})/g,

  // Entity names from notice headers
  entityName: /(?:FINAL NOTICE|DECISION NOTICE|WARNING NOTICE)[\s\S]{0,50}?(?:to|To|TO)\s+([A-Z][A-Za-z\s&.,'-]+(?:Ltd|Limited|PLC|LLP|LP|Inc|Corporation|Corp)?)/i,
  individualName: /(?:Mr|Mrs|Ms|Miss|Dr)\s+([A-Z][a-z]+\s+[A-Z][A-Za-z\-']+)/g,

  // Discount information
  discountPercent: /(\d{2,3})%?\s*(?:stage\s*\d+)?\s*discount/gi,
  earlySettlement: /(?:early\s+)?settlement\s+discount/gi
};

// User agent for requests
const USER_AGENT = process.env.FCA_USER_AGENT ||
  'RegCanary-Regulatory-Scanner/2.0 (+https://github.com/yourusername/regcanary; contact@example.com)';

// HTTP request configuration
const HTTP_CONFIG = {
  timeout: 60000,               // 60 second timeout (increased for FCA's slower responses)
  maxRedirects: 5,
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  }
};

// AI Configuration
const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'anthropic',  // anthropic, openai
  model: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
  maxTokens: 2048,             // Reduced for cost savings
  temperature: 0.1,            // Low temperature for consistent extraction
  maxContentLength: 8000,      // Reduced from 15000 for cost savings

  // Fallback models
  fallbackModels: [
    'claude-sonnet-4-20250514',
    'gpt-4o',
    'gpt-4-turbo'
  ]
};

// Processing status values
const PROCESSING_STATUS = {
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  DOWNLOAD_FAILED: 'download_failed',
  PARSING: 'parsing',
  PARSED: 'parsed',
  PARSE_FAILED: 'parse_failed',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  PROCESS_FAILED: 'process_failed',
  SKIPPED: 'skipped'
};

// Job status values
const JOB_STATUS = {
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Job types
const JOB_TYPES = {
  INDEX_SCRAPE: 'index_scrape',
  PDF_DOWNLOAD: 'pdf_download',
  PDF_PARSE: 'pdf_parse',
  AI_PROCESS: 'ai_process',
  FULL_BACKFILL: 'full_backfill',
  INCREMENTAL_UPDATE: 'incremental_update'
};

// Export all constants
module.exports = {
  FCA_BASE_URL,
  FCA_PUBLICATIONS_SEARCH,
  SEARCH_CONFIG,
  RATE_LIMITS,
  BATCH_SIZES,
  STORAGE_PATHS,
  DOCUMENT_TYPES,
  OUTCOME_TYPES,
  BREACH_CATEGORIES,
  HANDBOOK_PATTERNS,
  EXTRACTION_PATTERNS,
  USER_AGENT,
  HTTP_CONFIG,
  AI_CONFIG,
  PROCESSING_STATUS,
  JOB_STATUS,
  JOB_TYPES
};
