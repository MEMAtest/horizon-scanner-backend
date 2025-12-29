const CREATE_WORKFLOW_TEMPLATES_TABLE = `
          CREATE TABLE IF NOT EXISTS workflow_stage_templates (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            stages JSONB NOT NULL DEFAULT '[]',
            is_default BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `

const CREATE_WORKFLOW_TEMPLATES_INDEX = `
          CREATE INDEX IF NOT EXISTS idx_workflow_stage_templates_user
          ON workflow_stage_templates(user_id, is_active)
        `

const CREATE_REGULATORY_CHANGE_ITEMS_TABLE = `
          CREATE TABLE IF NOT EXISTS regulatory_change_items (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            business_line_profile_id BIGINT,
            workflow_template_id BIGINT,
            regulatory_update_id BIGINT,
            regulatory_update_url TEXT,
            title VARCHAR(500) NOT NULL,
            summary TEXT,
            authority VARCHAR(100),
            impact_level VARCHAR(20),
            current_stage_id VARCHAR(100),
            stage_history JSONB DEFAULT '[]',
            identified_date TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            target_completion_date TIMESTAMP WITHOUT TIME ZONE,
            actual_completion_date TIMESTAMP WITHOUT TIME ZONE,
            status VARCHAR(30) DEFAULT 'active',
            priority VARCHAR(20) DEFAULT 'medium',
            tags TEXT[] DEFAULT ARRAY[]::TEXT[],
            linked_dossier_ids UUID[] DEFAULT ARRAY[]::UUID[],
            linked_policy_ids UUID[] DEFAULT ARRAY[]::UUID[],
            watch_list_match_ids UUID[] DEFAULT ARRAY[]::UUID[],
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `

const ALTER_REGULATORY_CHANGE_ITEMS_LINKING = `
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regulatory_change_items' AND column_name = 'linked_dossier_ids') THEN
              ALTER TABLE regulatory_change_items ADD COLUMN linked_dossier_ids UUID[] DEFAULT ARRAY[]::UUID[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regulatory_change_items' AND column_name = 'linked_policy_ids') THEN
              ALTER TABLE regulatory_change_items ADD COLUMN linked_policy_ids UUID[] DEFAULT ARRAY[]::UUID[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regulatory_change_items' AND column_name = 'watch_list_match_ids') THEN
              ALTER TABLE regulatory_change_items ADD COLUMN watch_list_match_ids UUID[] DEFAULT ARRAY[]::UUID[];
            END IF;
          END $$;
        `

const CREATE_REGULATORY_CHANGE_ITEMS_USER_INDEX = `
          CREATE INDEX IF NOT EXISTS idx_regulatory_change_items_user
          ON regulatory_change_items(user_id, status)
        `

const CREATE_REGULATORY_CHANGE_ITEMS_PROFILE_INDEX = `
          CREATE INDEX IF NOT EXISTS idx_regulatory_change_items_profile
          ON regulatory_change_items(business_line_profile_id)
        `

const CREATE_REGULATORY_CHANGE_ITEMS_STAGE_INDEX = `
          CREATE INDEX IF NOT EXISTS idx_regulatory_change_items_stage
          ON regulatory_change_items(current_stage_id)
        `

const CREATE_REGULATORY_CHANGE_ACTIONS_TABLE = `
          CREATE TABLE IF NOT EXISTS regulatory_change_actions (
            id BIGSERIAL PRIMARY KEY,
            change_item_id BIGINT NOT NULL,
            user_id TEXT NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            stage_id VARCHAR(100),
            title VARCHAR(255),
            description TEXT,
            from_stage_id VARCHAR(100),
            to_stage_id VARCHAR(100),
            attachments JSONB DEFAULT '[]',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `

const CREATE_REGULATORY_CHANGE_ACTIONS_ITEM_INDEX = `
          CREATE INDEX IF NOT EXISTS idx_regulatory_change_actions_item
          ON regulatory_change_actions(change_item_id)
        `

const CREATE_REGULATORY_CHANGE_ACTIONS_DATE_INDEX = `
          CREATE INDEX IF NOT EXISTS idx_regulatory_change_actions_date
          ON regulatory_change_actions(created_at DESC)
        `

const GET_WORKFLOW_TEMPLATES_QUERY = {
  active: 'SELECT * FROM workflow_stage_templates WHERE user_id = $1 AND is_active = TRUE ORDER BY name ASC',
  all: 'SELECT * FROM workflow_stage_templates WHERE user_id = $1 ORDER BY name ASC'
}

const GET_WORKFLOW_TEMPLATE_BY_ID_QUERY = 'SELECT * FROM workflow_stage_templates WHERE id = $1 AND user_id = $2'

const CLEAR_DEFAULT_WORKFLOW_TEMPLATE_QUERY = 'UPDATE workflow_stage_templates SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1'

const CLEAR_DEFAULT_WORKFLOW_TEMPLATE_EXCEPT_QUERY = 'UPDATE workflow_stage_templates SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1 AND id != $2'

const INSERT_WORKFLOW_TEMPLATE_QUERY = `INSERT INTO workflow_stage_templates (
              user_id, name, description, stages, is_default, is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW()) RETURNING *`

const UPDATE_WORKFLOW_TEMPLATE_QUERY = `UPDATE workflow_stage_templates SET
              name = COALESCE($3, name),
              description = COALESCE($4, description),
              stages = COALESCE($5, stages),
              is_default = COALESCE($6, is_default),
              updated_at = NOW()
            WHERE id = $1 AND user_id = $2 RETURNING *`

const DELETE_WORKFLOW_TEMPLATE_QUERY = 'UPDATE workflow_stage_templates SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *'

