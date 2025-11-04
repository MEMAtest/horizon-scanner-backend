const path = require('path')
const fs = require('fs/promises')
const os = require('os')
const puppeteer = require('puppeteer')
let PDFDocument
try {
  PDFDocument = require('pdfkit')
} catch (error) {
  console.warn('⚠️ pdfkit not installed, falling back to HTML export when Puppeteer is unavailable.')
  PDFDocument = null
}

const intelligenceDashboardService = require('../../../services/intelligenceDashboardService')
const { buildAiIntelligenceExportPage } = require('../../../views/aiIntelligence/exportBuilder')

let cachedLogoDataUri = null

async function getLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri
  try {
    const logoPath = path.join(__dirname, '../../../../public/images/regcanary-logo.png')
    const buffer = await fs.readFile(logoPath)
    const base64 = buffer.toString('base64')
    cachedLogoDataUri = `data:image/png;base64,${base64}`
    return cachedLogoDataUri
  } catch (error) {
    console.warn('⚠️ Unable to inline RegCanary logo for PDF export:', error.message)
    return '/images/regcanary-logo.png'
  }
}

async function renderAiIntelligenceExportPdf(req, res) {
  let browser
  let tempProfileDir
  let snapshot
  let page
  try {
    snapshot = await intelligenceDashboardService.getDailySnapshot()
    const logoSource = await getLogoDataUri()
    const html = buildAiIntelligenceExportPage(snapshot, { logoSource })

    tempProfileDir = await fs.mkdtemp(path.join(os.tmpdir(), 'regcanary-pdf-'))

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-crash-reporter'
      ],
      userDataDir: tempProfileDir
    })
    page = await browser.newPage()
    await page.setContent(html, { waitUntil: ['load', 'domcontentloaded'] })
    await page.emulateMediaType('screen')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        bottom: '12mm',
        left: '12mm',
        right: '12mm'
      }
    })

    const filenameDate = snapshot.snapshotDate ? snapshot.snapshotDate.slice(0, 10) : 'report'
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `inline; filename="regcanary-intelligence-${filenameDate}.pdf"`
    )
    return res.send(pdf)
  } catch (error) {
    console.error('X Error rendering AI intelligence PDF export:', error)
    try {
      const fallbackSnapshot = snapshot || await intelligenceDashboardService.getDailySnapshot()
      if (PDFDocument) {
        const pdfBuffer = await buildFallbackPdf(fallbackSnapshot)
        const filenameDate = fallbackSnapshot.snapshotDate ? fallbackSnapshot.snapshotDate.slice(0, 10) : 'report'
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader(
          'Content-Disposition',
          `inline; filename="regcanary-intelligence-${filenameDate}-fallback.pdf"`
        )
        return res.send(pdfBuffer)
      }
      const fallbackHtml = buildAiIntelligenceExportPage(fallbackSnapshot, {
        logoSource: '/images/regcanary-logo.png',
        autoPrint: true,
        bannerMessage: 'Automatic PDF generation is not available in this environment. Use the browser print dialog to save this page as a PDF.'
      })
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.send(fallbackHtml)
    } catch (fallbackError) {
      console.error('X Fallback export rendering also failed:', fallbackError)
      res.status(500).json({
        success: false,
        error: 'Unable to generate intelligence export. Please try again shortly.'
      })
    }
  } finally {
    if (page) {
      try {
        await page.close()
      } catch (error) {
        // ignore
      }
    }
    if (browser) {
      try {
        await browser.close()
      } catch (error) {
        console.warn('⚠️ Error closing Puppeteer browser:', error.message)
      }
    }
    if (typeof tempProfileDir === 'string') {
      try {
        await fs.rm(tempProfileDir, { recursive: true, force: true })
      } catch (error) {
        console.warn('⚠️ Unable to remove temporary Puppeteer profile:', error.message)
      }
    }
  }
}

