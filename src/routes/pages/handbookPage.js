const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const { buildHandbookPage } = require('../../views/handbook/pageBuilder')

async function renderHandbookPage(req, res) {
  try {
    console.log('[Handbook] Rendering handbook page...')

    const [sidebar, clientScripts, commonStyles] = await Promise.all([
      getSidebar('handbook'),
      getClientScripts(),
      getCommonStyles()
    ])

    const html = buildHandbookPage({
      sidebar,
      clientScripts,
      commonStyles
    })

    res.send(html)
  } catch (error) {
    console.error('[Handbook] Error rendering page:', error)
    res.status(500).send(renderError(error))
  }
}

function renderError(error) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Error - Handbook</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Error Loading Page</h1>
        <p>Unable to load the handbook explorer. Please try refreshing.</p>
        <p><a href="/handbook">Try Again</a></p>
        <small>Error: ${error.message}</small>
      </body>
    </html>
  `
}

module.exports = { renderHandbookPage }
