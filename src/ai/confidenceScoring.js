// src/ai/confidenceScoring.js
// AI Confidence Scoring Algorithms for Regulatory Intelligence
// Phase 3: AI Intelligence Engine

class ConfidenceScoring {
    constructor() {
        this.baseConfidence = 50;
        this.maxConfidence = 95;
        this.minConfidence = 10;
        
        // Confidence scoring weights
        this.weights = {
            sourceReliability: 0.25,
            contentQuality: 0.20,
            historicalAccuracy: 0.20,
            aiModelConfidence: 0.15,
            crossValidation: 0.10,
            timeRelevance: 0.10
        };
        
        // Authority reliability scores
        this.authorityReliability = {
            'FCA': 95,
            'PRA': 95,
            'Bank of England': 95,
            'HM Treasury': 90,
            'FRC': 85,
            'PSR': 85,
            'FATF': 80,
            'European Banking Authority': 85,
            'Basel Committee': 80,
            'IOSCO': 80,
            'Unknown': 40
        };
        
        // Document type reliability
        this.documentTypeReliability = {
            'Policy Statement': 95,
            'Consultation Paper': 90,
            'Technical Standard': 90,
            'Guidance': 85,
            'Speech': 70,
            'News': 60,
            'Blog Post': 50,
            'Unknown': 40
        };
    }

    // MAIN CONFIDENCE SCORING METHOD
    calculateConfidence(analysis, metadata = {}) {
        try {
            const scores = {
                sourceReliability: this.scoreSourceReliability(metadata),
                contentQuality: this.scoreContentQuality(analysis, metadata),
                historicalAccuracy: this.scoreHistoricalAccuracy(analysis),
                aiModelConfidence: this.scoreAIModelConfidence(analysis),
                crossValidation: this.scoreCrossValidation(analysis, metadata),
                timeRelevance: this.scoreTimeRelevance(metadata)
            };
            
            // Calculate weighted confidence
            let weightedConfidence = 0;
            for (const [factor, score] of Object.entries(scores)) {
                weightedConfidence += score * this.weights[factor];
            }
            
            // Apply confidence modifiers
            const modifiedConfidence = this.applyConfidenceModifiers(weightedConfidence, analysis, metadata);
            
            // Ensure confidence is within bounds
            const finalConfidence = Math.max(this.minConfidence, 
                Math.min(this.maxConfidence, modifiedConfidence));
            
            return {
                confidence: Math.round(finalConfidence),
                breakdown: scores,
                factors: this.getConfidenceFactors(analysis, metadata),
                reliability: this.getReliabilityLevel(finalConfidence)
            };
            
        } catch (error) {
            console.error('Error calculating confidence:', error);
            return {
                confidence: this.baseConfidence,
                breakdown: {},
                factors: ['Error in confidence calculation'],
                reliability: 'Medium'
            };
        }
    }

