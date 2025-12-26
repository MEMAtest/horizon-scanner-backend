const { getCommonStyles } = require('../templates/commonStyles')
const { getSidebar } = require('../templates/sidebar')
const { getCommonClientScripts } = require('../templates/clientScripts')
const { renderSummaryPage } = require('../../views/publications/summaryLayout')
const { Pool } = require('pg')

// Database pool (created on demand)
let dbPool = null

function getDbPool() {
  if (!dbPool && process.env.DATABASE_URL) {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  }
  return dbPool
}

async function summaryPage(req, res) {
  try {
    const year = parseInt(req.params.year, 10)

    // Validate year
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
      return res.status(400).send('Invalid year')
    }

    console.log(`[summary] page requested for year: ${year}`)

    // Fetch summary from database (if exists)
    let summary = null
    let stats = null

    const pool = getDbPool()
    if (pool) {
      try {
        // Get cached summary
        const summaryResult = await pool.query(
          `SELECT * FROM fca_annual_summaries WHERE year = $1`,
          [year]
        )
        if (summaryResult.rows.length > 0) {
          summary = summaryResult.rows[0]
        }

        // Get basic stats for the year
        const statsResult = await pool.query(`
          SELECT
            COUNT(*) as total_actions,
            SUM(COALESCE(fine_amount, 0)) as total_fines,
            COUNT(DISTINCT outcome_type) as outcome_types,
            COUNT(DISTINCT primary_breach_type) as breach_types
          FROM fca_enforcement_notices
          WHERE EXTRACT(YEAR FROM notice_date) = $1
        `, [year])

        if (statsResult.rows.length > 0) {
          stats = {
            totalActions: parseInt(statsResult.rows[0].total_actions, 10) || 0,
            totalFines: parseFloat(statsResult.rows[0].total_fines) || 0,
            outcomeTypes: parseInt(statsResult.rows[0].outcome_types, 10) || 0,
            breachTypes: parseInt(statsResult.rows[0].breach_types, 10) || 0
          }
        }
      } catch (dbError) {
        console.error('[summaryPage] Database error:', dbError.message)
      }
    } else {
      console.warn('[summaryPage] No DATABASE_URL configured')
    }

    const sidebar = await getSidebar('publications')
    const html = renderSummaryPage({
      sidebar,
      commonStyles: getCommonStyles(),
      commonClientScripts: getCommonClientScripts(),
      year,
      summary,
      stats
    })

    res.send(html)
  } catch (error) {
    console.error('[error] Error rendering summary page:', error)
    res.status(500).send(`
      <html>
        <head>
          <title>Error - Annual Summary</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f8fafc;
            }
            .error-container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              max-width: 500px;
            }
            h1 { color: #dc2626; }
            a {
              color: #4f46e5;
              text-decoration: none;
              padding: 10px 20px;
              border: 1px solid #4f46e5;
              border-radius: 6px;
              display: inline-block;
              margin-top: 20px;
            }
            a:hover {
              background: #4f46e5;
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>&#10060; Error Loading Summary</h1>
            <p>${error.message}</p>
            <a href="/publications">&larr; Back to Publications</a>
          </div>
        </body>
      </html>
    `)
  }
}

module.exports = summaryPage
