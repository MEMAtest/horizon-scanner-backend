/**
 * FCA Publications Database Operations
 *
 * Handles all database interactions for the publications pipeline
 */

const { Pool } = require('pg');
const { BATCH_SIZES, PROCESSING_STATUS } = require('./constants');

class PublicationsDatabase {
  constructor(connectionString) {
    this.connectionString = connectionString || process.env.DATABASE_URL;
    this.pool = null;
    this.initialized = false;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.initialized = true;
      console.log('[PublicationsDB] Database connection established');
    } catch (error) {
      console.error('[PublicationsDB] Failed to connect:', error.message);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.initialized = false;
      console.log('[PublicationsDB] Database connection closed');
    }
  }

  // ============================================================
  // PUBLICATIONS INDEX OPERATIONS
  // ============================================================

  /**
   * Insert a publication into the index
   */
  async insertPublication(publication) {
    const query = `
      INSERT INTO fca_publications_index (
        publication_id, title, document_type, publication_date,
        url, pdf_url, description, year_published, month_published, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (publication_id) DO UPDATE SET
        title = EXCLUDED.title,
        pdf_url = COALESCE(EXCLUDED.pdf_url, fca_publications_index.pdf_url),
        description = COALESCE(EXCLUDED.description, fca_publications_index.description),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

    const date = publication.publicationDate ? new Date(publication.publicationDate) : null;
    const values = [
      publication.publicationId,
      publication.title,
      publication.documentType,
      date,
      publication.url,
      publication.pdfUrl,
      publication.description,
      date ? date.getFullYear() : null,
      date ? date.getMonth() + 1 : null,
      PROCESSING_STATUS.PENDING
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Batch insert publications
   */
  async insertPublicationsBatch(publications) {
    const client = await this.pool.connect();
    let inserted = 0;
    let updated = 0;

    try {
      await client.query('BEGIN');

      for (const pub of publications) {
        const result = await client.query(`
          INSERT INTO fca_publications_index (
            publication_id, title, document_type, publication_date,
            url, pdf_url, description, year_published, month_published, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (publication_id) DO UPDATE SET
            title = EXCLUDED.title,
            pdf_url = COALESCE(EXCLUDED.pdf_url, fca_publications_index.pdf_url),
            updated_at = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS is_insert
        `, [
          pub.publicationId,
          pub.title,
          pub.documentType,
          pub.publicationDate ? new Date(pub.publicationDate) : null,
          pub.url,
          pub.pdfUrl,
          pub.description,
          pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : null,
          pub.publicationDate ? new Date(pub.publicationDate).getMonth() + 1 : null,
          PROCESSING_STATUS.PENDING
        ]);

        if (result.rows[0]?.is_insert) {
          inserted++;
        } else {
          updated++;
        }
      }

      await client.query('COMMIT');
      return { inserted, updated };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get publications by status
   */
  async getPublicationsByStatus(status, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM fca_publications_index
      WHERE status = $1
      ORDER BY scraped_at ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [status, limit, offset]);
    return result.rows;
  }

  /**
   * Get publications pending download (have PDF URL but not downloaded)
   */
  async getPendingDownloads(limit = 100) {
    const query = `
      SELECT * FROM fca_publications_index
      WHERE status = $1
        AND pdf_url IS NOT NULL
        AND retry_count < 3
      ORDER BY publication_date DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [PROCESSING_STATUS.PENDING, limit]);
    return result.rows;
  }

  /**
   * Get publications pending parsing
   */
  async getPendingParses(limit = 100) {
    const query = `
      SELECT * FROM fca_publications_index
      WHERE status = $1
        AND pdf_local_path IS NOT NULL
        AND retry_count < 3
      ORDER BY pdf_downloaded_at ASC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [PROCESSING_STATUS.DOWNLOADED, limit]);
    return result.rows;
  }

  /**
   * Get publications pending AI processing
   * Only processes enforcement-type documents for cost efficiency
   */
  async getPendingAIProcessing(limit = 50) {
    const enforcementTypes = ['final_notice', 'decision_notice', 'warning_notice', 'supervisory_notice'];
    const query = `
      SELECT pi.*,
             pft.full_text
      FROM fca_publications_index pi
      LEFT JOIN fca_publication_full_text pft ON pi.publication_id = pft.publication_id
      WHERE pi.status = $1
        AND pi.raw_text_length > 100
        AND pi.retry_count < 3
        AND pi.document_type = ANY($3)
      ORDER BY pi.parsed_at ASC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [PROCESSING_STATUS.PARSED, limit, enforcementTypes]);
    return result.rows;
  }

  /**
   * Update publication status
   */
  async updatePublicationStatus(publicationId, status, additionalFields = {}) {
    const setFields = ['status = $2'];
    const values = [publicationId, status];
    let paramIndex = 3;

    // Add timestamp based on status
    if (status === PROCESSING_STATUS.DOWNLOADED) {
      setFields.push('pdf_downloaded_at = CURRENT_TIMESTAMP');
    } else if (status === PROCESSING_STATUS.PARSED) {
      setFields.push('parsed_at = CURRENT_TIMESTAMP');
    } else if (status === PROCESSING_STATUS.PROCESSED) {
      setFields.push('processed_at = CURRENT_TIMESTAMP');
    }

    // Add additional fields
    for (const [key, value] of Object.entries(additionalFields)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      setFields.push(`${snakeKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    const query = `
      UPDATE fca_publications_index
      SET ${setFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE publication_id = $1
    `;

    await this.pool.query(query, values);
  }

  /**
   * Increment retry count for failed operations
   */
  async incrementRetryCount(publicationId, errorMessage) {
    const query = `
      UPDATE fca_publications_index
      SET retry_count = retry_count + 1,
          last_retry_at = CURRENT_TIMESTAMP,
          error_message = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE publication_id = $1
    `;
    await this.pool.query(query, [publicationId, errorMessage]);
  }

  /**
   * Check if publication exists
   */
  async publicationExists(publicationId) {
    const query = 'SELECT 1 FROM fca_publications_index WHERE publication_id = $1';
    const result = await this.pool.query(query, [publicationId]);
    return result.rows.length > 0;
  }

  /**
   * Get publication count by status
   */
  async getStatusCounts() {
    const query = `
      SELECT status, COUNT(*) as count
      FROM fca_publications_index
      GROUP BY status
    `;
    const result = await this.pool.query(query);
    return result.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});
  }

  // ============================================================
  // ENFORCEMENT NOTICES OPERATIONS
  // ============================================================

  /**
   * Insert enforcement notice (processed data)
   */
  async insertEnforcementNotice(notice) {
    const query = `
      INSERT INTO fca_enforcement_notices (
        publication_id, entity_name, entity_type, frn, trading_names,
        outcome_type, fine_amount, fine_currency, fine_discounted,
        discount_percentage, original_fine_amount, early_settlement,
        primary_breach_type, specific_breaches, handbook_references,
        breach_categories, regulations_cited,
        relevant_period_start, relevant_period_end, relevant_period_description,
        notice_date, effective_date,
        remediation_actions, remediation_deadline, s166_required,
        voluntary_requirements, past_business_review, redress_scheme,
        key_findings, aggravating_factors, mitigating_factors,
        consumer_impact_level, consumer_impact_description,
        redress_required, estimated_consumer_harm, customers_affected,
        systemic_risk, systemic_risk_reasoning, market_impact,
        precedent_setting, precedent_notes,
        ai_summary, ai_analysis, ai_confidence_score, ai_model_used, ai_processed_at,
        risk_score, pdf_url, pdf_local_path, raw_text_excerpt, full_text_stored
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51
      )
      ON CONFLICT (publication_id) DO UPDATE SET
        entity_name = EXCLUDED.entity_name,
        ai_summary = EXCLUDED.ai_summary,
        ai_analysis = EXCLUDED.ai_analysis,
        ai_confidence_score = EXCLUDED.ai_confidence_score,
        ai_processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

    const values = [
      notice.publicationId,
      notice.entityName,
      notice.entityType,
      notice.frn,
      JSON.stringify(notice.tradingNames || []),
      notice.outcomeType,
      notice.fineAmount,
      notice.fineCurrency || 'GBP',
      notice.fineDiscounted || false,
      notice.discountPercentage,
      notice.originalFineAmount,
      notice.earlySettlement || false,
      notice.primaryBreachType,
      JSON.stringify(notice.specificBreaches || []),
      JSON.stringify(notice.handbookReferences || []),
      JSON.stringify(notice.breachCategories || []),
      JSON.stringify(notice.regulationsCited || []),
      notice.relevantPeriodStart,
      notice.relevantPeriodEnd,
      notice.relevantPeriodDescription,
      notice.noticeDate,
      notice.effectiveDate,
      JSON.stringify(notice.remediationActions || []),
      notice.remediationDeadline,
      notice.s166Required || false,
      JSON.stringify(notice.voluntaryRequirements || []),
      notice.pastBusinessReview || false,
      notice.redressScheme || false,
      JSON.stringify(notice.keyFindings || []),
      JSON.stringify(notice.aggravatingFactors || []),
      JSON.stringify(notice.mitigatingFactors || []),
      notice.consumerImpactLevel,
      notice.consumerImpactDescription,
      notice.redressRequired || false,
      notice.estimatedConsumerHarm,
      notice.customersAffected,
      notice.systemicRisk || false,
      notice.systemicRiskReasoning,
      notice.marketImpact || false,
      notice.precedentSetting || false,
      notice.precedentNotes,
      notice.aiSummary,
      JSON.stringify(notice.aiAnalysis || {}),
      notice.aiConfidenceScore,
      notice.aiModelUsed,
      notice.aiProcessedAt || new Date(),
      notice.riskScore,
      notice.pdfUrl,
      notice.pdfLocalPath,
      notice.rawTextExcerpt,
      notice.fullTextStored || false
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get enforcement notices with filters
   */
  async searchEnforcementNotices(filters = {}, limit = 50, offset = 0) {
    let query = `
      SELECT en.*, pi.document_type, pi.pdf_url as source_pdf
      FROM fca_enforcement_notices en
      JOIN fca_publications_index pi ON en.publication_id = pi.publication_id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (filters.outcomeType) {
      query += ` AND en.outcome_type = $${paramIndex}`;
      values.push(filters.outcomeType);
      paramIndex++;
    }

    if (filters.breachType) {
      query += ` AND en.primary_breach_type = $${paramIndex}`;
      values.push(filters.breachType);
      paramIndex++;
    }

    if (filters.handbookRef) {
      query += ` AND en.handbook_references @> $${paramIndex}::jsonb`;
      values.push(JSON.stringify([filters.handbookRef]));
      paramIndex++;
    }

    if (filters.frn) {
      query += ` AND en.frn = $${paramIndex}`;
      values.push(filters.frn);
      paramIndex++;
    }

    if (filters.minFine) {
      query += ` AND en.fine_amount >= $${paramIndex}`;
      values.push(filters.minFine);
      paramIndex++;
    }

    if (filters.maxFine) {
      query += ` AND en.fine_amount <= $${paramIndex}`;
      values.push(filters.maxFine);
      paramIndex++;
    }

    if (filters.fromDate) {
      query += ` AND en.notice_date >= $${paramIndex}`;
      values.push(filters.fromDate);
      paramIndex++;
    }

    if (filters.toDate) {
      query += ` AND en.notice_date <= $${paramIndex}`;
      values.push(filters.toDate);
      paramIndex++;
    }

    if (filters.entityName) {
      query += ` AND en.entity_name ILIKE $${paramIndex}`;
      values.push(`%${filters.entityName}%`);
      paramIndex++;
    }

    query += ` ORDER BY en.notice_date DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Get enforcement notice by publication ID
   */
  async getEnforcementNotice(publicationId) {
    const query = `
      SELECT en.*, pi.document_type, pi.pdf_url as source_pdf, pi.title
      FROM fca_enforcement_notices en
      JOIN fca_publications_index pi ON en.publication_id = pi.publication_id
      WHERE en.publication_id = $1
    `;
    const result = await this.pool.query(query, [publicationId]);
    return result.rows[0];
  }

  // ============================================================
  // FULL TEXT OPERATIONS
  // ============================================================

  /**
   * Store full text of publication
   */
  async storeFullText(publicationId, fullText) {
    const query = `
      INSERT INTO fca_publication_full_text (
        publication_id, full_text, text_length, word_count
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (publication_id) DO UPDATE SET
        full_text = EXCLUDED.full_text,
        text_length = EXCLUDED.text_length,
        word_count = EXCLUDED.word_count
    `;

    const wordCount = fullText.split(/\s+/).length;
    await this.pool.query(query, [
      publicationId,
      fullText,
      fullText.length,
      wordCount
    ]);
  }

  /**
   * Full text search
   */
  async searchFullText(searchQuery, limit = 20) {
    const query = `
      SELECT
        pi.publication_id, pi.title, pi.document_type, pi.publication_date,
        ts_rank(to_tsvector('english', pft.full_text), plainto_tsquery('english', $1)) as rank,
        ts_headline('english', pft.full_text, plainto_tsquery('english', $1),
                    'MaxWords=50, MinWords=25, StartSel=<b>, StopSel=</b>') as snippet
      FROM fca_publication_full_text pft
      JOIN fca_publications_index pi ON pft.publication_id = pi.publication_id
      WHERE to_tsvector('english', pft.full_text) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [searchQuery, limit]);
    return result.rows;
  }

  // ============================================================
  // STATISTICS AND REPORTING
  // ============================================================

  /**
   * Get pipeline statistics
   */
  async getPipelineStats() {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM fca_publications_index) as total_publications,
        (SELECT COUNT(*) FROM fca_publications_index WHERE status = 'pending') as pending,
        (SELECT COUNT(*) FROM fca_publications_index WHERE status = 'downloaded') as downloaded,
        (SELECT COUNT(*) FROM fca_publications_index WHERE status = 'parsed') as parsed,
        (SELECT COUNT(*) FROM fca_publications_index WHERE status = 'processed') as processed,
        (SELECT COUNT(*) FROM fca_publications_index WHERE status LIKE '%_failed') as failed,
        (SELECT COUNT(*) FROM fca_enforcement_notices) as enforcement_notices,
        (SELECT SUM(fine_amount) FROM fca_enforcement_notices WHERE fine_amount > 0) as total_fines,
        (SELECT MAX(scraped_at) FROM fca_publications_index) as last_scraped,
        (SELECT MAX(processed_at) FROM fca_publications_index) as last_processed
    `;
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  /**
   * Get breach type statistics
   */
  async getBreachStats() {
    const query = `
      SELECT
        primary_breach_type,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        AVG(COALESCE(fine_amount, 0)) as avg_fine,
        MAX(fine_amount) as max_fine
      FROM fca_enforcement_notices
      WHERE primary_breach_type IS NOT NULL
      GROUP BY primary_breach_type
      ORDER BY total_fines DESC
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Get yearly statistics
   */
  async getYearlyStats() {
    const query = `
      SELECT
        EXTRACT(YEAR FROM notice_date) as year,
        outcome_type,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines
      FROM fca_enforcement_notices
      WHERE notice_date IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM notice_date), outcome_type
      ORDER BY year DESC, total_fines DESC
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }
}

module.exports = PublicationsDatabase;
