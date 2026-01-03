const { renderMarketingPage } = require('./components/index.js')

async function marketingPage(req, res) {
  try {
    const html = renderMarketingPage()
    res.send(html)
  } catch (error) {
    console.error('X Error rendering marketing page:', error)
    res.status(500).send('Error loading marketing page')
  }
}

module.exports = marketingPage
