const styles = [
  '/css/enforcement/layout.css',
  '/css/enforcement/index.css',
  '/css/enforcement/modals.css'
]

const headScripts = [
  '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
  '<script src="https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@2.0.1/dist/chartjs-chart-matrix.min.js"></script>'
]

function getEnforcementStyles() {
  return styles
    .map((href) => `<link rel="stylesheet" href="${href}">`)
    .join('\n')
}

function getEnforcementHeadScripts() {
  return headScripts.join('\n')
}

function getEnforcementRuntimeScripts() {
  return [
    '<script type="module" src="/js/enforcement/index.js"></script>'
  ].join('\n')
}

module.exports = {
  getEnforcementStyles,
  getEnforcementHeadScripts,
  getEnforcementRuntimeScripts
}
