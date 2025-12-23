/**
 * FCA Publications AI Classifier
 *
 * Uses Claude/GPT to analyze enforcement notices and extract structured data
 */

const Anthropic = require('@anthropic-ai/sdk');
const {
  AI_CONFIG,
  RATE_LIMITS,
  PROCESSING_STATUS,
  BREACH_CATEGORIES,
  OUTCOME_TYPES
} = require('./constants');

class AIClassifier {
  constructor(database, progressTracker, options = {}) {
    this.db = database;
    this.progressTracker = progressTracker;

    // Initialize AI client
    this.provider = options.provider || AI_CONFIG.provider;
    this.model = options.model || AI_CONFIG.model;

    if (this.provider === 'anthropic') {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }

    // Rate limiting
    this.requestTimes = [];
    this.processCount = 0;
    this.failedCount = 0;
  }

  /**
   * Delay helper
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check and wait for rate limit
   */
  async waitForRateLimit() {
    const now = Date.now();
    const hourAgo = now - 3600000;

    // Clean old entries
    this.requestTimes = this.requestTimes.filter(t => t > hourAgo);

    // Check hourly limit
    if (this.requestTimes.length >= RATE_LIMITS.maxAICallsPerHour) {
      const waitTime = this.requestTimes[0] + 3600000 - now + 1000;
      console.log(`[AIClassifier] Hourly limit reached, waiting ${Math.ceil(waitTime / 1000)}s`);
      await this.delay(waitTime);
      this.requestTimes = this.requestTimes.filter(t => t > Date.now() - 3600000);
    }

    this.requestTimes.push(Date.now());
  }

  /**
   * Build the analysis prompt
   */
  buildPrompt(documentContent, documentType) {
    return `You are an expert analyst specializing in UK financial regulation and FCA enforcement actions.

Analyze this FCA ${documentType.replace('_', ' ')} and extract structured data. Be precise and extract only what is explicitly stated in the document.

DOCUMENT CONTENT:
${documentContent}

Extract and return ONLY valid JSON (no markdown, no explanations) with this exact structure:

{
  "firm_or_individual": {
    "name": "Full legal name of firm or individual",
    "type": "firm or individual",
    "frn": "6-digit FRN if present, otherwise null",
    "trading_names": ["array of trading names if mentioned"]
  },
  "outcome": {
    "type": "One of: fine, prohibition, cancellation, restriction, censure, public_statement, warning, supervisory_notice, voluntary_requirement, other",
    "fine_amount": null or numeric value (no currency symbol),
    "fine_discounted": true/false,
    "discount_percentage": null or number (e.g., 30),
    "original_fine_amount": null or numeric value before discount
  },
  "breaches": {
    "primary_breach_type": "One of: AML, MARKET_ABUSE, SYSTEMS_CONTROLS, CLIENT_MONEY, CONDUCT, MIS_SELLING, PRUDENTIAL, REPORTING, GOVERNANCE, FINANCIAL_CRIME, PRINCIPLES, COMPLAINTS, FINANCIAL_PROMOTIONS, APPROVED_PERSONS",
    "specific_breaches": ["List of specific rule breaches mentioned"],
    "handbook_references": ["PRIN 2.1", "SYSC 3.1", etc - extract ALL handbook references],
    "breach_categories": ["Array of applicable categories from the list above"]
  },
  "relevant_period": {
    "start_date": "YYYY-MM-DD or null",
    "end_date": "YYYY-MM-DD or null",
    "description": "e.g., Between January 2018 and December 2020"
  },
  "remediation": {
    "actions_required": ["List of remediation actions required"],
    "deadline": "YYYY-MM-DD or null",
    "s166_required": true/false (skilled person report),
    "voluntary_requirements": ["any VREQs mentioned"]
  },
  "key_findings": [
    "Concise bullet points of the main findings (max 5)"
  ],
  "aggravating_factors": ["list from document"],
  "mitigating_factors": ["list from document"],
  "consumer_impact": {
    "level": "High, Medium, Low, or Unknown",
    "description": "Brief description of impact on consumers",
    "redress_required": true/false,
    "estimated_harm": null or numeric value,
    "customers_affected": null or number
  },
  "systemic_risk": {
    "is_systemic": true/false,
    "reasoning": "explanation if true, otherwise null"
  },
  "precedent_notes": "Any novel or precedent-setting aspects, or null",
  "summary": "2-3 sentence executive summary of the enforcement action"
}

IMPORTANT:
- Return ONLY the JSON object, no markdown code blocks
- FRN is typically 6 digits
- Fine amounts should be numeric only (e.g., 1234567.89 not "£1,234,567.89")
- Dates must be YYYY-MM-DD format
- If information is not in the document, use null
- Extract ALL handbook references (PRIN, SYSC, COBS, SUP, MAR, etc.)`;
  }

