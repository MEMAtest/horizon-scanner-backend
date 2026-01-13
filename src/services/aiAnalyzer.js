const {
  PRIMARY_MODEL,
  FALLBACK_MODELS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_REQUEST_TIMEOUT_MS,
  DEFAULT_MIN_REQUEST_INTERVAL_MS,
  DEFAULT_CACHE_EXPIRY_MS
} = require('./aiAnalyzer/constants')

const applyMetadataMethods = require('./aiAnalyzer/metadata')
const applyPromptMethods = require('./aiAnalyzer/prompts')
const applyClientMethods = require('./aiAnalyzer/client')
const applyParserMethods = require('./aiAnalyzer/parser')
const applyEnhancementMethods = require('./aiAnalyzer/enhancements')
const applyFallbackMethods = require('./aiAnalyzer/fallback')
const applyNormalizationMethods = require('./aiAnalyzer/normalization')
const applyWeeklyMethods = require('./aiAnalyzer/weekly')
const applyAnalysisMethods = require('./aiAnalyzer/analysis')
const applyHealthMethods = require('./aiAnalyzer/health')
const applyMaintenanceMethods = require('./aiAnalyzer/maintenance')

class EnhancedAIAnalyzer {
  constructor() {
    // Priority: Anthropic Claude (best quality) > DeepSeek > OpenRouter > Groq
    const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY)
    const hasDeepSeek = Boolean(process.env.DEEPSEEK_API_KEY)
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY)
    const hasGroq = Boolean(process.env.GROQ_API_KEY)

    if (hasAnthropic) {
      this.provider = 'anthropic'
      this.apiKey = process.env.ANTHROPIC_API_KEY
      this.apiUrl = process.env.ANTHROPIC_ENDPOINT || 'https://api.anthropic.com/v1/messages'
      this.currentModel = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
      console.log(`🤖 Enhanced AI Analyzer initialized with Claude model: ${this.currentModel}`)
      console.log('✅ Anthropic API key detected (premium quality, fast)')
    } else if (hasDeepSeek) {
      this.provider = 'deepseek'
      this.apiKey = process.env.DEEPSEEK_API_KEY
      this.apiUrl = process.env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions'
      this.currentModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
      console.log(`🤖 Enhanced AI Analyzer initialized with DeepSeek model: ${this.currentModel}`)
      console.log('✅ DeepSeek API key detected (excellent rate limits)')
    } else if (hasOpenRouter) {
      this.provider = 'openrouter'
      this.apiKey = process.env.OPENROUTER_API_KEY
      this.apiUrl = process.env.OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions'
      this.currentModel = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct'
      console.log(`🤖 Enhanced AI Analyzer initialized with OpenRouter model: ${this.currentModel}`)
      console.log('✅ OpenRouter API key detected (no rate limits)')
    } else if (hasGroq) {
      this.provider = 'groq'
      this.apiKey = process.env.GROQ_API_KEY
      this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions'
      this.currentModel = PRIMARY_MODEL
      console.log(`🤖 Enhanced AI Analyzer initialized with Groq model: ${PRIMARY_MODEL}`)
      console.log('✅ GROQ API key detected')
    } else {
      console.error('❌ No AI API key configured (ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY)')
    }

    this.maxRetries = DEFAULT_MAX_RETRIES
    this.retryDelay = DEFAULT_RETRY_DELAY_MS
    this.requestTimeout = DEFAULT_REQUEST_TIMEOUT_MS
    this.lastRequestTime = 0
    // Anthropic, DeepSeek and OpenRouter have better rate limits than Groq
    this.minRequestInterval = (this.provider === 'anthropic' || this.provider === 'deepseek' || this.provider === 'openrouter') ? 500 : DEFAULT_MIN_REQUEST_INTERVAL_MS
    this.cacheExpiry = DEFAULT_CACHE_EXPIRY_MS

    this.modelFallbackChain = [this.currentModel, PRIMARY_MODEL, ...FALLBACK_MODELS]
    this.modelFailureCount = new Map()

    this.weeklyRoundupCache = new Map()
    this.authoritySpotlightCache = new Map()
    this.sectorAnalysisCache = new Map()
  }
}

applyMetadataMethods(EnhancedAIAnalyzer)
applyPromptMethods(EnhancedAIAnalyzer)
applyClientMethods(EnhancedAIAnalyzer)
applyParserMethods(EnhancedAIAnalyzer)
applyEnhancementMethods(EnhancedAIAnalyzer)
applyFallbackMethods(EnhancedAIAnalyzer)
applyNormalizationMethods(EnhancedAIAnalyzer)
applyWeeklyMethods(EnhancedAIAnalyzer)
applyAnalysisMethods(EnhancedAIAnalyzer)
applyHealthMethods(EnhancedAIAnalyzer)
applyMaintenanceMethods(EnhancedAIAnalyzer)

module.exports = new EnhancedAIAnalyzer()
