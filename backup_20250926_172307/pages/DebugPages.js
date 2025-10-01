// src/pages/DebugPages.js
const dbService = require('../services/dbService')
const fileDbService = require('../services/fileDbService')
const aiAnalyzer = require('../services/aiAnalyzer') // Assuming this service exists

// --- Render /debug/test Page ---
async function renderTestPage() {
  let dbStatus = 'unknown'
  let dbConnected = false
  const envVars = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasGroqKey: !!process.env.GROQ_API_KEY
  }

  try {
    await fileDbService.initialize()
    dbStatus = 'connected'
    dbConnected = true
  } catch (error) {
    dbStatus = 'error: ' + error.message
  }

  let healthScore = 0
  if (dbConnected) healthScore += 50
  if (envVars.hasGroqKey) healthScore += 30
  if (envVars.hasDatabaseUrl) healthScore += 20

  return `<!DOCTYPE html>
    <html><head><title>System Test</title><!-- styles --></head>
    <body>
        <h1>System Test for Regulatory Horizon Scanner</h1>
        <h2>Health Score: ${healthScore}%</h2>
        <p>Database Status: ${dbStatus}</p>
        <p>Groq Key Present: ${envVars.hasGroqKey}</p>
        <!-- The rest of the original complex HTML for this page -->
    </body></html>`
}

// --- Render /debug/database Page ---
async function renderDbDebugPage() {
  const pool = dbService.getPool()
  let connectionTime = 0; const queryTime = 0; let status = 'failed'
  try {
    const start = Date.now()
    const client = await pool.connect()
    connectionTime = Date.now() - start
    status = 'connected'
    client.release()
  } catch (e) { /* handle error */ }

  return `<!DOCTYPE html>
    <html><head><title>Database Debug</title><!-- styles --></head>
    <body>
        <h1>Database Debug</h1>
        <p>Connection Status: ${status}</p>
        <p>Connection Time: ${connectionTime}ms</p>
        <!-- The rest of the original complex HTML for this page -->
    </body></html>`
}

// --- Render other debug pages similarly ---
async function renderGroqTestPage() {
  // Logic from original groq-test endpoint
  return '<html><body><h1>Groq Test Page</h1></body></html>'
}

async function renderCleanupPage() {
  // Logic from original cleanup endpoint
  const result = await dbService.runCleanup()
  return `<html><body><h1>Cleanup Page</h1><p>Deleted ${result.deletedCount} records.</p></body></html>`
}

async function renderComprehensiveFixPage() {
  // Logic from original comprehensive-fix endpoint
  return '<html><body><h1>Comprehensive Fix Page</h1></body></html>'
}

module.exports = {
  renderTestPage,
  renderDbDebugPage,
  renderGroqTestPage,
  renderCleanupPage,
  renderComprehensiveFixPage
}
