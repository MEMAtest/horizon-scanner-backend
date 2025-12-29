const { laneDefinitions } = require('./constants')
const { fallbackLaneByBucket } = require('./utils')

function buildAnalyticsViewModel(predictiveData) {
  const predictions = predictiveData?.predictions || { imminent: [], nearTerm: [], strategic: [] }
  const flattenPredictions = [
    ...(predictions.imminent || []),
    ...(predictions.nearTerm || []),
    ...(predictions.strategic || [])
  ].map(prediction => ({
    ...prediction,
    priority_lane: prediction.priority_lane || fallbackLaneByBucket(prediction.lane_bucket)
  }))

  const lanes = {
    act_now: [],
    prepare_next: [],
    plan_horizon: []
  }

  flattenPredictions.forEach(prediction => {
    const laneKey = laneDefinitions[prediction.priority_lane] ? prediction.priority_lane : fallbackLaneByBucket(prediction.lane_bucket)
    lanes[laneKey].push(prediction)
  })

  Object.keys(lanes).forEach(laneKey => {
    lanes[laneKey] = lanes[laneKey]
      .sort((a, b) => (b.priority_score || b.confidence || 0) - (a.priority_score || a.confidence || 0))
  })

  const uniqueAuthorities = new Set()
  const uniqueSectors = new Set()
  const uniqueBuckets = new Set()

  flattenPredictions.forEach(prediction => {
    (prediction.context?.authorities || prediction.authorities || []).forEach(authority => {
      if (authority) uniqueAuthorities.add(authority)
    })
    ;(prediction.affected_sectors || prediction.context?.sectors || []).forEach(sector => {
      if (sector) uniqueSectors.add(sector)
    })
    if (prediction.confidence_bucket) uniqueBuckets.add(prediction.confidence_bucket)
  })

  const confidenceValues = flattenPredictions.filter(pred => typeof pred.confidence === 'number').map(pred => pred.confidence)
  const averageConfidence = confidenceValues.length
    ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length)
    : null

  const highRiskSectors = (predictiveData?.momentum?.sectors || []).filter(item => ['high', 'critical'].includes((item.severity || '').toLowerCase()))

  const summaryTiles = [
    { label: 'Total insights', value: flattenPredictions.length.toString() },
    { label: 'Act now (<=14d)', value: lanes.act_now.length.toString() },
    { label: 'Prepare next (15-45d)', value: lanes.prepare_next.length.toString() },
    { label: 'High-risk sectors', value: highRiskSectors.length.toString(), helper: 'Monitoring for regulatory heat' }
  ]

  if (averageConfidence !== null) {
    summaryTiles.splice(1, 0, { label: 'Average confidence', value: `${averageConfidence}%`, helper: 'Weighted across live predictions' })
  }

  const filters = {
    authorities: Array.from(uniqueAuthorities).sort(),
    sectors: Array.from(uniqueSectors).sort(),
    confidence: Array.from(uniqueBuckets).sort()
  }

  const momentum = predictiveData?.momentum || { authorities: [], topics: [], sectors: [] }
  const hotspots = (momentum.sectors || []).slice(0, 5)
  const alerts = (predictiveData?.alerts || []).slice(0, 6)

  const clientPayload = {
    generatedAt: predictiveData?.generatedAt,
    summary: summaryTiles,
    lanes,
    filters,
    momentum,
    alerts
  }

  return {
    lanes,
    summaryTiles,
    filters,
    momentum,
    hotspots,
    alerts,
    clientPayload
  }
}

module.exports = { buildAnalyticsViewModel }
