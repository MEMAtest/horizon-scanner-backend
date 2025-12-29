const CREATE_WATCH_LISTS_TABLE = `
          CREATE TABLE IF NOT EXISTS watch_lists (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
            authorities TEXT[] DEFAULT ARRAY[]::TEXT[],
            sectors TEXT[] DEFAULT ARRAY[]::TEXT[],
            alert_on_match BOOLEAN DEFAULT TRUE,
            alert_threshold DECIMAL(3,2) DEFAULT 0.50,
            auto_add_to_dossier BOOLEAN DEFAULT FALSE,
            target_dossier_id BIGINT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `

const ALTER_WATCH_LISTS_TABLE = `
          ALTER TABLE watch_lists
            ADD COLUMN IF NOT EXISTS alert_on_match BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS alert_threshold DECIMAL(3,2) DEFAULT 0.50,
            ADD COLUMN IF NOT EXISTS auto_add_to_dossier BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS target_dossier_id BIGINT
        `

const CREATE_WATCH_LISTS_INDEX = `
          CREATE INDEX IF NOT EXISTS idx_watch_lists_user
          ON watch_lists(user_id, is_active)
        `

const CREATE_WATCH_LIST_MATCHES_TABLE = `
          CREATE TABLE IF NOT EXISTS watch_list_matches (
            id BIGSERIAL PRIMARY KEY,
            watch_list_id BIGINT NOT NULL REFERENCES watch_lists(id) ON DELETE CASCADE,
            regulatory_update_id BIGINT NOT NULL,
            match_score DECIMAL(3,2) DEFAULT 0,
            match_reasons JSONB DEFAULT '{}',
            reviewed BOOLEAN DEFAULT FALSE,
            reviewed_at TIMESTAMP WITHOUT TIME ZONE,
            dismissed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            UNIQUE(watch_list_id, regulatory_update_id)
          )
        `

const ALTER_WATCH_LIST_MATCHES_TABLE = `
          ALTER TABLE watch_list_matches
            ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITHOUT TIME ZONE
        `

const CREATE_WATCH_LIST_MATCHES_INDEX = `
          CREATE INDEX IF NOT EXISTS idx_watch_list_matches_list
          ON watch_list_matches(watch_list_id, dismissed)
        `

const CREATE_WATCH_LIST_MATCHES_UPDATE_INDEX = `
          CREATE INDEX IF NOT EXISTS idx_watch_list_matches_update
          ON watch_list_matches(regulatory_update_id)
        `

const GET_WATCH_LISTS_QUERY = `
            SELECT w.*, 
              (SELECT COUNT(*) FROM watch_list_matches m WHERE m.watch_list_id = w.id AND m.dismissed = FALSE) as match_count,
              (SELECT COUNT(*) FROM watch_list_matches m WHERE m.watch_list_id = w.id AND m.dismissed = FALSE AND m.reviewed = FALSE) as unreviewed_count
            FROM watch_lists w
            WHERE w.user_id = $1 AND w.is_active = TRUE
            ORDER BY w.created_at DESC
          `

const GET_WATCH_LIST_BY_ID_QUERY = `
            SELECT w.*, 
              (SELECT COUNT(*) FROM watch_list_matches m WHERE m.watch_list_id = w.id AND m.dismissed = FALSE) as match_count,
              (SELECT COUNT(*) FROM watch_list_matches m WHERE m.watch_list_id = w.id AND m.dismissed = FALSE AND m.reviewed = FALSE) as unreviewed_count
            FROM watch_lists w
            WHERE w.id = $1 AND w.user_id = $2
          `

const INSERT_WATCH_LIST_QUERY = `
            INSERT INTO watch_lists (
              user_id, name, description, keywords, authorities, sectors,
              alert_on_match, alert_threshold, auto_add_to_dossier, target_dossier_id,
              is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NOW(), NOW())
            RETURNING *
          `

const UPDATE_WATCH_LIST_QUERY = (setClauses) => `
            UPDATE watch_lists SET ${setClauses.join(', ')}
            WHERE id = $1 AND user_id = $2
            RETURNING *
          `

const DELETE_WATCH_LIST_QUERY = `
            UPDATE watch_lists SET is_active = FALSE, updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
          `

const WATCH_LIST_MATCHES_BASE_QUERY = `
            SELECT m.*, u.headline, u.summary, u.ai_summary, u.authority, u.sector,
                   u.impact_level, u.published_date, u.url
            FROM watch_list_matches m
            LEFT JOIN regulatory_updates u ON m.regulatory_update_id = u.id
            WHERE m.watch_list_id = $1
          `

const INSERT_WATCH_LIST_MATCH_QUERY = `
            INSERT INTO watch_list_matches (
              watch_list_id, regulatory_update_id, match_score, match_reasons, reviewed, reviewed_at, dismissed, created_at
            ) VALUES ($1, $2, $3, $4, FALSE, NULL, FALSE, NOW())
            ON CONFLICT (watch_list_id, regulatory_update_id) DO UPDATE SET
              match_score = EXCLUDED.match_score,
              match_reasons = EXCLUDED.match_reasons
            RETURNING *
          `

