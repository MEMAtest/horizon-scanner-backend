(function bootstrapWeeklyBriefing() {
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

  const startApp = (AppFactory) => {
    if (!AppFactory) {
      console.error('[WeeklyBriefing] App module failed to load.')
      return
    }
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        const App = await AppFactory()
        const instance = new App()
        window.weeklyBriefingApp = instance
      } catch (error) {
        console.error('[WeeklyBriefing] Failed to initialise app:', error)
      }
    })
  }

  const loadEsm = () => import(withVersion('/js/weekly-briefing/app-core.js'))

  loadEsm()
    .then(module => {
      if (typeof module?.loadWeeklyBriefingApp === 'function') {
        startApp(module.loadWeeklyBriefingApp)
      } else if (module?.WeeklyBriefingApp) {
        startApp(async () => module.WeeklyBriefingApp)
      } else if (module?.default) {
        startApp(async () => module.default)
      } else {
        throw new Error('No usable export found')
      }
    })
    .catch(error => {
      console.error('[WeeklyBriefing] Unable to load module:', error)
    })
})()
