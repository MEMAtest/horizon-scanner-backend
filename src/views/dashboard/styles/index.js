const { getDashboardLayoutStyles } = require('./layout')
const { getDashboardModalStyles } = require('./modals')

function getDashboardStyles() {
  return `
    <style>${getDashboardLayoutStyles()}${getDashboardModalStyles()}
    </style>
  `
}

module.exports = { getDashboardStyles }
