/**
 * Publications API - Annual Summary Routes
 * Summary retrieval and AI generation endpoints
 */

const express = require('express');
const router = express.Router();
const { getDbPool, getPipeline, allowFallback } = require('./helpers');

/**
 * GET /api/publications/summary/:year
 * Get cached annual summary
 */
router.get('/summary/:year', allowFallback, async (req, res) => {
  try {
    const pool = getPipeline()?.pool || getDbPool();
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
    // Table might not exist yet - try to create it
    if (error.code === '42P01') {
      console.log('[PublicationsAPI] Creating fca_annual_summaries table...');
      try {
        const pool = getPipeline()?.pool || getDbPool();
        await pool.query(`
          CREATE TABLE IF NOT EXISTS fca_annual_summaries (
            id SERIAL PRIMARY KEY,
            year INTEGER UNIQUE NOT NULL,
            summary_html TEXT,
            summary_text TEXT,
            total_fines DECIMAL(15,2),
            total_cases INTEGER,
            top_breaches JSONB DEFAULT '[]'::jsonb,
            top_entities JSONB DEFAULT '[]'::jsonb,
            key_themes JSONB DEFAULT '[]'::jsonb,
            model_used VARCHAR(100),
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            data_hash VARCHAR(64),
            is_stale BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('[PublicationsAPI] fca_annual_summaries table created');
      } catch (createErr) {
        console.warn('[PublicationsAPI] Could not create fca_annual_summaries table:', createErr.message);
      }
      return res.json({ success: true, data: null, message: 'Summary table initialized - no cached summary yet' });
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
    const pool = getPipeline()?.pool || getDbPool();
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
    const pool = getPipeline()?.pool || getDbPool();
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

module.exports = router;
