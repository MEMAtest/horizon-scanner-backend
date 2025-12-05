/**
 * Custom SVG Icons for Weekly Briefing
 * Modern Editorial style - thin line icons with consistent stroke widths
 */

const ICON_DEFAULTS = {
  size: 18,
  stroke: 'currentColor',
  strokeWidth: 1.5
}

function createIcon(pathD, options = {}) {
  const { size, stroke, strokeWidth } = { ...ICON_DEFAULTS, ...options }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${pathD}</svg>`
}

// Document/Clipboard icon for "Assemble Briefing"
function briefingIcon(options = {}) {
  return createIcon(`
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  `, options)
}

// Circular arrows for "Refresh Data"
function refreshIcon(options = {}) {
  return createIcon(`
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  `, options)
}

// Download icon
function downloadIcon(options = {}) {
  return createIcon(`
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  `, options)
}

// Printer icon
function printIcon(options = {}) {
  return createIcon(`
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  `, options)
}

// Bell icon for notifications/alerts
function alertIcon(options = {}) {
  return createIcon(`
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  `, options)
}

// Upward trend icon
function trendUpIcon(options = {}) {
  return createIcon(`
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  `, options)
}

// Downward trend icon
function trendDownIcon(options = {}) {
  return createIcon(`
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  `, options)
}

// Calendar icon
function calendarIcon(options = {}) {
  return createIcon(`
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  `, options)
}

// Clock icon for timing/schedule
function clockIcon(options = {}) {
  return createIcon(`
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  `, options)
}

// Chart/Analytics icon
function chartIcon(options = {}) {
  return createIcon(`
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  `, options)
}

// Shield icon for compliance/security
function shieldIcon(options = {}) {
  return createIcon(`
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  `, options)
}

// Globe icon for regulatory bodies
function globeIcon(options = {}) {
  return createIcon(`
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  `, options)
}

// Building icon for authorities
function buildingIcon(options = {}) {
  return createIcon(`
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <line x1="9" y1="22" x2="9" y2="18"/>
    <line x1="15" y1="22" x2="15" y2="18"/>
    <line x1="8" y1="6" x2="8" y2="6.01"/>
    <line x1="12" y1="6" x2="12" y2="6.01"/>
    <line x1="16" y1="6" x2="16" y2="6.01"/>
    <line x1="8" y1="10" x2="8" y2="10.01"/>
    <line x1="12" y1="10" x2="12" y2="10.01"/>
    <line x1="16" y1="10" x2="16" y2="10.01"/>
    <line x1="8" y1="14" x2="8" y2="14.01"/>
    <line x1="12" y1="14" x2="12" y2="14.01"/>
    <line x1="16" y1="14" x2="16" y2="14.01"/>
  `, options)
}

// Bookmark icon for saved items
function bookmarkIcon(options = {}) {
  return createIcon(`
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  `, options)
}

// External link icon
function externalLinkIcon(options = {}) {
  return createIcon(`
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  `, options)
}

// Filter icon
function filterIcon(options = {}) {
  return createIcon(`
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  `, options)
}

// Search icon
function searchIcon(options = {}) {
  return createIcon(`
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  `, options)
}

// Eye icon for view/visibility
function eyeIcon(options = {}) {
  return createIcon(`
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  `, options)
}

// Star icon for priority/rating
function starIcon(options = {}) {
  return createIcon(`
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  `, options)
}

// Lightning bolt for high impact
function boltIcon(options = {}) {
  return createIcon(`
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  `, options)
}

// Check circle for compliance
function checkCircleIcon(options = {}) {
  return createIcon(`
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  `, options)
}

// Alert triangle for warnings
function alertTriangleIcon(options = {}) {
  return createIcon(`
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  `, options)
}

// Info icon
function infoIcon(options = {}) {
  return createIcon(`
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  `, options)
}

// File text icon for documents
function fileTextIcon(options = {}) {
  return createIcon(`
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  `, options)
}

// Layers icon for sectors
function layersIcon(options = {}) {
  return createIcon(`
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  `, options)
}

// Arrow right for navigation
function arrowRightIcon(options = {}) {
  return createIcon(`
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  `, options)
}

// Chevron icons
function chevronDownIcon(options = {}) {
  return createIcon(`
    <polyline points="6 9 12 15 18 9"/>
  `, options)
}

function chevronRightIcon(options = {}) {
  return createIcon(`
    <polyline points="9 18 15 12 9 6"/>
  `, options)
}

// More horizontal (ellipsis)
function moreHorizontalIcon(options = {}) {
  return createIcon(`
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  `, options)
}

module.exports = {
  briefingIcon,
  refreshIcon,
  downloadIcon,
  printIcon,
  alertIcon,
  trendUpIcon,
  trendDownIcon,
  calendarIcon,
  clockIcon,
  chartIcon,
  shieldIcon,
  globeIcon,
  buildingIcon,
  bookmarkIcon,
  externalLinkIcon,
  filterIcon,
  searchIcon,
  eyeIcon,
  starIcon,
  boltIcon,
  checkCircleIcon,
  alertTriangleIcon,
  infoIcon,
  fileTextIcon,
  layersIcon,
  arrowRightIcon,
  chevronDownIcon,
  chevronRightIcon,
  moreHorizontalIcon
}
