/**
 * FCA Publications API Routes
 * REST API for the publications pipeline
 *
 * Route Structure (1995 lines):
 * ============================================================
 *
 * SHARED HELPERS (L17-58)
 * - getDbPool(), setPipeline(), allowFallback(), requirePipeline()
 *
 * STATUS & STATS (L60-171)
 * - GET /status      - Pipeline status
 * - GET /stats       - Detailed statistics
 * - GET /jobs        - Pipeline jobs
 *
 * PIPELINE OPERATIONS (L173-313)
 * - POST /backfill           - Start full backfill
 * - POST /backfill/:stage    - Run specific stage
 * - POST /update             - Trigger update
 * - POST /pause              - Pause pipeline
 * - POST /resume             - Resume pipeline
 * - POST /cancel             - Cancel current job
 *
 * NOTICES CRUD (L315-495)
 * - GET /notices             - List notices (paginated)
 * - GET /notices/:id         - Get notice by ID
 * - GET /search              - Search notices
 *
 * INSIGHTS (L496-1285)
 * - GET /insights/outcome-analysis         - Outcome breakdown
 * - GET /insights/outcome-breaches/:type   - Breaches by outcome
 * - GET /insights/case-studies             - Notable cases
 * - GET /insights/risk-indicators          - Risk indicators
 * - GET /insights/top-fines                - Top fines
 * - GET /insights/breach-analysis/:type    - Breach analysis
 * - GET /insights/breach-summary           - Breach summary
 * - GET /insights/handbook-stats           - Handbook stats
 * - GET /insights/rule-citations           - Rule citations
 * - GET /insights/common-findings          - Common findings
 * - GET /insights/fine-modifiers           - Fine modifiers
 * - GET /insights/timeline                 - Timeline data
 *
 * ENTITY & SUMMARY (L1286-1987)
 * - GET /insights/yearly-breakdown         - Yearly breakdown
 * - GET /insights/reoffenders              - Repeat offenders
 * - GET /entity/:name/history              - Entity history
 * - GET /insights/themes                   - Enforcement themes
 * - GET /summary/:year                     - Year summary
 * - GET /summary/:year/data                - Year summary data
 * - POST /summary/:year/generate           - Generate summary
 *
 * MODULAR HELPERS AVAILABLE:
 * - publications/helpers.js - Shared middleware (created)
 * - publications/status.js  - Status routes (created)
 *
 * ============================================================
 */

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Pipeline instance will be set by the main app
let pipeline = null;

// Direct database pool for fallback
let dbPool = null;

