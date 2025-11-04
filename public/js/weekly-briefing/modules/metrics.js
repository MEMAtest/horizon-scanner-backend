function applyMetricsMixin(klass) {
  Object.assign(klass.prototype, {
    async loadMetrics() {
      try {
        const response = await fetch('/api/weekly-briefings/metrics')
        if (!response.ok) throw new Error('Failed to load metrics')
        const payload = await response.json()
        if (payload.success) {
          this.state.metrics = payload.metrics
          this.renderMetrics()
        }
      } catch (error) {
        console.warn('Unable to load metrics:', error.message)
      }
    }
  })
}

export { applyMetricsMixin }
