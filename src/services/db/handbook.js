const DEFAULT_AUTHORITY = 'FCA'

function ensurePostgres(context) {
  if (!context || context.fallbackMode || !context.pool) {
    throw new Error('Handbook registry requires PostgreSQL')
  }
}

module.exports = function applyHandbookMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async ensureHandbookTables() {
      if (this.fallbackMode) return

      const client = await this.pool.connect()
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS reg_document_sourcebooks (
            id SERIAL PRIMARY KEY,
            authority TEXT NOT NULL,
            jurisdiction TEXT,
            code TEXT NOT NULL,
            title TEXT,
            doc_type TEXT,
            home_url TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            UNIQUE (authority, code)
          )
        `)

        await client.query(`
          CREATE TABLE IF NOT EXISTS reg_document_versions (
            id SERIAL PRIMARY KEY,
            sourcebook_id INTEGER REFERENCES reg_document_sourcebooks(id) ON DELETE CASCADE,
            version_label TEXT,
            effective_date DATE,
            published_date DATE,
            ingested_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            source_url TEXT,
            content_hash TEXT,
            status TEXT DEFAULT 'active'
          )
        `)

        await client.query(`
          CREATE TABLE IF NOT EXISTS reg_document_sections (
            id SERIAL PRIMARY KEY,
            version_id INTEGER REFERENCES reg_document_versions(id) ON DELETE CASCADE,
            parent_id INTEGER REFERENCES reg_document_sections(id) ON DELETE SET NULL,
            level INTEGER NOT NULL,
            section_number TEXT,
            section_title TEXT,
            canonical_ref TEXT,
            path TEXT,
            anchor TEXT,
            text TEXT,
            html TEXT,
            order_index INTEGER,
            content_hash TEXT,
            search_vector TSVECTOR
          )
        `)

        await client.query(`
          CREATE TABLE IF NOT EXISTS reg_document_paragraphs (
            id SERIAL PRIMARY KEY,
            section_id INTEGER REFERENCES reg_document_sections(id) ON DELETE CASCADE,
            paragraph_number TEXT,
            canonical_ref TEXT,
            anchor TEXT,
            text TEXT,
            html TEXT,
            content_hash TEXT,
            search_vector TSVECTOR
          )
        `)

        await client.query(`
          CREATE TABLE IF NOT EXISTS reg_document_citations (
            id SERIAL PRIMARY KEY,
            canonical_ref TEXT NOT NULL,
            sourcebook_id INTEGER REFERENCES reg_document_sourcebooks(id) ON DELETE CASCADE,
            version_id INTEGER REFERENCES reg_document_versions(id) ON DELETE CASCADE,
            section_id INTEGER REFERENCES reg_document_sections(id) ON DELETE CASCADE,
            paragraph_id INTEGER REFERENCES reg_document_paragraphs(id) ON DELETE SET NULL,
            url TEXT,
            anchor TEXT
          )
        `)

        await client.query(`
          CREATE TABLE IF NOT EXISTS reg_ingest_runs (
            id SERIAL PRIMARY KEY,
            authority TEXT NOT NULL,
            started_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            ended_at TIMESTAMP WITHOUT TIME ZONE,
            status TEXT DEFAULT 'running',
            source TEXT,
            stats_json JSONB DEFAULT '{}'::jsonb,
            error_json JSONB DEFAULT '{}'::jsonb
          )
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_reg_document_sourcebooks_authority_code
            ON reg_document_sourcebooks (authority, code)
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_reg_document_versions_sourcebook
            ON reg_document_versions (sourcebook_id, ingested_at DESC)
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_reg_document_sections_version_order
            ON reg_document_sections (version_id, order_index)
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_reg_document_paragraphs_section
            ON reg_document_paragraphs (section_id)
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_reg_document_citations_ref
            ON reg_document_citations (canonical_ref)
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_reg_document_sections_search
            ON reg_document_sections USING GIN(search_vector)
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_reg_document_paragraphs_search
            ON reg_document_paragraphs USING GIN(search_vector)
        `)
      } finally {
        client.release()
      }
    },

    async createHandbookIngestRun({ authority = DEFAULT_AUTHORITY, source } = {}) {
      ensurePostgres(this)
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          `INSERT INTO reg_ingest_runs (authority, source)
           VALUES ($1, $2)
           RETURNING id`,
          [authority, source || null]
        )
        return result.rows[0]?.id
      } finally {
        client.release()
      }
    },

    async finishHandbookIngestRun(runId, { status = 'completed', stats = {}, error = {} } = {}) {
      ensurePostgres(this)
      if (!runId) return
      const client = await this.pool.connect()
      try {
        await client.query(
          `UPDATE reg_ingest_runs
           SET ended_at = NOW(),
               status = $2,
               stats_json = $3::jsonb,
               error_json = $4::jsonb
           WHERE id = $1`,
          [runId, status, JSON.stringify(stats), JSON.stringify(error)]
        )
      } finally {
        client.release()
      }
    },

    async getLatestHandbookIngestRun(authority = DEFAULT_AUTHORITY) {
      ensurePostgres(this)
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          `SELECT *
           FROM reg_ingest_runs
           WHERE authority = $1
           ORDER BY started_at DESC
           LIMIT 1`,
          [authority]
        )
        return result.rows[0] || null
      } finally {
        client.release()
      }
    },

    async upsertHandbookSourcebook({
      authority = DEFAULT_AUTHORITY,
      jurisdiction,
      code,
      title,
      docType,
      homeUrl,
      status = 'active'
    }) {
      ensurePostgres(this)
      if (!code) {
        throw new Error('Sourcebook code is required')
      }

      const client = await this.pool.connect()
      try {
        const result = await client.query(
          `INSERT INTO reg_document_sourcebooks
            (authority, jurisdiction, code, title, doc_type, home_url, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (authority, code)
           DO UPDATE SET
             jurisdiction = EXCLUDED.jurisdiction,
             title = EXCLUDED.title,
             doc_type = EXCLUDED.doc_type,
             home_url = EXCLUDED.home_url,
             status = EXCLUDED.status,
             updated_at = NOW()
           RETURNING *`,
          [authority, jurisdiction || null, code, title || null, docType || null, homeUrl || null, status]
        )
        return result.rows[0]
      } finally {
        client.release()
      }
    },

    async getHandbookSourcebooks(authority = DEFAULT_AUTHORITY) {
      ensurePostgres(this)
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          `SELECT sb.*,
             v.id AS latest_version_id,
             v.ingested_at AS latest_ingested_at,
             v.version_label AS latest_version_label
           FROM reg_document_sourcebooks sb
           LEFT JOIN LATERAL (
             SELECT id, ingested_at, version_label
             FROM reg_document_versions
             WHERE sourcebook_id = sb.id
             ORDER BY ingested_at DESC
             LIMIT 1
           ) v ON TRUE
           WHERE sb.authority = $1
           ORDER BY sb.code`,
          [authority]
        )
        return result.rows
      } finally {
        client.release()
      }
    },

    async getHandbookSourcebookByCode(authority = DEFAULT_AUTHORITY, code) {
      ensurePostgres(this)
      if (!code) return null
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          `SELECT sb.*,
             v.id AS latest_version_id,
             v.ingested_at AS latest_ingested_at,
             v.version_label AS latest_version_label
           FROM reg_document_sourcebooks sb
           LEFT JOIN LATERAL (
             SELECT id, ingested_at, version_label
             FROM reg_document_versions
             WHERE sourcebook_id = sb.id
             ORDER BY ingested_at DESC
             LIMIT 1
           ) v ON TRUE
           WHERE sb.authority = $1 AND sb.code = $2`,
          [authority, code]
        )
        return result.rows[0] || null
      } finally {
        client.release()
      }
    },

    async getLatestHandbookVersion(sourcebookId) {
      ensurePostgres(this)
      if (!sourcebookId) return null
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          `SELECT *
           FROM reg_document_versions
           WHERE sourcebook_id = $1
           ORDER BY ingested_at DESC
           LIMIT 1`,
          [sourcebookId]
        )
        return result.rows[0] || null
      } finally {
        client.release()
      }
    },

    async getHandbookOutlineBySourcebookId(sourcebookId, versionId) {
      ensurePostgres(this)
      if (!sourcebookId) return { versionId: null, chapters: [] }

      let resolvedVersionId = versionId
      if (!resolvedVersionId) {
        const latest = await this.getLatestHandbookVersion(sourcebookId)
        resolvedVersionId = latest?.id
      }
      if (!resolvedVersionId) {
        return { versionId: null, chapters: [] }
      }

      const client = await this.pool.connect()
      try {
        const result = await client.query(
          `SELECT id, parent_id, level, section_number, section_title,
                  canonical_ref, anchor, path, order_index
           FROM reg_document_sections
           WHERE version_id = $1
           ORDER BY level, order_index, id`,
          [resolvedVersionId]
        )

        const chapters = []
        const chapterMap = new Map()
        let sectionsCount = 0

        result.rows.forEach(row => {
          if (row.level === 1) {
            const chapter = {
              id: row.id,
              parentId: row.parent_id,
              level: row.level,
              ref: row.canonical_ref,
              sectionNumber: row.section_number,
              title: row.section_title,
              anchor: row.anchor,
              path: row.path,
              orderIndex: row.order_index,
              sections: []
            }
            chapters.push(chapter)
            chapterMap.set(row.id, chapter)
          } else if (row.level === 2) {
            const section = {
              id: row.id,
              parentId: row.parent_id,
              level: row.level,
              ref: row.canonical_ref,
              sectionNumber: row.section_number,
              title: row.section_title,
              anchor: row.anchor,
              path: row.path,
              orderIndex: row.order_index
            }
            sectionsCount += 1
            const parent = chapterMap.get(row.parent_id)
            if (parent) {
              parent.sections.push(section)
            }
          }
        })

        return {
          versionId: resolvedVersionId,
          chapters,
          sectionsCount
        }
      } finally {
        client.release()
      }
    },

    async getHandbookSectionById(sectionId) {
      ensurePostgres(this)
      if (!sectionId) return null
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          `SELECT s.*, v.id AS version_id, v.ingested_at,
             v.sourcebook_id,
             sb.code AS sourcebook_code, sb.title AS sourcebook_title
           FROM reg_document_sections s
           JOIN reg_document_versions v ON v.id = s.version_id
           JOIN reg_document_sourcebooks sb ON sb.id = v.sourcebook_id
           WHERE s.id = $1
           LIMIT 1`,
          [sectionId]
        )
        return result.rows[0] || null
      } finally {
        client.release()
      }
    },

    async getHandbookParagraphsBySectionId(sectionId) {
      ensurePostgres(this)
      if (!sectionId) return []
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          `SELECT id, paragraph_number, canonical_ref, anchor, text, html
           FROM reg_document_paragraphs
           WHERE section_id = $1
           ORDER BY id`,
          [sectionId]
        )
        return result.rows
      } finally {
        client.release()
      }
    },

    async createHandbookVersion(sourcebookId, {
      versionLabel,
      effectiveDate,
      publishedDate,
      sourceUrl,
      contentHash,
      status = 'active'
    }) {
      ensurePostgres(this)
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          `INSERT INTO reg_document_versions
            (sourcebook_id, version_label, effective_date, published_date, source_url, content_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            sourcebookId,
            versionLabel || null,
            effectiveDate || null,
            publishedDate || null,
            sourceUrl || null,
            contentHash || null,
            status
          ]
        )
        return result.rows[0]
      } finally {
        client.release()
      }
    },

    async insertHandbookSections(versionId, sections = []) {
      ensurePostgres(this)
      if (!versionId || sections.length === 0) return []
      const client = await this.pool.connect()
      try {
        const inserted = []
        const chunkSize = 200
        for (let i = 0; i < sections.length; i += chunkSize) {
          const batch = sections.slice(i, i + chunkSize)
          const values = []
          const placeholders = batch.map((section, index) => {
            const base = index * 12
            values.push(
              versionId,
              section.parentId || null,
              section.level,
              section.sectionNumber || null,
              section.sectionTitle || null,
              section.canonicalRef || null,
              section.path || null,
              section.anchor || null,
              section.text || null,
              section.html || null,
              section.orderIndex || null,
              section.contentHash || null
            )
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, to_tsvector('english', $${base + 9}))`
          })
          const query = `
            INSERT INTO reg_document_sections (
              version_id, parent_id, level, section_number, section_title,
              canonical_ref, path, anchor, text, html, order_index, content_hash, search_vector
            ) VALUES ${placeholders.join(', ')}
            RETURNING id, canonical_ref
          `
          const result = await client.query(query, values)
          inserted.push(...result.rows)
        }
        return inserted
      } finally {
        client.release()
      }
    },

    async insertHandbookParagraphs(sectionIdMap, paragraphs = []) {
      ensurePostgres(this)
      if (!paragraphs.length) return []
      const client = await this.pool.connect()
      try {
        const inserted = []
        const chunkSize = 300
        for (let i = 0; i < paragraphs.length; i += chunkSize) {
          const batch = paragraphs.slice(i, i + chunkSize)
          const values = []
          const placeholders = batch.map((paragraph, index) => {
            const base = index * 7
            const sectionId = sectionIdMap.get(paragraph.sectionKey)
            values.push(
              sectionId || null,
              paragraph.paragraphNumber || null,
              paragraph.canonicalRef || null,
              paragraph.anchor || null,
              paragraph.text || null,
              paragraph.html || null,
              paragraph.contentHash || null
            )
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, to_tsvector('english', $${base + 5}))`
          })
          const query = `
            INSERT INTO reg_document_paragraphs (
              section_id, paragraph_number, canonical_ref, anchor,
              text, html, content_hash, search_vector
            ) VALUES ${placeholders.join(', ')}
            RETURNING id, canonical_ref
          `
          const result = await client.query(query, values)
          inserted.push(...result.rows)
        }
        return inserted
      } finally {
        client.release()
      }
    },

    async insertHandbookCitations(citations = []) {
      ensurePostgres(this)
      if (!citations.length) return
      const client = await this.pool.connect()
      try {
        const chunkSize = 400
        for (let i = 0; i < citations.length; i += chunkSize) {
          const batch = citations.slice(i, i + chunkSize)
          const values = []
          const placeholders = batch.map((citation, index) => {
            const base = index * 7
            values.push(
              citation.canonicalRef,
              citation.sourcebookId,
              citation.versionId,
              citation.sectionId,
              citation.paragraphId || null,
              citation.url || null,
              citation.anchor || null
            )
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`
          })
          await client.query(
            `INSERT INTO reg_document_citations
              (canonical_ref, sourcebook_id, version_id, section_id, paragraph_id, url, anchor)
             VALUES ${placeholders.join(', ')}`,
            values
          )
        }
      } finally {
        client.release()
      }
    },

    async findHandbookReference(ref, authority = DEFAULT_AUTHORITY) {
      ensurePostgres(this)
      if (!ref) return null
      const client = await this.pool.connect()
      try {
        const paragraphResult = await client.query(
          `SELECT p.*, s.section_title, s.section_number, s.canonical_ref AS section_ref,
             v.id AS version_id, v.ingested_at,
             sb.code AS sourcebook_code, sb.title AS sourcebook_title
           FROM reg_document_paragraphs p
           JOIN reg_document_sections s ON s.id = p.section_id
           JOIN reg_document_versions v ON v.id = s.version_id
           JOIN reg_document_sourcebooks sb ON sb.id = v.sourcebook_id
           WHERE sb.authority = $1 AND p.canonical_ref = $2
           ORDER BY v.ingested_at DESC
           LIMIT 1`,
          [authority, ref]
        )
        if (paragraphResult.rows[0]) {
          return { type: 'paragraph', ...paragraphResult.rows[0] }
        }

        const sectionResult = await client.query(
          `SELECT s.*, v.id AS version_id, v.ingested_at,
             sb.code AS sourcebook_code, sb.title AS sourcebook_title
           FROM reg_document_sections s
           JOIN reg_document_versions v ON v.id = s.version_id
           JOIN reg_document_sourcebooks sb ON sb.id = v.sourcebook_id
           WHERE sb.authority = $1 AND s.canonical_ref = $2
           ORDER BY v.ingested_at DESC
           LIMIT 1`,
          [authority, ref]
        )

        return sectionResult.rows[0]
          ? { type: 'section', ...sectionResult.rows[0] }
          : null
      } finally {
        client.release()
      }
    },

    async searchHandbook(query, {
      authority = DEFAULT_AUTHORITY,
      limit = 20,
      offset = 0,
      sourcebookCode
    } = {}) {
      ensurePostgres(this)
      if (!query) return []
      const client = await this.pool.connect()
      try {
        const normalizedCode = sourcebookCode ? sourcebookCode.toUpperCase() : null
        const result = await client.query(
          `WITH query AS (
             SELECT plainto_tsquery('english', $2) AS q
           ),
           latest_versions AS (
             SELECT sb.id AS sourcebook_id,
                    v.id AS version_id
             FROM reg_document_sourcebooks sb
             LEFT JOIN LATERAL (
               SELECT id, ingested_at
               FROM reg_document_versions
               WHERE sourcebook_id = sb.id
               ORDER BY ingested_at DESC
               LIMIT 1
             ) v ON TRUE
             WHERE sb.authority = $1
               AND ($5::text IS NULL OR sb.code = $5)
           )
           SELECT *
           FROM (
             SELECT
               'section' AS type,
               s.canonical_ref,
               s.section_title,
               s.section_number,
               sb.code AS sourcebook_code,
               sb.title AS sourcebook_title,
               s.id AS section_id,
               NULL::integer AS paragraph_id,
               ts_rank_cd(s.search_vector, query.q) AS rank
             FROM reg_document_sections s
             JOIN latest_versions lv ON lv.version_id = s.version_id
             JOIN reg_document_sourcebooks sb ON sb.id = lv.sourcebook_id
             JOIN query ON TRUE
             WHERE s.search_vector @@ query.q

             UNION ALL

             SELECT
               'paragraph' AS type,
               p.canonical_ref,
               s.section_title,
               s.section_number,
               sb.code AS sourcebook_code,
               sb.title AS sourcebook_title,
               s.id AS section_id,
               p.id AS paragraph_id,
               ts_rank_cd(p.search_vector, query.q) AS rank
             FROM reg_document_paragraphs p
             JOIN reg_document_sections s ON s.id = p.section_id
             JOIN latest_versions lv ON lv.version_id = s.version_id
             JOIN reg_document_sourcebooks sb ON sb.id = lv.sourcebook_id
             JOIN query ON TRUE
             WHERE p.search_vector @@ query.q
           ) results
           ORDER BY rank DESC
           LIMIT $3 OFFSET $4`,
          [authority, query, limit, offset, normalizedCode]
        )
        return result.rows
      } finally {
        client.release()
      }
    }
  })
}
