// src/templates/emails/regulatorIcons.js
// Premium email-friendly regulator icons using HTML/CSS gradients (no SVG for Gmail compatibility)

// Premium regulator icons with gradient backgrounds and meaningful symbols
const REGULATOR_ICONS = {
  // UK Regulators - with relevant Unicode symbols
  FCA: {
    bg: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
    color: '#1E40AF',
    symbol: '🛡',
    label: 'FCA',
    accent: '#60A5FA'
  },
  PRA: {
    bg: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    color: '#7C3AED',
    symbol: '🏛',
    label: 'PRA',
    accent: '#A78BFA'
  },
  'Bank of England': {
    bg: 'linear-gradient(135deg, #047857 0%, #065F46 100%)',
    color: '#047857',
    symbol: '🏦',
    label: 'BoE',
    accent: '#34D399'
  },
  HMRC: {
    bg: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    color: '#DC2626',
    symbol: '💷',
    label: 'HMRC',
    accent: '#FCA5A5'
  },
  'HM Treasury': {
    bg: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
    color: '#B91C1C',
    symbol: '🏛',
    label: 'HMT',
    accent: '#FECACA'
  },
  'HM Government': {
    bg: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 100%)',
    color: '#1E3A8A',
    symbol: '🇬🇧',
    label: 'GOV',
    accent: '#93C5FD'
  },
  AQUIS: {
    bg: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
    color: '#0891B2',
    symbol: '📊',
    label: 'AQX',
    accent: '#67E8F9'
  },
  LSE: {
    bg: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
    color: '#1D4ED8',
    symbol: '📈',
    label: 'LSE',
    accent: '#93C5FD'
  },

  // European Regulators
  ESMA: {
    bg: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 100%)',
    color: '#1E3A8A',
    symbol: '🇪🇺',
    label: 'ESMA',
    accent: '#A5B4FC'
  },
  EBA: {
    bg: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
    color: '#0F766E',
    symbol: '🏦',
    label: 'EBA',
    accent: '#5EEAD4'
  },
  ECB: {
    bg: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
    color: '#1D4ED8',
    symbol: '💶',
    label: 'ECB',
    accent: '#93C5FD'
  },
  BAFIN: {
    bg: 'linear-gradient(135deg, #0C4A6E 0%, #164E63 100%)',
    color: '#0C4A6E',
    symbol: '🇩🇪',
    label: 'BAF',
    accent: '#7DD3FC'
  },
  AMF: {
    bg: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
    color: '#1E40AF',
    symbol: '🇫🇷',
    label: 'AMF',
    accent: '#93C5FD'
  },

  // International
  FATF: {
    bg: 'linear-gradient(135deg, #0369A1 0%, #075985 100%)',
    color: '#0369A1',
    symbol: '🌐',
    label: 'FATF',
    accent: '#7DD3FC'
  },
  FSB: {
    bg: 'linear-gradient(135deg, #4338CA 0%, #3730A3 100%)',
    color: '#4338CA',
    symbol: '🌍',
    label: 'FSB',
    accent: '#A5B4FC'
  },
  WOLFSBERG: {
    bg: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
    color: '#374151',
    symbol: '🏦',  // Banking group, not a wolf
    label: 'WLF',
    accent: '#9CA3AF'
  },

  // US Regulators
  SEC: {
    bg: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
    color: '#1E3A8A',
    symbol: '🇺🇸',
    label: 'SEC',
    accent: '#93C5FD'
  },
  FEDERAL_RESERVE: {
    bg: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
    color: '#065F46',
    symbol: '🏛',
    label: 'Fed',
    accent: '#34D399'
  },
  OFAC: {
    bg: 'linear-gradient(135deg, #7C2D12 0%, #9A3412 100%)',
    color: '#7C2D12',
    symbol: '⚠️',
    label: 'OFAC',
    accent: '#FDBA74'
  },

  // Asia-Pacific
  HKMA: {
    bg: 'linear-gradient(135deg, #BE123C 0%, #9F1239 100%)',
    color: '#BE123C',
    symbol: '🇭🇰',
    label: 'HKMA',
    accent: '#FDA4AF'
  },
  MAS: {
    bg: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    color: '#DC2626',
    symbol: '🇸🇬',
    label: 'MAS',
    accent: '#FCA5A5'
  },
  JFSA: {
    bg: 'linear-gradient(135deg, #BE185D 0%, #9D174D 100%)',
    color: '#BE185D',
    symbol: '🇯🇵',
    label: 'JFSA',
    accent: '#F9A8D4'
  },
  RBI: {
    bg: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
    color: '#0D9488',
    symbol: '🇮🇳',
    label: 'RBI',
    accent: '#5EEAD4'
  },
  APRA: {
    bg: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
    color: '#1D4ED8',
    symbol: '🇦🇺',
    label: 'APRA',
    accent: '#93C5FD'
  },

  // Caribbean
  CIMA: {
    bg: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
    color: '#0891B2',
    symbol: '🏝',
    label: 'CIMA',
    accent: '#67E8F9'
  },

  // Default
  default: {
    bg: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    color: '#475569',
    symbol: '📋',
    label: 'REG',
    accent: '#94A3B8'
  }
}

