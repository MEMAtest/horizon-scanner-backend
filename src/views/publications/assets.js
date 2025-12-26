const { getCanaryAnimationStyles } = require('../icons/canaryAnimations')

function getPublicationsStyles() {
  return `
    <link rel="stylesheet" href="/css/publications/layout.css">
    <link rel="stylesheet" href="/css/publications/index.css">
    <style>
      ${getCanaryAnimationStyles()}
    </style>
  `
}

function getPublicationsHeadScripts() {
  return `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  `
}

function getPublicationsRuntimeScripts() {
  return `
    <script src="/js/publications/fca-handbook-rules.js"></script>
    <script type="module" src="/js/publications/index.js"></script>
  `
}

module.exports = {
  getPublicationsStyles,
  getPublicationsHeadScripts,
  getPublicationsRuntimeScripts
}
