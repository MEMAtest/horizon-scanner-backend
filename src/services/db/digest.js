module.exports = function applyDigestMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async markDigestItemsSent(identifiers = [], options = {}) {
      const digestDate = options.digestDate instanceof Date ? options.digestDate : new Date(options.digestDate || Date.now())
      const retentionDays = Number.isFinite(options.retentionDays) ? options.retentionDays : 45
      const cleanIdentifiers = Array.isArray(identifiers)
        ? identifiers.map(id => (id != null ? String(id) : null)).filter(Boolean)
        : []

      if (cleanIdentifiers.length === 0) {
        return { recorded: 0 }
      }

      try {
        if (this.fallbackMode) {
          await this.markDigestItemsSentJSON(cleanIdentifiers, digestDate, retentionDays)
        } else {
          await this.markDigestItemsSentPG(cleanIdentifiers, digestDate, retentionDays)
        }
        return { recorded: cleanIdentifiers.length }
      } catch (error) {
        console.error('❌ Error recording digest history:', error)
        return { recorded: 0, error: error.message }
      }
    },

    async markDigestItemsSentPG(identifiers, digestDate, retentionDays) {
      const client = await this.pool.connect()
      try {
        await client.query('BEGIN')

        for (const identifier of identifiers) {
          await client.query(`
            INSERT INTO daily_digest_history (update_identifier, digest_sent_at)
            VALUES ($1, $2)
            ON CONFLICT (update_identifier)
            DO UPDATE SET digest_sent_at = EXCLUDED.digest_sent_at
          `, [identifier, digestDate])
        }

        if (Number.isFinite(retentionDays) && retentionDays > 0) {
          const cutoff = new Date(digestDate.getTime() - retentionDays * 24 * 60 * 60 * 1000)
          await client.query('DELETE FROM daily_digest_history WHERE digest_sent_at < $1', [cutoff])
        }

        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    },

    async markDigestItemsSentJSON(identifiers, digestDate, retentionDays) {
      const history = await this.loadJSONData(this.digestHistoryFile)
      const isoDate = digestDate.toISOString()

      const historyMap = new Map(history.map(entry => [entry.update_identifier, entry]))

      for (const identifier of identifiers) {
        historyMap.set(identifier, {
          update_identifier: identifier,
          digest_sent_at: isoDate
        })
      }

      let updatedHistory = Array.from(historyMap.values())

      if (Number.isFinite(retentionDays) && retentionDays > 0) {
        const cutoff = new Date(digestDate.getTime() - retentionDays * 24 * 60 * 60 * 1000)
        updatedHistory = updatedHistory.filter(entry => {
          const sentAt = new Date(entry.digest_sent_at)
          return !Number.isNaN(sentAt.getTime()) && sentAt >= cutoff
        })
      }

      await this.saveJSONData(this.digestHistoryFile, updatedHistory)
    },

    async getRecentDigestIdentifiers(windowDays = 45) {
      const days = Number.isFinite(windowDays) && windowDays > 0 ? windowDays : 45
      const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true'

      try {
        // On Vercel, ensure PostgreSQL connection
        if (isVercel && !this.usePostgres) {
          const reconnected = await this.ensurePostgresConnection()
          if (!reconnected) {
            console.warn('⚠️ Cannot fetch digest history: PostgreSQL unavailable')
            return []
          }
        }

        if (this.fallbackMode && !isVercel) {
          return await this.getRecentDigestIdentifiersJSON(days)
        } else if (this.usePostgres) {
          return await this.getRecentDigestIdentifiersPG(days)
        } else {
          return []
        }
      } catch (error) {
        console.error('❌ Error fetching digest history:', error)
        return []
      }
    },

    async getRecentDigestIdentifiersPG(windowDays) {
      const client = await this.pool.connect()
      try {
        const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
        const result = await client.query(`
          SELECT update_identifier
          FROM daily_digest_history
          WHERE digest_sent_at >= $1
        `, [cutoff])
        return result.rows.map(row => row.update_identifier)
      } finally {
        client.release()
      }
    },

    async getRecentDigestIdentifiersJSON(windowDays) {
      const history = await this.loadJSONData(this.digestHistoryFile)
      const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
      return history
        .filter(entry => {
          const sentAt = new Date(entry.digest_sent_at)
          return !Number.isNaN(sentAt.getTime()) && sentAt >= cutoff
        })
        .map(entry => entry.update_identifier)
    }
  })
}
