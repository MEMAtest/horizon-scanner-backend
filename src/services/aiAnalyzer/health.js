function applyHealthMethods(ServiceClass) {
  ServiceClass.prototype.healthCheck = async function() {
    try {
      if (!this.apiKey) {
        return { status: 'unhealthy', reason: 'API key not configured' }
      }

      const testPrompt = 'Respond with JSON: {"status": "healthy", "service": "ai_analyzer"}'
      const response = await this.makeGroqRequest(testPrompt)

      if (response?.choices?.[0]?.message?.content) {
        return {
          status: 'healthy',
          service: 'ai_analyzer',
          currentModel: this.currentModel,
          modelChain: this.modelFallbackChain,
          timestamp: new Date().toISOString()
        }
      }

      return { status: 'unhealthy', reason: 'Invalid API response' }
    } catch (error) {
      return { status: 'unhealthy', reason: error.message }
    }
  }
}

module.exports = applyHealthMethods
