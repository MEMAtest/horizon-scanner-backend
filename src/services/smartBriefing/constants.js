const path = require('path')

const isVercel = process.env.VERCEL || process.env.NOW_REGION

const storageDir = isVercel
  ? path.join('/tmp', 'weekly_briefings')
  : path.join(process.cwd(), 'data', 'weekly_briefings')

const metricsFile = isVercel
  ? path.join('/tmp', 'weekly_briefing_metrics.json')
  : path.join(process.cwd(), 'data', 'weekly_briefing_metrics.json')

const DEFAULT_DAYS = 7
const HISTORY_WINDOW_DAYS = 28
const MAX_FLAGGED_ITEMS = 10

module.exports = {
  DEFAULT_DAYS,
  HISTORY_WINDOW_DAYS,
  MAX_FLAGGED_ITEMS,
  metricsFile,
  storageDir
}
