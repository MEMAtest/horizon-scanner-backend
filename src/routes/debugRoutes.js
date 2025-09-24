// src/routes/debugRoutes.js
const express = require('express')
const router = express.Router()
const {
  renderTestPage,
  renderDbDebugPage,
  renderGroqTestPage,
  renderCleanupPage,
  renderComprehensiveFixPage,
  renderTestFcaArticlePage,
  renderRssDebugPage,
  renderRefreshDebugPage
} = require('../pages/DebugPages') // Functions to generate the debug HTML

router.get('/health', (req, res) => res.json({ status: 'healthy' }))

router.get('/test', async (req, res, next) => {
  try {
    const html = await renderTestPage()
    res.send(html)
  } catch (error) {
    next(error)
  }
})

router.get('/database', async (req, res, next) => {
  try {
    const html = await renderDbDebugPage()
    res.send(html)
  } catch (error) {
    next(error)
  }
})

router.get('/groq-test', async (req, res, next) => {
  try {
    const html = await renderGroqTestPage()
    res.send(html)
  } catch (error) {
    next(error)
  }
})

router.get('/cleanup-and-reprocess', async (req, res, next) => {
  try {
    const html = await renderCleanupPage()
    res.send(html)
  } catch (error) {
    next(error)
  }
})

router.get('/comprehensive-fix', async (req, res, next) => {
  try {
    const html = await renderComprehensiveFixPage()
    res.send(html)
  } catch (error) {
    next(error)
  }
})

// --- Newly Added Debug Routes ---

router.get('/test-fca-article', async (req, res, next) => {
  try {
    // This is now a JSON endpoint as it doesn't have a complex UI
    const aiAnalyzer = require('../services/aiAnalyzer')
    const testArticle = {
      title: 'FCA Test Article Processing',
      link: 'https://www.fca.org.uk/news/press-releases/upper-tribunal-upholds-jes-staley-ban',
      pubDate: new Date().toISOString()
    }
    const content = await aiAnalyzer.scrapeArticleContent(testArticle.link)
    if (!content) {
      return res.status(500).json({ status: 'ERROR', message: 'Failed to scrape article content' })
    }
    const aiResult = await aiAnalyzer.analyzeContentWithAI(content, testArticle.link)
    res.json({ status: 'SUCCESS', result: aiResult })
  } catch (error) {
    next(error)
  }
})

router.get('/rss', async (req, res, next) => {
  try {
    // This is now a JSON endpoint
    const Parser = require('rss-parser')
    const parser = new Parser()
    const feed = await parser.parseURL('https://www.fca.org.uk/news/rss.xml')
    res.json({ status: 'SUCCESS', itemCount: feed.items.length, items: feed.items.slice(0, 5) })
  } catch (error) {
    next(error)
  }
})

router.get('/refresh', async (req, res, next) => {
  try {
    // This is now a JSON endpoint
    const rssFetcher = require('../services/rssFetcher')
    const fileDb = require('../services/fileDbService')
    await fileDb.initialize()
    const initialCount = (await fileDb.get('updates').value()).length
    await rssFetcher.fetchAndProcessAll()
    const finalCount = (await fileDb.get('updates').value()).length
    res.json({
      status: 'SUCCESS',
      initialCount,
      finalCount,
      newArticles: finalCount - initialCount
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
