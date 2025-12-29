const { getCalendarLayoutStyles } = require('./layout')
const { getCalendarGridStyles } = require('./grid')
const { getCalendarCardStyles, getCalendarStatusStyles } = require('./cards')
const { getCalendarModalStyles } = require('./modals')
const { getCalendarResponsiveStyles } = require('./responsive')
const { getCalendarWidgetStyles } = require('./widget')

function getCalendarStyles() {
  return `
${getCalendarLayoutStyles()}${getCalendarGridStyles()}${getCalendarCardStyles()}${getCalendarModalStyles()}${getCalendarStatusStyles()}${getCalendarResponsiveStyles()}`
}

module.exports = {
  getCalendarStyles,
  getCalendarWidgetStyles
}
