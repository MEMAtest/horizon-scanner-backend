/**
 * Publications API Shared Helpers
 * Shared state, middleware, and utility functions
 */

const { Pool } = require('pg')

// Pipeline instance will be set by the main app
let pipeline = null

// Direct database pool for fallback
let dbPool = null

function getDbPool() {
  if (!dbPool && process.env.DATABASE_URL) {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  }
  return dbPool
}

/**
 * Set the pipeline instance
 */
function setPipeline(pipelineInstance) {
  pipeline = pipelineInstance
}

/**
 * Get the current pipeline instance
 */
function getPipeline() {
  return pipeline
}

/**
 * Middleware - allows fallback to direct DB
 */
function allowFallback(req, res, next) {
  if (!pipeline && !getDbPool()) {
    return res.status(503).json({
      success: false,
      error: 'Publications service not available'
    })
  }
  next()
}

/**
 * Middleware to ensure pipeline is available
 */
function requirePipeline(req, res, next) {
  if (!pipeline) {
    return res.status(503).json({
      success: false,
      error: 'Publications pipeline not initialized'
    })
  }
  next()
}

module.exports = {
  getDbPool,
  getPipeline,
  setPipeline,
  allowFallback,
  requirePipeline
}
