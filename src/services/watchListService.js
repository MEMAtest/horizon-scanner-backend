/**
 * Watch List Service
 * Handles watch list management and automatic matching of regulatory updates
 */

const db = require('./dbService')

class WatchListService {
  /**
   * Get all watch lists for a user
   */
  async getWatchLists(userId, options = {}) {
    try {
      const watchLists = await db.getWatchLists(userId, options)
      return { success: true, data: watchLists }
    } catch (error) {
      console.error('[WatchListService] Error getting watch lists:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get a single watch list by ID
   */
  async getWatchListById(watchListId, userId) {
    try {
      const watchList = await db.getWatchListById(watchListId, userId)
      if (!watchList) {
        return { success: false, error: 'Watch list not found' }
      }
      return { success: true, data: watchList }
    } catch (error) {
      console.error('[WatchListService] Error getting watch list:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a new watch list
   */
  async createWatchList(userId, data) {
    try {
      // Validate required fields
      if (!data.name) {
        return { success: false, error: 'Watch list name is required' }
      }

      const watchList = await db.createWatchList(userId, {
        name: data.name,
        description: data.description,
        keywords: data.keywords || [],
        authorities: data.authorities || [],
        sectors: data.sectors || [],
        alertOnMatch: data.alertOnMatch !== false,
        alertThreshold: data.alertThreshold || 0.5,
        autoAddToDossier: data.autoAddToDossier || false,
        targetDossierId: data.targetDossierId
      })

      return { success: true, data: watchList }
    } catch (error) {
      console.error('[WatchListService] Error creating watch list:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update a watch list
   */
  async updateWatchList(watchListId, userId, updates) {
    try {
      const watchList = await db.updateWatchList(watchListId, userId, updates)
      if (!watchList) {
        return { success: false, error: 'Watch list not found' }
      }
      return { success: true, data: watchList }
    } catch (error) {
      console.error('[WatchListService] Error updating watch list:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete a watch list
   */
  async deleteWatchList(watchListId, userId) {
    try {
      const deleted = await db.deleteWatchList(watchListId, userId)
      if (!deleted) {
        return { success: false, error: 'Watch list not found' }
      }
      return { success: true, message: 'Watch list deleted' }
    } catch (error) {
      console.error('[WatchListService] Error deleting watch list:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get matches for a watch list
   */
  async getWatchListMatches(watchListId, userId, options = {}) {
    try {
      const matches = await db.getWatchListMatches(watchListId, userId, options)
      return { success: true, data: matches }
    } catch (error) {
      console.error('[WatchListService] Error getting matches:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Match a new regulatory update against all watch lists
   * This should be called when a new update is added to the system
   */
  async matchUpdateAgainstWatchLists(updateId, updateData, userId) {
    try {
      const matches = await db.matchUpdateAgainstWatchLists(updateId, updateData)

      // Create notifications for high-score matches
      for (const match of matches) {
        if (match.match_score >= match.alert_threshold && match.alert_on_match) {
          await db.createWatchListMatchNotification(
            userId,
            match.watch_list_name,
            { id: updateId, title: updateData.title },
            match.match_score
          )
        }

        // Auto-add to dossier if configured
        if (match.auto_add_to_dossier && match.target_dossier_id) {
          await db.addItemToDossier(match.target_dossier_id, updateId, {
            notes: `Auto-added from watch list "${match.watch_list_name}" (${Math.round(match.match_score * 100)}% match)`,
            addedBy: 'system'
          })
        }
      }

      return { success: true, data: { matchCount: matches.length, matches } }
    } catch (error) {
      console.error('[WatchListService] Error matching update:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Mark a match as reviewed
   */
  async markMatchReviewed(matchId, userId) {
    try {
      const match = await db.markMatchReviewed(matchId, userId)
      if (!match) {
        return { success: false, error: 'Match not found' }
      }
      return { success: true, data: match }
    } catch (error) {
      console.error('[WatchListService] Error marking match reviewed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Dismiss a match (won't be shown in unreviewed list)
   */
  async dismissMatch(matchId, userId) {
    try {
      const match = await db.dismissMatch(matchId, userId)
      if (!match) {
        return { success: false, error: 'Match not found' }
      }
      return { success: true, data: match }
    } catch (error) {
      console.error('[WatchListService] Error dismissing match:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete a match completely (unlink from watch list)
   */
  async deleteMatch(matchId, userId) {
    try {
      const match = await db.deleteWatchListMatch(matchId)
      if (!match) {
        return { success: false, error: 'Match not found' }
      }
      return { success: true, data: match }
    } catch (error) {
      console.error('[WatchListService] Error deleting match:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get unreviewed matches count across all watch lists
   */
  async getUnreviewedMatchCount(userId) {
    try {
      const watchLists = await db.getWatchLists(userId)
      let totalUnreviewed = 0

      for (const watchList of watchLists) {
        const matches = await db.getWatchListMatches(watchList.id, userId, { unreviewedOnly: true })
        totalUnreviewed += matches.length
      }

      return { success: true, data: { count: totalUnreviewed } }
    } catch (error) {
      console.error('[WatchListService] Error getting unreviewed count:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Bulk match all existing updates against a newly created watch list
   */
  async bulkMatchWatchList(watchListId, userId) {
    try {
      const watchList = await db.getWatchListById(watchListId, userId)
      if (!watchList) {
        return { success: false, error: 'Watch list not found' }
      }

      // Get recent updates (last 30 days by default)
      const updates = await db.getRecentUpdates(userId, { days: 30 })
      const matches = []

      for (const update of updates) {
        const updateData = {
          title: update.title,
          summary: update.summary || update.description,
          authority: update.authority || update.source,
          sector: update.sector || update.category
        }

        const score = db.calculateMatchScore(watchList, updateData)
        if (score >= watchList.alert_threshold) {
          const match = await db.createWatchListMatch(watchList.id, update.id, score)
          matches.push(match)
        }
      }

      return {
        success: true,
        data: {
          matchCount: matches.length,
          updatesScanned: updates.length
        }
      }
    } catch (error) {
      console.error('[WatchListService] Error bulk matching:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get watch list statistics
   */
  async getWatchListStats(userId) {
    try {
      const watchLists = await db.getWatchLists(userId)

      let totalMatches = 0
      let unreviewedMatches = 0
      let topMatchingList = null
      let topMatchCount = 0

      for (const watchList of watchLists) {
        const allMatches = await db.getWatchListMatches(watchList.id, userId)
        const unreviewed = allMatches.filter(m => !m.reviewed)

        totalMatches += allMatches.length
        unreviewedMatches += unreviewed.length

        if (allMatches.length > topMatchCount) {
          topMatchCount = allMatches.length
          topMatchingList = watchList.name
        }
      }

      return {
        success: true,
        data: {
          totalWatchLists: watchLists.length,
          totalMatches,
          unreviewedMatches,
          topMatchingList,
          topMatchCount
        }
      }
    } catch (error) {
      console.error('[WatchListService] Error getting stats:', error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = new WatchListService()
