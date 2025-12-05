/**
 * Research Dossier Service
 * Handles dossier management for collecting and organizing evidence related to regulatory topics
 */

const db = require('./dbService')

class DossierService {
  /**
   * Get all dossiers for a user
   */
  async getDossiers(userId, filters = {}) {
    try {
      const dossiers = await db.getDossiers(userId, filters)
      return { success: true, data: dossiers }
    } catch (error) {
      console.error('[DossierService] Error getting dossiers:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get a single dossier by ID with all items
   */
  async getDossierById(dossierId, userId) {
    try {
      const dossier = await db.getDossierById(dossierId, userId)
      if (!dossier) {
        return { success: false, error: 'Dossier not found' }
      }

      // Get all items in the dossier
      const items = await db.getDossierItems(dossierId)
      dossier.items = items

      return { success: true, data: dossier }
    } catch (error) {
      console.error('[DossierService] Error getting dossier:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a new dossier
   */
  async createDossier(userId, data) {
    try {
      // Validate required fields
      if (!data.name) {
        return { success: false, error: 'Dossier name is required' }
      }

      const dossier = await db.createDossier(userId, {
        name: data.name,
        description: data.description,
        topic: data.topic,
        status: data.status || 'active',
        tags: data.tags || [],
        linkedWatchListId: data.linkedWatchListId
      })

      return { success: true, data: dossier }
    } catch (error) {
      console.error('[DossierService] Error creating dossier:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update a dossier
   */
  async updateDossier(dossierId, userId, updates) {
    try {
      const dossier = await db.updateDossier(dossierId, userId, updates)
      if (!dossier) {
        return { success: false, error: 'Dossier not found' }
      }
      return { success: true, data: dossier }
    } catch (error) {
      console.error('[DossierService] Error updating dossier:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete a dossier
   */
  async deleteDossier(dossierId, userId) {
    try {
      const deleted = await db.deleteDossier(dossierId, userId)
      if (!deleted) {
        return { success: false, error: 'Dossier not found' }
      }
      return { success: true, message: 'Dossier deleted' }
    } catch (error) {
      console.error('[DossierService] Error deleting dossier:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Add a regulatory update to a dossier
   */
  async addItemToDossier(dossierId, updateId, userId, data = {}) {
    try {
      // Verify dossier exists and belongs to user
      const dossier = await db.getDossierById(dossierId, userId)
      if (!dossier) {
        return { success: false, error: 'Dossier not found' }
      }

      // Check if item already exists in dossier
      const existingItems = await db.getDossierItems(dossierId)
      const alreadyExists = existingItems.some(item =>
        String(item.regulatory_update_id) === String(updateId)
      )

      if (alreadyExists) {
        return { success: false, error: 'Item already exists in this dossier' }
      }

      const item = await db.addItemToDossier(dossierId, updateId, {
        notes: data.notes,
        relevanceScore: data.relevanceScore,
        addedBy: data.addedBy || userId,
        tags: data.tags || []
      })

      // Update dossier's updated_at timestamp
      await db.updateDossier(dossierId, userId, { updatedAt: new Date().toISOString() })

      return { success: true, data: item }
    } catch (error) {
      console.error('[DossierService] Error adding item to dossier:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Remove an item from a dossier
   */
  async removeItemFromDossier(dossierId, itemId, userId) {
    try {
      // Verify dossier exists and belongs to user
      const dossier = await db.getDossierById(dossierId, userId)
      if (!dossier) {
        return { success: false, error: 'Dossier not found' }
      }

      const removed = await db.removeDossierItem(itemId)
      if (!removed) {
        return { success: false, error: 'Item not found in dossier' }
      }

      return { success: true, message: 'Item removed from dossier' }
    } catch (error) {
      console.error('[DossierService] Error removing item:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update notes or relevance for a dossier item
   */
  async updateDossierItem(dossierId, itemId, userId, updates) {
    try {
      // Verify dossier exists and belongs to user
      const dossier = await db.getDossierById(dossierId, userId)
      if (!dossier) {
        return { success: false, error: 'Dossier not found' }
      }

      const item = await db.updateDossierItem(itemId, updates)
      if (!item) {
        return { success: false, error: 'Item not found' }
      }

      return { success: true, data: item }
    } catch (error) {
      console.error('[DossierService] Error updating item:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get dossier timeline - items sorted by publish date
   */
  async getDossierTimeline(dossierId, userId) {
    try {
      // Verify dossier exists and belongs to user
      const dossier = await db.getDossierById(dossierId, userId)
      if (!dossier) {
        return { success: false, error: 'Dossier not found' }
      }

      const timeline = await db.getDossierTimeline(dossierId)
      return { success: true, data: timeline }
    } catch (error) {
      console.error('[DossierService] Error getting timeline:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Archive a dossier (soft close, can be reopened)
   */
  async archiveDossier(dossierId, userId) {
    try {
      const dossier = await db.updateDossier(dossierId, userId, { status: 'archived' })
      if (!dossier) {
        return { success: false, error: 'Dossier not found' }
      }
      return { success: true, data: dossier }
    } catch (error) {
      console.error('[DossierService] Error archiving dossier:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Reopen an archived dossier
   */
  async reopenDossier(dossierId, userId) {
    try {
      const dossier = await db.updateDossier(dossierId, userId, { status: 'active' })
      if (!dossier) {
        return { success: false, error: 'Dossier not found' }
      }
      return { success: true, data: dossier }
    } catch (error) {
      console.error('[DossierService] Error reopening dossier:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get dossier statistics
   */
  async getDossierStats(userId) {
    try {
      const dossiers = await db.getDossiers(userId)

      const stats = {
        totalDossiers: dossiers.length,
        activeDossiers: 0,
        archivedDossiers: 0,
        totalItems: 0,
        mostActiveTopics: {}
      }

      for (const dossier of dossiers) {
        if (dossier.status === 'archived') {
          stats.archivedDossiers++
        } else {
          stats.activeDossiers++
        }

        const items = await db.getDossierItems(dossier.id)
        stats.totalItems += items.length

        // Track topic frequency
        if (dossier.topic) {
          stats.mostActiveTopics[dossier.topic] = (stats.mostActiveTopics[dossier.topic] || 0) + 1
        }
      }

      // Convert topics to sorted array
      stats.topTopics = Object.entries(stats.mostActiveTopics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count }))

      delete stats.mostActiveTopics

      return { success: true, data: stats }
    } catch (error) {
      console.error('[DossierService] Error getting stats:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Export dossier as structured data
   */
  async exportDossier(dossierId, userId, format = 'json') {
    try {
      const dossier = await db.getDossierById(dossierId, userId)
      if (!dossier) {
        return { success: false, error: 'Dossier not found' }
      }

      const items = await db.getDossierItems(dossierId)
      const timeline = await db.getDossierTimeline(dossierId)

      const exportData = {
        dossier: {
          name: dossier.name,
          description: dossier.description,
          topic: dossier.topic,
          status: dossier.status,
          createdAt: dossier.created_at,
          itemCount: items.length
        },
        items: items.map(item => ({
          title: item.update_title,
          source: item.update_source,
          publishedDate: item.published_date,
          notes: item.notes,
          relevanceScore: item.relevance_score,
          addedAt: item.added_at
        })),
        timeline: timeline.map(t => ({
          date: t.published_date,
          title: t.update_title,
          source: t.update_source
        })),
        exportedAt: new Date().toISOString()
      }

      if (format === 'csv') {
        const csvRows = [
          ['Title', 'Source', 'Published Date', 'Notes', 'Relevance', 'Added At'],
          ...items.map(item => [
            item.update_title,
            item.update_source,
            item.published_date,
            item.notes || '',
            item.relevance_score || '',
            item.added_at
          ])
        ]
        return {
          success: true,
          data: csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n'),
          contentType: 'text/csv',
          filename: `${dossier.name.replace(/[^a-z0-9]/gi, '_')}_export.csv`
        }
      }

      return {
        success: true,
        data: exportData,
        contentType: 'application/json',
        filename: `${dossier.name.replace(/[^a-z0-9]/gi, '_')}_export.json`
      }
    } catch (error) {
      console.error('[DossierService] Error exporting dossier:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Bulk add items to a dossier
   */
  async bulkAddItems(dossierId, updateIds, userId, data = {}) {
    try {
      const dossier = await db.getDossierById(dossierId, userId)
      if (!dossier) {
        return { success: false, error: 'Dossier not found' }
      }

      const results = { added: 0, skipped: 0, errors: [] }

      for (const updateId of updateIds) {
        try {
          const result = await this.addItemToDossier(dossierId, updateId, userId, data)
          if (result.success) {
            results.added++
          } else if (result.error === 'Item already exists in this dossier') {
            results.skipped++
          } else {
            results.errors.push({ updateId, error: result.error })
          }
        } catch (error) {
          results.errors.push({ updateId, error: error.message })
        }
      }

      return { success: true, data: results }
    } catch (error) {
      console.error('[DossierService] Error bulk adding items:', error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = new DossierService()
