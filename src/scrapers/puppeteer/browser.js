function applyBrowserMethods(ServiceClass, puppeteer) {
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

    console.log('🚀 Launching Puppeteer browser with stealth mode...')
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=site-per-process',
        '--window-size=1920x1080'
      ]
    })

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
