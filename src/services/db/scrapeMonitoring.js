module.exports = function applyScrapeMonitoringMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async ensureScrapeMonitoringTables() {
      if (!this.pool) return

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS scrape_monitor_runs (
          id BIGSERIAL PRIMARY KEY,
          run_type TEXT NOT NULL,
          started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMP WITHOUT TIME ZONE,
          duration_ms INTEGER,
          status TEXT NOT NULL,
          total_sources INTEGER DEFAULT 0,
          success_sources INTEGER DEFAULT 0,
          fixed_sources INTEGER DEFAULT 0,
          no_update_sources INTEGER DEFAULT 0,
          stale_sources INTEGER DEFAULT 0,
          error_sources INTEGER DEFAULT 0,
          new_updates INTEGER DEFAULT 0,
          total_processed INTEGER DEFAULT 0,
          metadata JSONB DEFAULT '{}'::JSONB
        )
      `)

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS scrape_monitor_checks (
          id BIGSERIAL PRIMARY KEY,
          run_id BIGINT REFERENCES scrape_monitor_runs(id) ON DELETE CASCADE,
          source_name TEXT NOT NULL,
          authority TEXT,
          source_type TEXT,
          priority TEXT,
          initial_status TEXT,
          status TEXT,
          issue_type TEXT,
          issue_detail TEXT,
          fetched_count INTEGER DEFAULT 0,
          saved_count INTEGER DEFAULT 0,
          error_message TEXT,
          duration_ms INTEGER,
          fix_actions JSONB DEFAULT '[]'::JSONB,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          -- AI diagnosis fields for maintenance agent
          error_category TEXT,
          http_status_code INTEGER,
          ai_diagnosis JSONB,
          ai_suggested_fix TEXT,
          ai_confidence FLOAT,
          ai_analyzed_at TIMESTAMP WITHOUT TIME ZONE,
          human_action_required BOOLEAN DEFAULT false,
          human_action_taken_at TIMESTAMP WITHOUT TIME ZONE,
          maintenance_notes TEXT,
          UNIQUE (run_id, source_name)
        )
      `)

      // Add columns if they don't exist (for existing tables)
      await this.pool.query(`
        DO $$
        BEGIN
          ALTER TABLE scrape_monitor_checks ADD COLUMN IF NOT EXISTS error_category TEXT;
          ALTER TABLE scrape_monitor_checks ADD COLUMN IF NOT EXISTS http_status_code INTEGER;
          ALTER TABLE scrape_monitor_checks ADD COLUMN IF NOT EXISTS ai_diagnosis JSONB;
          ALTER TABLE scrape_monitor_checks ADD COLUMN IF NOT EXISTS ai_suggested_fix TEXT;
          ALTER TABLE scrape_monitor_checks ADD COLUMN IF NOT EXISTS ai_confidence FLOAT;
          ALTER TABLE scrape_monitor_checks ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMP WITHOUT TIME ZONE;
          ALTER TABLE scrape_monitor_checks ADD COLUMN IF NOT EXISTS human_action_required BOOLEAN DEFAULT false;
          ALTER TABLE scrape_monitor_checks ADD COLUMN IF NOT EXISTS human_action_taken_at TIMESTAMP WITHOUT TIME ZONE;
          ALTER TABLE scrape_monitor_checks ADD COLUMN IF NOT EXISTS maintenance_notes TEXT;
        EXCEPTION WHEN OTHERS THEN NULL;
        END $$
      `)

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_scrape_monitor_runs_started
          ON scrape_monitor_runs (started_at DESC)
      `)

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_scrape_monitor_checks_run
          ON scrape_monitor_checks (run_id)
      `)

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_scrape_monitor_checks_status
          ON scrape_monitor_checks (status, created_at DESC)
      `)

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_scrape_monitor_checks_source
          ON scrape_monitor_checks (source_name, created_at DESC)
      `)

      console.log('[DB] Scrape monitoring tables ensured')
    },

    async createScrapeMonitorRun(payload = {}) {
      const runType = payload.runType || 'scheduled'
      const startedAt = payload.startedAt || new Date()
      const status = payload.status || 'running'
      const metadata = payload.metadata || {}

      if (this.usePostgres) {
        const result = await this.pool.query(
          `
            INSERT INTO scrape_monitor_runs (run_type, started_at, status, metadata)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `,
          [runType, startedAt, status, JSON.stringify(metadata)]
        )
        return result.rows[0].id
      }

      return this.createScrapeMonitorRunJSON({ runType, startedAt, status, metadata })
    },

    async finishScrapeMonitorRun(runId, payload = {}) {
      const completedAt = payload.completedAt || new Date()
      const durationMs = payload.durationMs != null ? payload.durationMs : null
      const status = payload.status || 'success'
      const totals = payload.totals || {}
      const metadata = payload.metadata || {}

      if (this.usePostgres) {
        await this.pool.query(
          `
            UPDATE scrape_monitor_runs
            SET completed_at = $2,
                duration_ms = $3,
                status = $4,
                total_sources = $5,
                success_sources = $6,
                fixed_sources = $7,
                no_update_sources = $8,
                stale_sources = $9,
                error_sources = $10,
                new_updates = $11,
                total_processed = $12,
                metadata = $13
            WHERE id = $1
          `,
          [
            runId,
            completedAt,
            durationMs,
            status,
            totals.totalSources || 0,
            totals.successSources || 0,
            totals.fixedSources || 0,
            totals.noUpdateSources || 0,
            totals.staleSources || 0,
            totals.errorSources || 0,
            totals.newUpdates || 0,
            totals.totalProcessed || 0,
            JSON.stringify(metadata)
          ]
        )
        return runId
      }

      return this.finishScrapeMonitorRunJSON(runId, {
        completedAt,
        durationMs,
        status,
        totals,
        metadata
      })
    },

    async recordScrapeMonitorCheck(runId, check = {}) {
      const payload = {
        runId,
        sourceName: check.sourceName,
        authority: check.authority,
        sourceType: check.sourceType,
        priority: check.priority,
        initialStatus: check.initialStatus,
        status: check.status,
        issueType: check.issueType || null,
        issueDetail: check.issueDetail || null,
        fetchedCount: check.fetchedCount || 0,
        savedCount: check.savedCount || 0,
        errorMessage: check.errorMessage || null,
        durationMs: check.durationMs || null,
        fixActions: Array.isArray(check.fixActions) ? check.fixActions : [],
        createdAt: check.createdAt || new Date(),
        // Error classification fields
        errorCategory: check.errorCategory || null,
        httpStatusCode: check.httpStatusCode || null
      }

      if (this.usePostgres) {
        await this.pool.query(
          `
            INSERT INTO scrape_monitor_checks (
              run_id,
              source_name,
              authority,
              source_type,
              priority,
              initial_status,
              status,
              issue_type,
              issue_detail,
              fetched_count,
              saved_count,
              error_message,
              duration_ms,
              fix_actions,
              created_at,
              error_category,
              http_status_code
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (run_id, source_name)
            DO UPDATE SET
              authority = EXCLUDED.authority,
              source_type = EXCLUDED.source_type,
              priority = EXCLUDED.priority,
              initial_status = EXCLUDED.initial_status,
              status = EXCLUDED.status,
              issue_type = EXCLUDED.issue_type,
              issue_detail = EXCLUDED.issue_detail,
              fetched_count = EXCLUDED.fetched_count,
              saved_count = EXCLUDED.saved_count,
              error_message = EXCLUDED.error_message,
              duration_ms = EXCLUDED.duration_ms,
              fix_actions = EXCLUDED.fix_actions,
              created_at = EXCLUDED.created_at,
              error_category = EXCLUDED.error_category,
              http_status_code = EXCLUDED.http_status_code
          `,
          [
            payload.runId,
            payload.sourceName,
            payload.authority,
            payload.sourceType,
            payload.priority,
            payload.initialStatus,
            payload.status,
            payload.issueType,
            payload.issueDetail,
            payload.fetchedCount,
            payload.savedCount,
            payload.errorMessage,
            payload.durationMs,
            JSON.stringify(payload.fixActions),
            payload.createdAt,
            payload.errorCategory,
            payload.httpStatusCode
          ]
        )
        return payload
      }

      return this.recordScrapeMonitorCheckJSON(payload)
    },

    async updateCheckWithAIDiagnosis(checkId, diagnosis) {
      if (!this.usePostgres) return null

      await this.pool.query(
        `
          UPDATE scrape_monitor_checks
          SET error_category = $2,
              ai_diagnosis = $3,
              ai_suggested_fix = $4,
              ai_confidence = $5,
              ai_analyzed_at = $6,
              human_action_required = $7
          WHERE id = $1
        `,
        [
          checkId,
          diagnosis.category || null,
          JSON.stringify(diagnosis),
          diagnosis.suggestedFix || null,
          diagnosis.confidence || null,
          new Date(),
          diagnosis.humanActionRequired || false
        ]
      )
      return checkId
    },

    async getUnanalyzedIssues(sinceHours = 24) {
      if (!this.usePostgres) return []

      const sinceDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000)
      const result = await this.pool.query(
        `
          SELECT c.*, r.started_at as run_started_at
          FROM scrape_monitor_checks c
          JOIN scrape_monitor_runs r ON c.run_id = r.id
          WHERE c.created_at >= $1
            AND c.issue_type IS NOT NULL
            AND c.ai_analyzed_at IS NULL
          ORDER BY c.created_at DESC
        `,
        [sinceDate]
      )
      return result.rows
    },

    async getIssuesRequiringHumanAction(sinceHours = 48) {
      if (!this.usePostgres) return []

      const sinceDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000)
      const result = await this.pool.query(
        `
          SELECT c.*, r.started_at as run_started_at
          FROM scrape_monitor_checks c
          JOIN scrape_monitor_runs r ON c.run_id = r.id
          WHERE c.created_at >= $1
            AND c.human_action_required = true
            AND c.human_action_taken_at IS NULL
          ORDER BY c.ai_confidence DESC NULLS LAST, c.created_at DESC
        `,
        [sinceDate]
      )
      return result.rows
    },

    async getMaintenanceSummary(sinceHours = 24) {
      if (!this.usePostgres) return null

      const sinceDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000)

      // Get totals
      const totalsResult = await this.pool.query(
        `
          SELECT
            COUNT(*) as total_checks,
            COUNT(CASE WHEN status = 'success' OR status = 'fixed' THEN 1 END) as healthy,
            COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
            COUNT(CASE WHEN status = 'stale' THEN 1 END) as stale,
            COUNT(CASE WHEN status = 'fixed' THEN 1 END) as auto_fixed,
            COUNT(CASE WHEN human_action_required = true AND human_action_taken_at IS NULL THEN 1 END) as needs_attention
          FROM scrape_monitor_checks
          WHERE created_at >= $1
        `,
        [sinceDate]
      )

      // Get error categories breakdown
      const categoriesResult = await this.pool.query(
        `
          SELECT error_category, COUNT(*) as count
          FROM scrape_monitor_checks
          WHERE created_at >= $1 AND error_category IS NOT NULL
          GROUP BY error_category
          ORDER BY count DESC
        `,
        [sinceDate]
      )

      // Get sources with recurring issues (3+ in last 7 days)
      const recurringResult = await this.pool.query(
        `
          SELECT source_name, source_type, COUNT(*) as issue_count
          FROM scrape_monitor_checks
          WHERE created_at >= NOW() - INTERVAL '7 days'
            AND issue_type IS NOT NULL
          GROUP BY source_name, source_type
          HAVING COUNT(*) >= 3
          ORDER BY issue_count DESC
          LIMIT 10
        `
      )

      const totals = totalsResult.rows[0] || {}
      const healthScore = totals.total_checks > 0
        ? Math.round(((totals.healthy || 0) / totals.total_checks) * 100)
        : 100

      return {
        since: sinceDate.toISOString(),
        healthScore,
        totals: {
          total: parseInt(totals.total_checks) || 0,
          healthy: parseInt(totals.healthy) || 0,
          errors: parseInt(totals.errors) || 0,
          stale: parseInt(totals.stale) || 0,
          autoFixed: parseInt(totals.auto_fixed) || 0,
          needsAttention: parseInt(totals.needs_attention) || 0
        },
        errorCategories: categoriesResult.rows.reduce((acc, row) => {
          acc[row.error_category] = parseInt(row.count)
          return acc
        }, {}),
        recurringIssues: recurringResult.rows
      }
    },

    async getScrapeMonitorLastSuccessTimes() {
      if (this.usePostgres) {
        const result = await this.pool.query(`
          SELECT source_name, MAX(created_at) AS last_success_at
          FROM scrape_monitor_checks
          WHERE status IN ('success', 'fixed')
          GROUP BY source_name
        `)

        return result.rows.reduce((acc, row) => {
          acc[row.source_name] = row.last_success_at
          return acc
        }, {})
      }

      return this.getScrapeMonitorLastSuccessTimesJSON()
    },

    async getScrapeMonitorSummary({ sinceHours = 24 } = {}) {
      const sinceDate = new Date(Date.now() - sinceHours * 60 * 60 * 1000)

      if (this.usePostgres) {
        const runsResult = await this.pool.query(
          `
            SELECT *
            FROM scrape_monitor_runs
            WHERE started_at >= $1
            ORDER BY started_at DESC
          `,
          [sinceDate]
        )

        const checksResult = await this.pool.query(
          `
            SELECT *
            FROM scrape_monitor_checks
            WHERE created_at >= $1
            ORDER BY created_at DESC
          `,
          [sinceDate]
        )

        return this.buildScrapeMonitorSummary(runsResult.rows, checksResult.rows, sinceDate)
      }

      const runs = await this.loadScrapeMonitorRunsJSON()
      const checks = await this.loadScrapeMonitorChecksJSON()

      return this.buildScrapeMonitorSummary(
        runs.filter(run => new Date(run.startedAt) >= sinceDate),
        checks.filter(check => new Date(check.createdAt) >= sinceDate),
        sinceDate
      )
    },

    buildScrapeMonitorSummary(runs, checks, sinceDate) {
      const issueChecks = checks.filter(check => check.issueType || check.issue_type)
      const issueTypeCounts = issueChecks.reduce((acc, check) => {
        const key = check.issueType || check.issue_type || 'unknown'
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      const sources = new Map()
      issueChecks.forEach(check => {
        const key = check.source_name || check.sourceName
        if (!key) return
        const entry = sources.get(key) || {
          sourceName: key,
          authority: check.authority,
          sourceType: check.source_type || check.sourceType,
          issueCount: 0,
          lastIssueAt: null,
          lastIssueDetail: null,
          lastStatus: check.status
        }
        entry.issueCount += 1
        entry.lastIssueAt = entry.lastIssueAt && new Date(entry.lastIssueAt) > new Date(check.created_at || check.createdAt)
          ? entry.lastIssueAt
          : (check.created_at || check.createdAt)
        entry.lastIssueDetail = check.issue_detail || check.issueDetail || entry.lastIssueDetail
        entry.lastStatus = check.status
        sources.set(key, entry)
      })

      return {
        since: sinceDate.toISOString(),
        runCount: runs.length,
        checkCount: checks.length,
        issueCount: issueChecks.length,
        issueTypes: issueTypeCounts,
        latestRun: runs[0] || null,
        sourcesWithIssues: Array.from(sources.values())
      }
    },

    // ---------------------------------------------------------------------
    // JSON fallback helpers
    // ---------------------------------------------------------------------
    async loadScrapeMonitorRunsJSON() {
      return this.loadJSONData(this.scrapeMonitorRunsFile)
    },

    async loadScrapeMonitorChecksJSON() {
      return this.loadJSONData(this.scrapeMonitorChecksFile)
    },

    async createScrapeMonitorRunJSON(payload) {
      const runs = await this.loadScrapeMonitorRunsJSON()
      const id = runs.length > 0 ? Math.max(...runs.map(run => run.id || 0)) + 1 : 1
      const record = {
        id,
        runType: payload.runType,
        startedAt: new Date(payload.startedAt).toISOString(),
        status: payload.status,
        metadata: payload.metadata || {}
      }
      runs.push(record)
      await this.saveJSONData(this.scrapeMonitorRunsFile, runs)
      return id
    },

    async finishScrapeMonitorRunJSON(runId, payload) {
      const runs = await this.loadScrapeMonitorRunsJSON()
      const index = runs.findIndex(run => run.id === runId)
      if (index === -1) return runId
      runs[index] = {
        ...runs[index],
        completedAt: new Date(payload.completedAt).toISOString(),
        durationMs: payload.durationMs,
        status: payload.status,
        totals: payload.totals || {},
        metadata: payload.metadata || {}
      }
      await this.saveJSONData(this.scrapeMonitorRunsFile, runs)
      return runId
    },

    async recordScrapeMonitorCheckJSON(payload) {
      const checks = await this.loadScrapeMonitorChecksJSON()
      const existingIndex = checks.findIndex(
        check => check.runId === payload.runId && check.sourceName === payload.sourceName
      )
      const record = {
        id: existingIndex === -1 ? checks.length + 1 : checks[existingIndex].id,
        runId: payload.runId,
        sourceName: payload.sourceName,
        authority: payload.authority,
        sourceType: payload.sourceType,
        priority: payload.priority,
        initialStatus: payload.initialStatus,
        status: payload.status,
        issueType: payload.issueType,
        issueDetail: payload.issueDetail,
        fetchedCount: payload.fetchedCount,
        savedCount: payload.savedCount,
        errorMessage: payload.errorMessage,
        durationMs: payload.durationMs,
        fixActions: payload.fixActions,
        createdAt: new Date(payload.createdAt).toISOString()
      }
      if (existingIndex === -1) {
        checks.push(record)
      } else {
        checks[existingIndex] = record
      }
      await this.saveJSONData(this.scrapeMonitorChecksFile, checks)
      return record
    },

    async getScrapeMonitorLastSuccessTimesJSON() {
      const checks = await this.loadScrapeMonitorChecksJSON()
      return checks.reduce((acc, check) => {
        if (!['success', 'fixed'].includes(check.status)) return acc
        const sourceName = check.sourceName
        if (!sourceName) return acc
        const createdAt = check.createdAt
        if (!acc[sourceName] || new Date(createdAt) > new Date(acc[sourceName])) {
          acc[sourceName] = createdAt
        }
        return acc
      }, {})
    }
  })
}
