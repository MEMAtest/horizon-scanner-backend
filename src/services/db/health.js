module.exports = function applyHealthMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async healthCheck() {
      try {
        if (this.fallbackMode) {
          return {
            status: 'healthy',
            mode: 'json',
            updates: (await this.loadJSONData(this.updatesFile)).length
          }
        } else {
          const client = await this.pool.connect()
          const result = await client.query('SELECT COUNT(*) FROM regulatory_updates')
          client.release()

          return {
            status: 'healthy',
            mode: 'postgresql',
            updates: parseInt(result.rows[0].count)
          }
        }
      } catch (error) {
        return { status: 'unhealthy', error: error.message }
      }
    }
  })
}
