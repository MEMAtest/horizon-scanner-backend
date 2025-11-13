const crypto = require('crypto')

const STATIC_ASSETS = [
  '/css/weekly-briefing/layout.css',
  '/css/weekly-briefing/components.css',
  '/css/weekly-briefing/modals.css',
  '/css/weekly-briefing/widgets.css'
]

const versionSeed = process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_ID || process.env.COMMIT_REF || ''
const buildStamp = process.env.BUILD_TIMESTAMP || new Date().toISOString()
const baseKey = versionSeed ? versionSeed.slice(0, 10) : crypto.createHash('md5').update(String(Date.now())).digest('hex').slice(0, 10)
const cacheKey = `${baseKey}-${crypto.createHash('md5').update(buildStamp).digest('hex').slice(0, 6)}`
const versionSuffix = `?v=${cacheKey}`

function withVersion(path) {
  return `${path}${versionSuffix}`
}

function getWeeklyBriefingStyles() {
  return STATIC_ASSETS
    .map(href => `<link rel="stylesheet" href="${withVersion(href)}">`)
    .join('\n')
}

function getWeeklyBriefingRuntimeScripts() {
  return [
    `<script>window.__WB_VERSION__='${versionSuffix}'</script>`,
    `<script type="module" src="${withVersion('/js/weekly-briefing/index.js')}"></script>`
  ].join('\n')
}

module.exports = {
  getWeeklyBriefingStyles,
  getWeeklyBriefingRuntimeScripts
}
