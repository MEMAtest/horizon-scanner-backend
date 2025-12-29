const fallbackLaneByBucket = bucket => {
  switch (bucket) {
    case 'imminent':
      return 'act_now'
    case 'near':
      return 'prepare_next'
    default:
      return 'plan_horizon'
  }
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatList = (items = []) => {
  if (!items || !items.length) return '-'
  return items.join(', ')
}

const serializeForScript = value =>
  JSON.stringify(value).replace(/</g, '\\u003c')

module.exports = {
  fallbackLaneByBucket,
  escapeHtml,
  formatList,
  serializeForScript
}
