const chromium = require('@sparticuz/chromium')
const puppeteerCore = require('puppeteer-core')

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--disable-blink-features=AutomationControlled',
  '--disable-features=site-per-process',
  '--window-size=1920,1080'
]

/**
 * Launch a Puppeteer browser instance.
 * On Vercel: uses @sparticuz/chromium (serverless-compatible).
 * Locally: uses puppeteer-extra with StealthPlugin for Cloudflare bypass.
 *
 * @param {Object} opts
 * @param {boolean} opts.stealth - Use stealth plugin locally (default: true)
 * @param {string[]} opts.extraArgs - Additional browser args
 * @returns {Promise<import('puppeteer-core').Browser>}
 */
async function launchBrowser(opts = {}) {
  const { stealth = true, extraArgs = [] } = opts
  const isVercel = process.env.VERCEL === '1'

  const args = [...BROWSER_ARGS, ...chromium.args, ...extraArgs]

  if (isVercel) {
    console.log('[browser] Launching serverless Chromium on Vercel...')
    const executablePath = await chromium.executablePath()
    const browser = await puppeteerCore.launch({
      args,
      executablePath,
      headless: chromium.headless,
      defaultViewport: { width: 1920, height: 1080 }
    })
    console.log('[browser] Serverless Chromium launched')
    return browser
  }

  // Local development — use puppeteer-extra with stealth
  console.log('[browser] Launching local Chromium...')
  if (stealth) {
    try {
      const puppeteerExtra = require('puppeteer-extra')
      const StealthPlugin = require('puppeteer-extra-plugin-stealth')
      puppeteerExtra.use(StealthPlugin())

      const browser = await puppeteerExtra.launch({
        headless: 'new',
        args,
        defaultViewport: { width: 1920, height: 1080 }
      })
      console.log('[browser] Local Chromium launched with stealth')
      return browser
    } catch (err) {
      console.warn('[browser] puppeteer-extra not available, falling back to puppeteer-core')
    }
  }

  // Fallback: puppeteer-core with system Chrome
  const browser = await puppeteerCore.launch({
    headless: 'new',
    args,
    executablePath: findLocalChrome(),
    defaultViewport: { width: 1920, height: 1080 }
  })
  console.log('[browser] Local Chromium launched (puppeteer-core)')
  return browser
}

/**
 * Find a local Chrome/Chromium executable for puppeteer-core
 */
function findLocalChrome() {
  const fs = require('fs')
  const paths = [
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ]
  for (const p of paths) {
    if (fs.existsSync(p)) return p
  }
  // Return a default and let puppeteer-core error if not found
  return '/usr/bin/google-chrome'
}

/**
 * Method injection pattern for ServiceClass (legacy compatibility)
 */
function applyBrowserMethods(ServiceClass, _puppeteer) {
  ServiceClass.prototype.initBrowser = async function initBrowser() {
    if (this.browser) {
      if (typeof this.browser.isConnected === 'function' && this.browser.isConnected()) {
        return this.browser
      }

      try {
        await this.browser.close()
      } catch (error) {
        // ignore close errors for stale browsers
      }
      this.browser = null
    }

    console.log('🚀 Launching Puppeteer browser...')
    this.browser = await launchBrowser({ stealth: true })

    this.browser.on('disconnected', () => {
      this.browser = null
      console.warn('⚠️ Puppeteer browser disconnected')
    })

    console.log('✅ Puppeteer browser launched successfully')
    return this.browser
  }

  ServiceClass.prototype.closeBrowser = async function closeBrowser() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      console.log('🔒 Puppeteer browser closed')
    }
  }
}

module.exports = applyBrowserMethods
module.exports.launchBrowser = launchBrowser