/**
 * Get canary logo HTML for email header
 * Uses table-based layout for maximum email client compatibility
 * @param {number} size - Size in pixels (default 70)
 * @returns {string} HTML string with the canary logo
 */
function getCanaryLogo(size = 70) {
  // Simple yellow canary bird using HTML/CSS shapes
  // This approach works in all email clients including Gmail
  const bodySize = Math.round(size * 0.6)
  const headSize = Math.round(size * 0.35)

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
      <tr>
        <td align="center" style="position: relative;">
          <!-- Canary body (yellow oval) -->
          <div style="
            width: ${bodySize}px;
            height: ${Math.round(bodySize * 1.2)}px;
            background: #F59E0B;
            border-radius: 50%;
            position: relative;
            margin-top: ${Math.round(headSize * 0.5)}px;
          ">
            <!-- Head (overlapping circle) -->
            <div style="
              width: ${headSize}px;
              height: ${headSize}px;
              background: #F59E0B;
              border-radius: 50%;
              position: absolute;
              top: -${Math.round(headSize * 0.6)}px;
              left: 50%;
              transform: translateX(-50%);
            ">
              <!-- Eye -->
              <div style="
                width: 6px;
                height: 6px;
                background: #1E3A8A;
                border-radius: 50%;
                position: absolute;
                top: ${Math.round(headSize * 0.3)}px;
                right: ${Math.round(headSize * 0.2)}px;
              "></div>
              <!-- Beak -->
              <div style="
                width: 0;
                height: 0;
                border-top: 4px solid transparent;
                border-bottom: 4px solid transparent;
                border-left: 8px solid #EA580C;
                position: absolute;
                top: ${Math.round(headSize * 0.4)}px;
                right: -6px;
              "></div>
            </div>
            <!-- Legs -->
            <div style="
              position: absolute;
              bottom: -10px;
              left: 35%;
              width: 2px;
              height: 12px;
              background: #EA580C;
            "></div>
            <div style="
              position: absolute;
              bottom: -10px;
              right: 35%;
              width: 2px;
              height: 12px;
              background: #EA580C;
            "></div>
          </div>
        </td>
      </tr>
    </table>
  `
}

/**
 * Get simple canary icon (legacy - redirects to premium)
 * @param {number} size - Size in pixels
 * @returns {string} HTML string
 */
function getCanaryIconSimple(size = 70) {
  return getPremiumCanaryLogo(size)
}

/**
 * Get premium canary logo - Simple, clean canary icon
 * Navy background with just the canary - professional and recognizable
 * @param {number} size - Size in pixels (default 64)
 * @returns {string} HTML string
 */
function getPremiumCanaryLogo(size = 64) {
  // Simple, clean canary icon - professional branding
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="display: inline-block;">
      <tr>
        <td style="
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%);
          border-radius: 12px;
          text-align: center;
          vertical-align: middle;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 2px solid rgba(251, 191, 36, 0.3);
        ">
          <span style="font-size: ${Math.floor(size * 0.55)}px; line-height: ${size}px;">🐤</span>
        </td>
      </tr>
    </table>
  `
}

