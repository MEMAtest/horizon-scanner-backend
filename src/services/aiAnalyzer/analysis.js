function applyAnalysisMethods(ServiceClass) {
  ServiceClass.prototype.analyzeUpdate = async function(update = {}) {
    if (!update || typeof update !== 'object') {
      throw new Error('Update data must be provided for AI analysis')
    }

    const metadata = this.buildAnalysisMetadata(update)
    const contentForAnalysis = this.extractContentForAnalysis(update, metadata)

    if (!contentForAnalysis) {
      console.warn('⚠️ No content available for AI analysis, generating fallback from metadata')
    }

    try {
      const analysis = await this.analyzeRegulatoryContent(
        contentForAnalysis || `${update.headline || update.title || 'Regulatory update'}\n${update.summary || ''}`,
        update.url,
        metadata
      )

      const normalized = this.normalizeAnalysisResult(analysis, update, metadata)
      return this.buildAnalyzeUpdateResponse(normalized)
    } catch (error) {
      console.error('❌ analyzeUpdate failed, using enhanced fallback:', error.message)

      const fallbackAnalysis = this.createEnhancedFallbackAnalysis(
        contentForAnalysis || `${update.headline || update.title || 'Regulatory update'} ${update.summary || ''}`,
        update.url,
        metadata
      )

      const normalized = this.normalizeAnalysisResult(fallbackAnalysis, update, metadata)
      return this.buildAnalyzeUpdateResponse(normalized, { fallback: true, error: error.message })
    }
  }

  ServiceClass.prototype.analyzeRegulatoryContent = async function(content, url, metadata = {}) {
    console.log(`🔍 Starting enhanced AI analysis for: ${url?.substring(0, 100)}...`)

    if (!this.apiKey) {
      console.warn('⚠️ No API key configured, using fallback analysis')
      return this.createEnhancedFallbackAnalysis(content, url, metadata)
    }

    if (!content || content.trim().length < 50) {
      console.warn('⚠️ Content too short for meaningful analysis')
      return this.createEnhancedFallbackAnalysis(content, url, metadata)
    }

    try {
      const enhancedPrompt = this.createEnhancedAnalysisPrompt(content, url, metadata)
      const response = await this.makeGroqRequest(enhancedPrompt)

      if (!response || !response.choices || !response.choices[0]) {
        throw new Error('Invalid response format from Groq API')
      }

      const aiResponse = response.choices[0].message.content
      const parsedAnalysis = this.parseAndValidateAIResponse(aiResponse)

      if (!parsedAnalysis) {
        throw new Error('Failed to parse AI response')
      }

      const enhancedAnalysis = await this.addIntelligenceEnhancements(parsedAnalysis, content, url)

      console.log(`✅ Enhanced AI analysis completed successfully with model: ${this.currentModel}`)
      return enhancedAnalysis
    } catch (error) {
      console.error('❌ Enhanced AI analysis failed:', error.message)
      console.log('🔄 Using enhanced fallback analysis with sector intelligence')
      return this.createEnhancedFallbackAnalysis(content, url, metadata)
    }
  }
}

module.exports = applyAnalysisMethods
