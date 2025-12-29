const { ensurePinnedItemTopicArea } = require('./validators')

function mapPinnedItems(service, items) {
  const list = Array.isArray(items) ? items : []
  return list
    .map(item => service.normalizePinnedItemRecord(item))
    .filter(Boolean)
    .map(ensurePinnedItemTopicArea)
}

module.exports = {
  mapPinnedItems
}
