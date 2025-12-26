/**
 * Formatters Module
 * Standalone utility functions for formatting data
 */

export function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return '£0'
  const num = Number(amount)
  if (num >= 1000000000) return '£' + (num / 1e9).toFixed(2) + 'B'
  if (num >= 1000000) return '£' + (num / 1e6).toFixed(1) + 'M'
  if (num >= 1000) return '£' + (num / 1000).toFixed(0) + 'K'
  return '£' + num.toLocaleString('en-GB')
}

export function formatNumber(num) {
  return num ? num.toLocaleString('en-GB') : '0'
}

export function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c])
}

export function parseJson(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try {
    return JSON.parse(val)
  } catch {
    return []
  }
}

export function formatOutcomeLabel(type) {
  const labels = {
    fine: 'Fine',
    cancellation: 'Cancellation',
    prohibition: 'Prohibition Order',
    restriction: 'Restriction',
    censure: 'Public Censure',
    warning: 'Warning Notice',
    supervisory_notice: 'Supervisory Notice',
    public_statement: 'Public Statement',
    voluntary_requirement: 'Voluntary Requirement',
    other: 'Other'
  }
  return labels[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'
}

export function formatBreachLabel(type) {
  const labels = {
    conduct: 'Conduct',
    aml: 'AML/Financial Crime',
    prudential: 'Prudential',
    governance: 'Governance',
    consumer_protection: 'Consumer Protection',
    market_abuse: 'Market Abuse',
    reporting: 'Reporting Failures',
    systems: 'Systems & Controls',
    fitness: 'Fitness & Propriety',
    other: 'Other'
  }
  return labels[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown'
}

// Outcome colors mapping
export const outcomeColors = {
  'cancellation': '#ef4444',
  'prohibition': '#f97316',
  'fine': '#f59e0b',
  'restriction': '#eab308',
  'censure': '#84cc16',
  'public_statement': '#22c55e',
  'warning': '#14b8a6',
  'supervisory_notice': '#06b6d4',
  'voluntary_requirement': '#3b82f6',
  'other': '#64748b'
}
