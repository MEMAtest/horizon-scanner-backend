// src/services/fileDbService.js
// Serverless-compatible file database fallback

const fs = require('fs').promises
const path = require('path')

class FileDbService {
  constructor() {
    // Use /tmp directory for Vercel serverless compatibility
    this.dbPath = process.env.NODE_ENV === 'production'
      ? '/tmp/regulatory-updates.json'
      : path.join(__dirname, '../../data/regulatory-updates.json')

    this.initialized = false
    this.data = { updates: [] }
  }

  async initialize() {
    if (this.initialized) return

    try {
      // Ensure directory exists (for local development)
      if (process.env.NODE_ENV !== 'production') {
        const dir = path.dirname(this.dbPath)
        try {
          await fs.mkdir(dir, { recursive: true })
        } catch (error) {
          // Directory might already exist
        }
      }

      // Try to load existing data
      try {
        const fileContent = await fs.readFile(this.dbPath, 'utf8')
        this.data = JSON.parse(fileContent)

        // Ensure updates array exists
        if (!this.data.updates) {
          this.data.updates = []
        }

        console.log(`✅ File database loaded: ${this.data.updates.length} updates`)
      } catch (error) {
        // File doesn't exist or is corrupted, start fresh
        this.data = {
          updates: [],
          metadata: {
            created: new Date().toISOString(),
            version: '2.0'
          }
        }

        await this.saveData()
        console.log('✅ File database initialized with empty data')
      }

      this.initialized = true
    } catch (error) {
      console.error('❌ File database initialization failed:', error)
      throw error
    }
  }

  async saveData() {
    try {
      this.data.metadata = {
        ...this.data.metadata,
        lastUpdated: new Date().toISOString(),
        totalUpdates: this.data.updates.length
      }

      await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8')
    } catch (error) {
      console.error('❌ Error saving file database:', error)
      throw error
    }
  }

  async getAllUpdates() {
    await this.initialize()

    // Sort by fetched date (newest first)
    return this.data.updates
      .sort((a, b) => new Date(b.fetchedDate) - new Date(a.fetchedDate))
  }

