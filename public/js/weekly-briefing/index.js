(function bootstrapWeeklyBriefing() {
  console.log('[WeeklyBriefing] 🚀 Starting bootstrap...')

  const queues = window.__weeklyBriefingQueues = window.__weeklyBriefingQueues || {}
  const versionSuffix = window.__WB_VERSION__ || ''
  const withVersion = (path) => `${path}${versionSuffix}`

  const ensureGlobal = (name) => {
    if (typeof window[name] === 'function') return
    const queue = queues[name] = queues[name] || []
    window[name] = (...args) => {
      if (!queue.__warned) {
        console.warn(`[WeeklyBriefing] ${name} called before initialisation.`)
        queue.__warned = true
      }
      queue.push(args)
    }
  }

  ensureGlobal('assembleBriefing')
  ensureGlobal('refreshData')
  console.log('[WeeklyBriefing] ✓ Global functions queued')

  const startApp = (AppFactory) => {
    if (!AppFactory) {
      console.error('[WeeklyBriefing] ❌ App module failed to load.')
      showErrorBanner('Weekly Briefing failed to load. Please refresh the page.')
      return
    }

    const init = async () => {
      console.log('[WeeklyBriefing] 🔧 DOM ready, initializing app...')
      try {
        // Check for required DOM elements
        const assembleBtn = document.getElementById('assembleBtn')
        if (!assembleBtn) {
          console.warn('[WeeklyBriefing] ⚠️ Required element #assembleBtn not found in DOM')
        }

        console.log('[WeeklyBriefing] 📦 Loading app factory...')
        const App = await AppFactory()
        console.log('[WeeklyBriefing] ✓ App factory loaded:', App)

        console.log('[WeeklyBriefing] 🏗️ Creating app instance...')
        const instance = new App()
        window.weeklyBriefingApp = instance
        console.log('[WeeklyBriefing] ✅ App initialized successfully:', instance)
      } catch (error) {
        console.error('[WeeklyBriefing] ❌ Failed to initialise app:', error)
        console.error('[WeeklyBriefing] Error stack:', error.stack)
        showErrorBanner('Weekly Briefing initialization failed. Please refresh the page.')
      }
    }

    if (document.readyState === 'loading') {
      console.log('[WeeklyBriefing] ⏳ Waiting for DOMContentLoaded...')
      document.addEventListener('DOMContentLoaded', init)
    } else {
      console.log('[WeeklyBriefing] ⚡ DOM already ready, initializing immediately')
      init()
    }
  }

  const showErrorBanner = (message) => {
    const banner = document.createElement('div')
    banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #dc2626; color: white; padding: 16px; text-align: center; z-index: 9999; font-weight: 600;'
    banner.textContent = message
    document.body.insertBefore(banner, document.body.firstChild)
  }

  const loadEsm = () => {
    console.log('[WeeklyBriefing] 📥 Loading ES module:', withVersion('/js/weekly-briefing/app-core.js'))
    return import(withVersion('/js/weekly-briefing/app-core.js'))
  }

  loadEsm()
    .then(module => {
      console.log('[WeeklyBriefing] ✓ Module loaded successfully:', module)
      console.log('[WeeklyBriefing] Module exports:', Object.keys(module))

      if (typeof module?.loadWeeklyBriefingApp === 'function') {
        console.log('[WeeklyBriefing] ✓ Using loadWeeklyBriefingApp export')
        startApp(module.loadWeeklyBriefingApp)
      } else if (module?.WeeklyBriefingApp) {
        console.log('[WeeklyBriefing] ✓ Using WeeklyBriefingApp export')
        startApp(async () => module.WeeklyBriefingApp)
      } else if (module?.default) {
        console.log('[WeeklyBriefing] ✓ Using default export')
        startApp(async () => module.default)
      } else {
        throw new Error('No usable export found in module. Available exports: ' + Object.keys(module).join(', '))
      }
    })
    .catch(error => {
      console.error('[WeeklyBriefing] ❌ Unable to load module:', error)
      console.error('[WeeklyBriefing] Error details:', error.message)
      console.error('[WeeklyBriefing] Error stack:', error.stack)
      showErrorBanner('Failed to load Weekly Briefing module. Please refresh the page.')
    })
})()
