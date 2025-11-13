const axios = require('axios')
const Anthropic = require('@anthropic-ai/sdk')

const { GROQ_API_URL } = require('./constants')

function applyClientMethods(ServiceClass) {
  ServiceClass.prototype.makeGroqRequest = async function(prompt, retryCount = 0, modelIndex = 0) {
    // If using Anthropic, use the SDK
    if (this.provider === 'anthropic') {
      return this.makeAnthropicRequest(prompt, retryCount, modelIndex)
    }

    if (!this.apiKey) {
      throw new Error('API key not configured (ANTHROPIC_API_KEY, OPENROUTER_API_KEY or GROQ_API_KEY)')
    }

    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    this.lastRequestTime = Date.now()

    const modelToUse = this.modelFallbackChain[modelIndex] || this.modelFallbackChain[0]
    console.log(`🤖 Attempting request with model: ${modelToUse}`)

    // Build headers - OpenRouter needs HTTP-Referer header
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }

    if (this.useOpenRouter) {
      headers['HTTP-Referer'] = 'https://regcanary.ai'
      headers['X-Title'] = 'RegCanary Horizon Scanner'
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: modelToUse,
          messages: [
            {
              role: 'system',
              content: 'You are an expert regulatory intelligence analyst. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        },
        {
          headers,
          timeout: this.requestTimeout
        }
      )

      this.currentModel = modelToUse
      this.modelFailureCount.set(modelToUse, 0)

      console.log(`✅ Successfully used model: ${modelToUse}`)
      return response.data
    } catch (error) {
      const errorDetails = error.response?.data?.error || error.message
      console.error(`❌ Error with model ${modelToUse}:`, errorDetails)

      const failCount = (this.modelFailureCount.get(modelToUse) || 0) + 1
      this.modelFailureCount.set(modelToUse, failCount)

      if (error.response?.status === 401) {
        console.error('❌ Authentication failed - check your GROQ_API_KEY')
        throw new Error('Invalid API key')
      } else if (error.response?.status === 429) {
        const waitTime = Math.pow(2, retryCount) * 10000
        console.warn(`⚠️ Rate limited, waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${this.maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        if (retryCount < this.maxRetries) {
          return this.makeGroqRequest(prompt, retryCount + 1, modelIndex)
        }
      } else if (error.response?.status === 400 || error.response?.status === 404) {
        if (modelIndex < this.modelFallbackChain.length - 1) {
          console.log(`🔄 Model ${modelToUse} not available, trying fallback model ${this.modelFallbackChain[modelIndex + 1]}`)
          return this.makeGroqRequest(prompt, 0, modelIndex + 1)
        }
      } else if (error.response?.status === 503) {
        console.warn('⚠️ Service temporarily unavailable, retrying...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        if (retryCount < this.maxRetries) {
          return this.makeGroqRequest(prompt, retryCount + 1, modelIndex)
        }
      }

      if (retryCount < this.maxRetries) {
        console.warn(`⚠️ Retrying request (${retryCount + 1}/${this.maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.makeGroqRequest(prompt, retryCount + 1, modelIndex)
      }

      throw error
    }
  }

  ServiceClass.prototype.makeAnthropicRequest = async function(prompt, retryCount = 0, modelIndex = 0) {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured (ANTHROPIC_API_KEY)')
    }

    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    this.lastRequestTime = Date.now()

    const modelToUse = this.modelFallbackChain[modelIndex] || this.modelFallbackChain[0]
    console.log(`🤖 Attempting request with Claude model: ${modelToUse}`)

    try {
      const anthropic = new Anthropic({
        apiKey: this.apiKey
      })

      const response = await anthropic.messages.create({
        model: modelToUse,
        max_tokens: 2000,
        temperature: 0.1,
        system: 'You are an expert regulatory intelligence analyst. Always respond with valid JSON only.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      this.currentModel = modelToUse
      this.modelFailureCount.set(modelToUse, 0)

      console.log(`✅ Successfully used Claude model: ${modelToUse}`)

      // Convert Anthropic response format to match OpenAI format for compatibility
      return {
        choices: [
          {
            message: {
              content: response.content[0].text
            }
          }
        ]
      }
    } catch (error) {
      const errorDetails = error.message || error.toString()
      console.error(`❌ Error with Claude model ${modelToUse}:`, errorDetails)

      const failCount = (this.modelFailureCount.get(modelToUse) || 0) + 1
      this.modelFailureCount.set(modelToUse, failCount)

      if (error.status === 401) {
        console.error('❌ Authentication failed - check your ANTHROPIC_API_KEY')
        throw new Error('Invalid Anthropic API key')
      } else if (error.status === 429) {
        const waitTime = Math.pow(2, retryCount) * 10000
        console.warn(`⚠️ Rate limited, waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${this.maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        if (retryCount < this.maxRetries) {
          return this.makeAnthropicRequest(prompt, retryCount + 1, modelIndex)
        }
      } else if (error.status === 400 || error.status === 404) {
        if (modelIndex < this.modelFallbackChain.length - 1) {
          console.log(`🔄 Model ${modelToUse} not available, trying fallback model ${this.modelFallbackChain[modelIndex + 1]}`)
          return this.makeAnthropicRequest(prompt, 0, modelIndex + 1)
        }
      } else if (error.status === 503) {
        console.warn('⚠️ Service temporarily unavailable, retrying...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        if (retryCount < this.maxRetries) {
          return this.makeAnthropicRequest(prompt, retryCount + 1, modelIndex)
        }
      }

      if (retryCount < this.maxRetries) {
        console.warn(`⚠️ Retrying request (${retryCount + 1}/${this.maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.makeAnthropicRequest(prompt, retryCount + 1, modelIndex)
      }

      throw error
    }
  }
}

module.exports = applyClientMethods
