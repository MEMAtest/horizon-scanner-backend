const { serializeForScript } = require('../../dashboard/helpers')
const { AUTHORITIES, SECTORS } = require('../../../constants/dropdownOptions')
const { getWatchListStateScript } = require('./state')
const { getWatchListMainCoreScript } = require('./mainCore')
const { getWatchListMatchesScript } = require('./mainMatches')
const { getWatchListLinksScript } = require('./mainLinks')

function getWatchListScripts({ watchLists, stats }) {
  const serializedWatchLists = serializeForScript(watchLists || [])
  const serializedStats = serializeForScript(stats || {})
  const serializedAuthorities = serializeForScript(AUTHORITIES)
  const serializedSectors = serializeForScript(SECTORS)

  return `
    ${getWatchListStateScript({
      serializedWatchLists,
      serializedStats,
      serializedAuthorities,
      serializedSectors
    })}${getWatchListMainCoreScript()}${getWatchListMatchesScript()}${getWatchListLinksScript()}
  `
}

module.exports = { getWatchListScripts }