  /**
   * Call AI API to analyze document
   */
  async analyzeDocument(documentContent, documentType) {
    await this.waitForRateLimit();

    // Truncate content if too long
    const maxLength = AI_CONFIG.maxContentLength;
    const truncatedContent = documentContent.length > maxLength
      ? documentContent.substring(0, maxLength) + '\n\n[... content truncated ...]'
      : documentContent;

    const prompt = this.buildPrompt(truncatedContent, documentType);

    try {
      if (this.provider === 'anthropic') {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        });

        const responseText = response.content[0].text;

        // Parse JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: parsed,
          model: this.model,
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens
        };
      }

      throw new Error(`Unsupported AI provider: ${this.provider}`);

    } catch (error) {
      console.error('[AIClassifier] Analysis failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate risk score based on analysis
   */
  calculateRiskScore(analysis) {
    let score = 0;

    // Fine amount contribution (0-30 points)
    const fineAmount = analysis.outcome?.fine_amount || 0;
    if (fineAmount > 100_000_000) score += 30;
    else if (fineAmount > 10_000_000) score += 25;
    else if (fineAmount > 1_000_000) score += 20;
    else if (fineAmount > 100_000) score += 15;
    else if (fineAmount > 0) score += 10;

    // Breach type severity (0-25 points)
    const severeBreaches = ['MARKET_ABUSE', 'AML', 'FINANCIAL_CRIME', 'CLIENT_MONEY'];
    if (severeBreaches.includes(analysis.breaches?.primary_breach_type)) {
      score += 25;
    } else if (analysis.breaches?.primary_breach_type) {
      score += 15;
    }

    // Consumer impact (0-20 points)
    const impactLevel = analysis.consumer_impact?.level;
    if (impactLevel === 'High') score += 20;
    else if (impactLevel === 'Medium') score += 12;
    else if (impactLevel === 'Low') score += 5;

    // Systemic risk (0-15 points)
    if (analysis.systemic_risk?.is_systemic) score += 15;

    // Aggravating factors (0-10 points)
    const aggravatingCount = analysis.aggravating_factors?.length || 0;
    score += Math.min(aggravatingCount * 2, 10);

    // Reduce for mitigating factors
    const mitigatingCount = analysis.mitigating_factors?.length || 0;
    score -= Math.min(mitigatingCount * 2, 10);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Transform AI response to database format
   */
  transformToDbFormat(aiData, publication) {
    return {
      publicationId: publication.publication_id,
      entityName: aiData.firm_or_individual?.name || publication.title,
      entityType: aiData.firm_or_individual?.type || null,
      frn: aiData.firm_or_individual?.frn || null,
      tradingNames: aiData.firm_or_individual?.trading_names || [],

      outcomeType: aiData.outcome?.type || 'other',
      fineAmount: aiData.outcome?.fine_amount || null,
      fineDiscounted: aiData.outcome?.fine_discounted || false,
      discountPercentage: aiData.outcome?.discount_percentage || null,
      originalFineAmount: aiData.outcome?.original_fine_amount || null,

      primaryBreachType: aiData.breaches?.primary_breach_type || null,
      specificBreaches: aiData.breaches?.specific_breaches || [],
      handbookReferences: aiData.breaches?.handbook_references || [],
      breachCategories: aiData.breaches?.breach_categories || [],

      relevantPeriodStart: aiData.relevant_period?.start_date || null,
      relevantPeriodEnd: aiData.relevant_period?.end_date || null,
      relevantPeriodDescription: aiData.relevant_period?.description || null,
      noticeDate: publication.publication_date,

      remediationActions: aiData.remediation?.actions_required || [],
      remediationDeadline: aiData.remediation?.deadline || null,
      s166Required: aiData.remediation?.s166_required || false,
      voluntaryRequirements: aiData.remediation?.voluntary_requirements || [],

      keyFindings: aiData.key_findings || [],
      aggravatingFactors: aiData.aggravating_factors || [],
      mitigatingFactors: aiData.mitigating_factors || [],

      consumerImpactLevel: aiData.consumer_impact?.level || 'Unknown',
      consumerImpactDescription: aiData.consumer_impact?.description || null,
      redressRequired: aiData.consumer_impact?.redress_required || false,
      estimatedConsumerHarm: aiData.consumer_impact?.estimated_harm || null,
      customersAffected: aiData.consumer_impact?.customers_affected || null,

      systemicRisk: aiData.systemic_risk?.is_systemic || false,
      systemicRiskReasoning: aiData.systemic_risk?.reasoning || null,

      precedentNotes: aiData.precedent_notes || null,
      aiSummary: aiData.summary || null,
      aiAnalysis: aiData,
      aiConfidenceScore: 0.85, // Default confidence
      aiModelUsed: this.model,

      riskScore: this.calculateRiskScore(aiData),
      pdfUrl: publication.pdf_url,
      pdfLocalPath: publication.pdf_local_path,
      rawTextExcerpt: publication.full_text?.substring(0, 5000) || null,
      fullTextStored: !!publication.full_text
    };
  }

  /**
   * Process a single publication
   */
  async processPublication(publication) {
    const { publication_id, document_type, full_text } = publication;

    if (!full_text || full_text.length < 100) {
      console.log(`[AIClassifier] Insufficient text for ${publication_id}`);
      return { success: false, reason: 'insufficient_text' };
    }

    await this.db.updatePublicationStatus(publication_id, PROCESSING_STATUS.PROCESSING);

    try {
      console.log(`[AIClassifier] Analyzing: ${publication_id}`);

      const result = await this.analyzeDocument(full_text, document_type || 'enforcement notice');

      if (!result.success) {
        throw new Error(result.error);
      }

      // Transform and save
      const dbRecord = this.transformToDbFormat(result.data, publication);
      await this.db.insertEnforcementNotice(dbRecord);

      // Update publication status
      await this.db.updatePublicationStatus(publication_id, PROCESSING_STATUS.PROCESSED);

      this.processCount++;
      console.log(`[AIClassifier] Processed ${publication_id}: ${dbRecord.entityName}`);

      // Rate limit delay
      await this.delay(RATE_LIMITS.aiProcessingDelay);

      return {
        success: true,
        entityName: dbRecord.entityName,
        outcomeType: dbRecord.outcomeType,
        fineAmount: dbRecord.fineAmount,
        riskScore: dbRecord.riskScore
      };

    } catch (error) {
      this.failedCount++;
      console.error(`[AIClassifier] Failed ${publication_id}:`, error.message);

      await this.db.incrementRetryCount(publication_id, error.message);

      if (publication.retry_count >= 2) {
        await this.db.updatePublicationStatus(publication_id, PROCESSING_STATUS.PROCESS_FAILED);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Process batch of publications
   */
  async processBatch(publications, options = {}) {
    const { onProgress = null, jobId = null } = options;

    const results = {
      successful: 0,
      failed: 0,
      skipped: 0
    };

    for (let i = 0; i < publications.length; i++) {
      const pub = publications[i];
      const result = await this.processPublication(pub);

      if (result.success) {
        results.successful++;
      } else if (result.reason === 'insufficient_text') {
        results.skipped++;
      } else {
        results.failed++;
      }

      if (onProgress) {
        onProgress({
          processed: i + 1,
          total: publications.length,
          current: pub.publication_id,
          ...results
        });
      }

      if (this.progressTracker && jobId) {
        await this.progressTracker.updateProgress(jobId, {
          processedItems: i + 1,
          failedItems: results.failed
        });
      }
    }

    return results;
  }

  /**
   * Process all pending AI classifications
   */
  async processAllPending(options = {}) {
    const { batchSize = 25, onBatchComplete = null, jobId = null } = options;

    let totalResults = {
      successful: 0,
      failed: 0,
      skipped: 0
    };

    let batch;
    let batchNumber = 0;

    while (true) {
      batch = await this.db.getPendingAIProcessing(batchSize);

      if (batch.length === 0) {
        console.log('[AIClassifier] No more pending AI processing');
        break;
      }

      batchNumber++;
      console.log(`[AIClassifier] Processing batch ${batchNumber} (${batch.length} items)`);

      const batchResults = await this.processBatch(batch, { jobId });

      totalResults.successful += batchResults.successful;
      totalResults.failed += batchResults.failed;
      totalResults.skipped += batchResults.skipped;

      if (onBatchComplete) {
        onBatchComplete({
          batchNumber,
          batchResults,
          totalResults
        });
      }
    }

    console.log(`[AIClassifier] AI processing complete:`, totalResults);
    return totalResults;
  }

  /**
   * Get classifier statistics
   */
  getStats() {
    return {
      processCount: this.processCount,
      failedCount: this.failedCount,
      requestsLastHour: this.requestTimes.length
    };
  }
}

module.exports = AIClassifier;
