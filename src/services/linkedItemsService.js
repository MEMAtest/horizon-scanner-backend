/**
 * Linked Items Service
 * Provides unified API for getting all cross-feature connections
 */

const dbService = require('./dbService')

/**
 * Get all items linked to a Watch List
 * Returns: matching regulatory updates, linked kanban items, dossiers containing those updates
 */
async function getWatchListLinkedItems(watchListId, userId) {
  try {
    const client = await dbService.pool.connect()
    try {
      // Get all matches for this watch list
      const matchesResult = await client.query(`
        SELECT
          wlm.id,
          wlm.regulatory_update_id,
          wlm.match_score,
          ru.headline,
          ru.authority,
          ru.published_date
        FROM watch_list_matches wlm
        LEFT JOIN regulatory_updates ru ON ru.id = wlm.regulatory_update_id
        WHERE wlm.watch_list_id = $1 AND wlm.dismissed = false
        ORDER BY wlm.created_at DESC
        LIMIT 50
      `, [watchListId])

      const updateIds = matchesResult.rows
        .filter(r => r.regulatory_update_id)
        .map(r => r.regulatory_update_id)

      // Get dossiers containing any matched updates
      let dossiers = []
      if (updateIds.length > 0) {
        const dossiersResult = await client.query(`
          SELECT DISTINCT
            d.id,
            d.name,
            d.category,
            d.status,
            COUNT(di.id) as matched_update_count
          FROM research_dossiers d
          INNER JOIN dossier_items di ON di.dossier_id = d.id
          WHERE di.regulatory_update_id = ANY($1::bigint[])
            AND d.user_id = $2
          GROUP BY d.id
          LIMIT 20
        `, [updateIds, userId])
        dossiers = dossiersResult.rows
      }

      // Get Kanban items linked via regulatory updates
      let kanbanItems = []
      if (updateIds.length > 0) {
        const kanbanResult = await client.query(`
          SELECT DISTINCT
            rci.id,
            rci.title,
            rci.priority,
            rci.current_stage_id,
            wst.name as stage_name
          FROM regulatory_change_items rci
          LEFT JOIN workflow_stage_templates wst ON wst.id::text = rci.current_stage_id
          WHERE rci.regulatory_update_id = ANY($1::bigint[])
            AND rci.user_id = $2
          LIMIT 20
        `, [updateIds, userId])
        kanbanItems = kanbanResult.rows
      }

      // Get policies citing any matched updates
      let policies = []
      if (updateIds.length > 0) {
        const policiesResult = await client.query(`
          SELECT DISTINCT
            p.id,
            p.name,
            p.category,
            p.status,
            COUNT(pc.id) as citation_count
          FROM policies p
          INNER JOIN policy_versions pv ON pv.policy_id = p.id
          INNER JOIN policy_citations pc ON pc.policy_version_id = pv.id
          WHERE pc.regulatory_update_id = ANY($1::bigint[])
            AND p.user_id = $2
          GROUP BY p.id
          LIMIT 20
        `, [updateIds, userId])
        policies = policiesResult.rows
      }

      return {
        success: true,
        data: {
          matches: matchesResult.rows,
          dossiers: dossiers,
          kanbanItems: kanbanItems,
          policies: policies,
          summary: {
            totalMatches: matchesResult.rows.length,
            totalDossiers: dossiers.length,
            totalKanbanItems: kanbanItems.length,
            totalPolicies: policies.length
          }
        }
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[LinkedItems] Error getting watch list links:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all items linked to a Dossier
 * Returns: regulatory updates in dossier, watch lists matching those updates, policies citing them, kanban items
 */
async function getDossierLinkedItems(dossierId, userId) {
  try {
    const client = await dbService.pool.connect()
    try {
      // Get all updates in this dossier
      const updatesResult = await client.query(`
        SELECT
          di.regulatory_update_id,
          di.user_notes,
          di.relevance_rating,
          ru.headline,
          ru.authority,
          ru.published_date
        FROM dossier_items di
        LEFT JOIN regulatory_updates ru ON ru.id = di.regulatory_update_id
        INNER JOIN research_dossiers d ON d.id = di.dossier_id
        WHERE di.dossier_id = $1 AND d.user_id = $2
        ORDER BY di.added_at DESC
        LIMIT 50
      `, [dossierId, userId])

      const updateIds = updatesResult.rows
        .filter(r => r.regulatory_update_id)
        .map(r => r.regulatory_update_id)

      // Get watch lists that match any of these updates
      let watchLists = []
      if (updateIds.length > 0) {
        const watchListsResult = await client.query(`
          SELECT DISTINCT
            wl.id,
            wl.name,
            COUNT(wlm.id) as match_count
          FROM watch_lists wl
          INNER JOIN watch_list_matches wlm ON wlm.watch_list_id = wl.id
          WHERE wlm.regulatory_update_id = ANY($1::bigint[])
            AND wl.user_id = $2
            AND wlm.dismissed = false
          GROUP BY wl.id
          LIMIT 20
        `, [updateIds, userId])
        watchLists = watchListsResult.rows
      }

      // Get policies citing any of these updates
      let policies = []
      if (updateIds.length > 0) {
        const policiesResult = await client.query(`
          SELECT DISTINCT
            p.id,
            p.name,
            p.category,
            p.status,
            COUNT(pc.id) as citation_count
          FROM policies p
          INNER JOIN policy_versions pv ON pv.policy_id = p.id
          INNER JOIN policy_citations pc ON pc.policy_version_id = pv.id
          WHERE pc.regulatory_update_id = ANY($1::bigint[])
            AND p.user_id = $2
          GROUP BY p.id
          LIMIT 20
        `, [updateIds, userId])
        policies = policiesResult.rows
      }

      // Get Kanban items linked to these updates
      let kanbanItems = []
      if (updateIds.length > 0) {
        const kanbanResult = await client.query(`
          SELECT DISTINCT
            rci.id,
            rci.title,
            rci.priority,
            rci.current_stage_id,
            wst.name as stage_name
          FROM regulatory_change_items rci
          LEFT JOIN workflow_stage_templates wst ON wst.id::text = rci.current_stage_id
          WHERE rci.regulatory_update_id = ANY($1::bigint[])
            AND rci.user_id = $2
          LIMIT 20
        `, [updateIds, userId])
        kanbanItems = kanbanResult.rows
      }

      return {
        success: true,
        data: {
          updates: updatesResult.rows,
          watchLists: watchLists,
          policies: policies,
          kanbanItems: kanbanItems,
          summary: {
            totalUpdates: updatesResult.rows.length,
            totalWatchLists: watchLists.length,
            totalPolicies: policies.length,
            totalKanbanItems: kanbanItems.length
          }
        }
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[LinkedItems] Error getting dossier links:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all items linked to a Policy
 * Returns: regulatory updates cited, dossiers containing those updates, watch lists, kanban items
 */
async function getPolicyLinkedItems(policyId, userId) {
  try {
    const client = await dbService.pool.connect()
    try {
      // Get all citations for this policy (across all versions)
      const citationsResult = await client.query(`
        SELECT
          pc.id,
          pc.regulatory_update_id,
          pc.citation_type,
          pc.section_reference,
          pc.notes,
          pv.version_number,
          ru.headline,
          ru.authority,
          ru.published_date
        FROM policy_citations pc
        INNER JOIN policy_versions pv ON pv.id = pc.policy_version_id
        LEFT JOIN regulatory_updates ru ON ru.id = pc.regulatory_update_id
        INNER JOIN policies p ON p.id = pv.policy_id
        WHERE pv.policy_id = $1 AND p.user_id = $2
        ORDER BY pc.created_at DESC
        LIMIT 50
      `, [policyId, userId])

      const updateIds = citationsResult.rows
        .filter(r => r.regulatory_update_id)
        .map(r => r.regulatory_update_id)

      // Get dossiers containing any cited updates
      let dossiers = []
      if (updateIds.length > 0) {
        const dossiersResult = await client.query(`
          SELECT DISTINCT
            d.id,
            d.name,
            d.category,
            d.status,
            COUNT(di.id) as update_count
          FROM research_dossiers d
          INNER JOIN dossier_items di ON di.dossier_id = d.id
          WHERE di.regulatory_update_id = ANY($1::bigint[])
            AND d.user_id = $2
          GROUP BY d.id
          LIMIT 20
        `, [updateIds, userId])
        dossiers = dossiersResult.rows
      }

      // Get watch lists matching any cited updates
      let watchLists = []
      if (updateIds.length > 0) {
        const watchListsResult = await client.query(`
          SELECT DISTINCT
            wl.id,
            wl.name,
            COUNT(wlm.id) as match_count
          FROM watch_lists wl
          INNER JOIN watch_list_matches wlm ON wlm.watch_list_id = wl.id
          WHERE wlm.regulatory_update_id = ANY($1::bigint[])
            AND wl.user_id = $2
            AND wlm.dismissed = false
          GROUP BY wl.id
          LIMIT 20
        `, [updateIds, userId])
        watchLists = watchListsResult.rows
      }

      // Get Kanban items linked to these updates
      let kanbanItems = []
      if (updateIds.length > 0) {
        const kanbanResult = await client.query(`
          SELECT DISTINCT
            rci.id,
            rci.title,
            rci.priority,
            rci.current_stage_id,
            wst.name as stage_name
          FROM regulatory_change_items rci
          LEFT JOIN workflow_stage_templates wst ON wst.id::text = rci.current_stage_id
          WHERE rci.regulatory_update_id = ANY($1::bigint[])
            AND rci.user_id = $2
          LIMIT 20
        `, [updateIds, userId])
        kanbanItems = kanbanResult.rows
      }

      return {
        success: true,
        data: {
          citations: citationsResult.rows,
          dossiers: dossiers,
          watchLists: watchLists,
          kanbanItems: kanbanItems,
          summary: {
            totalCitations: citationsResult.rows.length,
            totalDossiers: dossiers.length,
            totalWatchLists: watchLists.length,
            totalKanbanItems: kanbanItems.length
          }
        }
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[LinkedItems] Error getting policy links:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all items linked to a Kanban Item (Regulatory Change)
 * Returns: source update, dossiers, policies, watch list matches
 */
async function getKanbanItemLinkedItems(itemId, userId) {
  try {
    const client = await dbService.pool.connect()
    try {
      // Get the kanban item details including source update
      const itemResult = await client.query(`
        SELECT
          rci.id,
          rci.title,
          rci.regulatory_update_id,
          rci.linked_dossier_ids,
          rci.linked_policy_ids,
          ru.headline as source_headline,
          ru.authority as source_authority,
          ru.published_date as source_published_date
        FROM regulatory_change_items rci
        LEFT JOIN regulatory_updates ru ON ru.id = rci.regulatory_update_id
        WHERE rci.id = $1 AND rci.user_id = $2
      `, [itemId, userId])

      if (itemResult.rows.length === 0) {
        return { success: false, error: 'Kanban item not found' }
      }

      const item = itemResult.rows[0]
      const sourceUpdateId = item.regulatory_update_id

      // Get linked dossiers
      let dossiers = []
      if (item.linked_dossier_ids && item.linked_dossier_ids.length > 0) {
        const dossiersResult = await client.query(`
          SELECT id, name, category, status
          FROM research_dossiers
          WHERE id = ANY($1::bigint[])
            AND user_id = $2
        `, [item.linked_dossier_ids, userId])
        dossiers = dossiersResult.rows
      }

      // Get linked policies
      let policies = []
      if (item.linked_policy_ids && item.linked_policy_ids.length > 0) {
        const policiesResult = await client.query(`
          SELECT id, name, category, status
          FROM policies
          WHERE id = ANY($1::bigint[])
            AND user_id = $2
        `, [item.linked_policy_ids, userId])
        policies = policiesResult.rows
      }

      // Get watch lists that match the source update
      let watchLists = []
      if (sourceUpdateId) {
        const watchListsResult = await client.query(`
          SELECT DISTINCT
            wl.id,
            wl.name,
            wlm.match_score
          FROM watch_lists wl
          INNER JOIN watch_list_matches wlm ON wlm.watch_list_id = wl.id
          WHERE wlm.regulatory_update_id = $1
            AND wl.user_id = $2
            AND wlm.dismissed = false
          LIMIT 20
        `, [sourceUpdateId, userId])
        watchLists = watchListsResult.rows
      }

      return {
        success: true,
        data: {
          sourceUpdate: sourceUpdateId ? {
            id: sourceUpdateId,
            headline: item.source_headline,
            authority: item.source_authority,
            publishedDate: item.source_published_date
          } : null,
          dossiers: dossiers,
          policies: policies,
          watchLists: watchLists,
          summary: {
            hasSourceUpdate: !!sourceUpdateId,
            totalDossiers: dossiers.length,
            totalPolicies: policies.length,
            totalWatchLists: watchLists.length
          }
        }
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[LinkedItems] Error getting kanban item links:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all items linked to a Regulatory Update
 * Returns: watch lists matching, dossiers containing, policies citing, kanban items
 */
async function getRegulatoryUpdateLinkedItems(updateId, userId) {
  try {
    const client = await dbService.pool.connect()
    try {
      // Get watch lists matching this update
      const watchListsResult = await client.query(`
        SELECT
          wl.id,
          wl.name,
          wlm.match_score,
          wlm.dismissed
        FROM watch_lists wl
        INNER JOIN watch_list_matches wlm ON wlm.watch_list_id = wl.id
        WHERE wlm.regulatory_update_id = $1
          AND wl.user_id = $2
          AND wlm.dismissed = false
        LIMIT 20
      `, [updateId, userId])

      // Get dossiers containing this update
      const dossiersResult = await client.query(`
        SELECT
          d.id,
          d.name,
          d.category,
          d.status,
          di.user_notes,
          di.relevance_rating
        FROM research_dossiers d
        INNER JOIN dossier_items di ON di.dossier_id = d.id
        WHERE di.regulatory_update_id = $1
          AND d.user_id = $2
        LIMIT 20
      `, [updateId, userId])

      // Get policies citing this update
      const policiesResult = await client.query(`
        SELECT
          p.id,
          p.name,
          p.category,
          p.status,
          pc.citation_type,
          pc.notes
        FROM policies p
        INNER JOIN policy_versions pv ON pv.policy_id = p.id
        INNER JOIN policy_citations pc ON pc.policy_version_id = pv.id
        WHERE pc.regulatory_update_id = $1
          AND p.user_id = $2
        LIMIT 20
      `, [updateId, userId])

      // Get Kanban items tracking this update
      const kanbanResult = await client.query(`
        SELECT
          rci.id,
          rci.title,
          rci.priority,
          wst.name as stage_name
        FROM regulatory_change_items rci
        LEFT JOIN workflow_stage_templates wst ON wst.id::text = rci.current_stage_id
        WHERE rci.regulatory_update_id = $1
          AND rci.user_id = $2
        LIMIT 20
      `, [updateId, userId])

      return {
        success: true,
        data: {
          watchLists: watchListsResult.rows,
          dossiers: dossiersResult.rows,
          policies: policiesResult.rows,
          kanbanItems: kanbanResult.rows,
          summary: {
            totalWatchLists: watchListsResult.rows.length,
            totalDossiers: dossiersResult.rows.length,
            totalPolicies: policiesResult.rows.length,
            totalKanbanItems: kanbanResult.rows.length
          }
        }
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[LinkedItems] Error getting update links:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get connection counts for all watch lists
 * Returns: { watchListId: { dossiers: X, policies: X, kanban: X, total: X } }
 */
async function getWatchListConnectionCounts(userId) {
  try {
    const client = await dbService.pool.connect()
    try {
      const result = await client.query(`
        WITH watch_list_updates AS (
          SELECT wl.id as watch_list_id, wlm.regulatory_update_id
          FROM watch_lists wl
          LEFT JOIN watch_list_matches wlm ON wlm.watch_list_id = wl.id AND wlm.dismissed = false
          WHERE wl.user_id = $1 AND wl.is_active = true
        ),
        dossier_counts AS (
          SELECT wlu.watch_list_id, COUNT(DISTINCT d.id) as count
          FROM watch_list_updates wlu
          INNER JOIN dossier_items di ON di.regulatory_update_id = wlu.regulatory_update_id
          INNER JOIN research_dossiers d ON d.id = di.dossier_id AND d.user_id = $1
          GROUP BY wlu.watch_list_id
        ),
        policy_counts AS (
          SELECT wlu.watch_list_id, COUNT(DISTINCT p.id) as count
          FROM watch_list_updates wlu
          INNER JOIN policy_citations pc ON pc.regulatory_update_id = wlu.regulatory_update_id
          INNER JOIN policy_versions pv ON pv.id = pc.policy_version_id
          INNER JOIN policies p ON p.id = pv.policy_id AND p.user_id = $1
          GROUP BY wlu.watch_list_id
        ),
        kanban_counts AS (
          SELECT wlu.watch_list_id, COUNT(DISTINCT rci.id) as count
          FROM watch_list_updates wlu
          INNER JOIN regulatory_change_items rci ON rci.regulatory_update_id = wlu.regulatory_update_id AND rci.user_id = $1
          GROUP BY wlu.watch_list_id
        )
        SELECT
          wl.id,
          COALESCE(dc.count, 0) as dossier_count,
          COALESCE(pc.count, 0) as policy_count,
          COALESCE(kc.count, 0) as kanban_count
        FROM watch_lists wl
        LEFT JOIN dossier_counts dc ON dc.watch_list_id = wl.id
        LEFT JOIN policy_counts pc ON pc.watch_list_id = wl.id
        LEFT JOIN kanban_counts kc ON kc.watch_list_id = wl.id
        WHERE wl.user_id = $1 AND wl.is_active = true
      `, [userId])

      const counts = {}
      result.rows.forEach(row => {
        const dossiers = parseInt(row.dossier_count) || 0
        const policies = parseInt(row.policy_count) || 0
        const kanban = parseInt(row.kanban_count) || 0
        counts[row.id] = {
          dossiers,
          policies,
          kanban,
          total: dossiers + policies + kanban
        }
      })
      return counts
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[LinkedItems] Error getting watch list connection counts:', error)
    return {}
  }
}

/**
 * Get connection counts for all dossiers
 */
async function getDossierConnectionCounts(userId) {
  try {
    const client = await dbService.pool.connect()
    try {
      const result = await client.query(`
        WITH dossier_updates AS (
          SELECT d.id as dossier_id, di.regulatory_update_id
          FROM research_dossiers d
          LEFT JOIN dossier_items di ON di.dossier_id = d.id
          WHERE d.user_id = $1
        ),
        watchlist_counts AS (
          SELECT du.dossier_id, COUNT(DISTINCT wl.id) as count
          FROM dossier_updates du
          INNER JOIN watch_list_matches wlm ON wlm.regulatory_update_id = du.regulatory_update_id AND wlm.dismissed = false
          INNER JOIN watch_lists wl ON wl.id = wlm.watch_list_id AND wl.user_id = $1
          GROUP BY du.dossier_id
        ),
        policy_counts AS (
          SELECT du.dossier_id, COUNT(DISTINCT p.id) as count
          FROM dossier_updates du
          INNER JOIN policy_citations pc ON pc.regulatory_update_id = du.regulatory_update_id
          INNER JOIN policy_versions pv ON pv.id = pc.policy_version_id
          INNER JOIN policies p ON p.id = pv.policy_id AND p.user_id = $1
          GROUP BY du.dossier_id
        ),
        kanban_counts AS (
          SELECT du.dossier_id, COUNT(DISTINCT rci.id) as count
          FROM dossier_updates du
          INNER JOIN regulatory_change_items rci ON rci.regulatory_update_id = du.regulatory_update_id AND rci.user_id = $1
          GROUP BY du.dossier_id
        )
        SELECT
          d.id,
          COALESCE(wc.count, 0) as watchlist_count,
          COALESCE(pc.count, 0) as policy_count,
          COALESCE(kc.count, 0) as kanban_count
        FROM research_dossiers d
        LEFT JOIN watchlist_counts wc ON wc.dossier_id = d.id
        LEFT JOIN policy_counts pc ON pc.dossier_id = d.id
        LEFT JOIN kanban_counts kc ON kc.dossier_id = d.id
        WHERE d.user_id = $1
      `, [userId])

      const counts = {}
      result.rows.forEach(row => {
        const watchLists = parseInt(row.watchlist_count) || 0
        const policies = parseInt(row.policy_count) || 0
        const kanban = parseInt(row.kanban_count) || 0
        counts[row.id] = {
          watchLists,
          policies,
          kanban,
          total: watchLists + policies + kanban
        }
      })
      return counts
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[LinkedItems] Error getting dossier connection counts:', error)
    return {}
  }
}

/**
 * Get connection counts for all policies
 */
async function getPolicyConnectionCounts(userId) {
  try {
    const client = await dbService.pool.connect()
    try {
      const result = await client.query(`
        WITH policy_updates AS (
          SELECT p.id as policy_id, pc.regulatory_update_id
          FROM policies p
          INNER JOIN policy_versions pv ON pv.policy_id = p.id
          LEFT JOIN policy_citations pc ON pc.policy_version_id = pv.id
          WHERE p.user_id = $1
        ),
        watchlist_counts AS (
          SELECT pu.policy_id, COUNT(DISTINCT wl.id) as count
          FROM policy_updates pu
          INNER JOIN watch_list_matches wlm ON wlm.regulatory_update_id = pu.regulatory_update_id AND wlm.dismissed = false
          INNER JOIN watch_lists wl ON wl.id = wlm.watch_list_id AND wl.user_id = $1
          GROUP BY pu.policy_id
        ),
        dossier_counts AS (
          SELECT pu.policy_id, COUNT(DISTINCT d.id) as count
          FROM policy_updates pu
          INNER JOIN dossier_items di ON di.regulatory_update_id = pu.regulatory_update_id
          INNER JOIN research_dossiers d ON d.id = di.dossier_id AND d.user_id = $1
          GROUP BY pu.policy_id
        ),
        kanban_counts AS (
          SELECT pu.policy_id, COUNT(DISTINCT rci.id) as count
          FROM policy_updates pu
          INNER JOIN regulatory_change_items rci ON rci.regulatory_update_id = pu.regulatory_update_id AND rci.user_id = $1
          GROUP BY pu.policy_id
        )
        SELECT
          p.id,
          COALESCE(wc.count, 0) as watchlist_count,
          COALESCE(dc.count, 0) as dossier_count,
          COALESCE(kc.count, 0) as kanban_count
        FROM policies p
        LEFT JOIN watchlist_counts wc ON wc.policy_id = p.id
        LEFT JOIN dossier_counts dc ON dc.policy_id = p.id
        LEFT JOIN kanban_counts kc ON kc.policy_id = p.id
        WHERE p.user_id = $1
      `, [userId])

      const counts = {}
      result.rows.forEach(row => {
        const watchLists = parseInt(row.watchlist_count) || 0
        const dossiers = parseInt(row.dossier_count) || 0
        const kanban = parseInt(row.kanban_count) || 0
        counts[row.id] = {
          watchLists,
          dossiers,
          kanban,
          total: watchLists + dossiers + kanban
        }
      })
      return counts
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[LinkedItems] Error getting policy connection counts:', error)
    return {}
  }
}

/**
 * Get connection counts for all kanban items
 */
async function getKanbanConnectionCounts(userId) {
  try {
    const client = await dbService.pool.connect()
    try {
      const result = await client.query(`
        WITH kanban_updates AS (
          SELECT rci.id as kanban_id, rci.regulatory_update_id
          FROM regulatory_change_items rci
          WHERE rci.user_id = $1 AND rci.is_active = true
        ),
        watchlist_counts AS (
          SELECT ku.kanban_id, COUNT(DISTINCT wl.id) as count
          FROM kanban_updates ku
          INNER JOIN watch_list_matches wlm ON wlm.regulatory_update_id = ku.regulatory_update_id AND wlm.dismissed = false
          INNER JOIN watch_lists wl ON wl.id = wlm.watch_list_id AND wl.user_id = $1
          GROUP BY ku.kanban_id
        ),
        dossier_counts AS (
          SELECT ku.kanban_id, COUNT(DISTINCT d.id) as count
          FROM kanban_updates ku
          INNER JOIN dossier_items di ON di.regulatory_update_id = ku.regulatory_update_id
          INNER JOIN research_dossiers d ON d.id = di.dossier_id AND d.user_id = $1
          GROUP BY ku.kanban_id
        ),
        policy_counts AS (
          SELECT ku.kanban_id, COUNT(DISTINCT p.id) as count
          FROM kanban_updates ku
          INNER JOIN policy_citations pc ON pc.regulatory_update_id = ku.regulatory_update_id
          INNER JOIN policy_versions pv ON pv.id = pc.policy_version_id
          INNER JOIN policies p ON p.id = pv.policy_id AND p.user_id = $1
          GROUP BY ku.kanban_id
        )
        SELECT
          rci.id,
          COALESCE(wc.count, 0) as watchlist_count,
          COALESCE(dc.count, 0) as dossier_count,
          COALESCE(pc.count, 0) as policy_count
        FROM regulatory_change_items rci
        LEFT JOIN watchlist_counts wc ON wc.kanban_id = rci.id
        LEFT JOIN dossier_counts dc ON dc.kanban_id = rci.id
        LEFT JOIN policy_counts pc ON pc.kanban_id = rci.id
        WHERE rci.user_id = $1 AND rci.is_active = true
      `, [userId])

      const counts = {}
      result.rows.forEach(row => {
        const watchLists = parseInt(row.watchlist_count) || 0
        const dossiers = parseInt(row.dossier_count) || 0
        const policies = parseInt(row.policy_count) || 0
        counts[row.id] = {
          watchLists,
          dossiers,
          policies,
          total: watchLists + dossiers + policies
        }
      })
      return counts
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[LinkedItems] Error getting kanban connection counts:', error)
    return {}
  }
}

module.exports = {
  getWatchListLinkedItems,
  getDossierLinkedItems,
  getPolicyLinkedItems,
  getKanbanItemLinkedItems,
  getRegulatoryUpdateLinkedItems,
  getWatchListConnectionCounts,
  getDossierConnectionCounts,
  getPolicyConnectionCounts,
  getKanbanConnectionCounts
}
