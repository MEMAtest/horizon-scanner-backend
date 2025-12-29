/**
 * Publications API - Entity Routes
 * Entity history and AI summary endpoints
 */

const express = require('express');
const router = express.Router();
const { getDbPool, getPipeline, allowFallback } = require('./helpers');

// AI Analyzer for entity summaries
let aiAnalyzer = null;
try {
  aiAnalyzer = require('../../../services/aiAnalyzer');
} catch (err) {
  console.warn('[PublicationsAPI] AI Analyzer not available:', err.message);
}

// In-memory cache for entity summaries (expires after 24 hours)
const entitySummaryCache = new Map();
const SUMMARY_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * GET /api/publications/entity/:entityName/history
 * Get full enforcement history for a specific entity
 */
router.get('/entity/:entityName/history', allowFallback, async (req, res) => {
  try {
    const pool = getPipeline()?.pool || getDbPool();
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
 * GET /api/publications/entity/:entityName/summary
 * Get AI-generated summary for a repeat offender
 * Returns a 2-4 sentence contextual analysis of the entity's enforcement history
 * Now checks pre-generated summaries in database first for instant response
 */
router.get('/entity/:entityName/summary', allowFallback, async (req, res) => {
  try {
    const { entityName } = req.params;
    const cacheKey = entityName.toLowerCase().trim();
    const pool = getPipeline()?.pool || getDbPool();

    // Check database for pre-generated summary FIRST (instant response)
    try {
      const preGenerated = await pool.query(
        `SELECT summary, summary_html, enforcement_count, total_fines, breach_types, years, generated_at
         FROM entity_summaries WHERE LOWER(entity_name) = LOWER($1)`,
        [entityName]
      );

      if (preGenerated.rows.length > 0) {
        const stored = preGenerated.rows[0];
        console.log(`[PublicationsAPI] Pre-generated summary found for: ${entityName}`);

        // Update access count
        pool.query(
          `UPDATE entity_summaries SET last_accessed_at = NOW(), access_count = access_count + 1 WHERE LOWER(entity_name) = LOWER($1)`,
          [entityName]
        ).catch(() => {}); // Fire and forget

        return res.json({
          success: true,
          data: {
            summary: stored.summary_html || stored.summary,
            aiGenerated: true,
            preGenerated: true,
            enforcementCount: stored.enforcement_count,
            totalFines: parseFloat(stored.total_fines || 0),
            breachTypes: stored.breach_types || [],
            years: stored.years || [],
            generatedAt: stored.generated_at
          }
        });
      }
    } catch (dbErr) {
      // Table doesn't exist - try to create it
      if (dbErr.code === '42P01') {
        console.log('[PublicationsAPI] Creating entity_summaries table...');
        try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS entity_summaries (
              id SERIAL PRIMARY KEY,
              entity_name VARCHAR(500) UNIQUE NOT NULL,
              summary TEXT,
              summary_html TEXT,
              enforcement_count INTEGER DEFAULT 0,
              total_fines DECIMAL(15,2) DEFAULT 0,
              breach_types JSONB DEFAULT '[]'::jsonb,
              years JSONB DEFAULT '[]'::jsonb,
              ai_model_used VARCHAR(100),
              generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              data_hash VARCHAR(64),
              is_stale BOOLEAN DEFAULT FALSE,
              last_accessed_at TIMESTAMP,
              access_count INTEGER DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          console.log('[PublicationsAPI] entity_summaries table created');
        } catch (createErr) {
          console.warn('[PublicationsAPI] Could not create entity_summaries table:', createErr.message);
        }
      } else {
        console.log('[PublicationsAPI] Pre-generated summary lookup failed:', dbErr.message);
      }
    }

    // Check memory cache second
    const cached = entitySummaryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < SUMMARY_CACHE_EXPIRY) {
      console.log(`[PublicationsAPI] Entity summary cache hit for: ${entityName}`);
      return res.json({ success: true, data: cached.data, cached: true });
    }

    // Get entity history for on-demand generation
    const result = await pool.query(`
      SELECT
        entity_name,
        notice_date,
        outcome_type,
        fine_amount,
        primary_breach_type,
        ai_summary
      FROM fca_enforcement_notices
      WHERE entity_name ILIKE $1
      ORDER BY notice_date DESC
    `, [entityName]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    // Calculate summary stats for prompt
    const actions = result.rows;
    const totalFines = actions.reduce((sum, r) => sum + parseFloat(r.fine_amount || 0), 0);
    const years = [...new Set(actions.map(r => r.notice_date ? new Date(r.notice_date).getFullYear() : null).filter(Boolean))].sort();
    const breachTypes = [...new Set(actions.map(r => r.primary_breach_type).filter(Boolean))];
    const outcomeTypes = [...new Set(actions.map(r => r.outcome_type).filter(Boolean))];

    // If no AI analyzer available, generate a basic summary
    if (!aiAnalyzer) {
      const basicSummary = generateBasicEntitySummary({
        entityName: actions[0].entity_name,
        count: actions.length,
        totalFines,
        years,
        breachTypes,
        outcomeTypes
      });

      entitySummaryCache.set(cacheKey, {
        timestamp: Date.now(),
        data: { summary: basicSummary, aiGenerated: false }
      });

      return res.json({
        success: true,
        data: { summary: basicSummary, aiGenerated: false }
      });
    }

    // Generate AI summary
    const prompt = `Based on this entity's FCA enforcement history, write a 2-4 sentence summary explaining the pattern of violations and what this suggests about their compliance posture. Be specific and analytical.

Entity: ${actions[0].entity_name}
Total enforcement actions: ${actions.length}
Year range: ${years.length > 0 ? `${Math.min(...years)} to ${Math.max(...years)}` : 'Unknown'}
Breach types: ${breachTypes.join(', ') || 'Various'}
Outcome types: ${outcomeTypes.join(', ') || 'Various'}
Total fines: £${totalFines.toLocaleString()}

Individual action summaries:
${actions.slice(0, 5).map((a, i) => `${i + 1}. ${a.notice_date ? new Date(a.notice_date).getFullYear() : '?'}: ${a.primary_breach_type || 'Unknown breach'} - ${a.outcome_type || 'enforcement action'}${a.fine_amount > 0 ? ` (£${parseFloat(a.fine_amount).toLocaleString()})` : ''}`).join('\n')}

Respond with a JSON object: { "summary": "Your 2-4 sentence analytical summary here" }`;

    try {
      const aiResponse = await aiAnalyzer.makeGroqRequest(prompt);
      const content = aiResponse.choices?.[0]?.message?.content || '';

      // Parse JSON response
      let summary = '';
      try {
        const parsed = JSON.parse(content);
        summary = parsed.summary || '';
      } catch (parseErr) {
        // Try to extract summary from non-JSON response
        summary = content.replace(/```json\n?|\n?```/g, '').trim();
        if (summary.startsWith('{')) {
          try {
            const parsed = JSON.parse(summary);
            summary = parsed.summary || summary;
          } catch (e) {
            // Keep as-is
          }
        }
      }

      if (!summary || summary.length < 20) {
        throw new Error('AI response too short or invalid');
      }

      // Cache the result
      entitySummaryCache.set(cacheKey, {
        timestamp: Date.now(),
        data: { summary, aiGenerated: true }
      });

      res.json({ success: true, data: { summary, aiGenerated: true } });
    } catch (aiError) {
      console.error('[PublicationsAPI] AI summary generation failed:', aiError.message);

      // Fallback to basic summary
      const basicSummary = generateBasicEntitySummary({
        entityName: actions[0].entity_name,
        count: actions.length,
        totalFines,
        years,
        breachTypes,
        outcomeTypes
      });

      entitySummaryCache.set(cacheKey, {
        timestamp: Date.now(),
        data: { summary: basicSummary, aiGenerated: false }
      });

      res.json({
        success: true,
        data: { summary: basicSummary, aiGenerated: false }
      });
    }
  } catch (error) {
    console.error('[PublicationsAPI] Error getting entity summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate a basic entity summary without AI
 */
function generateBasicEntitySummary({ entityName, count, totalFines, years, breachTypes, outcomeTypes }) {
  const yearSpan = years.length > 1
    ? `between ${Math.min(...years)} and ${Math.max(...years)}`
    : years.length === 1
      ? `in ${years[0]}`
      : '';

  const breachText = breachTypes.length > 0
    ? `primarily involving ${breachTypes.slice(0, 2).join(' and ')}`
    : '';

  const fineText = totalFines > 0
    ? `totaling £${totalFines.toLocaleString()} in fines`
    : '';

  return `${entityName} has faced ${count} FCA enforcement action${count > 1 ? 's' : ''} ${yearSpan}${breachText ? `, ${breachText}` : ''}${fineText ? `, ${fineText}` : ''}. ${count > 2 ? 'This pattern of repeated regulatory issues suggests persistent compliance weaknesses that require significant operational improvements.' : count > 1 ? 'Multiple enforcement actions indicate ongoing compliance challenges.' : ''}`;
}

module.exports = router;
