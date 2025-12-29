const { getDropdownStyles } = require('../../../constants/dropdownOptions')
const { getKanbanLayoutStyles } = require('./layout')
const { getKanbanModalStyles } = require('./modals')
const { getKanbanInteractionStyles } = require('./interactions')

function getKanbanStyles() {
  return `
    <style>
      ${getDropdownStyles()}${getKanbanLayoutStyles()}${getKanbanModalStyles()}${getKanbanInteractionStyles()}
    </style>
  `
}

module.exports = { getKanbanStyles }
