export function applyHelpersMixin(klass) {
  Object.assign(klass.prototype, {
    formatCurrency(amount) {
      if (!amount || isNaN(amount)) return '£0'
      const num = Number(amount)
      if (num >= 1000000000) return '£' + (num / 1e9).toFixed(2) + 'B'
      if (num >= 1000000) return '£' + (num / 1e6).toFixed(1) + 'M'
      if (num >= 1000) return '£' + (num / 1000).toFixed(0) + 'K'
      return '£' + num.toLocaleString('en-GB')
    },
    formatNumber(num) {
      return num ? num.toLocaleString('en-GB') : '0'
    },
    formatOutcomeLabel(type) {
      const labels = {
        cancellation: 'Cancellation',
        fine: 'Fine',
        prohibition: 'Prohibition',
        restriction: 'Restriction',
        censure: 'Censure',
        warning: 'Warning',
        supervisory_notice: 'Supervisory Notice',
        public_statement: 'Public Statement',
        voluntary_requirement: 'Voluntary Requirement',
        other: 'Other'
      }
      return labels[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
    },
    formatBreachLabel(type) {
      const labels = {
        PRINCIPLES: 'Principles',
        AML: 'AML',
        SYSTEMS_CONTROLS: 'Systems & Controls',
        MARKET_ABUSE: 'Market Abuse',
        MIS_SELLING: 'Mis-selling',
        CLIENT_MONEY: 'Client Money',
        CONDUCT: 'Conduct',
        PRUDENTIAL: 'Prudential',
        REPORTING: 'Reporting',
        GOVERNANCE: 'Governance',
        FINANCIAL_CRIME: 'Financial Crime',
        COMPLAINTS: 'Complaints',
        FINANCIAL_PROMOTIONS: 'Financial Promotions',
        APPROVED_PERSONS: 'Approved Persons'
      }
      return labels[type] || type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    },
    escapeHtml(str) {
      if (!str) return ''
      return str.replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[c])
    },
    parseJson(val) {
      if (!val) return []
      if (Array.isArray(val)) return val
      try {
        return JSON.parse(val)
      } catch {
        return []
      }
    }
  })
}
