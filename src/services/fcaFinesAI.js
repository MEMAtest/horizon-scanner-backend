// FCA Fines AI Analysis Service
// Enhanced Horizon Scanner - AI-Powered Enforcement Analysis

const { Pool } = require('pg');

class FCAFinesAI {
    constructor(dbConfig, aiAnalyzer) {
        this.db = new Pool(dbConfig);
        this.aiAnalyzer = aiAnalyzer;

        // Standardized categorization schemas
        this.breachCategories = [
            'Market Abuse', 'Insider Dealing', 'Market Manipulation',
            'Anti-Money Laundering', 'Counter-Terrorist Financing',
            'Systems and Controls', 'Risk Management', 'Governance',
            'Client Money Protection', 'Client Asset Protection',
            'Conduct Risk', 'Treating Customers Fairly',
            'Prudential Requirements', 'Capital Adequacy', 'Liquidity',
            'Reporting and Disclosure', 'Transaction Reporting',
            'Market Making', 'Best Execution',
            'Financial Promotions', 'Misleading Statements',
            'Data Protection', 'Record Keeping'
        ];

        this.impactLevels = ['High', 'Medium', 'Low'];
        this.firmSectors = [
            'Banking', 'Investment Banking', 'Retail Banking',
            'Insurance', 'Life Insurance', 'General Insurance',
            'Asset Management', 'Fund Management',
            'Wealth Management', 'Private Banking',
            'Brokerage', 'Market Making', 'Trading',
            'Fintech', 'Payment Services',
            'Financial Advisory', 'Independent Financial Advisers',
            'Pension Providers', 'Retirement Services',
            'Mortgage Lending', 'Consumer Credit',
            'Other Financial Services'
        ];
    }

    async processUnanalyzedFines(batchSize = 10) {
        console.log('🤖 Starting AI analysis of FCA fines...');

        try {
            // Get unprocessed fines
            const unprocessed = await this.db.query(
                `SELECT id, fine_reference, firm_individual, amount, summary,
                        scraped_content, breach_type, firm_category, date_issued
                 FROM fca_fines
                 WHERE processed_by_ai = FALSE
                 ORDER BY date_issued DESC
                 LIMIT $1`,
                [batchSize]
            );

            if (unprocessed.rows.length === 0) {
                console.log('✅ No unprocessed fines found');
                return { processed: 0, errors: 0 };
            }

            console.log(`📊 Processing ${unprocessed.rows.length} fines...`);

            let processed = 0;
            let errors = 0;

            for (const fine of unprocessed.rows) {
                try {
                    console.log(`   🔍 Analyzing: ${fine.fine_reference}`);

                    const analysis = await this.analyzeFine(fine);
                    await this.saveAnalysis(fine.id, analysis);

                    processed++;
                    console.log(`   ✅ Completed: ${fine.fine_reference}`);

                    // Rate limiting
                    await this.delay(1000);

                } catch (error) {
                    console.error(`   ❌ Error analyzing ${fine.fine_reference}:`, error.message);
                    errors++;

                    // Mark as failed but continue
                    await this.markAnalysisFailed(fine.id, error.message);
                }
            }

            console.log(`🎉 AI analysis completed: ${processed} processed, ${errors} errors`);
            return { processed, errors };

        } catch (error) {
            console.error('❌ Error in AI analysis process:', error);
            throw error;
        }
    }

