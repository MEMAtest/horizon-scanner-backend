const fs = require('fs').promises
const path = require('path')
const dbService = require('../dbService')

function applyStorageMethods(ServiceClass) {
  ServiceClass.prototype.ensureStorage = async function() {
    if (this.initialized) return

    // Try database first, fall back to filesystem
    this.useDatabase = Boolean(dbService.pool)

    if (!this.useDatabase) {
      try {
        await fs.mkdir(this.storageDir, { recursive: true })
        console.log('[SmartBriefing] Using filesystem storage:', this.storageDir)
      } catch (error) {
        console.warn('[SmartBriefing] Failed to create storage directory:', error.message)
      }
    } else {
      console.log('[SmartBriefing] Using database storage')
    }

    this.initialized = true
  }

  ServiceClass.prototype.listBriefings = async function(limit = 10) {
    await this.ensureStorage()

    // Use database if available
    if (this.useDatabase) {
      console.log('[SmartBriefing] Listing briefings from database')
      return await dbService.listWeeklyBriefings(limit)
    }

    // Fallback to filesystem
    console.log('[SmartBriefing] Listing briefings from:', this.storageDir)
    const files = await fs.readdir(this.storageDir)
    console.log('[SmartBriefing] Found files:', files.length)
    const briefings = []

    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const filePath = path.join(this.storageDir, file)

      try {
        const content = await fs.readFile(filePath, 'utf8')
        const data = JSON.parse(content)
        briefings.push({
          id: data.id,
          generatedAt: data.generatedAt,
          dateRange: data.dateRange,
          metadata: data.metadata || {}
        })
      } catch (error) {
        console.warn('[SmartBriefing] Failed to read briefing snapshot:', file, error.message)
      }
    }

    briefings.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
    return briefings.slice(0, limit)
  }

  ServiceClass.prototype.getBriefing = async function(briefingId) {
    await this.ensureStorage()

    // Use database if available
    if (this.useDatabase) {
      return await dbService.getWeeklyBriefing(briefingId)
    }

    // Fallback to filesystem
    const filePath = path.join(this.storageDir, `${briefingId}.json`)

    try {
      const content = await fs.readFile(filePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      return null
    }
  }

  ServiceClass.prototype.getLatestBriefing = async function() {
    await this.ensureStorage()

    // Use database if available
    if (this.useDatabase) {
      return await dbService.getLatestWeeklyBriefing()
    }

    // Fallback to filesystem
    const list = await this.listBriefings(1)
    if (list.length === 0) return null
    return this.getBriefing(list[0].id)
  }

  ServiceClass.prototype.saveBriefing = async function(briefing) {
    await this.ensureStorage()

    // Use database if available
    if (this.useDatabase) {
      await dbService.saveWeeklyBriefing(briefing)
    }

    // Always also save to filesystem as backup
    try {
      const filePath = path.join(this.storageDir, `${briefing.id}.json`)
      await fs.writeFile(filePath, JSON.stringify(briefing, null, 2), 'utf8')
      console.log('[SmartBriefing] Saved briefing to filesystem:', briefing.id)
    } catch (error) {
      console.warn('[SmartBriefing] Failed to save to filesystem (non-critical):', error.message)
    }
  }
}

module.exports = applyStorageMethods
