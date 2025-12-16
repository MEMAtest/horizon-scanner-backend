const fs = require('fs')
const path = require('path')

function applyDatabaseMethods(ServiceClass) {
  ServiceClass.prototype.initializeDatabase = async function() {
    try {
      console.log('🗄️ Initializing FCA fines database schema...')

      const existsResult = await this.db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'fca_fines'
        )
      `)

      if (existsResult.rows[0].exists) {
        console.log('✅ FCA fines database schema already exists')
        return
      }

      const schemaPath = path.join(__dirname, '../../sql/fca_fines_schema.sql')
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8')
        await this.db.query(schema)
        console.log('✅ FCA fines database schema initialized successfully')
      } else {
        console.log('⚠️ Schema file not found, skipping database initialization')
      }
    } catch (error) {
      console.error('❌ Error initializing database:', error)
      throw error
    }
  }

  ServiceClass.prototype.saveFine = async function(fine, forceScrape = false) {
    try {
      if (!forceScrape) {
        // Only check for duplicates based on actual data (firm, date, amount)
        // NOT the generated fine_reference which may collide with existing sequential IDs
        const existing = await this.db.query(
          'SELECT id, fine_reference FROM fca_fines WHERE firm_individual = $1 AND date_issued = $2 AND amount = $3',
          [fine.firm_individual, fine.date_issued, fine.amount]
        )

        if (existing.rows.length > 0) {
          return { isNew: false, id: existing.rows[0].id }
        }
      }

      // Generate a unique fine_reference based on firm name hash + date to avoid collisions
      const existingRefCheck = await this.db.query(
        'SELECT id FROM fca_fines WHERE fine_reference = $1',
        [fine.fine_reference]
      )

      // If the generated reference already exists, create a more unique one
      if (existingRefCheck.rows.length > 0) {
        const firmHash = fine.firm_individual.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
        const dateStr = fine.date_issued.toISOString().split('T')[0].replace(/-/g, '')
        fine.fine_reference = `FCA-${dateStr}-${firmHash}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      }

      const query = `
        INSERT INTO fca_fines (
          fine_reference, date_issued, firm_individual, amount, amount_text,
          summary, breach_type, breach_categories, firm_category, final_notice_url, press_release_url,
          year_issued, month_issued, quarter_issued, scraped_content, source_url, processing_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `

      const result = await this.db.query(query, [
        fine.fine_reference,
        fine.date_issued,
        fine.firm_individual,
        fine.amount,
        fine.amount_text,
        fine.summary,
        fine.breach_type,
        JSON.stringify(fine.breach_categories || []),
        fine.firm_category,
        fine.final_notice_url,
        fine.press_release_url,
        fine.year_issued,
        fine.month_issued,
        fine.quarter_issued,
        fine.scraped_content,
        fine.source_url,
        fine.processing_status
      ])

      return { isNew: true, id: result.rows[0].id }
    } catch (error) {
      console.error('Error saving fine:', error)
      throw error
    }
  }

  ServiceClass.prototype.startScrapingLog = async function() {
    const result = await this.db.query(
      'INSERT INTO fca_scraping_log (scrape_date, status) VALUES (CURRENT_DATE, $1) RETURNING id',
      ['in_progress']
    )
    return result.rows[0].id
  }

  ServiceClass.prototype.completeScrapingLog = async function(id, updates) {
    await this.db.query(
      `UPDATE fca_scraping_log
       SET status = $2, completed_at = CURRENT_TIMESTAMP, error_message = $3
       WHERE id = $1`,
      [id, updates.status, updates.errors]
    )
  }

  ServiceClass.prototype.close = async function() {
    await this.db.end()
  }
}

module.exports = applyDatabaseMethods
