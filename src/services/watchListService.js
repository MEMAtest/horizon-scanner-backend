/**
 * Watch List Service
 * Handles watch list management and automatic matching of regulatory updates
 */

const db = require('./dbService')

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

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
        return { success: false, error: 'Fine monitor name is required' }
      }

      const watchList = await db.createWatchList(userId, {
        name: data.name,
        description: data.description,
        keywords: data.keywords || [],
        authorities: data.authorities || [],
        sectors: data.sectors || [],
        alertOnMatch: data.alertOnMatch !== false,
        alertThreshold: toNumber(data.alertThreshold, 0.5),
        autoAddToDossier: data.autoAddToDossier === true,
        targetDossierId: data.targetDossierId
      })

      let bulkMatchResult = null
      const shouldBulkMatch = data.bulkMatch !== false
      if (shouldBulkMatch) {
        try {
          bulkMatchResult = await this.bulkMatchWatchList(watchList.id, userId)
        } catch (error) {
          console.warn('[WatchListService] Bulk match on create failed:', error.message)
        }
      }

      const refreshed = await db.getWatchListById(watchList.id, userId)

      try {
        const matchCount = bulkMatchResult?.data?.matchCount || 0
        const title = `Watch list created: ${watchList.name}`
        const message = matchCount
          ? `${matchCount} matching updates found.`
          : 'Ready to match new updates.'

        await db.createNotification(userId, {
          type: 'watch_list_created',
          title,
          message,
          priority: matchCount ? 'high' : 'normal',
          actionUrl: `/watch-lists?openMatches=${encodeURIComponent(watchList.id)}`,
          actionLabel: matchCount ? 'View Matches' : 'Open Fine Directory',
          referenceType: 'watch_list',
          referenceId: String(watchList.id),
          metadata: {
            watchListId: watchList.id,
            matchCount
          }
        })
      } catch (error) {
        console.warn('[WatchListService] Failed to create watch list notification:', error.message)
      }

      return { success: true, data: refreshed || watchList }
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
      const watchList = await db.getWatchListById(watchListId, userId)
      if (!watchList) {
        return { success: false, error: 'Watch list not found' }
      }

      const matches = await db.getWatchListMatches(watchListId, {
        includeDismissed: options.includeDismissed === true,
        limit: options.limit,
        offset: options.offset
      })

      const filtered = options.unreviewedOnly
        ? matches.filter(match => !match.reviewed)
        : matches

      return { success: true, data: filtered }
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
      const watchLists = await db.getWatchLists(userId)
      const matches = []

      for (const watchList of watchLists) {
        const matchResult = db.calculateMatchScore(watchList, updateData)
        if (!matchResult || matchResult.score <= 0) continue

        const threshold = watchList.alert_threshold || watchList.alertThreshold || 0.5
        if (matchResult.score < threshold) continue

        const match = await db.createWatchListMatch(watchList.id, updateId, {
          matchScore: matchResult.score,
          matchReasons: matchResult.reasons
        })

        matches.push({
          ...match,
          watch_list_name: watchList.name,
          alert_threshold: watchList.alert_threshold,
          alert_on_match: watchList.alert_on_match,
          auto_add_to_dossier: watchList.auto_add_to_dossier,
          target_dossier_id: watchList.target_dossier_id
        })

        const updateTitle = updateData.headline || updateData.title || match.update_title || 'Update'

        if (matchResult.score >= (watchList.alert_threshold || 0.5) && watchList.alert_on_match) {
          await db.createWatchListMatchNotification(
            userId,
            watchList.name,
            { id: updateId, title: updateTitle, watchListId: watchList.id },
            matchResult.score
          )
        }

        if (watchList.auto_add_to_dossier && watchList.target_dossier_id) {
          await db.addItemToDossier(watchList.target_dossier_id, updateId, {
            userNotes: `Auto-added from fine monitor "${watchList.name}" (${Math.round(matchResult.score * 100)}% match)`
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
      const match = await db.markWatchListMatchReviewed(matchId)
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
      const dismissed = await db.dismissWatchListMatch(matchId)
      if (!dismissed) {
        return { success: false, error: 'Match not found' }
      }
      return { success: true, data: { dismissed: true } }
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
        totalUnreviewed += watchList.unreviewedCount || watchList.unreviewed_count || 0
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
  async bulkMatchWatchList(watchListId, userId, options = {}) {
    try {
      const watchList = await db.getWatchListById(watchListId, userId)
      if (!watchList) {
        return { success: false, error: 'Watch list not found' }
      }

      const windowDays = toInteger(options.windowDays, 90)
      const pageSize = Math.min(toInteger(options.pageSize, 1000), 5000)
      const maxPages = Math.min(toInteger(options.maxPages, 25), 250)

      // Get recent updates (last 90 days by default)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Math.max(windowDays, 1))

      const threshold = watchList.alert_threshold || 0.5
      const shouldAutoAddToDossier = watchList.auto_add_to_dossier === true && !!watchList.target_dossier_id
      const matches = []
      let itemsAddedToDossier = 0
      let updatesScanned = 0
      let offset = 0
      let pageCount = 0

      while (pageCount < maxPages) {
        const updates = await db.getEnhancedUpdates({
          startDate: startDate.toISOString(),
          limit: pageSize,
          offset
        })

        if (!updates || updates.length === 0) break

        updatesScanned += updates.length
        pageCount += 1

        for (const update of updates) {
          const matchResult = db.calculateMatchScore(watchList, update)
          if (!matchResult || matchResult.score <= 0) continue
          if (matchResult.score >= threshold) {
            const match = await db.createWatchListMatch(watchList.id, update.id, {
              matchScore: matchResult.score,
              matchReasons: matchResult.reasons
            })
            matches.push(match)

            if (shouldAutoAddToDossier && update.id != null) {
              try {
                await db.addItemToDossier(watchList.target_dossier_id, update.id, {
                  userNotes: `Auto-added from fine monitor "${watchList.name}" (${Math.round(matchResult.score * 100)}% match)`
                })
                itemsAddedToDossier += 1
              } catch (error) {
                console.warn('[WatchListService] Auto-add to dossier failed:', error.message)
              }
            }
          }
        }

        if (updates.length < pageSize) break
        offset += updates.length
      }

      return {
        success: true,
        data: {
          matchCount: matches.length,
          updatesScanned,
          windowDays,
          pageSize,
          itemsAddedToDossier: shouldAutoAddToDossier ? itemsAddedToDossier : 0,
          targetDossierId: watchList.target_dossier_id || null
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
        const matchCount = watchList.matchCount || 0
        const unreviewedCount = watchList.unreviewedCount || watchList.unreviewed_count || 0

        totalMatches += matchCount
        unreviewedMatches += unreviewedCount

        if (matchCount > topMatchCount) {
          topMatchCount = matchCount
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
