const fs = require('fs').promises
const { normalizeSectorName } = require('../../utils/sectorTaxonomy')

const createDefaultWorkspaceState = () => ({
  savedSearches: [],
  customAlerts: [],
  pinnedItems: [],
  firmProfile: null
})

const parseWorkspaceState = raw => {
  if (!raw || !raw.trim()) {
    return createDefaultWorkspaceState()
  }

  try {
    const data = JSON.parse(raw)
    return {
      savedSearches: Array.isArray(data.savedSearches) ? data.savedSearches : [],
      customAlerts: Array.isArray(data.customAlerts) ? data.customAlerts : [],
      pinnedItems: Array.isArray(data.pinnedItems) ? data.pinnedItems : [],
      firmProfile: data.firmProfile || null
    }
  } catch (error) {
    console.warn('[workspace] Invalid JSON cache, resetting workspace data:', error.message)
    return createDefaultWorkspaceState()
  }
}

module.exports = function applyWorkspaceMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async loadWorkspaceState() {
      try {
        const raw = await fs.readFile(this.workspaceFile, 'utf8')
        return parseWorkspaceState(raw)
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn('[workspace] Failed to read workspace cache:', error.message)
        }
        const fallback = createDefaultWorkspaceState()
        await fs.writeFile(this.workspaceFile, JSON.stringify(fallback, null, 2))
        return fallback
      }
    },

    async saveWorkspaceState(state) {
      const merged = {
        ...createDefaultWorkspaceState(),
        ...state,
        savedSearches: Array.isArray(state?.savedSearches) ? state.savedSearches : [],
        customAlerts: Array.isArray(state?.customAlerts) ? state.customAlerts : [],
        pinnedItems: Array.isArray(state?.pinnedItems) ? state.pinnedItems : [],
        firmProfile: state?.firmProfile || null
      }

      await fs.writeFile(this.workspaceFile, JSON.stringify(merged, null, 2))
      return merged
    },

    async getSavedSearches() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
                      SELECT id, search_name as "searchName", filter_params as "filterParams", 
                             created_date as "createdDate"
                      FROM saved_searches 
                      ORDER BY created_date DESC
                  `)
          return result.rows
        } catch (error) {
          console.log('📊 Using JSON fallback for saved searches')
          return this.getSavedSearchesJSON()
        } finally {
          client.release()
        }
      } else {
        return this.getSavedSearchesJSON()
      }
    },

    async getSavedSearchesJSON() {
      const workspace = await this.loadWorkspaceState()
      return workspace.savedSearches
    },

    async getSavedSearch(searchId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
                      SELECT id, search_name as "searchName", filter_params as "filterParams", 
                             created_date as "createdDate"
                      FROM saved_searches WHERE id = $1
                  `, [searchId])
          return result.rows[0] || null
        } catch (error) {
          console.log('📊 Using JSON fallback for saved search')
          return this.getSavedSearchJSON(searchId)
        } finally {
          client.release()
        }
      } else {
        return this.getSavedSearchJSON(searchId)
      }
    },

    async getSavedSearchJSON(searchId) {
      const workspace = await this.loadWorkspaceState()
      return workspace.savedSearches.find(search => String(search.id) === String(searchId)) || null
    },

    async saveSearch(searchName, filterParams) {
      await this.initializeDatabase()

      const search = {
        id: Date.now(),
        search_name: searchName,
        filter_params: filterParams,
        created_date: new Date().toISOString()
      }

      if (!this.fallbackMode) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
                      INSERT INTO saved_searches (search_name, filter_params, created_date)
                      VALUES ($1, $2, $3) RETURNING id
                  `, [searchName, JSON.stringify(filterParams), search.created_date])
          search.id = result.rows[0].id
          return search
        } finally {
          client.release()
        }
      } else {
        const workspace = await this.loadWorkspaceState()
        workspace.savedSearches.push(search)
        await this.saveWorkspaceState(workspace)
        return search
      }
    },

    async deleteSavedSearch(searchId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query('DELETE FROM saved_searches WHERE id = $1', [searchId])
          console.log(`🗑️ Deleted saved search: ${searchId}`)
          return result.rowCount > 0
        } catch (error) {
          console.log('📊 Using JSON fallback for delete saved search')
          return this.deleteSavedSearchJSON(searchId)
        } finally {
          client.release()
        }
      } else {
        return this.deleteSavedSearchJSON(searchId)
      }
    },

    async deleteSavedSearchJSON(searchId) {
      const workspace = await this.loadWorkspaceState()
      const initialLength = workspace.savedSearches.length
      workspace.savedSearches = workspace.savedSearches.filter(search => String(search.id) !== String(searchId))
      await this.saveWorkspaceState(workspace)
      return workspace.savedSearches.length < initialLength
    },

    async createCustomAlert(alertName, alertConditions) {
      await this.initialize()

      const customAlert = {
        id: Date.now(),
        alertName,
        alertConditions,
        isActive: true,
        createdDate: new Date().toISOString()
      }

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
                      INSERT INTO custom_alerts (alert_name, alert_conditions, is_active, created_date)
                      VALUES ($1, $2, $3, $4) RETURNING id
                  `, [alertName, JSON.stringify(alertConditions), true, customAlert.createdDate])
          customAlert.id = result.rows[0].id
          console.log(`🚨 Created custom alert: ${alertName}`)
          return customAlert
        } catch (error) {
          console.log('📊 Using JSON fallback for custom alert')
          return this.createCustomAlertJSON(customAlert)
        } finally {
          client.release()
        }
      } else {
        return this.createCustomAlertJSON(customAlert)
      }
    },

    async createCustomAlertJSON(customAlert) {
      try {
        const workspace = await this.loadWorkspaceState()
        workspace.customAlerts.push(customAlert)
        await this.saveWorkspaceState(workspace)
        console.log(`🚨 Created custom alert in JSON: ${customAlert.alertName}`)
        return customAlert
      } catch (error) {
        throw new Error(`Failed to create custom alert: ${error.message}`)
      }
    },

    async getCustomAlerts() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
                      SELECT id, alert_name as "alertName", alert_conditions as "alertConditions", 
                             is_active as "isActive", created_date as "createdDate"
                      FROM custom_alerts 
                      ORDER BY created_date DESC
                  `)
          return result.rows
        } catch (error) {
          console.log('📊 Using JSON fallback for custom alerts')
          return this.getCustomAlertsJSON()
        } finally {
          client.release()
        }
      } else {
        return this.getCustomAlertsJSON()
      }
    },

    async getCustomAlertsJSON() {
      try {
        const workspace = await this.loadWorkspaceState()
        return workspace.customAlerts
      } catch (error) {
        return []
      }
    },

    async updateAlertStatus(alertId, isActive) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            'UPDATE custom_alerts SET is_active = $1 WHERE id = $2',
            [isActive, alertId]
          )
          console.log(`🚨 Updated alert status: ${alertId} -> ${isActive}`)
          return result.rowCount > 0
        } catch (error) {
          console.log('📊 Using JSON fallback for alert status update')
          return this.updateAlertStatusJSON(alertId, isActive)
        } finally {
          client.release()
        }
      } else {
        return this.updateAlertStatusJSON(alertId, isActive)
      }
    },

    async updateAlertStatusJSON(alertId, isActive) {
      try {
        const workspace = await this.loadWorkspaceState()
        const alert = workspace.customAlerts.find(item => String(item.id) === String(alertId))
        if (alert) {
          alert.isActive = isActive
          await this.saveWorkspaceState(workspace)
          return true
        }
        return false
      } catch (error) {
        return false
      }
    },

    async deleteCustomAlert(alertId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query('DELETE FROM custom_alerts WHERE id = $1', [alertId])
          console.log(`🗑️ Deleted custom alert: ${alertId}`)
          return result.rowCount > 0
        } catch (error) {
          console.log('📊 Using JSON fallback for delete custom alert')
          return this.deleteCustomAlertJSON(alertId)
        } finally {
          client.release()
        }
      } else {
        return this.deleteCustomAlertJSON(alertId)
      }
    },

    async deleteCustomAlertJSON(alertId) {
      try {
        const workspace = await this.loadWorkspaceState()
        const initialLength = workspace.customAlerts.length
        workspace.customAlerts = workspace.customAlerts.filter(alert => String(alert.id) !== String(alertId))
        await this.saveWorkspaceState(workspace)
        return workspace.customAlerts.length < initialLength
      } catch (error) {
        return false
      }
    },

    async getPinnedItems() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
                      SELECT * FROM pinned_items 
                      ORDER BY pinned_date DESC
                  `)
          return result.rows
            .map(row => this.normalizePinnedItemRecord(row))
            .filter(Boolean)
        } catch (error) {
          console.log('📊 Using JSON fallback for pinned items')
          return this.getPinnedItemsJSON()
        } finally {
          client.release()
        }
      } else {
        return this.getPinnedItemsJSON()
      }
    },

    async getPinnedItemsJSON() {
      try {
        const workspace = await this.loadWorkspaceState()
        const items = workspace.pinnedItems
        return items
          .map(item => this.normalizePinnedItemRecord(item))
          .filter(Boolean)
      } catch (error) {
        return []
      }
    },

    async addPinnedItem(url, title, notes = '', authority = '', options = {}) {
      await this.initializeDatabase() // FIX: Not this.initialize()

      const sectors = Array.isArray(options.sectors)
        ? Array.from(new Set(options.sectors.map(normalizeSectorName).filter(Boolean)))
        : []

      const personas = Array.isArray(options.personas)
        ? options.personas.filter(Boolean)
        : []

      const summary = options.summary || (options.metadata && options.metadata.summary) || ''
      const published = options.published || (options.metadata && options.metadata.published) || null
      const updateId = options.updateId || (options.metadata && options.metadata.updateId) || null

      const metadata = Object.assign(
        {},
        options.metadata || {},
        {
          sectors,
          personas,
          summary,
          published,
          updateId,
          authority: authority || options.authority || ''
        }
      )

      if (!Array.isArray(metadata.sectors) || metadata.sectors.length === 0) {
        metadata.sectors = sectors
      } else {
        metadata.sectors = Array.from(
          new Set(
            metadata.sectors
              .map(normalizeSectorName)
              .filter(Boolean)
          )
        )
      }

      const pinnedItem = {
        id: Date.now(),
        update_url: url,
        update_title: title,
        update_authority: authority,
        notes,
        pinned_date: new Date().toISOString(),
        sectors,
        personas,
        summary,
        published,
        update_id: updateId,
        metadata
      }

      if (!this.fallbackMode) { // FIX: Not this.usePostgres
        const client = await this.pool.connect()
        try {
          try {
            const result = await client.query(`
                      INSERT INTO pinned_items (update_url, update_title, update_authority, notes, pinned_date, metadata, sectors)
                      VALUES ($1, $2, $3, $4, $5, $6, $7)
                      RETURNING id, metadata, sectors
                  `, [url, title, authority || '', notes, pinnedItem.pinned_date, metadata, sectors])
            const row = result.rows[0]
            pinnedItem.id = row.id
            pinnedItem.metadata = row.metadata || metadata
            pinnedItem.sectors = Array.isArray(row.sectors)
              ? row.sectors.map(normalizeSectorName).filter(Boolean)
              : sectors
            return this.normalizePinnedItemRecord(pinnedItem)
          } catch (insertError) {
            console.warn('Pinned items metadata insert failed, falling back to legacy schema:', insertError.message)
            const legacyResult = await client.query(`
                          INSERT INTO pinned_items (update_url, update_title, notes, pinned_date)
                          VALUES ($1, $2, $3, $4) RETURNING id
                      `, [url, title, notes, pinnedItem.pinned_date])
            pinnedItem.id = legacyResult.rows[0].id
            return this.normalizePinnedItemRecord(pinnedItem)
          }
        } finally {
          client.release()
        }
      } else {
        // JSON fallback
        const workspace = await this.loadWorkspaceState()
        workspace.pinnedItems.push(pinnedItem)
        await this.saveWorkspaceState(workspace)
        return this.normalizePinnedItemRecord(pinnedItem)
      }
    },

    async removePinnedItem(url) {
      await this.initializeDatabase() // FIX: Not this.initialize()

      if (!this.fallbackMode) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            'DELETE FROM pinned_items WHERE update_url = $1',
            [url]
          )
          return result.rowCount > 0
        } finally {
          client.release()
        }
      } else {
        // JSON fallback
        const workspace = await this.loadWorkspaceState()
        const initialLength = workspace.pinnedItems.length
        workspace.pinnedItems = workspace.pinnedItems.filter(item => item.update_url !== url)
        await this.saveWorkspaceState(workspace)
        return workspace.pinnedItems.length < initialLength
      }
    },

    async updatePinnedItemNotes(updateUrl, notes) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            'UPDATE pinned_items SET notes = $1 WHERE update_url = $2',
            [notes, updateUrl]
          )
          console.log(`📝 Updated pinned item notes: ${updateUrl}`)
          return result.rowCount > 0
        } catch (error) {
          console.log('📊 Using JSON fallback for pinned item notes update')
          return this.updatePinnedItemNotesJSON(updateUrl, notes)
        } finally {
          client.release()
        }
      } else {
        return this.updatePinnedItemNotesJSON(updateUrl, notes)
      }
    },

    async updatePinnedItemNotesJSON(updateUrl, notes) {
      try {
        const workspace = await this.loadWorkspaceState()
        const pinnedItem = workspace.pinnedItems.find(item => item.updateUrl === updateUrl)
        if (pinnedItem) {
          pinnedItem.notes = notes
          pinnedItem.updatedDate = new Date().toISOString()
          await this.saveWorkspaceState(workspace)
          return true
        }
        return false
      } catch (error) {
        return false
      }
    },

    async getFirmProfile() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
                      SELECT * FROM firm_profiles 
                      ORDER BY id DESC 
                      LIMIT 1
                  `)
          return result.rows[0] || null
        } catch (error) {
          console.log('📊 Using JSON fallback for firm profile')
          return this.getFirmProfileJSON()
        } finally {
          client.release()
        }
      } else {
        return this.getFirmProfileJSON()
      }
    },

    async getFirmProfileJSON() {
      try {
        const workspace = await this.loadWorkspaceState()
        return workspace.firmProfile
      } catch (error) {
        return null
      }
    },

    async clearFirmProfile() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query('DELETE FROM firm_profiles')
          console.log('✅ Firm profile cleared from PostgreSQL')
        } catch (error) {
          console.log('📊 Using JSON fallback for clear firm profile')
          return this.clearFirmProfileJSON()
        } finally {
          client.release()
        }
      } else {
        return this.clearFirmProfileJSON()
      }
    },

    async clearFirmProfileJSON() {
      try {
        const workspace = await this.loadWorkspaceState()
        workspace.firmProfile = null
        await this.saveWorkspaceState(workspace)
        console.log('✅ Firm profile cleared from JSON')
      } catch (error) {
        console.error('Error clearing firm profile from JSON:', error)
        throw error
      }
    },

    async saveFirmProfile(profileData) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          // Delete existing profile first
          await client.query('DELETE FROM firm_profiles')

          // Insert new profile
          await client.query(`
                      INSERT INTO firm_profiles (firm_name, primary_sectors, firm_size, created_at)
                      VALUES ($1, $2, $3, NOW())
                  `, [
            profileData.firmName,
            JSON.stringify(profileData.primarySectors || []),
            profileData.firmSize || 'Medium'
          ])

          console.log('✅ Firm profile saved to PostgreSQL')
          return profileData
        } catch (error) {
          console.log('📊 Using JSON fallback for save firm profile')
          return this.saveFirmProfileJSON(profileData)
        } finally {
          client.release()
        }
      } else {
        return this.saveFirmProfileJSON(profileData)
      }
    },

    async saveFirmProfileJSON(profileData) {
      try {
        const workspace = await this.loadWorkspaceState()

        // Save the profile
        workspace.firmProfile = {
          firmName: profileData.firmName,
          primarySectors: profileData.primarySectors || [],
          firmSize: profileData.firmSize || 'Medium',
          isActive: true,
          createdDate: new Date().toISOString()
        }

        await this.saveWorkspaceState(workspace)
        console.log('✅ Firm profile saved to JSON')
        return workspace.firmProfile
      } catch (error) {
        console.error('Error saving firm profile to JSON:', error)
        throw error
      }
    }
  })
}
