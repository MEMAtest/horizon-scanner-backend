const fs = require('fs').promises
const path = require('path')

const { metricsFile } = require('./constants')

function applyMetricsMethods(ServiceClass) {
  ServiceClass.prototype.recordMetrics = async function(entry) {
    try {
      const metrics = await this.loadMetrics()
      const record = {
        runId: entry.runId,
        briefingId: entry.briefingId,
        datasetHash: entry.datasetHash,
        cacheHit: Boolean(entry.cacheHit),
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        durationMs: entry.durationMs || (entry.startedAt && entry.completedAt
          ? Date.parse(entry.completedAt) - Date.parse(entry.startedAt)
          : null),
        usage: entry.usage || null,
        totals: {
          currentUpdates: entry.dataset?.currentUpdates?.length || 0,
          annotations: entry.dataset?.annotations?.length || 0
        }
      }

      metrics.history.unshift(record)
      metrics.history = metrics.history.slice(0, 50)

      metrics.lastRun = record
      metrics.totals.runs += 1
      if (record.cacheHit) {
        metrics.totals.cacheHits += 1
      }
      if (record.usage?.totalTokens) {
        metrics.totals.totalTokens += record.usage.totalTokens
      }

      await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2), 'utf8')
    } catch (error) {
      console.warn('Failed to record smart briefing metrics:', error.message)
    }
  }

  ServiceClass.prototype.loadMetrics = async function() {
    try {
      await fs.access(metricsFile)
    } catch (_) {
      await fs.mkdir(path.dirname(metricsFile), { recursive: true })
      await fs.writeFile(metricsFile, JSON.stringify({
        totals: {
          runs: 0,
          cacheHits: 0,
          totalTokens: 0
        },
        lastRun: null,
        history: []
      }, null, 2), 'utf8')
    }

    try {
      const content = await fs.readFile(metricsFile, 'utf8')
      const metrics = JSON.parse(content)
      if (metrics && typeof metrics === 'object') {
        return {
          totals: metrics.totals || { runs: 0, cacheHits: 0, totalTokens: 0 },
          lastRun: metrics.lastRun || null,
          history: Array.isArray(metrics.history) ? metrics.history : []
        }
      }
    } catch (error) {
      console.warn('Failed to parse smart briefing metrics file:', error.message)
    }

    return {
      totals: {
        runs: 0,
        cacheHits: 0,
        totalTokens: 0
      },
      lastRun: null,
      history: []
    }
  }

  ServiceClass.prototype.getMetricsSummary = async function() {
    return this.loadMetrics()
  }
}

module.exports = applyMetricsMethods
