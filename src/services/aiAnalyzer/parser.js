const { VALID_CONTENT_TYPES } = require('../../utils/contentTypeInference')

function applyParserMethods(ServiceClass) {
  ServiceClass.prototype.parseAndValidateAIResponse = function(response) {
    try {
      let cleanedResponse = response.trim()
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')

      const jsonStart = cleanedResponse.indexOf('{')
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No JSON object found in response')
      }

      const jsonString = cleanedResponse.substring(jsonStart, jsonEnd)
      const parsed = JSON.parse(jsonString)

      const defaults = {
        headline: 'Regulatory Update',
        impact: 'Business impact analysis pending',
        area: 'General Regulation',
        impactLevel: 'Moderate',
        urgency: 'Medium'
      }

      Object.keys(defaults).forEach(key => {
        if (!parsed[key] || parsed[key] === 'undefined' || parsed[key].toString().includes('undefined')) {
          console.warn(`⚠️ Missing or broken field '${key}', using default: ${defaults[key]}`)
          parsed[key] = defaults[key]
        } else if (typeof parsed[key] === 'string') {
          parsed[key] = parsed[key]
            .replace(/undefined/g, '')
            .replace(/\s+/g, ' ')
            .trim()
        }
      })

      const validImpactLevels = ['Significant', 'Moderate', 'Informational']
      const validUrgencyLevels = ['High', 'Medium', 'Low']
      const validContentTypes = VALID_CONTENT_TYPES

      if (!validImpactLevels.includes(parsed.impactLevel)) {
        parsed.impactLevel = 'Moderate'
      }

      if (!validUrgencyLevels.includes(parsed.urgency)) {
        parsed.urgency = 'Medium'
      }

      // Validate and normalize contentType
      if (parsed.contentType && !validContentTypes.includes(parsed.contentType)) {
        console.warn(`⚠️ Invalid contentType '${parsed.contentType}', setting to 'Other'`)
        parsed.contentType = 'Other'
      } else if (!parsed.contentType) {
        parsed.contentType = 'Other'
      }

      return parsed
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error.message)
      console.error('Raw response snippet:', response.substring(0, 200))
      return null
    }
  }
}

module.exports = applyParserMethods