function getDbPool() {
  if (!dbPool && process.env.DATABASE_URL) {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return dbPool;
}

/**
 * Set the pipeline instance
 */
function setPipeline(pipelineInstance) {
  pipeline = pipelineInstance;
}

/**
 * Middleware - allows fallback to direct DB
 */
function allowFallback(req, res, next) {
  if (!pipeline && !getDbPool()) {
    return res.status(503).json({
      success: false,
      error: 'Publications service not available'
    });
  }
  next();
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
router.get('/status', allowFallback, async (req, res) => {
  try {
    if (pipeline) {
      const status = await pipeline.getStatus();
      res.json({ success: true, ...status });
    } else {
      // Direct DB fallback
      const pool = getDbPool();
      const indexResult = await pool.query(`
        SELECT status, count(*) as count
        FROM fca_publications_index
        GROUP BY status
      `);
      const noticesResult = await pool.query(`
        SELECT count(*) as count FROM fca_enforcement_notices
      `);

      const byStatus = {};
      let total = 0;
      indexResult.rows.forEach(row => {
        byStatus[row.status] = parseInt(row.count);
        total += parseInt(row.count);
      });

      res.json({
        success: true,
        index: { total, byStatus },
        notices: { total: parseInt(noticesResult.rows[0]?.count || 0) }
      });
    }
  } catch (error) {
    console.error('[PublicationsAPI] Error getting status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/stats
 * Get detailed statistics
 */
router.get('/stats', allowFallback, async (req, res) => {
  try {
    if (pipeline) {
      const stats = await pipeline.getStats();
      res.json({ success: true, data: stats });
    } else {
      // Direct DB fallback for stats
      const pool = getDbPool();

      const [outcomes, breaches, fines, riskDist] = await Promise.all([
        pool.query(`SELECT outcome_type, COUNT(*) as count FROM fca_enforcement_notices GROUP BY outcome_type ORDER BY count DESC`),
        pool.query(`SELECT primary_breach_type, COUNT(*) as count FROM fca_enforcement_notices WHERE primary_breach_type IS NOT NULL GROUP BY primary_breach_type ORDER BY count DESC LIMIT 10`),
        pool.query(`SELECT SUM(fine_amount) as total, COUNT(*) as count, AVG(fine_amount) as avg FROM fca_enforcement_notices WHERE fine_amount > 0`),
        pool.query(`SELECT
          CASE
            WHEN risk_score >= 80 THEN 'Critical'
            WHEN risk_score >= 60 THEN 'High'
            WHEN risk_score >= 40 THEN 'Medium'
            WHEN risk_score >= 20 THEN 'Low'
            ELSE 'Minimal'
          END as level,
          COUNT(*) as count
          FROM fca_enforcement_notices GROUP BY level ORDER BY count DESC`)
      ]);

      res.json({
        success: true,
        data: {
          outcomes: outcomes.rows,
          breaches: breaches.rows,
          fines: {
            total: parseFloat(fines.rows[0]?.total || 0),
            count: parseInt(fines.rows[0]?.count || 0),
            average: parseFloat(fines.rows[0]?.avg || 0)
          },
          riskDistribution: riskDist.rows
        }
      });
    }
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
router.get('/notices', allowFallback, async (req, res) => {
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

    if (pipeline) {
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

      // Get total count for pagination (pipeline path)
      let totalCount = notices.length;
      try {
        const pool = getDbPool();
        let countQuery = 'SELECT COUNT(*) as total FROM fca_enforcement_notices WHERE 1=1';
        const countParams = [];
        let idx = 1;
        if (outcome_type) { countQuery += ` AND outcome_type = $${idx++}`; countParams.push(outcome_type); }
        if (breach_type) { countQuery += ` AND primary_breach_type = $${idx++}`; countParams.push(breach_type); }
        if (entity_name) { countQuery += ` AND entity_name ILIKE $${idx++}`; countParams.push(`%${entity_name}%`); }
        const countResult = await pool.query(countQuery, countParams);
        totalCount = parseInt(countResult.rows[0]?.total || notices.length);
      } catch (e) { /* fallback to notices.length */ }

      res.json({
        success: true,
        notices,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: notices.length,
          total: totalCount
        }
      });
    } else {
      // Direct DB fallback
      const pool = getDbPool();

      // Build WHERE clause for both count and data queries
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (outcome_type) {
        whereClause += ` AND outcome_type = $${paramIndex++}`;
        params.push(outcome_type);
      }
      if (breach_type) {
        whereClause += ` AND primary_breach_type = $${paramIndex++}`;
        params.push(breach_type);
      }
      if (frn) {
        whereClause += ` AND frn = $${paramIndex++}`;
        params.push(frn);
      }
      if (entity_name) {
        whereClause += ` AND entity_name ILIKE $${paramIndex++}`;
        params.push(`%${entity_name}%`);
      }

      // Get total count first
      const countQuery = `SELECT COUNT(*) as total FROM fca_enforcement_notices ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0]?.total || 0);

      // Handle sorting - default to notice_date DESC
      const sortBy = req.query.sortBy || 'notice_date';
      const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
      const validSortColumns = ['notice_date', 'entity_name', 'outcome_type', 'fine_amount', 'primary_breach_type', 'risk_score', 'frn', 'created_at'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'notice_date';

      // Data query
      let query = `
        SELECT
          publication_id, entity_name, entity_type, frn, outcome_type,
          fine_amount, primary_breach_type, handbook_references,
          consumer_impact_level, risk_score, ai_summary, notice_date,
          key_findings, specific_breaches, pdf_url
        FROM fca_enforcement_notices
        ${whereClause}
        ORDER BY ${sortColumn} ${sortOrder} NULLS LAST
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      res.json({
        success: true,
        notices: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: result.rows.length,
          total: totalCount
        }
      });
    }
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
// DEEP INSIGHTS API
// ============================================================

/**
 * GET /api/publications/insights/outcome-analysis
 * Get outcome type breakdown with explanations and learnings
 */
router.get('/insights/outcome-analysis', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();

    // Get outcome distribution
    const outcomeResult = await pool.query(`
      SELECT
        outcome_type,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as with_fine
      FROM fca_enforcement_notices
      WHERE outcome_type IS NOT NULL
      GROUP BY outcome_type
      ORDER BY count DESC
    `);

    const total = outcomeResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0);

    // Outcome explanations - what each type means and common triggers
    const outcomeExplanations = {
      'fine': {
        label: 'Fines',
        description: 'Monetary penalties for significant rule breaches',
        triggers: [
          'Serious breaches of FCA Principles or rules',
          'Consumer harm resulting from misconduct',
          'Systemic control failures',
          'Market manipulation or abuse'
        ]
      },
      'prohibition': {
        label: 'Prohibitions',
        description: 'Individual banned from holding regulated role',
        triggers: [
          'Lack of fitness and propriety',
          'Misconduct by approved persons',
          'Criminal convictions',
          'Dishonesty or lack of integrity',
          'SM&CR breaches by senior managers'
        ]
      },
      'cancellation': {
        label: 'Cancellations',
        description: 'Firm loses FCA authorisation',
        triggers: [
          'Firm ceased trading / voluntarily gave up permission',
          'Failed to meet threshold conditions',
          'Non-payment of fees',
          'Failure to submit regulatory returns',
          'Consumer credit firms not meeting requirements'
        ]
      },
      'restriction': {
        label: 'Restrictions',
        description: 'Firm limited in activities it can perform',
        triggers: [
          'Specific control deficiencies identified',
          'Risk management failures',
          'Voluntary restrictions to address issues',
          'Interim measure pending full investigation'
        ]
      },
      'censure': {
        label: 'Public Censures',
        description: 'Public reprimand without financial penalty',
        triggers: [
          'Breaches not warranting fine',
          'Firm demonstrated strong remediation',
          'Lesser severity misconduct',
          'Alternative to fine due to financial hardship'
        ]
      },
      'public_statement': {
        label: 'Public Statements',
        description: 'Formal regulatory statement about conduct',
        triggers: [
          'Guidance for industry',
          'Warning about specific practices',
          'Clarification of regulatory expectations'
        ]
      },
      'warning': {
        label: 'Warnings',
        description: 'Preliminary notice of potential enforcement',
        triggers: [
          'Early stage of enforcement process',
          'Initial findings requiring response',
          'Notification of regulatory concerns'
        ]
      },
      'supervisory_notice': {
        label: 'Supervisory Notices',
        description: 'Formal supervisory action notice',
        triggers: [
          'Variation of permission',
          'Imposition of requirements',
          'Supervisory intervention'
        ]
      },
      'voluntary_requirement': {
        label: 'Voluntary Requirements',
        description: 'Firm-initiated remedial commitments',
        triggers: [
          'Self-identified issues',
          'Proactive remediation',
          'Agreement with FCA on improvements'
        ]
      },
      'other': {
        label: 'Other Actions',
        description: 'Miscellaneous enforcement actions',
        triggers: [
          'Various regulatory interventions',
          'Case-specific outcomes'
        ]
      }
    };

    // Build response with enriched data
    const outcomes = outcomeResult.rows.map(row => {
      const type = row.outcome_type;
      const explanation = outcomeExplanations[type] || {
        label: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
        description: 'Regulatory enforcement action',
        triggers: []
      };

      return {
        type,
        label: explanation.label,
        count: parseInt(row.count),
        percentage: ((parseInt(row.count) / total) * 100).toFixed(1),
        totalFines: parseFloat(row.total_fines) || 0,
        withFine: parseInt(row.with_fine) || 0,
        description: explanation.description,
        triggers: explanation.triggers
      };
    });

    // Get a key insight about the data
    const topOutcome = outcomes[0];
    const insight = topOutcome
      ? `${topOutcome.label} account for ${topOutcome.percentage}% of all enforcement actions. ${topOutcome.description.toLowerCase()}.`
      : null;

    res.json({
      success: true,
      data: {
        outcomes,
        total,
        insight
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting outcome analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/outcome-breaches/:outcomeType
 * Get breach type breakdown for a specific outcome type
 */
router.get('/insights/outcome-breaches/:outcomeType', allowFallback, async (req, res) => {
  try {
    const { outcomeType } = req.params;
    const pool = pipeline?.pool || getDbPool();

    // Get breach breakdown for this outcome type
    const result = await pool.query(`
      SELECT
        primary_breach_type,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as with_fine
      FROM fca_enforcement_notices
      WHERE outcome_type = $1 AND primary_breach_type IS NOT NULL
      GROUP BY primary_breach_type
      ORDER BY count DESC
    `, [outcomeType]);

    const total = result.rows.reduce((sum, r) => sum + parseInt(r.count), 0);

    // Breach type labels
    const breachLabels = {
      PRINCIPLES: 'Principles',
      AML: 'AML',
      SYSTEMS_CONTROLS: 'Systems & Controls',
      MARKET_ABUSE: 'Market Abuse',
      MIS_SELLING: 'Mis-selling',
      CLIENT_MONEY: 'Client Money',
      CONDUCT: 'Conduct',
      PRUDENTIAL: 'Prudential',
      REPORTING: 'Reporting',
      GOVERNANCE: 'Governance',
      FINANCIAL_CRIME: 'Financial Crime',
      COMPLAINTS: 'Complaints',
      FINANCIAL_PROMOTIONS: 'Financial Promotions',
      APPROVED_PERSONS: 'Approved Persons'
    };

    const breaches = result.rows.map(row => ({
      type: row.primary_breach_type,
      label: breachLabels[row.primary_breach_type] || row.primary_breach_type,
      count: parseInt(row.count),
      percentage: total > 0 ? ((parseInt(row.count) / total) * 100).toFixed(1) : 0,
      totalFines: parseFloat(row.total_fines) || 0,
      withFine: parseInt(row.with_fine) || 0
    }));

    res.json({
      success: true,
      data: {
        outcomeType,
        breaches,
        total
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting outcome breaches:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/case-studies
 * Get top cases with full details for case study spotlight
 * Includes all enforcement types (fines, cancellations, prohibitions, etc.)
 */
router.get('/insights/case-studies', allowFallback, async (req, res) => {
  try {
    const { limit = 5, outcome_type } = req.query;
    const pool = pipeline?.pool || getDbPool();

    // Get a diverse mix of enforcement types for case studies
    // Uses window functions to pick top cases from each outcome type
    const result = await pool.query(`
      WITH ranked_cases AS (
        SELECT
          publication_id, entity_name, entity_type, frn, outcome_type,
          fine_amount, primary_breach_type, notice_date,
          ai_summary, key_findings, specific_breaches,
          handbook_references, aggravating_factors, mitigating_factors,
          remediation_actions, pdf_url, risk_score,
          ROW_NUMBER() OVER (
            PARTITION BY outcome_type
            ORDER BY COALESCE(risk_score, 0) DESC, COALESCE(fine_amount, 0) DESC, notice_date DESC
          ) as rn
        FROM fca_enforcement_notices
        WHERE ai_summary IS NOT NULL
          ${outcome_type ? 'AND outcome_type = $2' : ''}
      )
      SELECT * FROM ranked_cases
      WHERE rn <= 2
      ORDER BY
        CASE outcome_type
          WHEN 'fine' THEN 1
          WHEN 'cancellation' THEN 2
          WHEN 'prohibition' THEN 3
          WHEN 'restriction' THEN 4
          ELSE 5
        END,
        COALESCE(risk_score, 0) DESC
      LIMIT $1
    `, outcome_type ? [parseInt(limit), outcome_type] : [parseInt(limit)]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        fine_amount: parseFloat(row.fine_amount) || 0,
        key_findings: row.key_findings || [],
        handbook_references: row.handbook_references || [],
        aggravating_factors: row.aggravating_factors || [],
        mitigating_factors: row.mitigating_factors || []
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting case studies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/risk-indicators
 * Get enforcement risk indicators - high-risk behaviors that commonly trigger FCA action
 */
router.get('/insights/risk-indicators', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();

    // Get risk indicators based on breach types with their enforcement frequency and fines
    const result = await pool.query(`
      SELECT
        primary_breach_type,
        COUNT(*) as case_count,
        COUNT(CASE WHEN outcome_type IN ('fine', 'cancellation', 'prohibition') THEN 1 END) as severe_actions,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        AVG(COALESCE(fine_amount, 0)) as avg_fine,
        MAX(COALESCE(fine_amount, 0)) as max_fine,
        MAX(notice_date) as latest_case
      FROM fca_enforcement_notices
      WHERE primary_breach_type IS NOT NULL
      GROUP BY primary_breach_type
      ORDER BY case_count DESC, total_fines DESC
      LIMIT 10
    `);

    // Get total case count for percentage
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM fca_enforcement_notices
      WHERE primary_breach_type IS NOT NULL
    `);
    const totalCases = parseInt(totalResult.rows[0]?.total || 1);

    // Calculate risk level based on case count and severity
    const indicators = result.rows.map(row => {
      const caseCount = parseInt(row.case_count);
      const severeActions = parseInt(row.severe_actions);
      const percentage = ((caseCount / totalCases) * 100).toFixed(1);
      const severityRatio = severeActions / caseCount;

      // Risk level: high (>15% or >50% severe), medium (>5% or >30% severe), low
      let riskLevel = 'low';
      if (percentage > 15 || severityRatio > 0.5) riskLevel = 'high';
      else if (percentage > 5 || severityRatio > 0.3) riskLevel = 'medium';

      return {
        breachType: row.primary_breach_type,
        label: formatBreachLabel(row.primary_breach_type),
        caseCount,
        percentage: parseFloat(percentage),
        severeActions,
        totalFines: parseFloat(row.total_fines || 0),
        avgFine: parseFloat(row.avg_fine || 0),
        maxFine: parseFloat(row.max_fine || 0),
        latestCase: row.latest_case,
        riskLevel
      };
    });

    res.json({
      success: true,
      data: indicators,
      totalCases
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting risk indicators:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function for breach label formatting
function formatBreachLabel(type) {
  if (!type) return 'Unknown';
  const labels = {
    'PRINCIPLES': 'Principles Breaches',
    'AML': 'AML/KYC Failures',
    'SYSTEMS_CONTROLS': 'Systems & Controls Gaps',
    'MARKET_ABUSE': 'Market Abuse',
    'MIS_SELLING': 'Mis-selling',
    'CLIENT_MONEY': 'Client Money Issues',
    'CONDUCT': 'Conduct Failures',
    'PRUDENTIAL': 'Prudential Requirements',
    'REPORTING': 'Regulatory Reporting Delays',
    'GOVERNANCE': 'Governance Deficiencies',
    'FINANCIAL_CRIME': 'Financial Crime',
    'APPROVED_PERSONS': 'Approved Persons Issues',
    'CONSUMER_DUTY': 'Consumer Duty Failures',
    'OTHER': 'Other Breaches'
  };
  return labels[type] || type.replace(/_/g, ' ').split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * GET /api/publications/insights/top-fines
 * Get top fines with full context and summary
 */
router.get('/insights/top-fines', allowFallback, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const pool = pipeline?.pool || getDbPool();

    const result = await pool.query(`
      SELECT
        entity_name, frn, fine_amount, outcome_type,
        EXTRACT(YEAR FROM notice_date) as year,
        primary_breach_type, ai_summary, pdf_url,
        COALESCE(
          (SELECT string_agg(ref, ', ')
           FROM jsonb_array_elements_text(handbook_references) AS ref
           LIMIT 3),
          ''
        ) as top_references
      FROM fca_enforcement_notices
      WHERE fine_amount > 0
      ORDER BY fine_amount DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        fine_amount: parseFloat(row.fine_amount) || 0,
        year: row.year ? parseInt(row.year) : null
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting top fines:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/breach-analysis/:type
 * Get deep dive for specific breach type with examples
 */
router.get('/insights/breach-analysis/:type', allowFallback, async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 5 } = req.query;
    const pool = pipeline?.pool || getDbPool();

    // Get cases of this breach type
    const casesResult = await pool.query(`
      SELECT
        entity_name, fine_amount, ai_summary,
        EXTRACT(YEAR FROM notice_date) as year,
        key_findings, handbook_references, pdf_url
      FROM fca_enforcement_notices
      WHERE primary_breach_type = $1 AND fine_amount > 0
      ORDER BY fine_amount DESC
      LIMIT $2
    `, [type, parseInt(limit)]);

    // Get total stats for this breach type
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_cases,
        SUM(fine_amount) as total_fines,
        AVG(fine_amount) as avg_fine,
        MAX(fine_amount) as max_fine
      FROM fca_enforcement_notices
      WHERE primary_breach_type = $1
    `, [type]);

    // Get common handbook references for this breach type
    const handbookResult = await pool.query(`
      SELECT ref, COUNT(*) as count
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(handbook_references) AS ref
      WHERE primary_breach_type = $1
      GROUP BY ref
      ORDER BY count DESC
      LIMIT 5
    `, [type]);

    res.json({
      success: true,
      data: {
        breachType: type,
        stats: {
          totalCases: parseInt(statsResult.rows[0]?.total_cases || 0),
          totalFines: parseFloat(statsResult.rows[0]?.total_fines || 0),
          avgFine: parseFloat(statsResult.rows[0]?.avg_fine || 0),
          maxFine: parseFloat(statsResult.rows[0]?.max_fine || 0)
        },
        topHandbookRefs: handbookResult.rows,
        examples: casesResult.rows.map(row => ({
          ...row,
          fine_amount: parseFloat(row.fine_amount) || 0,
          year: row.year ? parseInt(row.year) : null,
          key_findings: row.key_findings || [],
          handbook_references: row.handbook_references || []
        }))
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting breach analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/breach-summary
 * Get all breach types with stats and examples
 */
router.get('/insights/breach-summary', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();

    // First get aggregates by breach type
    const aggregates = await pool.query(`
      SELECT
        primary_breach_type,
        COUNT(*) as case_count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        MAX(COALESCE(fine_amount, 0)) as max_fine
      FROM fca_enforcement_notices
      WHERE primary_breach_type IS NOT NULL
      GROUP BY primary_breach_type
      ORDER BY total_fines DESC
    `);

    // Get top case (highest fine) for each breach type using window function
    const topCases = await pool.query(`
      SELECT primary_breach_type, entity_name, fine_amount
      FROM (
        SELECT
          primary_breach_type,
          entity_name,
          fine_amount,
          ROW_NUMBER() OVER (PARTITION BY primary_breach_type ORDER BY COALESCE(fine_amount, 0) DESC) as rn
        FROM fca_enforcement_notices
        WHERE primary_breach_type IS NOT NULL AND fine_amount > 0
      ) ranked
      WHERE rn = 1
    `);

    // Create a map for quick lookup
    const topCaseMap = {};
    topCases.rows.forEach(row => {
      topCaseMap[row.primary_breach_type] = {
        entity: row.entity_name,
        fine: parseFloat(row.fine_amount || 0)
      };
    });

    res.json({
      success: true,
      data: aggregates.rows.map(row => ({
        breachType: row.primary_breach_type,
        caseCount: parseInt(row.case_count),
        totalFines: parseFloat(row.total_fines || 0),
        maxFine: parseFloat(row.max_fine || 0),
        topCase: topCaseMap[row.primary_breach_type] || { entity: 'N/A', fine: 0 }
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting breach summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/handbook-stats
 * Get handbook reference frequency analysis
 */
router.get('/insights/handbook-stats', allowFallback, async (req, res) => {
  try {
    const { limit = 15 } = req.query;
    const pool = pipeline?.pool || getDbPool();

    const result = await pool.query(`
      SELECT
        ref,
        COUNT(*) as count,
        SUM(fine_amount) as total_fines,
        AVG(fine_amount) as avg_fine
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(handbook_references) AS ref
      WHERE handbook_references IS NOT NULL AND jsonb_array_length(handbook_references) > 0
      GROUP BY ref
      ORDER BY count DESC
      LIMIT $1
    `, [parseInt(limit)]);

    // Get total for percentage calculation
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM fca_enforcement_notices
      WHERE handbook_references IS NOT NULL AND jsonb_array_length(handbook_references) > 0
    `);

    const total = parseInt(totalResult.rows[0]?.total || 1);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        reference: row.ref,
        count: parseInt(row.count),
        percentage: ((parseInt(row.count) / total) * 100).toFixed(1),
        totalFines: parseFloat(row.total_fines || 0),
        avgFine: parseFloat(row.avg_fine || 0)
      })),
      total
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting handbook stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/rule-citations
 * Get comprehensive citation statistics for FCA handbook rules
 */
router.get('/insights/rule-citations', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();

    // Get citation counts and fine statistics for each handbook reference
    const result = await pool.query(`
      SELECT
        handbook_ref,
        COUNT(*) as case_count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        AVG(COALESCE(fine_amount, 0)) as avg_fine,
        MAX(COALESCE(fine_amount, 0)) as max_fine,
        MIN(notice_date) as first_case,
        MAX(notice_date) as latest_case,
        COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as cases_with_fines
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(handbook_references) AS handbook_ref
      WHERE handbook_references IS NOT NULL AND jsonb_array_length(handbook_references) > 0
      GROUP BY handbook_ref
      ORDER BY case_count DESC
    `);

    // Get total case count for percentage calculations
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM fca_enforcement_notices
      WHERE handbook_references IS NOT NULL AND jsonb_array_length(handbook_references) > 0
    `);
    const totalCases = parseInt(totalResult.rows[0]?.total || 1);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        rule: row.handbook_ref,
        caseCount: parseInt(row.case_count),
        percentage: ((parseInt(row.case_count) / totalCases) * 100).toFixed(1),
        totalFines: parseFloat(row.total_fines || 0),
        avgFine: parseFloat(row.avg_fine || 0),
        maxFine: parseFloat(row.max_fine || 0),
        casesWithFines: parseInt(row.cases_with_fines || 0),
        firstCase: row.first_case,
        latestCase: row.latest_case
      })),
      totalCases
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting rule citations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/common-findings
 * Get pattern analysis of key findings
 */
router.get('/insights/common-findings', allowFallback, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const pool = pipeline?.pool || getDbPool();

    const result = await pool.query(`
      SELECT
        finding,
        COUNT(*) as frequency
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(key_findings) AS finding
      WHERE key_findings IS NOT NULL AND jsonb_array_length(key_findings) > 0
      GROUP BY finding
      ORDER BY frequency DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        finding: row.finding,
        frequency: parseInt(row.frequency)
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting common findings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/fine-modifiers
 * Get aggravating and mitigating factors analysis
 */
router.get('/insights/fine-modifiers', allowFallback, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const pool = pipeline?.pool || getDbPool();

    // Get aggravating factors
    const aggravatingResult = await pool.query(`
      SELECT
        factor,
        COUNT(*) as count,
        AVG(fine_amount) as avg_fine
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(aggravating_factors) AS factor
      WHERE aggravating_factors IS NOT NULL
        AND jsonb_array_length(aggravating_factors) > 0
        AND fine_amount > 0
      GROUP BY factor
      ORDER BY count DESC
      LIMIT $1
    `, [parseInt(limit)]);

    // Get mitigating factors
    const mitigatingResult = await pool.query(`
      SELECT
        factor,
        COUNT(*) as count,
        AVG(fine_amount) as avg_fine
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(mitigating_factors) AS factor
      WHERE mitigating_factors IS NOT NULL
        AND jsonb_array_length(mitigating_factors) > 0
        AND fine_amount > 0
      GROUP BY factor
      ORDER BY count DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: {
        aggravating: aggravatingResult.rows.map(row => ({
          factor: row.factor,
          count: parseInt(row.count),
          avgFine: parseFloat(row.avg_fine || 0)
        })),
        mitigating: mitigatingResult.rows.map(row => ({
          factor: row.factor,
          count: parseInt(row.count),
          avgFine: parseFloat(row.avg_fine || 0)
        }))
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting fine modifiers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/timeline
 * Get fines by year with context
 */
router.get('/insights/timeline', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();

    // Simplified query without correlated subquery
    const result = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM notice_date)::int as year,
        COUNT(*)::int as case_count,
        COALESCE(SUM(fine_amount), 0) as total_fines,
        COALESCE(MAX(fine_amount), 0) as max_fine
      FROM fca_enforcement_notices
      WHERE notice_date IS NOT NULL AND fine_amount > 0
      GROUP BY EXTRACT(YEAR FROM notice_date)
      ORDER BY year DESC
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        year: row.year,
        caseCount: row.case_count,
        totalFines: parseFloat(row.total_fines || 0),
        maxFine: parseFloat(row.max_fine || 0)
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting timeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// YEARLY ANALYTICS & REOFFENDERS
// ============================================================

/**
 * GET /api/publications/insights/yearly-breakdown
 * Get enforcement counts by year with outcome type breakdown
 */
router.get('/insights/yearly-breakdown', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();

    // Get yearly totals
    const yearlyTotals = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM notice_date) as year,
        COUNT(*) as total_count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as fines_with_amount
      FROM fca_enforcement_notices
      WHERE notice_date IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM notice_date)
      ORDER BY year DESC
    `);

    // Get outcome breakdown per year
    const outcomeBreakdown = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM notice_date) as year,
        outcome_type,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines
      FROM fca_enforcement_notices
      WHERE notice_date IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM notice_date), outcome_type
      ORDER BY year DESC, count DESC
    `);

    // Get biggest case per year (using window function for correctness)
    const biggestCases = await pool.query(`
      SELECT year, entity_name, fine_amount, outcome_type, primary_breach_type
      FROM (
        SELECT
          EXTRACT(YEAR FROM notice_date) as year,
          entity_name,
          fine_amount,
          outcome_type,
          primary_breach_type,
          ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM notice_date) ORDER BY COALESCE(fine_amount, 0) DESC) as rn
        FROM fca_enforcement_notices
        WHERE notice_date IS NOT NULL AND fine_amount > 0
      ) ranked
      WHERE rn = 1
      ORDER BY year DESC
    `);

    // Organize data by year
    const yearlyData = {};

    yearlyTotals.rows.forEach(row => {
      const year = row.year ? parseInt(row.year) : null;
      if (year) {
        yearlyData[year] = {
          year,
          totalCount: parseInt(row.total_count),
          totalFines: parseFloat(row.total_fines || 0),
          finesWithAmount: parseInt(row.fines_with_amount),
          outcomes: {},
          biggestCase: null
        };
      }
    });

    outcomeBreakdown.rows.forEach(row => {
      const year = row.year ? parseInt(row.year) : null;
      if (year && yearlyData[year]) {
        const outcomeType = row.outcome_type || 'unknown';
        yearlyData[year].outcomes[outcomeType] = {
          count: parseInt(row.count),
          totalFines: parseFloat(row.total_fines || 0)
        };
      }
    });

    biggestCases.rows.forEach(row => {
      const year = row.year ? parseInt(row.year) : null;
      if (year && yearlyData[year]) {
        yearlyData[year].biggestCase = {
          entityName: row.entity_name,
          fineAmount: parseFloat(row.fine_amount || 0),
          outcomeType: row.outcome_type,
          breachType: row.primary_breach_type
        };
      }
    });

    res.json({
      success: true,
      data: Object.values(yearlyData).sort((a, b) => b.year - a.year)
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting yearly breakdown:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/reoffenders
 * Get entities with multiple enforcement actions
 */
router.get('/insights/reoffenders', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();
    const limit = parseInt(req.query.limit) || 50;

    const result = await pool.query(`
      SELECT
        entity_name,
        COUNT(*) as enforcement_count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        MIN(notice_date) as first_action,
        MAX(notice_date) as latest_action,
        array_agg(DISTINCT outcome_type) FILTER (WHERE outcome_type IS NOT NULL) as outcome_types,
        array_agg(DISTINCT primary_breach_type) FILTER (WHERE primary_breach_type IS NOT NULL) as breach_types,
        array_agg(DISTINCT EXTRACT(YEAR FROM notice_date)::int ORDER BY EXTRACT(YEAR FROM notice_date)::int) as years
      FROM fca_enforcement_notices
      WHERE entity_name IS NOT NULL
        AND entity_name != 'Full legal name of firm or individual'
      GROUP BY entity_name
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, SUM(COALESCE(fine_amount, 0)) DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        entityName: row.entity_name,
        enforcementCount: parseInt(row.enforcement_count),
        totalFines: parseFloat(row.total_fines || 0),
        firstAction: row.first_action,
        latestAction: row.latest_action,
        outcomeTypes: row.outcome_types || [],
        breachTypes: row.breach_types || [],
        years: row.years || []
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting reoffenders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/entity/:entityName/history
 * Get full enforcement history for a specific entity
 */
router.get('/entity/:entityName/history', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();
    const { entityName } = req.params;

    const result = await pool.query(`
      SELECT
        publication_id,
        entity_name,
        notice_date,
        outcome_type,
        fine_amount,
        primary_breach_type,
        specific_breaches,
        ai_summary,
        key_findings,
        pdf_url
      FROM fca_enforcement_notices
      WHERE entity_name ILIKE $1
      ORDER BY notice_date DESC
    `, [entityName]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    // Calculate summary stats
    const totalFines = result.rows.reduce((sum, r) => sum + parseFloat(r.fine_amount || 0), 0);
    const years = [...new Set(result.rows.map(r => r.notice_date ? new Date(r.notice_date).getFullYear() : null).filter(Boolean))].sort();

    res.json({
      success: true,
      data: {
        entityName: result.rows[0].entity_name,
        enforcementCount: result.rows.length,
        totalFines,
        yearRange: years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : null,
        actions: result.rows.map(row => ({
          publicationId: row.publication_id,
          date: row.notice_date,
          outcomeType: row.outcome_type,
          fineAmount: parseFloat(row.fine_amount || 0),
          breachType: row.primary_breach_type,
          specificBreaches: row.specific_breaches,
          summary: row.ai_summary,
          keyFindings: row.key_findings,
          pdfUrl: row.pdf_url
        }))
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting entity history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/insights/themes
 * Get breach type trends over time
 */
router.get('/insights/themes', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();

    const result = await pool.query(`
      SELECT
        primary_breach_type,
        EXTRACT(YEAR FROM notice_date) as year,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        AVG(COALESCE(fine_amount, 0)) FILTER (WHERE fine_amount > 0) as avg_fine
      FROM fca_enforcement_notices
      WHERE notice_date IS NOT NULL AND primary_breach_type IS NOT NULL
      GROUP BY primary_breach_type, EXTRACT(YEAR FROM notice_date)
      ORDER BY primary_breach_type, year DESC
    `);

    // Organize by breach type
    const themes = {};
    result.rows.forEach(row => {
      const breachType = row.primary_breach_type;
      if (!themes[breachType]) {
        themes[breachType] = {
          breachType,
          totalCount: 0,
          totalFines: 0,
          yearlyData: []
        };
      }
      themes[breachType].totalCount += parseInt(row.count);
      themes[breachType].totalFines += parseFloat(row.total_fines || 0);
      themes[breachType].yearlyData.push({
        year: row.year ? parseInt(row.year) : null,
        count: parseInt(row.count),
        totalFines: parseFloat(row.total_fines || 0),
        avgFine: parseFloat(row.avg_fine || 0)
      });
    });

    res.json({
      success: true,
      data: Object.values(themes).sort((a, b) => b.totalFines - a.totalFines)
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting themes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/summary/:year
 * Get cached annual summary
 */
router.get('/summary/:year', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();
    const year = parseInt(req.params.year);

    if (isNaN(year) || year < 2000 || year > 2030) {
      return res.status(400).json({ success: false, error: 'Invalid year' });
    }

    const result = await pool.query(`
      SELECT * FROM fca_annual_summaries WHERE year = $1
    `, [year]);

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null, message: 'No summary cached for this year' });
    }

    res.json({
      success: true,
      data: {
        year: result.rows[0].year,
        summaryHtml: result.rows[0].summary_html,
        summaryText: result.rows[0].summary_text,
        generatedAt: result.rows[0].generated_at,
        modelUsed: result.rows[0].model_used
      }
    });
  } catch (error) {
    // Table might not exist yet
    if (error.code === '42P01') {
      return res.json({ success: true, data: null, message: 'Summary table not yet created' });
    }
    console.error('[PublicationsAPI] Error getting summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/summary/:year/data
 * Get raw data for a year (used for AI summary generation)
 */
router.get('/summary/:year/data', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();
    const year = parseInt(req.params.year);

    if (isNaN(year) || year < 2000 || year > 2030) {
      return res.status(400).json({ success: false, error: 'Invalid year' });
    }

    // Get all data needed for summary generation
    const [totals, outcomes, breaches, topCases, reoffenders] = await Promise.all([
      // Totals
      pool.query(`
        SELECT
          COUNT(*) as total_count,
          SUM(COALESCE(fine_amount, 0)) as total_fines,
          COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as with_fines
        FROM fca_enforcement_notices
        WHERE EXTRACT(YEAR FROM notice_date) = $1
      `, [year]),

      // Outcomes breakdown
      pool.query(`
        SELECT outcome_type, COUNT(*) as count, SUM(COALESCE(fine_amount, 0)) as total_fines
        FROM fca_enforcement_notices
        WHERE EXTRACT(YEAR FROM notice_date) = $1 AND outcome_type IS NOT NULL
        GROUP BY outcome_type ORDER BY count DESC
      `, [year]),

      // Breach types
      pool.query(`
        SELECT primary_breach_type, COUNT(*) as count, SUM(COALESCE(fine_amount, 0)) as total_fines
        FROM fca_enforcement_notices
        WHERE EXTRACT(YEAR FROM notice_date) = $1 AND primary_breach_type IS NOT NULL
        GROUP BY primary_breach_type ORDER BY total_fines DESC LIMIT 10
      `, [year]),

      // Top 5 biggest cases
      pool.query(`
        SELECT entity_name, fine_amount, outcome_type, primary_breach_type, ai_summary
        FROM fca_enforcement_notices
        WHERE EXTRACT(YEAR FROM notice_date) = $1 AND fine_amount > 0
        ORDER BY fine_amount DESC LIMIT 5
      `, [year]),

      // Reoffenders that year
      pool.query(`
        SELECT entity_name, COUNT(*) as count
        FROM fca_enforcement_notices
        WHERE EXTRACT(YEAR FROM notice_date) = $1 AND entity_name IS NOT NULL
        GROUP BY entity_name HAVING COUNT(*) > 1
        ORDER BY count DESC LIMIT 5
      `, [year])
    ]);

    // Get previous year for comparison
    const prevYear = await pool.query(`
      SELECT COUNT(*) as total_count, SUM(COALESCE(fine_amount, 0)) as total_fines
      FROM fca_enforcement_notices
      WHERE EXTRACT(YEAR FROM notice_date) = $1
    `, [year - 1]);

    res.json({
      success: true,
      data: {
        year,
        totals: {
          totalCount: parseInt(totals.rows[0]?.total_count || 0),
          totalFines: parseFloat(totals.rows[0]?.total_fines || 0),
          withFines: parseInt(totals.rows[0]?.with_fines || 0)
        },
        previousYear: {
          totalCount: parseInt(prevYear.rows[0]?.total_count || 0),
          totalFines: parseFloat(prevYear.rows[0]?.total_fines || 0)
        },
        outcomes: outcomes.rows.map(r => ({
          type: r.outcome_type,
          count: parseInt(r.count),
          totalFines: parseFloat(r.total_fines || 0)
        })),
        breachTypes: breaches.rows.map(r => ({
          type: r.primary_breach_type,
          count: parseInt(r.count),
          totalFines: parseFloat(r.total_fines || 0)
        })),
        topCases: topCases.rows.map(r => ({
          entityName: r.entity_name,
          fineAmount: parseFloat(r.fine_amount || 0),
          outcomeType: r.outcome_type,
          breachType: r.primary_breach_type,
          summary: r.ai_summary
        })),
        reoffenders: reoffenders.rows.map(r => ({
          entityName: r.entity_name,
          count: parseInt(r.count)
        }))
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting summary data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/publications/summary/:year/generate
 * Generate AI summary for a year
 */
router.post('/summary/:year/generate', allowFallback, async (req, res) => {
  try {
    const pool = pipeline?.pool || getDbPool();
    const year = parseInt(req.params.year);
    const { yearData } = req.body;

    if (isNaN(year) || year < 2000 || year > 2030) {
      return res.status(400).json({ success: false, error: 'Invalid year' });
    }

    if (!yearData) {
      return res.status(400).json({ success: false, error: 'Year data required' });
    }

    // Generate the summary using AI
    const summaryHtml = await generateAISummary(yearData);

    // Hash the data to detect staleness later
    const crypto = require('crypto');
    const dataHash = crypto.createHash('sha256')
      .update(JSON.stringify(yearData))
      .digest('hex')
      .substring(0, 64);

    // Store in database
    await pool.query(`
      INSERT INTO fca_annual_summaries (year, summary_html, summary_text, generated_at, model_used, data_hash)
      VALUES ($1, $2, $3, NOW(), $4, $5)
      ON CONFLICT (year) DO UPDATE SET
        summary_html = EXCLUDED.summary_html,
        summary_text = EXCLUDED.summary_text,
        generated_at = NOW(),
        model_used = EXCLUDED.model_used,
        data_hash = EXCLUDED.data_hash,
        updated_at = NOW()
    `, [year, summaryHtml, stripHtml(summaryHtml), 'deepseek-chat', dataHash]);

    res.json({
      success: true,
      data: {
        year,
        summary_html: summaryHtml,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error generating summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate AI summary using DeepSeek API
 */
async function generateAISummary(yearData) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    // Fallback to template-based summary if no API key
    return generateTemplateSummary(yearData);
  }

  const prompt = buildSummaryPrompt(yearData);

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a senior regulatory analyst writing a professional enforcement summary for compliance officers.
Write in flowing, professional prose - NO bullet points. Use formal but accessible language.
Structure the content with HTML headings (h2) for sections.
Include specific numbers and entity names where relevant.
The summary should be approximately 800-1000 words.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in API response');
    }

    // Format the content as HTML
    return formatAsHtml(content);
  } catch (error) {
    console.error('[generateAISummary] API error:', error);
    // Fallback to template
    return generateTemplateSummary(yearData);
  }
}

/**
 * Build the prompt for AI summary generation
 */
function buildSummaryPrompt(yearData) {
  const { year, totals, previousYear, outcomes, breachTypes, topCases, reoffenders } = yearData;

  // Calculate year-over-year changes
  const actionChange = previousYear.totalCount > 0
    ? ((totals.totalCount - previousYear.totalCount) / previousYear.totalCount * 100).toFixed(0)
    : null;
  const fineChange = previousYear.totalFines > 0
    ? ((totals.totalFines - previousYear.totalFines) / previousYear.totalFines * 100).toFixed(0)
    : null;

  return `Generate a professional regulatory enforcement summary for FCA actions in ${year}.

DATA PROVIDED:

TOTALS:
- Total enforcement actions: ${totals.totalCount.toLocaleString()}
- Total fines imposed: £${formatMoney(totals.totalFines)}
- Cases with fines: ${totals.withFines}
${actionChange ? `- Year-over-year change in actions: ${actionChange > 0 ? '+' : ''}${actionChange}%` : ''}
${fineChange ? `- Year-over-year change in fines: ${fineChange > 0 ? '+' : ''}${fineChange}%` : ''}

ENFORCEMENT OUTCOMES:
${outcomes.map(o => `- ${formatOutcomeType(o.type)}: ${o.count} cases (£${formatMoney(o.totalFines)} in fines)`).join('\n')}

TOP BREACH CATEGORIES:
${breachTypes.map(b => `- ${formatBreachType(b.type)}: ${b.count} cases (£${formatMoney(b.totalFines)})`).join('\n')}

BIGGEST CASES:
${topCases.map((c, i) => `${i + 1}. ${c.entityName}: £${formatMoney(c.fineAmount)} for ${formatBreachType(c.breachType)}`).join('\n')}

${reoffenders.length > 0 ? `REPEAT OFFENDERS THIS YEAR:\n${reoffenders.map(r => `- ${r.entityName}: ${r.count} actions`).join('\n')}` : ''}

REQUIRED SECTIONS (use <h2> headings):
1. Overview - Overall enforcement landscape summary
2. Enforcement Landscape - Analysis of action types and trends
3. Significant Cases - Discussion of notable cases and their implications
4. Recurring Themes - Common patterns and regulatory focus areas
5. Key Takeaways for Firms - Practical compliance implications

Write in professional prose. NO bullet points. Be specific with numbers and entity names.`;
}

/**
 * Format raw text content as HTML
 */
function formatAsHtml(content) {
  // Clean up any markdown-style formatting
  let html = content
    // Convert markdown headers to HTML
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Convert markdown bold to HTML
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert markdown italic to HTML
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Convert line breaks to paragraphs
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => {
      p = p.trim();
      // Don't wrap if it's already an HTML element
      if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<p')) {
        return p;
      }
      return `<p>${p}</p>`;
    })
    .join('\n');

  return html;
}

/**
 * Generate a template-based summary when AI is unavailable
 */
function generateTemplateSummary(yearData) {
  const { year, totals, previousYear, outcomes, breachTypes, topCases } = yearData;

  const actionChange = previousYear.totalCount > 0
    ? ((totals.totalCount - previousYear.totalCount) / previousYear.totalCount * 100).toFixed(0)
    : null;

  const topOutcome = outcomes[0];
  const topBreach = breachTypes[0];
  const biggestCase = topCases[0];

  return `
<h2>Overview</h2>
<p>The Financial Conduct Authority took <strong>${totals.totalCount.toLocaleString()}</strong> enforcement actions in ${year}, with total financial penalties reaching <strong>£${formatMoney(totals.totalFines)}</strong>.${actionChange ? ` This represents a ${Math.abs(actionChange)}% ${actionChange > 0 ? 'increase' : 'decrease'} compared to the previous year.` : ''}</p>

<h2>Enforcement Landscape</h2>
<p>${topOutcome ? `${formatOutcomeType(topOutcome.type)} actions dominated the regulatory response, accounting for ${topOutcome.count} of all enforcement actions. ` : ''}The FCA continued its focus on maintaining market integrity and protecting consumers through a combination of financial penalties, authorisation withdrawals, and individual prohibitions.</p>

<h2>Significant Cases</h2>
${biggestCase ? `
<p>The year's largest penalty was the <strong>£${formatMoney(biggestCase.fineAmount)}</strong> fine imposed on <strong>${biggestCase.entityName}</strong> for ${formatBreachType(biggestCase.breachType).toLowerCase()} failings.${biggestCase.summary ? ` ${biggestCase.summary}` : ''}</p>
` : '<p>Detailed case information is available in the enforcement notices database.</p>'}

<h2>Recurring Themes</h2>
<p>${topBreach ? `${formatBreachType(topBreach.type)} breaches emerged as the primary focus of regulatory action in ${year}, reflecting the FCA's continued emphasis on this area. ` : ''}Firms should review their control frameworks against the patterns identified in this year's enforcement activity.</p>

<h2>Key Takeaways for Firms</h2>
<div class="takeaways">
<p>Compliance teams should take particular note of the FCA's enforcement priorities in ${year}. The regulatory focus on ${topBreach ? formatBreachType(topBreach.type).toLowerCase() : 'systems and controls'} underscores the importance of robust governance arrangements. Firms are advised to conduct thorough gap analyses against the common failings identified in enforcement notices and ensure their compliance frameworks adequately address these risk areas.</p>
</div>
`;
}

/**
 * Helper to format money amounts
 */
function formatMoney(amount) {
  if (!amount || amount === 0) return '0';
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1) + 'B';
  }
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'K';
  }
  return amount.toLocaleString();
}

/**
 * Format outcome type for display
 */
function formatOutcomeType(type) {
  if (!type) return 'Unknown';
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Format breach type for display
 */
function formatBreachType(type) {
  if (!type) return 'Unknown';
  const names = {
    'AML': 'Anti-Money Laundering',
    'PRINCIPLES': 'FCA Principles',
    'SYSTEMS_CONTROLS': 'Systems and Controls',
    'MARKET_ABUSE': 'Market Abuse',
    'MIS_SELLING': 'Mis-selling',
    'CLIENT_MONEY': 'Client Money',
    'CONDUCT': 'Conduct',
    'PRUDENTIAL': 'Prudential',
    'REPORTING': 'Regulatory Reporting',
    'GOVERNANCE': 'Governance',
    'FINANCIAL_CRIME': 'Financial Crime',
    'COMPLAINTS': 'Complaints Handling',
    'FINANCIAL_PROMOTIONS': 'Financial Promotions',
    'APPROVED_PERSONS': 'Approved Persons'
  };
  return names[type] || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  router,
  setPipeline
};
