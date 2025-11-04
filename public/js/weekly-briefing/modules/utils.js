function applyUtilsMixin(klass) {
  Object.assign(klass.prototype, {
    escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },
    escapeAttribute(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },


    formatDate(value) {
      if (!value) return 'Unknown'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return 'Unknown'
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    },

    formatDateTime(value) {
      if (!value) return 'Unknown'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return 'Unknown'
      return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatDuration(ms) {
      if (!Number.isFinite(ms) || ms < 0) return '—'
      const seconds = Math.floor(ms / 1000)
      const minutes = Math.floor(seconds / 60)
      if (minutes > 0) {
        const remaining = seconds % 60
        return `${minutes}m ${remaining}s`
      }
      return `${seconds}s`
    },

    toInputDate(value) {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      return date.toISOString().slice(0, 10)
    },

    visibilityLabel(value) {
      switch (value) {
        case 'all':
          return 'All teams'
        case 'private':
          return 'Private'
        default:
          return 'Team'
      }
    },

    statusClass(value) {
      if (value === 'assigned') return 'annotation-status assigned'
      if (value === 'reviewed') return 'annotation-status reviewed'
      if (value === 'n/a') return 'annotation-status annotation-status-na'
      return 'annotation-status analyzing'
    },

    statusLabel(value) {
      switch (value) {
        case 'assigned':
          return 'Assigned'
        case 'reviewed':
          return 'Reviewed'
        case 'n/a':
          return 'Not applicable'
        default:
          return 'Needs analysis'
      }
    },

    normalizeHighlightText(value) {
      return typeof value === 'string' ? value.toLowerCase() : ''
    },

    highlightSlug(value) {
      return this.normalizeHighlightText(value).replace(/[^a-z0-9]+/g, '-')
    },

    highlightTextContains(text, patterns) {
      if (!text) return false
      return patterns.some(pattern => text.includes(pattern))
    },

    truncateHighlightSummary(value, limit = 220) {
      if (!value) return ''
      const trimmed = value.trim()
      if (trimmed.length <= limit) return trimmed
      return `${trimmed.slice(0, Math.max(0, limit - 1)).trim()}…`
    },

    cleanText(value) {
      if (value == null) return ''
      return typeof value === 'string' ? value.trim() : String(value).trim()
    }
  })
}

export { applyUtilsMixin }