    // SOURCE RELIABILITY SCORING
    scoreSourceReliability(metadata) {
        const authority = metadata.authority || 'Unknown';
        const documentType = metadata.documentType || 'Unknown';
        const url = metadata.url || '';
        
        let score = this.authorityReliability[authority] || 40;
        
        // Boost for official domains
        if (this.isOfficialDomain(url)) {
            score += 10;
        }
        
        // Adjust for document type
        const docTypeScore = this.documentTypeReliability[documentType] || 40;
        score = (score + docTypeScore) / 2;
        
        // Penalty for unofficial sources
        if (url.includes('blog') || url.includes('news') || url.includes('forum')) {
            score -= 15;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    // CONTENT QUALITY SCORING
    scoreContentQuality(analysis, metadata) {
        let score = 60; // Base content quality
        
        // Check for specific indicators
        if (analysis.keyDates && analysis.keyDates !== 'None identified') {
            score += 15;
        }
        
        if (analysis.complianceActions && analysis.complianceActions.length > 10) {
            score += 10;
        }
        
        if (analysis.headline && analysis.headline.length > 20 && analysis.headline.length < 120) {
            score += 10;
        }
        
        if (analysis.area && analysis.area !== 'General') {
            score += 10;
        }
        
        // Check for detailed sector analysis
        if (analysis.sectorRelevanceScores && Object.keys(analysis.sectorRelevanceScores).length > 1) {
            score += 15;
        }
        
        // Penalty for vague responses
        if (analysis.impact && analysis.impact.length < 50) {
            score -= 15;
        }
        
        // Check for structured analysis
        if (analysis.impactLevel && analysis.urgency && analysis.riskLevel) {
            score += 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    // HISTORICAL ACCURACY SCORING
    scoreHistoricalAccuracy(analysis) {
        // This would integrate with historical prediction accuracy data
        // For now, we'll use heuristics based on the analysis structure
        
        let score = 70; // Base historical accuracy
        
        // More specific analyses tend to be more accurate
        if (analysis.area && analysis.area.length > 10) {
            score += 10;
        }
        
        // Specific sector targeting indicates better accuracy
        if (analysis.primarySectors && analysis.primarySectors.length <= 3) {
            score += 10;
        }
        
        // Realistic impact levels
        if (analysis.impactLevel === 'Informational' && analysis.urgency === 'Low') {
            score += 5; // Realistic assessment
        }
        
        if (analysis.impactLevel === 'Critical' && analysis.urgency === 'High') {
            score += 5; // Realistic critical assessment
        }
        
        // Over-confidence penalty
        if (analysis.impactLevel === 'Critical' && analysis.urgency === 'Urgent') {
            score -= 10; // Potentially over-confident
        }
        
        return Math.max(0, Math.min(100, score));
    }

    // AI MODEL CONFIDENCE SCORING
    scoreAIModelConfidence(analysis) {
        let score = 65; // Base AI confidence
        
        // Check for AI uncertainty indicators
        const uncertaintyWords = ['may', 'might', 'possible', 'potential', 'unclear', 'ambiguous'];
        const analysisText = JSON.stringify(analysis).toLowerCase();
        
        let uncertaintyCount = 0;
        uncertaintyWords.forEach(word => {
            if (analysisText.includes(word)) {
                uncertaintyCount++;
            }
        });
        
        // Penalty for uncertainty
        score -= uncertaintyCount * 5;
        
        // Boost for specific, definitive analysis
        if (analysis.consultationDeadline && analysis.consultationDeadline !== 'None') {
            score += 15;
        }
        
        if (analysis.implementationDate && analysis.implementationDate !== 'None') {
            score += 15;
        }
        
        // Check for comprehensive analysis
        const analysisFields = Object.keys(analysis);
        if (analysisFields.length >= 10) {
            score += 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    // CROSS-VALIDATION SCORING
    scoreCrossValidation(analysis, metadata) {
        let score = 60; // Base cross-validation score
        
        // This would check against multiple sources/analyses
        // For now, we'll use internal consistency checks
        
        // Consistency between impact level and urgency
        if (analysis.impactLevel === 'Critical' && ['High', 'Urgent'].includes(analysis.urgency)) {
            score += 15;
        }
        
        if (analysis.impactLevel === 'Informational' && ['Low', 'Medium'].includes(analysis.urgency)) {
            score += 10;
        }
        
        // Consistency between risk level and impact
        if (analysis.riskLevel === 'High' && ['Critical', 'Significant'].includes(analysis.impactLevel)) {
            score += 10;
        }
        
        // Authority and area consistency
        if (metadata.authority === 'FCA' && analysis.area.includes('Consumer')) {
            score += 5;
        }
        
        if (metadata.authority === 'PRA' && analysis.area.includes('Capital')) {
            score += 5;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    // TIME RELEVANCE SCORING
    scoreTimeRelevance(metadata) {
        let score = 80; // Base time relevance
        
        const publishDate = metadata.publishDate || metadata.pubDate;
        if (publishDate) {
            const daysSincePublish = this.getDaysSince(publishDate);
            
            if (daysSincePublish <= 1) {
                score = 100; // Very fresh
            } else if (daysSincePublish <= 7) {
                score = 90;  // Recent
            } else if (daysSincePublish <= 30) {
                score = 80;  // Current
            } else if (daysSincePublish <= 90) {
                score = 70;  // Somewhat dated
            } else {
                score = 60;  // Older content
            }
        }
        
        return Math.max(0, Math.min(100, score));
    }

    // CONFIDENCE MODIFIERS
    applyConfidenceModifiers(baseConfidence, analysis, metadata) {
        let modifiedConfidence = baseConfidence;
        
        // Official publication boost
        if (this.isOfficialPublication(metadata)) {
            modifiedConfidence += 10;
        }
        
        // Multiple sector impact (complexity penalty)
        if (analysis.primarySectors && analysis.primarySectors.length > 4) {
            modifiedConfidence -= 5;
        }
        
        // Specific deadline boost
        if (analysis.consultationDeadline && analysis.consultationDeadline.includes('2024')) {
            modifiedConfidence += 8;
        }
        
        // Technical complexity assessment
        if (analysis.area && analysis.area.includes('Technical')) {
            modifiedConfidence += 5;
        }
        
        // Emergency/urgent penalty (often less predictable)
        if (analysis.urgency === 'Urgent') {
            modifiedConfidence -= 5;
        }
        
        return modifiedConfidence;
    }

    // HELPER METHODS
    isOfficialDomain(url) {
        const officialDomains = [
            'fca.org.uk', 'bankofengland.co.uk', 'gov.uk', 
            'eba.europa.eu', 'bis.org', 'iosco.org'
        ];
        return officialDomains.some(domain => url.includes(domain));
    }

    isOfficialPublication(metadata) {
        const officialTypes = ['Policy Statement', 'Consultation Paper', 'Technical Standard', 'Guidance'];
        return officialTypes.includes(metadata.documentType);
    }

    getDaysSince(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            return Math.floor((now - date) / (1000 * 60 * 60 * 24));
        } catch (error) {
            return 30; // Default to 30 days if parsing fails
        }
    }

    getConfidenceFactors(analysis, metadata) {
        const factors = [];
        
        if (this.isOfficialDomain(metadata.url)) {
            factors.push('Official regulatory source');
        }
        
        if (analysis.keyDates && analysis.keyDates !== 'None identified') {
            factors.push('Specific dates identified');
        }
        
        if (analysis.consultationDeadline && analysis.consultationDeadline !== 'None') {
            factors.push('Clear consultation deadline');
        }
        
        if (metadata.authority && this.authorityReliability[metadata.authority] > 85) {
            factors.push('High-reliability authority');
        }
        
        if (analysis.sectorRelevanceScores && Object.keys(analysis.sectorRelevanceScores).length > 2) {
            factors.push('Detailed sector analysis');
        }
        
        return factors;
    }

    getReliabilityLevel(confidence) {
        if (confidence >= 85) return 'Very High';
        if (confidence >= 75) return 'High';
        if (confidence >= 60) return 'Medium';
        if (confidence >= 40) return 'Low';
        return 'Very Low';
    }

    // BATCH CONFIDENCE SCORING
    calculateBatchConfidence(analyses) {
        const results = [];
        
        for (const item of analyses) {
            const confidence = this.calculateConfidence(item.analysis, item.metadata);
            results.push({
                ...item,
                confidence: confidence
            });
        }
        
        // Calculate average confidence
        const averageConfidence = results.reduce((sum, item) => 
            sum + item.confidence.confidence, 0) / results.length;
        
        return {
            results,
            averageConfidence: Math.round(averageConfidence),
            highConfidenceCount: results.filter(r => r.confidence.confidence >= 75).length,
            lowConfidenceCount: results.filter(r => r.confidence.confidence < 50).length
        };
    }
}

module.exports = ConfidenceScoring;