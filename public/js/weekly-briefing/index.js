(function bootstrapWeeklyBriefing() {
  const queues = window.__weeklyBriefingQueues = window.__weeklyBriefingQueues || {}

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

  import('/js/weekly-briefing/app-core.js')
    .then(module => {
      if (typeof module?.loadWeeklyBriefingApp === 'function') {
        startApp(module.loadWeeklyBriefingApp)
      } else if (module?.WeeklyBriefingApp) {
        // Legacy fallback
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
