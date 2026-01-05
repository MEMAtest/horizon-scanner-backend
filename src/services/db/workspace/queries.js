const GET_SAVED_SEARCHES_QUERY = `
                      SELECT id, search_name as "searchName", filter_params as "filterParams", 
                             created_date as "createdDate"
                      FROM saved_searches 
                      ORDER BY created_date DESC
                  `

const GET_SAVED_SEARCH_QUERY = `
                      SELECT id, search_name as "searchName", filter_params as "filterParams", 
                             created_date as "createdDate"
                      FROM saved_searches WHERE id = $1
                  `

const INSERT_SAVED_SEARCH_QUERY = `
                      INSERT INTO saved_searches (search_name, filter_params, created_date)
                      VALUES ($1, $2, $3) RETURNING id
                  `

const DELETE_SAVED_SEARCH_QUERY = 'DELETE FROM saved_searches WHERE id = $1'

const INSERT_CUSTOM_ALERT_QUERY = `
                      INSERT INTO custom_alerts (alert_name, alert_conditions, is_active, created_date)
                      VALUES ($1, $2, $3, $4) RETURNING id
                  `

const GET_CUSTOM_ALERTS_QUERY = `
                      SELECT id, alert_name as "alertName", alert_conditions as "alertConditions", 
                             is_active as "isActive", created_date as "createdDate"
                      FROM custom_alerts 
                      ORDER BY created_date DESC
                  `

const UPDATE_ALERT_STATUS_QUERY = 'UPDATE custom_alerts SET is_active = $1 WHERE id = $2'

const DELETE_CUSTOM_ALERT_QUERY = 'DELETE FROM custom_alerts WHERE id = $1'

const GET_PINNED_ITEMS_QUERY = `
                      SELECT p.*,
                             COALESCE(u.area, '') as update_area,
                             COALESCE(u.sector, '') as update_sector,
                             COALESCE(u.authority, p.update_authority) as authority
                      FROM pinned_items p
                      LEFT JOIN regulatory_updates u ON p.update_url = u.url
                      ORDER BY p.pinned_date DESC
                  `

const UPDATE_PINNED_ITEM_COLLECTION_QUERY = `UPDATE pinned_items
             SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) || jsonb_build_object('collectionId', $2)
             WHERE update_url = $1`

const UPDATE_PINNED_ITEM_COLLECTION_BY_UPDATE_ID_QUERY = `UPDATE pinned_items
             SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) || jsonb_build_object('collectionId', $2)
             WHERE metadata->>'updateId' = $1`

const UPDATE_PINNED_ITEM_COLLECTION_BY_ID_QUERY = `UPDATE pinned_items
             SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) || jsonb_build_object('collectionId', $2)
             WHERE id = $1`

const UPDATE_PINNED_ITEM_TOPIC_QUERY = `UPDATE pinned_items
               SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) || jsonb_build_object('topicArea', $2)
               WHERE update_url = $1`

const UPDATE_PINNED_ITEM_TOPIC_BY_UPDATE_ID_QUERY = `UPDATE pinned_items
               SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) || jsonb_build_object('topicArea', $2)
               WHERE metadata->>'updateId' = $1`

const UPDATE_PINNED_ITEM_TOPIC_BY_ID_QUERY = `UPDATE pinned_items
               SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) || jsonb_build_object('topicArea', $2)
               WHERE id = $1`

const CLEAR_PINNED_ITEM_TOPIC_QUERY = `UPDATE pinned_items
               SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) - 'topicArea'
               WHERE update_url = $1`

const CLEAR_PINNED_ITEM_TOPIC_BY_UPDATE_ID_QUERY = `UPDATE pinned_items
               SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) - 'topicArea'
               WHERE metadata->>'updateId' = $1`

const CLEAR_PINNED_ITEM_TOPIC_BY_ID_QUERY = `UPDATE pinned_items
               SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) - 'topicArea'
               WHERE id = $1`

const DELETE_PINNED_ITEM_BY_UPDATE_ID_QUERY = `DELETE FROM pinned_items
                 WHERE metadata->>'updateId' = $1`

const INSERT_PINNED_ITEM_QUERY = `
                      INSERT INTO pinned_items (update_url, update_title, update_authority, notes, pinned_date, metadata, sectors)
                      VALUES ($1, $2, $3, $4, $5, $6, $7)
                      RETURNING id, metadata, sectors
                  `

const INSERT_PINNED_ITEM_LEGACY_QUERY = `
                          INSERT INTO pinned_items (update_url, update_title, notes, pinned_date)
                          VALUES ($1, $2, $3, $4) RETURNING id
                      `

const DELETE_PINNED_ITEM_QUERY = 'DELETE FROM pinned_items WHERE update_url = $1'

const UPDATE_PINNED_ITEM_NOTES_QUERY = 'UPDATE pinned_items SET notes = $1 WHERE update_url = $2'

const GET_FIRM_PROFILE_QUERY = `
                      SELECT * FROM firm_profiles 
                      ORDER BY id DESC 
                      LIMIT 1
                  `

const CLEAR_FIRM_PROFILE_QUERY = 'DELETE FROM firm_profiles'

const INSERT_FIRM_PROFILE_QUERY = `
                      INSERT INTO firm_profiles (firm_name, primary_sectors, firm_size, created_at)
                      VALUES ($1, $2, $3, NOW())
                  `

module.exports = {
  CLEAR_FIRM_PROFILE_QUERY,
  CLEAR_PINNED_ITEM_TOPIC_QUERY,
  CLEAR_PINNED_ITEM_TOPIC_BY_UPDATE_ID_QUERY,
  CLEAR_PINNED_ITEM_TOPIC_BY_ID_QUERY,
  DELETE_CUSTOM_ALERT_QUERY,
  DELETE_PINNED_ITEM_BY_UPDATE_ID_QUERY,
  DELETE_PINNED_ITEM_QUERY,
  DELETE_SAVED_SEARCH_QUERY,
  GET_CUSTOM_ALERTS_QUERY,
  GET_FIRM_PROFILE_QUERY,
  GET_PINNED_ITEMS_QUERY,
  GET_SAVED_SEARCH_QUERY,
  GET_SAVED_SEARCHES_QUERY,
  INSERT_CUSTOM_ALERT_QUERY,
  INSERT_FIRM_PROFILE_QUERY,
  INSERT_PINNED_ITEM_LEGACY_QUERY,
  INSERT_PINNED_ITEM_QUERY,
  INSERT_SAVED_SEARCH_QUERY,
  UPDATE_ALERT_STATUS_QUERY,
  UPDATE_PINNED_ITEM_COLLECTION_QUERY,
  UPDATE_PINNED_ITEM_COLLECTION_BY_UPDATE_ID_QUERY,
  UPDATE_PINNED_ITEM_COLLECTION_BY_ID_QUERY,
  UPDATE_PINNED_ITEM_NOTES_QUERY,
  UPDATE_PINNED_ITEM_TOPIC_QUERY,
  UPDATE_PINNED_ITEM_TOPIC_BY_UPDATE_ID_QUERY,
  UPDATE_PINNED_ITEM_TOPIC_BY_ID_QUERY
}
