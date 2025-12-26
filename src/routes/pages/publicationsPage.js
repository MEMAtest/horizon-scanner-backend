const { getCommonStyles } = require('../templates/commonStyles')
const { getSidebar } = require('../templates/sidebar')
const { getCommonClientScripts } = require('../templates/clientScripts')
const { renderPublicationsPage } = require('../../views/publications/layout')

async function publicationsPage(req, res) {
  try {
    console.log('[publications] page requested')

    const sidebar = await getSidebar('publications')
    const html = renderPublicationsPage({
      sidebar,
      commonStyles: getCommonStyles(),
      commonClientScripts: getCommonClientScripts()
    })

    res.send(html)
  } catch (error) {
    console.error('[error] Error rendering publications page:', error)
    res.status(500).send(`
      <html>
        <head>
          <title>Error - FCA Publications</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f8fafc;
            }
            .error-container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              max-width: 500px;
            }
            h1 { color: #dc2626; }
            a {
              color: #4f46e5;
              text-decoration: none;
              padding: 10px 20px;
              border: 1px solid #4f46e5;
              border-radius: 6px;
              display: inline-block;
              margin-top: 20px;
            }
            a:hover {
              background: #4f46e5;
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>&#10060; Error Loading Publications</h1>
            <p>${error.message}</p>
            <a href="/">&larr; Back to Home</a>
          </div>
        </body>
      </html>
    `)
  }
}

module.exports = publicationsPage