const REGULATORY_CHANGE_ITEMS_BASE_QUERY = 'SELECT * FROM regulatory_change_items WHERE user_id = $1 AND is_active = TRUE'

const GET_REGULATORY_CHANGE_ITEM_BY_ID_QUERY = 'SELECT * FROM regulatory_change_items WHERE id = $1 AND user_id = $2'

const INSERT_REGULATORY_CHANGE_ITEM_QUERY = `INSERT INTO regulatory_change_items (
              user_id, business_line_profile_id, workflow_template_id,
              regulatory_update_id, regulatory_update_url,
              title, summary, authority, impact_level,
              current_stage_id, stage_history,
              identified_date, target_completion_date,
              status, priority, tags, is_active,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, TRUE, NOW(), NOW()
            ) RETURNING *`

const UPDATE_REGULATORY_CHANGE_ITEM_QUERY = setClauses =>
  `UPDATE regulatory_change_items SET ${setClauses.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`

const DELETE_REGULATORY_CHANGE_ITEM_QUERY = `UPDATE regulatory_change_items SET is_active = FALSE, status = 'archived', updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`

const INSERT_REGULATORY_CHANGE_ACTION_QUERY = `INSERT INTO regulatory_change_actions (
              change_item_id, user_id, action_type, stage_id,
              title, description, from_stage_id, to_stage_id,
              attachments, metadata, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *`

const GET_REGULATORY_CHANGE_ACTIONS_QUERY = 'SELECT * FROM regulatory_change_actions WHERE change_item_id = $1 ORDER BY created_at DESC'

function buildRegulatoryChangeItemsQuery(userKey, filters = {}) {
  let query = REGULATORY_CHANGE_ITEMS_BASE_QUERY
  const params = [userKey]
  let paramCount = 1

  if (filters.status) {
    query += ` AND status = $${++paramCount}`
    params.push(filters.status)
  }

  if (filters.businessLineProfileId) {
    query += ` AND business_line_profile_id = $${++paramCount}`
    params.push(filters.businessLineProfileId)
  }

  if (filters.currentStageId) {
    query += ` AND current_stage_id = $${++paramCount}`
    params.push(filters.currentStageId)
  }

  if (filters.priority) {
    query += ` AND priority = $${++paramCount}`
    params.push(filters.priority)
  }

  query += ' ORDER BY created_at DESC'

  if (filters.limit) {
    query += ` LIMIT $${++paramCount}`
    params.push(filters.limit)
  }

  return { text: query, values: params }
}

function buildRegulatoryChangeItemUpdateQuery(itemId, userKey, updates = {}) {
  const setClauses = []
  const params = [itemId, userKey]
  let paramCount = 2

  const fieldMap = {
    title: 'title',
    summary: 'summary',
    authority: 'authority',
    impactLevel: 'impact_level',
    currentStageId: 'current_stage_id',
    targetCompletionDate: 'target_completion_date',
    actualCompletionDate: 'actual_completion_date',
    status: 'status',
    priority: 'priority'
  }

  Object.entries(fieldMap).forEach(([jsKey, dbKey]) => {
    if (updates[jsKey] !== undefined) {
      setClauses.push(`${dbKey} = $${++paramCount}`)
      params.push(updates[jsKey])
    }
  })

  if (updates.stageHistory !== undefined) {
    setClauses.push(`stage_history = $${++paramCount}`)
    params.push(JSON.stringify(updates.stageHistory))
  }

  if (updates.tags !== undefined) {
    setClauses.push(`tags = $${++paramCount}`)
    params.push(updates.tags)
  }

  if (setClauses.length === 0) {
    return { text: '', values: params, hasUpdates: false }
  }

  setClauses.push('updated_at = NOW()')

  return {
    text: UPDATE_REGULATORY_CHANGE_ITEM_QUERY(setClauses),
    values: params,
    hasUpdates: true
  }
}

module.exports = {
  ALTER_REGULATORY_CHANGE_ITEMS_LINKING,
  CLEAR_DEFAULT_WORKFLOW_TEMPLATE_EXCEPT_QUERY,
  CLEAR_DEFAULT_WORKFLOW_TEMPLATE_QUERY,
  CREATE_REGULATORY_CHANGE_ACTIONS_DATE_INDEX,
  CREATE_REGULATORY_CHANGE_ACTIONS_ITEM_INDEX,
  CREATE_REGULATORY_CHANGE_ACTIONS_TABLE,
  CREATE_REGULATORY_CHANGE_ITEMS_PROFILE_INDEX,
  CREATE_REGULATORY_CHANGE_ITEMS_STAGE_INDEX,
  CREATE_REGULATORY_CHANGE_ITEMS_TABLE,
  CREATE_REGULATORY_CHANGE_ITEMS_USER_INDEX,
  CREATE_WORKFLOW_TEMPLATES_INDEX,
  CREATE_WORKFLOW_TEMPLATES_TABLE,
  DELETE_REGULATORY_CHANGE_ITEM_QUERY,
  DELETE_WORKFLOW_TEMPLATE_QUERY,
  GET_REGULATORY_CHANGE_ACTIONS_QUERY,
  GET_REGULATORY_CHANGE_ITEM_BY_ID_QUERY,
  GET_WORKFLOW_TEMPLATE_BY_ID_QUERY,
  GET_WORKFLOW_TEMPLATES_QUERY,
  INSERT_REGULATORY_CHANGE_ACTION_QUERY,
  INSERT_REGULATORY_CHANGE_ITEM_QUERY,
  INSERT_WORKFLOW_TEMPLATE_QUERY,
  REGULATORY_CHANGE_ITEMS_BASE_QUERY,
  UPDATE_WORKFLOW_TEMPLATE_QUERY,
  buildRegulatoryChangeItemUpdateQuery,
  buildRegulatoryChangeItemsQuery
}
