const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const PRIMARY_MODEL = 'llama-3.1-8b-instant'

const FALLBACK_MODELS = [
  'gemma2-9b-it',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'deepseek-r1-distill-llama-70b'
]

const INDUSTRY_SECTORS = [
  'Banking', 'Investment Management', 'Insurance', 'Payment Services',
  'Fintech', 'Credit Unions', 'Pension Funds', 'Real Estate Finance',
  'Consumer Credit', 'Capital Markets', 'Private Equity', 'Hedge Funds',
  'Cryptocurrency', 'RegTech', 'Wealth Management', 'Corporate Finance'
]

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 5000
const DEFAULT_REQUEST_TIMEOUT_MS = 30000
const DEFAULT_MIN_REQUEST_INTERVAL_MS = 2000
const DEFAULT_CACHE_EXPIRY_MS = 6 * 60 * 60 * 1000

module.exports = {
  GROQ_API_URL,
  PRIMARY_MODEL,
  FALLBACK_MODELS,
  INDUSTRY_SECTORS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_REQUEST_TIMEOUT_MS,
  DEFAULT_MIN_REQUEST_INTERVAL_MS,
  DEFAULT_CACHE_EXPIRY_MS
}
