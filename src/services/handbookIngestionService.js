const axios = require('axios')
const crypto = require('crypto')

const db = require('./dbService')

const FCA_API_BASE = 'https://api-handbook.fca.org.uk'
const FCA_PUBLIC_BASE = 'https://www.handbook.fca.org.uk/handbook'

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*'
}

const REF_MARKERS = new Set([
  'Annex',
  'Appendix',
  'App',
  'Appx',
  'Sch',
  'Schedule',
  'TP',
  'Part',
  'Chapter',
  'Ch',
  'Module',
  'Section',
  'Subsection',
  'Sub-section'
])

const PROVISION_SUFFIXES = {
  Rules: 'R',
  Rule: 'R',
  Guidance: 'G',
  Evidential: 'E',
  Direction: 'D',
  Decision: 'D',
  Principles: 'P'
}

const http = axios.create({
  baseURL: FCA_API_BASE,
  timeout: 60000,
  headers: REQUEST_HEADERS
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function hashContent(value) {
  if (!value) return null
  return crypto.createHash('sha256').update(value).digest('hex')
}

function parseFcaDate(value) {
  if (!value || typeof value !== 'string') return null
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function extractSourcebookTitle(name, code) {
  if (!name) return null
  const trimmed = name.trim()
  if (!code) return trimmed
  const prefix = code.toUpperCase()
  if (trimmed.toUpperCase().startsWith(prefix)) {
    return trimmed.slice(prefix.length).trim() || trimmed
  }
  return trimmed
}

function splitNameIntoRefAndTitle(name) {
  if (!name) return { ref: null, title: null }
  const tokens = name.trim().split(/\s+/)
  if (tokens.length === 0) return { ref: null, title: null }

  const code = tokens.shift()
  if (!tokens.length) {
    return { ref: code, title: null }
  }

  const refTokens = [code]
  let index = 0

  for (; index < tokens.length; index += 1) {
    const token = tokens[index]
    const hasDigit = /\d/.test(token)
    const isMarker = REF_MARKERS.has(token)
    const isMarkerSuffix = /^[A-Z]+$/.test(token) && index > 0 && REF_MARKERS.has(tokens[index - 1])

    if (hasDigit || isMarker || isMarkerSuffix) {
      refTokens.push(token)
      continue
    }
    break
  }

  const ref = refTokens.join(' ')
  const title = tokens.slice(index).join(' ').trim() || null
  return { ref, title }
}

function normalizeProvisionRef(provisionName, provisionType) {
  if (!provisionName) return null
  const suffix = PROVISION_SUFFIXES[provisionType] || null
  const trimmed = provisionName.trim()
  if (!suffix) return trimmed
  if (trimmed.endsWith(suffix)) {
    return trimmed
  }
  return `${trimmed}${suffix}`
}

function makePathFromRef(ref) {
  if (!ref) return null
  return ref.replace(/\s+/g, '/')
}

async function fetchJson(path, { params } = {}) {
  const maxAttempts = 3
  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await http.get(path, { params })
      return response.data
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        await sleep(800 * attempt)
        continue
      }
    }
  }

  throw lastError
}

function collectSourcebooks(headers) {
  const sourcebooks = []
  if (!Array.isArray(headers)) return sourcebooks

  headers.forEach(block => {
    const blockParts = Array.isArray(block.parts) ? block.parts : []
    blockParts.forEach(sourcebook => {
      if (sourcebook?.isDeleted) return
      const code = (sourcebook?.contains || sourcebook?.name || '').split(/\s+/)[0]?.toUpperCase()
      if (!code) return
      const title = extractSourcebookTitle(sourcebook.name, code)
      const chapters = []
      const sections = []

      const chapterParts = Array.isArray(sourcebook.parts) ? sourcebook.parts : []
      chapterParts.forEach((chapter, chapterIndex) => {
        if (chapter?.isDeleted) return
        const { ref: chapterRef, title: chapterTitle } = splitNameIntoRefAndTitle(chapter.name)
        const ref = chapterRef || chapter.contains || chapter.entityId?.toUpperCase() || null
        chapters.push({
          key: chapter.entityId,
          ref,
          title: chapterTitle || chapter.name || null,
          orderIndex: chapterIndex,
          anchor: chapter.entityId || null,
          path: makePathFromRef(ref)
        })

        const sectionParts = Array.isArray(chapter.parts) ? chapter.parts : []
        sectionParts.forEach((section, sectionIndex) => {
          if (section?.isDeleted) return
          const { ref: sectionRef, title: sectionTitle } = splitNameIntoRefAndTitle(section.name)
          const sectionRefValue = sectionRef || section.name || null
          sections.push({
            key: section.entityId,
            parentKey: chapter.entityId,
            ref: sectionRefValue,
            title: sectionTitle || section.name || null,
            orderIndex: sectionIndex,
            anchor: section.entityId || null,
            path: makePathFromRef(sectionRefValue)
          })
        })
      })

      sourcebooks.push({
        code,
        title,
        entityId: sourcebook.entityId || null,
        lastModified: sourcebook.lastmodifieddate || null,
        chapters,
        sections
      })
    })
  })

  return sourcebooks
}

