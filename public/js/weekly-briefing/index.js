(function bootstrapWeeklyBriefing() {
  const startApp = (App) => {
    if (!App) {
      console.error('[WeeklyBriefing] App module failed to load.')
      return
    }
    document.addEventListener('DOMContentLoaded', () => {
      try {
        const app = new App()
        window.weeklyBriefingApp = app
      } catch (error) {
        console.error('[WeeklyBriefing] Failed to initialise app:', error)
      }
    })
  }

  if (typeof require === 'function') {
    try {
      const moduleExports = require('./app-core.js')
      const App = moduleExports?.WeeklyBriefingApp || moduleExports?.default
      startApp(App)
      return
    } catch (error) {
      console.warn('[WeeklyBriefing] CommonJS bootstrap failed, falling back to dynamic import.', error)
    }
  }

  import('/js/weekly-briefing/app-core.js')
    .then(module => {
      const App = module?.WeeklyBriefingApp || module?.default
      startApp(App)
    })
    .catch(error => {
      console.error('[WeeklyBriefing] Unable to load module:', error)
    })
})()
