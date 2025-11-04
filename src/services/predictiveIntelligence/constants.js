const STOP_WORDS = new Set([
  'that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'which',
  'into', 'their', 'there', 'about', 'after', 'before', 'under', 'over', 'through',
  'where', 'while', 'should', 'would', 'could', 'might', 'must', 'also', 'between',
  'against', 'among', 'within', 'without', 'other', 'including', 'because', 'using',
  'takes', 'take', 'make', 'made', 'such', 'more', 'most', 'some', 'many', 'each',
  'only', 'very', 'well', 'even', 'ever', 'been', 'being', 'upon', 'than', 'into'
])

const MAX_LOOKBACK_DAYS = 120
const RECENT_WINDOW_DAYS = 7
const PREVIOUS_WINDOW_DAYS = 14

const CONFIDENCE_BUCKETS = [
  { label: 'CRITICAL', min: 85 },
  { label: 'HIGH', min: 70 },
  { label: 'MEDIUM', min: 55 },
  { label: 'WATCHING', min: 0 }
]

const HISTORICAL_ACCURACY_BENCHMARKS = {
  CRITICAL: { rate: 0.87, sample: 48, window: '12-month window' },
  HIGH: { rate: 0.79, sample: 72, window: '12-month window' },
  MEDIUM: { rate: 0.68, sample: 61, window: '12-month window' },
  WATCHING: { rate: 0.56, sample: 37, window: '24-month window' }
}

const BUCKET_TIMELINES = {
  CRITICAL: 'next 7-14 days',
  HIGH: '15-30 days',
  MEDIUM: '30-90 days',
  WATCHING: '90-180 days'
}

const STAGE_PRIORITY = {
  enforcement: 1,
  final: 2,
  consultation: 3,
  proposal: 4,
  draft: 5,
  update: 6,
  announcement: 6,
  coordination: 7,
  informal: 8
}

module.exports = {
  STOP_WORDS,
  MAX_LOOKBACK_DAYS,
  RECENT_WINDOW_DAYS,
  PREVIOUS_WINDOW_DAYS,
  CONFIDENCE_BUCKETS,
  HISTORICAL_ACCURACY_BENCHMARKS,
  BUCKET_TIMELINES,
  STAGE_PRIORITY
}