  async saveUpdate(updateData) {
    await this.initialize()

    // Check if update already exists (by URL)
    const existingIndex = this.data.updates.findIndex(update => update.url === updateData.url)

    // Add metadata
    const processedUpdate = {
      ...updateData,
      id: existingIndex >= 0 ? this.data.updates[existingIndex].id : this.generateId(),
      fetchedDate: updateData.fetchedDate || new Date().toISOString(),
      createdAt: existingIndex >= 0 ? this.data.updates[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (existingIndex >= 0) {
      // Update existing
      this.data.updates[existingIndex] = processedUpdate
      console.log(`✅ Updated existing update: ${updateData.headline || 'Untitled'}`)
    } else {
      // Add new
      this.data.updates.push(processedUpdate)
      console.log(`✅ Added new update: ${updateData.headline || 'Untitled'}`)
    }

    await this.saveData()
    return processedUpdate
  }

  async findUpdate(url) {
    await this.initialize()

    return this.data.updates.find(update => update.url === url) || null
  }

  async deleteUpdate(url) {
    await this.initialize()

    const initialLength = this.data.updates.length
    this.data.updates = this.data.updates.filter(update => update.url !== url)

    if (this.data.updates.length < initialLength) {
      await this.saveData()
      return true
    }

    return false
  }

  async getUpdatesByAuthority(authority) {
    await this.initialize()

    return this.data.updates
      .filter(update => update.authority === authority)
      .sort((a, b) => new Date(b.fetchedDate) - new Date(a.fetchedDate))
  }

  async getUpdatesBySector(sector) {
    await this.initialize()

    return this.data.updates
      .filter(update => update.sector === sector)
      .sort((a, b) => new Date(b.fetchedDate) - new Date(a.fetchedDate))
  }

  async getRecentUpdates(days = 7) {
    await this.initialize()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return this.data.updates
      .filter(update => new Date(update.fetchedDate) >= cutoffDate)
      .sort((a, b) => new Date(b.fetchedDate) - new Date(a.fetchedDate))
  }

  async getAnalytics() {
    await this.initialize()

    const analytics = {
      total: this.data.updates.length,
      byAuthority: {},
      bySector: {},
      byImpactLevel: {},
      byUrgency: {},
      recentCount: 0
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    this.data.updates.forEach(update => {
      // Count by authority
      const authority = update.authority || 'Unknown'
      analytics.byAuthority[authority] = (analytics.byAuthority[authority] || 0) + 1

      // Count by sector
      const sector = update.sector || 'General'
      analytics.bySector[sector] = (analytics.bySector[sector] || 0) + 1

      // Count by impact level
      const impact = update.impactLevel || 'Unknown'
      analytics.byImpactLevel[impact] = (analytics.byImpactLevel[impact] || 0) + 1

      // Count by urgency
      const urgency = update.urgency || 'Unknown'
      analytics.byUrgency[urgency] = (analytics.byUrgency[urgency] || 0) + 1

      // Count recent updates
      if (new Date(update.fetchedDate) >= sevenDaysAgo) {
        analytics.recentCount++
      }
    })

    return analytics
  }

  async searchUpdates(query, filters = {}) {
    await this.initialize()

    let results = [...this.data.updates]

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase()
      results = results.filter(update =>
        (update.headline && update.headline.toLowerCase().includes(searchTerm)) ||
                (update.impact && update.impact.toLowerCase().includes(searchTerm)) ||
                (update.area && update.area.toLowerCase().includes(searchTerm))
      )
    }

    // Apply filters
    if (filters.authority) {
      results = results.filter(update => update.authority === filters.authority)
    }

    if (filters.sector) {
      results = results.filter(update => update.sector === filters.sector)
    }

    if (filters.impactLevel) {
      results = results.filter(update => update.impactLevel === filters.impactLevel)
    }

    if (filters.urgency) {
      results = results.filter(update => update.urgency === filters.urgency)
    }

    // Sort by relevance/date
    return results.sort((a, b) => new Date(b.fetchedDate) - new Date(a.fetchedDate))
  }

  async cleanup(daysToKeep = 30) {
    await this.initialize()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const initialCount = this.data.updates.length
    this.data.updates = this.data.updates.filter(update =>
      new Date(update.fetchedDate) >= cutoffDate
    )

    const removedCount = initialCount - this.data.updates.length

    if (removedCount > 0) {
      await this.saveData()
      console.log(`🧹 Cleaned up ${removedCount} old updates (older than ${daysToKeep} days)`)
    }

    return removedCount
  }

  async healthCheck() {
    try {
      await this.initialize()

      // Verify we can read and write
      await this.saveData()

      return {
        status: 'healthy',
        type: 'file_database',
        path: this.dbPath,
        recordCount: this.data.updates.length,
        lastUpdated: this.data.metadata?.lastUpdated || 'unknown'
      }
    } catch (error) {
      throw new Error(`File database health check failed: ${error.message}`)
    }
  }

  generateId() {
    // Generate a simple numeric ID based on timestamp and random
    return Date.now() + Math.floor(Math.random() * 1000)
  }

  async exportData(format = 'json') {
    await this.initialize()

    if (format === 'csv') {
      const headers = ['ID', 'Headline', 'Impact', 'Area', 'Authority', 'Impact Level', 'Urgency', 'Sector', 'Key Dates', 'URL', 'Fetched Date']
      const csvData = [
        headers.join(','),
        ...this.data.updates.map(update => [
          update.id,
                    `"${(update.headline || '').replace(/"/g, '""')}"`,
                    `"${(update.impact || '').replace(/"/g, '""')}"`,
                    `"${(update.area || '').replace(/"/g, '""')}"`,
                    `"${(update.authority || '').replace(/"/g, '""')}"`,
                    `"${(update.impactLevel || '').replace(/"/g, '""')}"`,
                    `"${(update.urgency || '').replace(/"/g, '""')}"`,
                    `"${(update.sector || '').replace(/"/g, '""')}"`,
                    `"${(update.keyDates || '').replace(/"/g, '""')}"`,
                    `"${(update.url || '').replace(/"/g, '""')}"`,
                    `"${(update.fetchedDate || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n')

      return csvData
    }

    // Default to JSON
    return JSON.stringify({
      metadata: {
        ...this.data.metadata,
        exportDate: new Date().toISOString(),
        totalRecords: this.data.updates.length
      },
      updates: this.data.updates
    }, null, 2)
  }

  async getDbInfo() {
    await this.initialize()

    return {
      type: 'file_database',
      path: this.dbPath,
      totalUpdates: this.data.updates.length,
      metadata: this.data.metadata,
      size: await this.getFileSize()
    }
  }

  async getFileSize() {
    try {
      const stats = await fs.stat(this.dbPath)
      return stats.size
    } catch (error) {
      return 0
    }
  }
}

// Create singleton instance
const fileDbService = new FileDbService()

module.exports = fileDbService