const MARK_WATCH_LIST_MATCH_REVIEWED_QUERY = `
            UPDATE watch_list_matches
            SET reviewed = TRUE, reviewed_at = NOW()
            WHERE id = $1
            RETURNING *
          `

const DISMISS_WATCH_LIST_MATCH_QUERY = `
            UPDATE watch_list_matches SET dismissed = TRUE
            WHERE id = $1
            RETURNING *
          `

const DELETE_WATCH_LIST_MATCH_QUERY = `
            DELETE FROM watch_list_matches
            WHERE id = $1
            RETURNING *
          `

const GET_MATCH_COUNT_QUERY = `
            SELECT COUNT(*) as count FROM watch_list_matches
            WHERE watch_list_id = $1 AND dismissed = FALSE
          `

const GET_ALL_ACTIVE_WATCH_LISTS_QUERY = `
            SELECT * FROM watch_lists WHERE is_active = TRUE
          `

function buildWatchListUpdateQuery(watchListId, userKey, updates) {
  const setClauses = []
  const values = [watchListId, userKey]
  let paramCount = 2

  if (updates.name !== undefined) {
    setClauses.push(`name = $${++paramCount}`)
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    setClauses.push(`description = $${++paramCount}`)
    values.push(updates.description)
  }
  if (updates.keywords !== undefined) {
    setClauses.push(`keywords = $${++paramCount}`)
    values.push(updates.keywords)
  }
  if (updates.authorities !== undefined) {
    setClauses.push(`authorities = $${++paramCount}`)
    values.push(updates.authorities)
  }
  if (updates.sectors !== undefined) {
    setClauses.push(`sectors = $${++paramCount}`)
    values.push(updates.sectors)
  }
  if (updates.alertOnMatch !== undefined || updates.alert_on_match !== undefined) {
    const next = updates.alertOnMatch !== undefined ? updates.alertOnMatch : updates.alert_on_match
    setClauses.push(`alert_on_match = $${++paramCount}`)
    values.push(next !== false)
  }
  if (updates.alertThreshold !== undefined || updates.alert_threshold !== undefined) {
    const raw = updates.alertThreshold !== undefined ? updates.alertThreshold : updates.alert_threshold
    const parsed = Number.parseFloat(raw)
    setClauses.push(`alert_threshold = $${++paramCount}`)
    values.push(Number.isFinite(parsed) ? parsed : 0.5)
  }
  if (updates.autoAddToDossier !== undefined || updates.auto_add_to_dossier !== undefined) {
    const next = updates.autoAddToDossier !== undefined ? updates.autoAddToDossier : updates.auto_add_to_dossier
    setClauses.push(`auto_add_to_dossier = $${++paramCount}`)
    values.push(next === true)
  }
  if (updates.targetDossierId !== undefined || updates.target_dossier_id !== undefined) {
    const next = updates.targetDossierId !== undefined ? updates.targetDossierId : updates.target_dossier_id
    setClauses.push(`target_dossier_id = $${++paramCount}`)
    values.push(next || null)
  }

  if (setClauses.length === 0) {
    return { text: '', values, hasUpdates: false }
  }

  setClauses.push('updated_at = NOW()')

  return {
    text: UPDATE_WATCH_LIST_QUERY(setClauses),
    values,
    hasUpdates: true
  }
}

function buildWatchListMatchesQuery(watchListId, includeDismissed, limit, offset) {
  let query = WATCH_LIST_MATCHES_BASE_QUERY
  const values = [watchListId]
  let paramCount = 1

  if (!includeDismissed) {
    query += ' AND m.dismissed = FALSE'
  }

  query += ' ORDER BY m.created_at DESC'
  query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`
  values.push(limit, offset)

  return { text: query, values }
}

function buildCreateWatchListMatchQuery(watchListId, updateId, matchData) {
  return {
    text: INSERT_WATCH_LIST_MATCH_QUERY,
    values: [
      watchListId,
      updateId,
      matchData.matchScore || 0,
      JSON.stringify(matchData.matchReasons || {})
    ]
  }
}

module.exports = {
  ALTER_WATCH_LISTS_TABLE,
  ALTER_WATCH_LIST_MATCHES_TABLE,
  CREATE_WATCH_LISTS_INDEX,
  CREATE_WATCH_LISTS_TABLE,
  CREATE_WATCH_LIST_MATCHES_INDEX,
  CREATE_WATCH_LIST_MATCHES_TABLE,
  CREATE_WATCH_LIST_MATCHES_UPDATE_INDEX,
  DELETE_WATCH_LIST_MATCH_QUERY,
  DELETE_WATCH_LIST_QUERY,
  DISMISS_WATCH_LIST_MATCH_QUERY,
  GET_ALL_ACTIVE_WATCH_LISTS_QUERY,
  GET_MATCH_COUNT_QUERY,
  GET_WATCH_LIST_BY_ID_QUERY,
  GET_WATCH_LISTS_QUERY,
  INSERT_WATCH_LIST_QUERY,
  MARK_WATCH_LIST_MATCH_REVIEWED_QUERY,
  WATCH_LIST_MATCHES_BASE_QUERY,
  buildCreateWatchListMatchQuery,
  buildWatchListMatchesQuery,
  buildWatchListUpdateQuery
}
