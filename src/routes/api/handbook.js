const db = require('../../services/dbService')

function parseNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function resolveAuthority(req) {
  return (req.query.authority || 'FCA').toString().toUpperCase()
}

async function ensureHandbookReady(res) {
  await db.waitForInitialization()
  if (db.fallbackMode || !db.pool) {
    res.status(503).json({ success: false, error: 'Handbook data requires PostgreSQL' })
    return false
  }
  return true
}

function registerHandbookRoutes(router) {
  // GET /api/handbook/sourcebooks
  router.get('/handbook/sourcebooks', async (req, res) => {
    try {
      if (!await ensureHandbookReady(res)) return
      const authority = resolveAuthority(req)
      const sourcebooks = await db.getHandbookSourcebooks(authority)
      const latestIngest = await db.getLatestHandbookIngestRun(authority)
      res.json({ success: true, data: sourcebooks, latestIngest })
    } catch (error) {
      console.error('Error getting handbook sourcebooks:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/handbook/sourcebooks/:code
  router.get('/handbook/sourcebooks/:code', async (req, res) => {
    try {
      if (!await ensureHandbookReady(res)) return
      const authority = resolveAuthority(req)
      const code = (req.params.code || '').toUpperCase()
      if (!code) {
        return res.status(400).json({ success: false, error: 'Sourcebook code is required' })
      }

      const sourcebook = await db.getHandbookSourcebookByCode(authority, code)
      if (!sourcebook) {
        return res.status(404).json({ success: false, error: 'Sourcebook not found' })
      }

      if (req.query.includeOutline === 'true') {
        const outline = await db.getHandbookOutlineBySourcebookId(
          sourcebook.id,
          sourcebook.latest_version_id
        )
        return res.json({ success: true, data: sourcebook, outline })
      }

      res.json({ success: true, data: sourcebook })
    } catch (error) {
      console.error('Error getting handbook sourcebook:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/handbook/sourcebooks/:code/outline
  router.get('/handbook/sourcebooks/:code/outline', async (req, res) => {
    try {
      if (!await ensureHandbookReady(res)) return
      const authority = resolveAuthority(req)
      const code = (req.params.code || '').toUpperCase()
      if (!code) {
        return res.status(400).json({ success: false, error: 'Sourcebook code is required' })
      }

      const sourcebook = await db.getHandbookSourcebookByCode(authority, code)
      if (!sourcebook) {
        return res.status(404).json({ success: false, error: 'Sourcebook not found' })
      }

      const outline = await db.getHandbookOutlineBySourcebookId(
        sourcebook.id,
        sourcebook.latest_version_id
      )

      res.json({ success: true, data: outline, sourcebook })
    } catch (error) {
      console.error('Error getting handbook outline:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/handbook/search?q=
  router.get('/handbook/search', async (req, res) => {
    try {
      if (!await ensureHandbookReady(res)) return
      const query = req.query.q || req.query.query
      if (!query) {
        return res.status(400).json({ success: false, error: 'Search query is required' })
      }

      const authority = resolveAuthority(req)
      const limit = parseNumber(req.query.limit, 20)
      const offset = parseNumber(req.query.offset, 0)
      const results = await db.searchHandbook(query, { authority, limit, offset })

      res.json({ success: true, data: results, limit, offset })
    } catch (error) {
      console.error('Error searching handbook:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/handbook/reference/:ref
  router.get('/handbook/reference/:ref', async (req, res) => {
    try {
      if (!await ensureHandbookReady(res)) return
      const authority = resolveAuthority(req)
      const ref = decodeURIComponent(req.params.ref || '').trim()
      if (!ref) {
        return res.status(400).json({ success: false, error: 'Reference is required' })
      }

      const result = await db.findHandbookReference(ref, authority)
      if (!result) {
        return res.status(404).json({ success: false, error: 'Reference not found' })
      }

      let paragraphs = []
      if (req.query.includeParagraphs === 'true' && result.type === 'section') {
        paragraphs = await db.getHandbookParagraphsBySectionId(result.id)
      }

      res.json({ success: true, data: result, paragraphs })
    } catch (error) {
      console.error('Error getting handbook reference:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/handbook/sections/:sectionId
  router.get('/handbook/sections/:sectionId', async (req, res) => {
    try {
      if (!await ensureHandbookReady(res)) return
      const sectionId = parseNumber(req.params.sectionId, null)
      if (!sectionId) {
        return res.status(400).json({ success: false, error: 'Section id is required' })
      }

      const section = await db.getHandbookSectionById(sectionId)
      if (!section) {
        return res.status(404).json({ success: false, error: 'Section not found' })
      }

      let paragraphs = []
      if (req.query.includeParagraphs === 'true') {
        paragraphs = await db.getHandbookParagraphsBySectionId(sectionId)
      }

      res.json({ success: true, data: section, paragraphs })
    } catch (error) {
      console.error('Error getting handbook section:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })
}

module.exports = registerHandbookRoutes
