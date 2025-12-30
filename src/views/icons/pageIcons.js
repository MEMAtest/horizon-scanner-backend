/**
 * Page-Specific Canary Icons
 * Each page gets a unique canary pose
 */

const {
  getDashboardCanary,
  getProfileCanary,
  getAnalyticsCanary,
  getWeeklyRoundupCanary,
  getCalendarCanary,
  getWatchListsCanary,
  getDossiersCanary,
  getPoliciesCanary,
  getKanbanCanary,
  getPredictiveCanary,
  getEnforcementCanary,
  getSpotlightCanary,
  getIntelligenceCanary
} = require('./canaryBase')

/**
 * Dashboard Icon - Standing alert canary
 */
function getDashboardIcon() {
  return getDashboardCanary()
}

/**
 * Profile Hub Icon - Waving canary
 */
function getProfileIcon() {
  return getProfileCanary()
}

/**
 * Analytics Icon - Magnifying glass canary
 */
function getAnalyticsIcon() {
  return getAnalyticsCanary()
}

/**
 * Weekly Roundup Icon - Reading canary with glasses
 */
function getWeeklyRoundupIcon() {
  return getWeeklyRoundupCanary()
}

/**
 * Calendar Icon - Clock pointing canary
 */
function getCalendarIcon() {
  return getCalendarCanary()
}

/**
 * Watch Lists Icon - Binoculars canary
 */
function getWatchListsIcon() {
  return getWatchListsCanary()
}

/**
 * Dossiers Icon - Folder carrying canary
 */
function getDossiersIcon() {
  return getDossiersCanary()
}

/**
 * Policies Icon - Clipboard canary
 */
function getPoliciesIcon() {
  return getPoliciesCanary()
}

/**
 * Handbook Icon - Reading canary
 */
function getHandbookIcon() {
  return getWeeklyRoundupCanary()
}

/**
 * Kanban Icon - Card arranging canary
 */
function getKanbanIcon() {
  return getKanbanCanary()
}

/**
 * Predictive Analytics Icon - Crystal ball canary
 */
function getPredictiveIcon() {
  return getPredictiveCanary()
}

/**
 * Enforcement Icon - Gavel canary
 */
function getEnforcementIcon() {
  return getEnforcementCanary()
}

/**
 * Authority Spotlight Icon - Searchlight canary
 */
function getSpotlightIcon() {
  return getSpotlightCanary()
}

/**
 * Sector Intelligence Icon - Radar canary
 */
function getIntelligenceIcon() {
  return getIntelligenceCanary()
}

/**
 * Wrap icon in container div
 * @param {string} iconSvg - The SVG icon
 * @returns {string} Icon wrapped in styled container
 */
function wrapIconInContainer(iconSvg) {
  return `<div class="canary-icon-container">${iconSvg}</div>`
}

/**
 * Get page icon by name
 * @param {string} pageName - Name of the page
 * @returns {string} SVG icon for that page
 */
function getPageIcon(pageName) {
  const icons = {
    dashboard: getDashboardIcon,
    profile: getProfileIcon,
    'profile-hub': getProfileIcon,
    analytics: getAnalyticsIcon,
    'predictive-analytics': getPredictiveIcon,
    'weekly-roundup': getWeeklyRoundupIcon,
    calendar: getCalendarIcon,
    'regulatory-calendar': getCalendarIcon,
    'watch-lists': getWatchListsIcon,
    dossiers: getDossiersIcon,
    policies: getPoliciesIcon,
    handbook: getHandbookIcon,
    kanban: getKanbanIcon,
    'change-management': getKanbanIcon,
    enforcement: getEnforcementIcon,
    'authority-spotlight': getSpotlightIcon,
    spotlight: getSpotlightIcon,
    'sector-intelligence': getIntelligenceIcon,
    intelligence: getIntelligenceIcon
  }

  const iconFn = icons[pageName.toLowerCase()] || getDashboardIcon
  return iconFn()
}

module.exports = {
  getDashboardIcon,
  getProfileIcon,
  getAnalyticsIcon,
  getWeeklyRoundupIcon,
  getCalendarIcon,
  getWatchListsIcon,
  getDossiersIcon,
  getPoliciesIcon,
  getHandbookIcon,
  getKanbanIcon,
  getPredictiveIcon,
  getEnforcementIcon,
  getSpotlightIcon,
  getIntelligenceIcon,
  wrapIconInContainer,
  getPageIcon
}
