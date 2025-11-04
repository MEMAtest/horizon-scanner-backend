const { INDUSTRY_SECTORS } = require('./constants')

function applyPromptMethods(ServiceClass) {
  ServiceClass.prototype.createEnhancedAnalysisPrompt = function(content, url, metadata = {}) {
    const authorityContext = metadata.authority ? `Authority: ${metadata.authority}\n` : ''
    const dateContext = metadata.publishedDate ? `Published: ${metadata.publishedDate}\n` : ''

    return `You are an expert regulatory intelligence analyst specializing in UK and international financial services regulation. 

Analyze this regulatory content and provide a comprehensive structured response:

${authorityContext}${dateContext}
CONTENT TO ANALYZE:
${content.substring(0, 4000)}

URL SOURCE: ${url}

ANALYSIS REQUIREMENTS:
1. Create a clear, professional headline (max 120 characters)
2. Provide a concise business impact summary (max 300 words) focusing on practical implications
3. Identify the specific regulatory area/topic
4. Determine impact level: Significant, Moderate, or Informational
5. Assess urgency: High, Medium, or Low
6. Identify ALL relevant industry sectors from this list: ${INDUSTRY_SECTORS.join(', ')}
7. Provide sector-specific relevance scores (0-100) for each identified sector
8. Extract any key dates, deadlines, or implementation timeframes
9. Identify specific compliance requirements or actions needed
10. Assess potential business risks and opportunities
11. Determine affected firm sizes: small, medium, large, all

CRITICAL: Respond ONLY with valid JSON in this exact format:
{
  "headline": "Clear, professional headline under 120 chars",
  "impact": "Concise business impact summary focusing on practical implications",
  "area": "Specific regulatory area or topic",
  "impactLevel": "Significant|Moderate|Informational",
  "urgency": "High|Medium|Low", 
  "sector": "Primary sector most affected",
  "primarySectors": ["Array", "of", "affected", "sectors"],
  "sectorRelevanceScores": {
    "Banking": 85,
    "Investment Management": 70
  },
  "keyDates": "Any important dates or deadlines mentioned",
  "complianceActions": "Required actions or next steps",
  "riskLevel": "High|Medium|Low",
  "affectedFirmSizes": ["small", "medium", "large"],
  "businessOpportunities": "Potential business opportunities or competitive advantages",
  "implementationComplexity": "Low|Medium|High",
  "crossReferences": ["Related regulatory topics or requirements"]
}

Ensure accuracy, professionalism, and focus on actionable business intelligence.`
  }
}

module.exports = applyPromptMethods
