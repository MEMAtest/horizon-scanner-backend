/**
 * RegCanary Icons Module
 * Unique animated canary mascot poses for each page
 */

const { getCanaryAnimationStyles } = require('./canaryAnimations')
const {
  getCanaryGradients,
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
  getIntelligenceCanary,
  getInternationalCanary,
  getBankNewsCanary,
  getDearCeoCanary,
  getConsultationsCanary
} = require('./canaryBase')
const {
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
  getInternationalIcon,
  getBankNewsIcon,
  getDearCeoIcon,
  getConsultationsIcon,
  wrapIconInContainer,
  getPageIcon
} = require('./pageIcons')

module.exports = {
  // Animation styles
  getCanaryAnimationStyles,

  // Base components
  getCanaryGradients,

  // Canary pose functions (direct access)
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
  getIntelligenceCanary,
  getInternationalCanary,
  getBankNewsCanary,
  getDearCeoCanary,
  getConsultationsCanary,

  // Page-specific icons (wrapped)
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
  getInternationalIcon,
  getBankNewsIcon,
  getDearCeoIcon,
  getConsultationsIcon,

  // Utilities
  wrapIconInContainer,
  getPageIcon
}