    async analyzeFine(fine) {
        const analysisText = fine.scraped_content || fine.summary || '';

        if (!analysisText.trim()) {
            throw new Error('No content available for analysis');
        }

        // Prepare AI analysis prompt
        const prompt = this.buildAnalysisPrompt(fine, analysisText);

        try {
            // Get AI analysis
            const aiResponse = await this.aiAnalyzer.analyze(prompt);

            // Parse and structure the response
            const structuredAnalysis = this.parseAIResponse(aiResponse, fine);

            return structuredAnalysis;

        } catch (error) {
            console.error('AI analysis failed:', error);
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    buildAnalysisPrompt(fine, content) {
        return `
Analyze this FCA enforcement action and provide a structured analysis:

FINE DETAILS:
- Firm/Individual: ${fine.firm_individual}
- Amount: £${fine.amount ? fine.amount.toLocaleString() : 'Unknown'}
- Date: ${fine.date_issued}
- Current Breach Type: ${fine.breach_type || 'Unknown'}
- Current Category: ${fine.firm_category || 'Unknown'}

CONTENT TO ANALYZE:
${content}

Please provide a JSON response with the following structure:
{
  "ai_summary": "Concise 50-100 word summary highlighting key breach, amount, and implications",
  "breach_categories": ["Primary breach type", "Secondary breach type if applicable"],
  "affected_sectors": ["Primary sector", "Secondary sector if applicable"],
  "customer_impact_level": "High/Medium/Low",
  "systemic_risk": true/false,
  "precedent_setting": true/false,
  "regulatory_theme": "Main regulatory focus area",
  "risk_score": 1-100,
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "key_findings": [
    "Finding 1",
    "Finding 2",
    "Finding 3"
  ],
  "implications": "What this means for the industry",
  "severity_assessment": "Assessment of the severity and significance"
}

Guidelines:
- Breach categories must be from: ${this.breachCategories.join(', ')}
- Affected sectors must be from: ${this.firmSectors.join(', ')}
- Risk score: 1-30 (Low), 31-60 (Medium), 61-100 (High)
- Customer impact: High (direct customer harm), Medium (potential harm), Low (technical/procedural)
- Systemic risk: true if affects market stability or multiple firms
- Precedent setting: true if establishes new regulatory approach or significant penalty
- Be precise and factual
- Focus on regulatory significance and market impact
`;
    }

    parseAIResponse(aiResponse, fine) {
        try {
            // Try to parse as JSON first
            let analysis;
            try {
                analysis = JSON.parse(aiResponse);
            } catch (parseError) {
                // If JSON parsing fails, extract information manually
                analysis = this.extractFromText(aiResponse, fine);
            }

            // Validate and clean the analysis
            return this.validateAnalysis(analysis, fine);

        } catch (error) {
            console.error('Error parsing AI response:', error);
            // Return basic analysis based on fine data
            return this.createFallbackAnalysis(fine);
        }
    }

    extractFromText(text, fine) {
        // Fallback text extraction if JSON parsing fails
        const analysis = {
            ai_summary: '',
            breach_categories: [],
            affected_sectors: [],
            customer_impact_level: 'Medium',
            systemic_risk: false,
            precedent_setting: false,
            regulatory_theme: '',
            risk_score: 50,
            keywords: [],
            key_findings: [],
            implications: '',
            severity_assessment: ''
        };

        // Extract summary (first paragraph or key sentences)
        const sentences = text.split(/[.!?]+/);
        const summaryParts = sentences
            .filter(s => s.toLowerCase().includes('fine') || s.toLowerCase().includes('breach'))
            .slice(0, 2);
        analysis.ai_summary = summaryParts.join('. ').trim().substring(0, 200);

        // Extract breach categories from text
        for (const category of this.breachCategories) {
            if (text.toLowerCase().includes(category.toLowerCase())) {
                analysis.breach_categories.push(category);
            }
        }

        // Extract sectors
        for (const sector of this.firmSectors) {
            if (text.toLowerCase().includes(sector.toLowerCase())) {
                analysis.affected_sectors.push(sector);
            }
        }

        // Determine risk score based on amount and content
        if (fine.amount) {
            if (fine.amount >= 10000000) analysis.risk_score = 85;
            else if (fine.amount >= 1000000) analysis.risk_score = 70;
            else if (fine.amount >= 100000) analysis.risk_score = 55;
            else analysis.risk_score = 40;
        }

        // Check for systemic risk indicators
        const systemicKeywords = ['systemic', 'market', 'widespread', 'multiple', 'industry'];
        analysis.systemic_risk = systemicKeywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );

        // Extract keywords
        const importantWords = text.toLowerCase()
            .match(/\b\w{4,}\b/g)
            ?.filter(word =>
                !['this', 'that', 'with', 'from', 'they', 'were', 'been', 'have'].includes(word)
            )
            .slice(0, 10) || [];
        analysis.keywords = [...new Set(importantWords)];

        return analysis;
    }

    validateAnalysis(analysis, fine) {
        // Ensure all required fields exist with defaults
        const validated = {
            ai_summary: analysis.ai_summary || this.generateDefaultSummary(fine),
            breach_categories: Array.isArray(analysis.breach_categories) ?
                analysis.breach_categories.filter(cat => this.breachCategories.includes(cat)) : [],
            affected_sectors: Array.isArray(analysis.affected_sectors) ?
                analysis.affected_sectors.filter(sector => this.firmSectors.includes(sector)) : [],
            customer_impact_level: this.impactLevels.includes(analysis.customer_impact_level) ?
                analysis.customer_impact_level : 'Medium',
            systemic_risk: Boolean(analysis.systemic_risk),
            precedent_setting: Boolean(analysis.precedent_setting),
            regulatory_theme: analysis.regulatory_theme || 'Regulatory Compliance',
            risk_score: Math.max(1, Math.min(100, parseInt(analysis.risk_score) || 50)),
            keywords: Array.isArray(analysis.keywords) ?
                analysis.keywords.slice(0, 10) : [],
            key_findings: Array.isArray(analysis.key_findings) ?
                analysis.key_findings.slice(0, 5) : [],
            implications: analysis.implications || '',
            severity_assessment: analysis.severity_assessment || ''
        };

        // Ensure at least one breach category
        if (validated.breach_categories.length === 0) {
            validated.breach_categories = [this.inferBreachCategory(fine)];
        }

        // Ensure at least one sector
        if (validated.affected_sectors.length === 0) {
            validated.affected_sectors = [fine.firm_category || 'Other Financial Services'];
        }

        return validated;
    }

    createFallbackAnalysis(fine) {
        return {
            ai_summary: this.generateDefaultSummary(fine),
            breach_categories: [this.inferBreachCategory(fine)],
            affected_sectors: [fine.firm_category || 'Other Financial Services'],
            customer_impact_level: 'Medium',
            systemic_risk: (fine.amount || 0) >= 10000000,
            precedent_setting: (fine.amount || 0) >= 50000000,
            regulatory_theme: 'Regulatory Compliance',
            risk_score: this.calculateRiskScore(fine),
            keywords: this.extractBasicKeywords(fine),
            key_findings: [],
            implications: '',
            severity_assessment: this.assessSeverity(fine)
        };
    }

    generateDefaultSummary(fine) {
        const amount = fine.amount ? `£${fine.amount.toLocaleString()}` : 'an undisclosed amount';
        const firm = fine.firm_individual || 'a financial services firm';
        const breach = fine.breach_type || 'regulatory breaches';

        return `${firm} was fined ${amount} by the FCA for ${breach}. The enforcement action highlights the regulator's focus on compliance and consumer protection.`;
    }

    inferBreachCategory(fine) {
        const breachType = (fine.breach_type || '').toLowerCase();

        if (breachType.includes('market')) return 'Market Abuse';
        if (breachType.includes('money') || breachType.includes('aml')) return 'Anti-Money Laundering';
        if (breachType.includes('system') || breachType.includes('control')) return 'Systems and Controls';
        if (breachType.includes('client')) return 'Client Money Protection';
        if (breachType.includes('conduct')) return 'Conduct Risk';
        if (breachType.includes('prudential')) return 'Prudential Requirements';
        if (breachType.includes('report')) return 'Reporting and Disclosure';

        return 'Regulatory Compliance';
    }

    calculateRiskScore(fine) {
        let score = 30; // Base score

        if (fine.amount) {
            if (fine.amount >= 50000000) score += 40;
            else if (fine.amount >= 10000000) score += 30;
            else if (fine.amount >= 1000000) score += 20;
            else if (fine.amount >= 100000) score += 10;
        }

        // Recent fines get higher scores
        const daysOld = (new Date() - new Date(fine.date_issued)) / (1000 * 60 * 60 * 24);
        if (daysOld < 30) score += 10;
        else if (daysOld < 90) score += 5;

        return Math.min(100, score);
    }

    assessSeverity(fine) {
        const amount = fine.amount || 0;

        if (amount >= 50000000) return 'Exceptional - represents landmark enforcement action';
        if (amount >= 10000000) return 'High - significant financial penalty indicating serious breaches';
        if (amount >= 1000000) return 'Medium-High - substantial penalty reflecting material regulatory failures';
        if (amount >= 100000) return 'Medium - moderate penalty for compliance failings';

        return 'Low-Medium - penalty reflects technical or procedural breaches';
    }

    extractBasicKeywords(fine) {
        const text = [
            fine.firm_individual || '',
            fine.breach_type || '',
            fine.firm_category || '',
            fine.summary || ''
        ].join(' ').toLowerCase();

        const keywords = [];

        // Add amount-based keywords
        if (fine.amount) {
            if (fine.amount >= 10000000) keywords.push('major-fine');
            else if (fine.amount >= 1000000) keywords.push('significant-penalty');
            keywords.push('financial-penalty');
        }

        // Add category-based keywords
        if (fine.breach_type) keywords.push(fine.breach_type.toLowerCase().replace(/\s+/g, '-'));
        if (fine.firm_category) keywords.push(fine.firm_category.toLowerCase().replace(/\s+/g, '-'));

        return keywords.slice(0, 10);
    }

    async saveAnalysis(fineId, analysis) {
        try {
            const query = `
                UPDATE fca_fines SET
                    ai_summary = $1,
                    ai_analysis = $2,
                    breach_categories = $3,
                    affected_sectors = $4,
                    customer_impact_level = $5,
                    systemic_risk = $6,
                    precedent_setting = $7,
                    regulatory_theme = $8,
                    risk_score = $9,
                    keywords = $10,
                    processed_by_ai = TRUE,
                    processing_status = 'completed',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $11
            `;

            await this.db.query(query, [
                analysis.ai_summary,
                JSON.stringify(analysis),
                JSON.stringify(analysis.breach_categories),
                JSON.stringify(analysis.affected_sectors),
                analysis.customer_impact_level,
                analysis.systemic_risk,
                analysis.precedent_setting,
                analysis.regulatory_theme,
                analysis.risk_score,
                JSON.stringify(analysis.keywords),
                fineId
            ]);

        } catch (error) {
            console.error('Error saving analysis:', error);
            throw error;
        }
    }

    async markAnalysisFailed(fineId, errorMessage) {
        try {
            await this.db.query(
                `UPDATE fca_fines SET
                 processing_status = 'failed',
                 ai_analysis = $1,
                 updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [JSON.stringify({ error: errorMessage, timestamp: new Date() }), fineId]
            );
        } catch (error) {
            console.error('Error marking analysis as failed:', error);
        }
    }

    async generateInsights() {
        console.log('📊 Generating FCA fines insights...');

        try {
            // Get insights from analyzed fines
            const insights = await this.db.query(`
                SELECT
                    COUNT(*) as total_fines,
                    SUM(amount) as total_amount,
                    AVG(amount) as average_amount,
                    AVG(risk_score) as average_risk_score,
                    COUNT(CASE WHEN systemic_risk = true THEN 1 END) as systemic_risk_count,
                    COUNT(CASE WHEN precedent_setting = true THEN 1 END) as precedent_count,
                    COUNT(CASE WHEN customer_impact_level = 'High' THEN 1 END) as high_impact_count,

                    -- Top breach categories
                    (SELECT json_agg(category_data)
                     FROM (
                         SELECT bc.category, COUNT(*) as count
                         FROM fca_fines f,
                         jsonb_array_elements_text(f.breach_categories) as bc(category)
                         WHERE f.processed_by_ai = true
                         GROUP BY bc.category
                         ORDER BY count DESC
                         LIMIT 5
                     ) category_data) as top_breach_categories,

                    -- Top affected sectors
                    (SELECT json_agg(sector_data)
                     FROM (
                         SELECT s.sector, COUNT(*) as count
                         FROM fca_fines f,
                         jsonb_array_elements_text(f.affected_sectors) as s(sector)
                         WHERE f.processed_by_ai = true
                         GROUP BY s.sector
                         ORDER BY count DESC
                         LIMIT 5
                     ) sector_data) as top_sectors,

                    -- Monthly trends
                    (SELECT json_agg(monthly_data)
                     FROM (
                         SELECT
                             year_issued,
                             month_issued,
                             COUNT(*) as count,
                             SUM(amount) as total_amount
                         FROM fca_fines
                         WHERE processed_by_ai = true
                         AND date_issued >= CURRENT_DATE - INTERVAL '12 months'
                         GROUP BY year_issued, month_issued
                         ORDER BY year_issued, month_issued
                     ) monthly_data) as monthly_trends

                FROM fca_fines
                WHERE processed_by_ai = true
            `);

            const result = insights.rows[0];

            console.log('✅ Generated insights:');
            console.log(`   📊 Total fines: ${result.total_fines}`);
            console.log(`   💰 Total amount: £${Number(result.total_amount || 0).toLocaleString()}`);
            console.log(`   📈 Average risk score: ${Number(result.average_risk_score || 0).toFixed(1)}`);
            console.log(`   ⚠️ Systemic risk cases: ${result.systemic_risk_count}`);

            return result;

        } catch (error) {
            console.error('❌ Error generating insights:', error);
            throw error;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async close() {
        await this.db.end();
    }
}

module.exports = FCAFinesAI;