async function ingestFcaHandbook(options = {}) {
  const {
    sourcebooks: sourcebookFilter = [],
    maxSourcebooks,
    maxChapters,
    log = console.log
  } = options

  await db.waitForInitialization()
  if (db.fallbackMode || !db.pool) {
    throw new Error('FCA handbook ingestion requires PostgreSQL (DATABASE_URL).')
  }

  const runId = await db.createHandbookIngestRun({ authority: 'FCA', source: FCA_API_BASE })
  const stats = {
    sourcebooks: 0,
    chapters: 0,
    sections: 0,
    provisions: 0
  }

  try {
    log('Fetching FCA handbook index...')
    const indexData = await fetchJson('/Handbook/GetAllHandbook')
    const headers = indexData?.Result?.headers || []
    let sourcebooks = collectSourcebooks(headers)

    if (sourcebookFilter.length) {
      const filterSet = new Set(sourcebookFilter.map(code => code.toUpperCase()))
      sourcebooks = sourcebooks.filter(item => filterSet.has(item.code))
    }

    if (maxSourcebooks && Number.isInteger(maxSourcebooks)) {
      sourcebooks = sourcebooks.slice(0, maxSourcebooks)
    }

    for (const sourcebook of sourcebooks) {
      stats.sourcebooks += 1
      log(`Ingesting ${sourcebook.code} (${sourcebook.title || 'Untitled'})`)

      const sourcebookRow = await db.upsertHandbookSourcebook({
        authority: 'FCA',
        jurisdiction: 'UK',
        code: sourcebook.code,
        title: sourcebook.title,
        docType: 'sourcebook',
        homeUrl: `${FCA_PUBLIC_BASE}/${sourcebook.code}/`,
        status: 'active'
      })

      const versionLabel = sourcebook.lastModified || null
      const effectiveDate = parseFcaDate(sourcebook.lastModified)
      const version = await db.createHandbookVersion(sourcebookRow.id, {
        versionLabel,
        effectiveDate,
        publishedDate: effectiveDate,
        sourceUrl: `${FCA_PUBLIC_BASE}/${sourcebook.code}/`,
        contentHash: hashContent(`${sourcebook.code}:${sourcebook.lastModified || ''}:${sourcebook.chapters.length}`)
      })

      const chapterRows = sourcebook.chapters.map(chapter => ({
        parentId: null,
        level: 1,
        sectionNumber: chapter.ref,
        sectionTitle: chapter.title,
        canonicalRef: chapter.ref,
        path: chapter.path,
        anchor: chapter.anchor,
        text: [chapter.ref, chapter.title].filter(Boolean).join(' - ') || null,
        html: null,
        orderIndex: chapter.orderIndex,
        contentHash: hashContent(chapter.ref || chapter.title || '')
      }))

      const insertedChapters = await db.insertHandbookSections(version.id, chapterRows)
      const chapterIdByRef = new Map(insertedChapters.map(row => [row.canonical_ref, row.id]))
      const chapterRefByKey = new Map(
        sourcebook.chapters.map(chapter => [chapter.key, chapter.ref])
      )

      const sectionRows = sourcebook.sections.map(section => ({
        parentId: chapterIdByRef.get(chapterRefByKey.get(section.parentKey)) || null,
        level: 2,
        sectionNumber: section.ref,
        sectionTitle: section.title,
        canonicalRef: section.ref,
        path: section.path,
        anchor: section.anchor,
        text: [section.ref, section.title].filter(Boolean).join(' - ') || null,
        html: null,
        orderIndex: section.orderIndex,
        contentHash: hashContent(section.ref || section.title || '')
      }))

      const insertedSections = await db.insertHandbookSections(version.id, sectionRows)
      const sectionIdByRef = new Map(insertedSections.map(row => [row.canonical_ref, row.id]))
      const sectionRefByKey = new Map(sourcebook.sections.map(section => [section.key, section.ref]))
      const sectionIdMap = new Map()

      sectionRefByKey.forEach((ref, key) => {
        const id = sectionIdByRef.get(ref)
        if (id) {
          sectionIdMap.set(key, id)
        }
      })

      let chaptersProcessed = 0
      for (const chapter of sourcebook.chapters) {
        if (!chapter.key) continue
        if (maxChapters && Number.isInteger(maxChapters) && chaptersProcessed >= maxChapters) {
          break
        }

        chaptersProcessed += 1
        stats.chapters += 1
        log(`  Fetching provisions for ${chapter.ref}`)

        const chapterData = await fetchJson(`/Handbook/GetAllHandBookProvisionsSortedOrderByChapter/${chapter.key}`)
        const provisions = chapterData?.Result?.provisions || []

        if (!Array.isArray(provisions) || !provisions.length) {
          continue
        }

        const paragraphs = provisions
          .filter(item => !item?.isDeleted)
          .map(item => {
            const canonicalRef = normalizeProvisionRef(item.provisionName, item.provisionType)
            return {
              sectionKey: item.sectionId,
              paragraphNumber: item.provisionName || null,
              canonicalRef,
              anchor: item.entityId || item.provisionTagId || null,
              text: item.contentText || null,
              html: item.contentType || null,
              contentHash: hashContent(item.contentText || item.contentType || '')
            }
          })

        if (paragraphs.length) {
          await db.insertHandbookParagraphs(sectionIdMap, paragraphs)
          stats.provisions += paragraphs.length
        }
      }

      stats.sections += sourcebook.sections.length
    }

    await db.finishHandbookIngestRun(runId, { status: 'completed', stats })
    return stats
  } catch (error) {
    await db.finishHandbookIngestRun(runId, {
      status: 'failed',
      stats,
      error: {
        message: error.message,
        stack: error.stack
      }
    })
    throw error
  }
}

module.exports = {
  ingestFcaHandbook
}