async function buildFallbackPdf(snapshot) {
  if (!PDFDocument) {
    throw new Error('pdfkit not available')
  }
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks = []

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const dateLabel = snapshot && snapshot.snapshotDate
        ? new Date(snapshot.snapshotDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

      doc.fontSize(20).fillColor('#0f172a').text('RegCanary AI Intelligence Brief', { align: 'left' })
      doc.moveDown(0.3)
      doc.fontSize(11).fillColor('#475569').text(dateLabel)
      doc.moveDown()

      if (snapshot && snapshot.heroInsight) {
        doc.fontSize(14).fillColor('#0f172a').text('Hero Insight', { bold: true })
        doc.moveDown(0.2)
        doc.fontSize(12).fillColor('#0f172a').text(snapshot.heroInsight.headline || 'Key development')
        doc.moveDown(0.3)
        doc.fontSize(10).fillColor('#334155').text(snapshot.heroInsight.summary || 'Summary unavailable.', { lineGap: 4 })
        doc.moveDown(0.3)
        doc.fontSize(10).fillColor('#0f172a').text('Recommended action: ' + (snapshot.heroInsight.recommendation || 'Monitor developments.'))
        doc.moveDown()
      }

      doc.fontSize(14).fillColor('#0f172a').text('Risk Pulse', { bold: true })
      doc.moveDown(0.2)
      const pulse = snapshot?.riskPulse || {}
      doc.fontSize(11).fillColor('#0f172a').text(`Score: ${pulse.score || 0} (${pulse.label || 'Stable'})`)
      doc.fontSize(10).fillColor('#475569').text(`Delta vs baseline: ${pulse.delta || 0}`)
      if (Array.isArray(pulse.components) && pulse.components.length) {
        doc.moveDown(0.2)
        doc.fontSize(10).fillColor('#64748b').text('Score breakdown:')
        pulse.components.forEach(component => {
          doc.text(` • ${component.label}: ${Number(component.score || 0).toFixed(1)} (weight ${(component.weight * 100).toFixed(0)}%)`)
        })
      }
      doc.moveDown()

      doc.fontSize(14).fillColor('#0f172a').text('Priority feed', { bold: true })
      doc.moveDown(0.4)
      const priorityFeed = []
      ;(snapshot.streams?.high || []).forEach(update => priorityFeed.push(update))
      ;(snapshot.streams?.medium || []).forEach(update => priorityFeed.push(update))
      ;(snapshot.streams?.low || []).forEach(update => priorityFeed.push(update))

      priorityFeed.slice(0, 8).forEach((update, index) => {
        doc.fontSize(11).fillColor('#0f172a').text(`${index + 1}. ${update.authority || 'Authority'} — ${update.headline || 'Untitled update'}`, { lineGap: 2 })
        if (update.summary) {
          doc.fontSize(10).fillColor('#475569').text(update.summary, { lineGap: 4 })
        }
        doc.moveDown(0.3)
      })

      doc.addPage()
      doc.fontSize(14).fillColor('#0f172a').text('Persona briefings', { bold: true })
      doc.moveDown(0.4)
      const personas = snapshot.personaBriefings || {}
      Object.entries(personas).forEach(([persona, briefing]) => {
        doc.fontSize(12).fillColor('#0f172a').text(persona.charAt(0).toUpperCase() + persona.slice(1), { lineGap: 4 })
        doc.fontSize(10).fillColor('#475569').text(briefing.summary || 'No priority actions detected.', { lineGap: 4 })
        if (Array.isArray(briefing.nextSteps) && briefing.nextSteps.length) {
          briefing.nextSteps.forEach(step => {
            doc.text(` • ${step}`, { lineGap: 4 })
          })
        }
        doc.moveDown(0.6)
      })

      doc.fontSize(8).fillColor('#94a3b8').text('Generated by RegCanary Intelligence', { align: 'right' })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = renderAiIntelligenceExportPdf
