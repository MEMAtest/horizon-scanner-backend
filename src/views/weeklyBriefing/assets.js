const styles = [
  '/css/weekly-briefing/layout.css',
  '/css/weekly-briefing/components.css',
  '/css/weekly-briefing/modals.css',
  '/css/weekly-briefing/widgets.css'
]

function getWeeklyBriefingStyles() {
  return styles.map(href => `<link rel="stylesheet" href="${href}">`).join('\n')
}

function getWeeklyBriefingRuntimeScripts() {
  return [
    '<script type="module" src="/js/weekly-briefing/index.js"></script>'
  ].join('\n')
}

module.exports = {
  getWeeklyBriefingStyles,
  getWeeklyBriefingRuntimeScripts
}
