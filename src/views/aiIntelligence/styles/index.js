const { getTokensStyles } = require('./tokens')
const { getLayoutStyles } = require('./layout')
const { getHeroStyles } = require('./hero')
const { getCardsStyles } = require('./cards')
const { getTablesStyles } = require('./tables')
const { getUtilitiesStyles } = require('./utilities')

function getAiIntelligenceStyles() {
  return `
    <style>
${getTokensStyles()}${getLayoutStyles()}${getHeroStyles()}${getCardsStyles()}${getTablesStyles()}${getUtilitiesStyles()}
    </style>
  `
}

module.exports = { getAiIntelligenceStyles }