/**
 * Get premium regulator icon HTML for email - gradient backgrounds with meaningful symbols
 * @param {string} authority - The authority/regulator name
 * @param {number} size - Icon size in pixels (default 32)
 * @returns {string} HTML string with the icon
 */
function getRegulatorIcon(authority, size = 32) {
  const normalizedAuth = (authority || '').toUpperCase().replace(/[^A-Z]/g, '')
  const iconData = REGULATOR_ICONS[authority] ||
               REGULATOR_ICONS[normalizedAuth] ||
               Object.values(REGULATOR_ICONS).find(i => i.label === normalizedAuth) ||
               REGULATOR_ICONS.default

  // Premium gradient icon with Unicode symbol (works in ALL email clients)
  return `<div style="
    width: ${size}px;
    height: ${size}px;
    background: ${iconData.bg || iconData.color};
    border-radius: 6px;
    display: inline-block;
    text-align: center;
    line-height: ${size}px;
    font-size: ${Math.floor(size * 0.55)}px;
    vertical-align: middle;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
    border: 1px solid ${iconData.accent || '#FFFFFF'}40;
  ">${iconData.symbol || iconData.icon || iconData.label}</div>`
}

/**
 * Get regulator color
 * @param {string} authority - The authority/regulator name
 * @returns {string} Hex color code
 */
function getRegulatorColor(authority) {
  const icon = REGULATOR_ICONS[authority] || REGULATOR_ICONS.default
  return icon.color
}

/**
 * Build a traffic light risk gauge for email
 * @param {string} level - 'low', 'medium', or 'high'
 * @returns {string} HTML for the gauge
 */
function buildRiskGauge(level = 'low') {
  const colors = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' }
  const labels = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH' }

  const color = colors[level] || colors.low
  const label = labels[level] || labels.low

  // Three circles with one highlighted
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="display: inline-block; vertical-align: middle;">
      <tr>
        <td style="padding-right: 4px;">
          <div style="width: 16px; height: 16px; background: ${level === 'low' ? '#10B981' : '#D1D5DB'}; border-radius: 50%;"></div>
        </td>
        <td style="padding-right: 4px;">
          <div style="width: 16px; height: 16px; background: ${level === 'medium' ? '#F59E0B' : '#D1D5DB'}; border-radius: 50%;"></div>
        </td>
        <td style="padding-right: 8px;">
          <div style="width: 16px; height: 16px; background: ${level === 'high' ? '#EF4444' : '#D1D5DB'}; border-radius: 50%;"></div>
        </td>
        <td style="font-size: 12px; font-weight: 700; color: ${color}; letter-spacing: 0.05em;">
          ${label}
        </td>
      </tr>
    </table>
  `
}

/**
 * Build a simple colored badge for overall risk
 * @param {string} level - 'low', 'medium', or 'high'
 * @returns {string} HTML for the badge
 */
function buildRiskBadge(level = 'low') {
  const colors = {
    low: { bg: '#D1FAE5', text: '#065F46', label: 'LOW RISK' },
    medium: { bg: '#FEF3C7', text: '#92400E', label: 'MEDIUM RISK' },
    high: { bg: '#FEE2E2', text: '#991B1B', label: 'HIGH RISK' }
  }

  const config = colors[level] || colors.low

  return `
    <span style="display: inline-block; padding: 6px 12px; background: ${config.bg}; color: ${config.text}; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; border-radius: 4px;">
      ${config.label}
    </span>
  `
}

/**
 * Get priority color based on relevance score
 * @param {object} insight - The insight object with relevanceScore
 * @returns {string} Hex color code
 */
function getPriorityColor(insight) {
  if (!insight) return '#94A3B8'
  const score = insight.relevanceScore || 0
  if (score >= 80) return '#B91C1C' // High impact - red
  if (score >= 70) return '#D97706' // Enforcement - orange
  return '#475569' // Monitor - gray
}

module.exports = {
  REGULATOR_ICONS,
  getCanaryLogo,
  getCanaryIconSimple,
  getPremiumCanaryLogo,
  getRegulatorIcon,
  getRegulatorColor,
  buildRiskGauge,
  buildRiskBadge,
  getPriorityColor
}
