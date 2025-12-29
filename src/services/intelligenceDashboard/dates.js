function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function subtractDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

function toISO(date) {
  return new Date(date).toISOString()
}

function toTimestamp(value) {
  if (!value) return 0

  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? 0 : time
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return parsed
    const asNumber = Number(value)
    return Number.isFinite(asNumber) ? asNumber : 0
  }

  if (typeof value === 'object') {
    if (typeof value.valueOf === 'function') {
      const raw = value.valueOf()
      if (raw instanceof Date) {
        const rawTime = raw.getTime()
        return Number.isNaN(rawTime) ? 0 : rawTime
      }
      if (typeof raw === 'number' && Number.isFinite(raw)) {
        return raw
      }
      if (typeof raw === 'string') {
        const parsedValue = Date.parse(raw)
        if (!Number.isNaN(parsedValue)) return parsedValue
      }
    }

    if (typeof value.toISOString === 'function') {
      const iso = value.toISOString()
      const parsedIso = Date.parse(iso)
      if (!Number.isNaN(parsedIso)) return parsedIso
    }

    if (typeof value.toString === 'function') {
      const parsed = Date.parse(value.toString())
      if (!Number.isNaN(parsed)) return parsed
    }
  }

  return 0
}

function extractUpdateDate(update) {
  if (!update) return null
  const raw =
    update.publishedAt ||
    update.published_at ||
    update.publishedDate ||
    update.published_date ||
    update.createdAt ||
    update.fetchedDate
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function groupUpdatesByDay(updates) {
  const groups = new Map()
  updates.forEach(update => {
    const date = extractUpdateDate(update)
    if (!date) return
    const key = date.toISOString().slice(0, 10)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(update)
  })
  return groups
}

module.exports = {
  startOfDay,
  endOfDay,
  subtractDays,
  toISO,
  toTimestamp,
  extractUpdateDate,
  groupUpdatesByDay
}
