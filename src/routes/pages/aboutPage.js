const { getSidebar } = require('../templates/sidebar')
const { getCommonStyles } = require('../templates/commonStyles')

async function renderAboutPage(req, res) {
  try {
    const sidebar = await getSidebar('about')
    const commonStyles = getCommonStyles()

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>About - AI Regulatory Intelligence Platform</title>
        ${commonStyles}
        <style>
          .about-section {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          }

          .version-info {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 30px;
            border-radius: 12px;
            border: 1px solid #0ea5e9;
            margin-bottom: 30px;
          }

          .tech-stack {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }

          .tech-item {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="app-container">
          ${sidebar}

          <main class="main-content">
            <div class="version-info">
              <h1>AI AI Regulatory Intelligence Platform</h1>
              <p style="font-size: 1.2rem; color: #0c4a6e; margin-bottom: 20px;">
                <strong>Version 2.0 - Phase 1.3 Complete</strong>
              </p>
              <p>
                Advanced AI-powered regulatory intelligence with personalized relevance scoring,
                workspace management, and intelligent compliance support.
              </p>
            </div>

            <div class="about-section">
              <h2>Target Mission</h2>
              <p>
                To transform regulatory compliance from reactive monitoring to proactive intelligence,
                helping financial services firms stay ahead of regulatory changes with AI-powered insights,
                personalized relevance scoring, and automated business impact analysis.
              </p>
            </div>

            <div class="about-section">
              <h2>Spark Key Features</h2>
              <ul style="line-height: 2;">
                <li><strong>Target Firm Profile System:</strong> Personalized relevance scoring based on your sectors</li>
                <li><strong>Pin Workspace Management:</strong> Pin important updates, save searches, create alerts</li>
                <li><strong>AI AI-Powered Analysis:</strong> Automated impact scoring and sector relevance analysis</li>
                <li><strong>Analytics Real-time Dashboard:</strong> Live regulatory updates with intelligent filtering</li>
                <li><strong>Note Weekly AI Roundups:</strong> Comprehensive weekly intelligence briefings</li>
                <li><strong>Authority Authority Spotlight:</strong> Deep analysis of regulatory authority patterns</li>
                <li><strong>Growth Trend Analysis:</strong> Emerging regulatory themes and compliance priorities</li>
                <li><strong>Power Smart Filtering:</strong> Advanced search and categorization capabilities</li>
              </ul>
            </div>

            <div class="about-section">
              <h2>Tools Technology Stack</h2>
              <div class="tech-stack">
                <div class="tech-item">
                  <h4>Launch Backend</h4>
                  <p>Node.js, Express.js</p>
                </div>
                <div class="tech-item">
                  <h4>AI AI Engine</h4>
                  <p>Groq API, Llama-3.3-70B</p>
                </div>
                <div class="tech-item">
                  <h4>Save Database</h4>
                  <p>PostgreSQL + JSON Fallback</p>
                </div>
                <div class="tech-item">
                  <h4>Signal Data Sources</h4>
                  <p>RSS Feeds, Web Scraping</p>
                </div>
                <div class="tech-item">
                  <h4>Design Frontend</h4>
                  <p>Vanilla JS, Modern CSS</p>
                </div>
                <div class="tech-item">
                  <h4>Cloud Infrastructure</h4>
                  <p>Docker, Cloud Ready</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </body>
      </html>
    `

    res.send(html)
  } catch (error) {
    console.error('X Error rendering about page:', error)
    res.status(500).send('Error loading about page')
  }
}

module.exports = renderAboutPage
