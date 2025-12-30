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
              // Store original source sectors before AI overwrites
              const originalSectors = update.sectors || []
              const originalSector = update.sector || ''

              update.aiAnalysis = aiData
              update.businessImpact = analysisResult.businessImpact || aiData.ai_summary
              update.confidence = analysisResult.confidence || aiData.ai_confidence_score

              // Preserve source sectors if AI returns nothing meaningful
              const aiSectors = analysisResult.sectors?.length > 0
                ? analysisResult.sectors
                : aiData.primarySectors?.length > 0
                  ? aiData.primarySectors
                  : null
              update.sectors = aiSectors || originalSectors

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

              // Preserve source sector if AI returns nothing meaningful
              update.sector = aiData.sector || originalSector
              update.primarySectors = aiData.primarySectors?.length > 0 ? aiData.primarySectors : originalSectors
              update.primary_sectors = aiData.primary_sectors?.length > 0 ? aiData.primary_sectors : originalSectors
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

              // New calendar date fields
              update.consultationEndDate = aiData.consultationEndDate
              update.consultation_end_date = aiData.consultation_end_date
              update.implementationDate = aiData.implementationDate
              update.implementation_date = aiData.implementation_date
              update.effectiveDate = aiData.effectiveDate
              update.effective_date = aiData.effective_date
              update.reviewDate = aiData.reviewDate
              update.review_date = aiData.review_date
              update.allCalendarDates = aiData.allCalendarDates
              update.all_calendar_dates = aiData.all_calendar_dates

              this.processingStats.aiAnalysisSuccess++
            }
          } catch (aiError) {
            console.warn('⚠️ AI analysis failed for update:', aiError.message)
          }
        }

        update.fetchedDate = update.fetchedDate || new Date()

        const savedId = await dbService.saveUpdate(update)
        savedCount++
        this.processingStats.processed++

        // Auto-create calendar events from extracted dates
        const updateId = savedId?.id || savedId // Handle both object and direct id returns
        if (updateId) {
          const updateWithId = { ...update, id: updateId }
          if (updateWithId.compliance_deadline || updateWithId.consultation_end_date ||
              updateWithId.implementation_date || updateWithId.all_calendar_dates?.length) {
            try {
              await dbService.createEventsFromUpdate(updateWithId)
            } catch (calErr) {
              console.warn('⚠️ Could not auto-create calendar events:', calErr.message)
            }
          }
        }
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
