/**
 * Publications API - Enforcement Notices
 * CRUD and search endpoints
 */

const express = require('express');
const router = express.Router();
const { getDbPool, getPipeline, allowFallback, requirePipeline } = require('./helpers');

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

    const pipeline = getPipeline();
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
      if (from_date) {
        whereClause += ` AND notice_date >= $${paramIndex++}`;
        params.push(from_date);
      }
      if (to_date) {
        whereClause += ` AND notice_date <= $${paramIndex++}`;
        params.push(to_date);
      }
      if (min_fine) {
        whereClause += ` AND fine_amount >= $${paramIndex++}`;
        params.push(parseFloat(min_fine));
      }
      if (max_fine) {
        whereClause += ` AND fine_amount <= $${paramIndex++}`;
        params.push(parseFloat(max_fine));
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
router.get('/notices/:id', allowFallback, async (req, res) => {
  try {
    const pipeline = getPipeline();

    if (pipeline) {
      const notice = await pipeline.getNotice(req.params.id);
      if (!notice) {
        return res.status(404).json({
          success: false,
          error: 'Notice not found'
        });
      }
      return res.json({ success: true, data: notice });
    }

    // DB fallback
    const pool = getDbPool();
    const result = await pool.query(`
      SELECT
        publication_id, entity_name, entity_type, frn, outcome_type,
        fine_amount, primary_breach_type, handbook_references,
        consumer_impact_level, risk_score, ai_summary, notice_date,
        key_findings, specific_breaches, pdf_url, created_at, updated_at
      FROM fca_enforcement_notices
      WHERE publication_id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting notice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/publications/search
 * Full text search
 */
router.get('/search', allowFallback, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 3 characters'
      });
    }

    const pipeline = getPipeline();

    if (pipeline) {
      const results = await pipeline.searchFullText(q, parseInt(limit));
      return res.json({ success: true, data: results });
    }

    // DB fallback - use PostgreSQL full-text search
    const pool = getDbPool();
    const result = await pool.query(`
      SELECT
        publication_id, entity_name, entity_type, frn, outcome_type,
        fine_amount, primary_breach_type, ai_summary, notice_date, pdf_url,
        ts_rank(
          to_tsvector('english', COALESCE(entity_name, '') || ' ' || COALESCE(ai_summary, '') || ' ' || COALESCE(primary_breach_type, '')),
          plainto_tsquery('english', $1)
        ) as rank
      FROM fca_enforcement_notices
      WHERE to_tsvector('english', COALESCE(entity_name, '') || ' ' || COALESCE(ai_summary, '') || ' ' || COALESCE(primary_breach_type, ''))
            @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC, notice_date DESC
      LIMIT $2
    `, [q, parseInt(limit)]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[PublicationsAPI] Error searching:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
