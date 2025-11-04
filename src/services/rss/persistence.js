function applyPersistenceMethods(ServiceClass, { dbService, aiAnalyzer }) {
  ServiceClass.prototype.saveUpdates = async function saveUpdates(updates, source) {
    let savedCount = 0

    for (const update of updates) {
      try {
        const exists = await dbService.checkUpdateExists(update.url)
        if (exists) {
          continue
        }

        if (aiAnalyzer && typeof aiAnalyzer.analyzeUpdate === 'function') {
          try {
            const analysisResult = await aiAnalyzer.analyzeUpdate(update)
            const aiData = analysisResult?.data || analysisResult

            if (analysisResult?.success && aiData) {
              update.aiAnalysis = aiData
              update.businessImpact = analysisResult.businessImpact || aiData.ai_summary
              update.confidence = analysisResult.confidence || aiData.ai_confidence_score
              update.sectors = analysisResult.sectors || aiData.primarySectors || update.sectors
              update.category = analysisResult.category || aiData.area
              update.urgency = analysisResult.urgency || aiData.urgency

              update.ai_summary = aiData.ai_summary
              update.impactLevel = aiData.impactLevel
              update.impact_level = aiData.impactLevel
              update.businessImpactScore = aiData.businessImpactScore
              update.business_impact_score = aiData.business_impact_score
              update.ai_tags = aiData.ai_tags
              update.aiTags = aiData.aiTags
              update.ai_confidence_score = aiData.ai_confidence_score
              update.sector = aiData.sector || update.sector
              update.primarySectors = aiData.primarySectors
              update.primary_sectors = aiData.primary_sectors
              update.complianceDeadline = aiData.complianceDeadline
              update.compliance_deadline = aiData.compliance_deadline
              update.sectorRelevanceScores = aiData.sectorRelevanceScores
              update.sector_relevance_scores = aiData.sector_relevance_scores
              update.implementationPhases = aiData.implementationPhases
              update.implementation_phases = aiData.implementation_phases
              update.requiredResources = aiData.requiredResources
              update.required_resources = aiData.required_resources
              update.firmTypesAffected = aiData.firmTypesAffected
              update.firm_types_affected = aiData.firm_types_affected
              update.assessment = aiData.impact || update.assessment
              update.complianceActions = aiData.complianceActions || update.complianceActions
              update.compliance_deadline = aiData.compliance_deadline || update.compliance_deadline
              update.sectorRelevanceScores = aiData.sectorRelevanceScores
              update.sector_relevance_scores = aiData.sector_relevance_scores
              update.implementationPhases = aiData.implementationPhases
              update.implementation_phases = aiData.implementation_phases
              update.requiredResources = aiData.requiredResources
              update.required_resources = aiData.required_resources
              update.firmTypesAffected = aiData.firmTypesAffected
              update.firm_types_affected = aiData.firm_types_affected
              update.area = aiData.area || update.area
              update.content_type = aiData.content_type || update.content_type
              update.contentType = aiData.contentType || update.contentType
              update.aiModelUsed = aiData.aiModelUsed
              update.enhancedAt = aiData.enhancedAt

              this.processingStats.aiAnalysisSuccess++
            }
          } catch (aiError) {
            console.warn('⚠️ AI analysis failed for update:', aiError.message)
          }
        }

        update.fetchedDate = update.fetchedDate || new Date()

        await dbService.saveUpdate(update)
        savedCount++
        this.processingStats.processed++
      } catch (error) {
        console.error('❌ Failed to save update:', error.message)
        this.processingStats.errors++
      }
    }

    return savedCount
  }

  ServiceClass.prototype.generateDemoUpdates = async function generateDemoUpdates(source) {
    return [
      {
        headline: 'Demo: New Banking Regulations Announced',
        summary: 'This is a demo update showing new banking regulations...',
        url: 'https://demo.example.com/update1',
        authority: 'Demo Authority',
        publishedDate: new Date(),
        source: source.name,
        feedType: 'demo'
      }
    ]
  }
}

module.exports = applyPersistenceMethods
