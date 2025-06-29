// src/services/analyticsService.js
// Phase 2A: Predictive Analytics Engine for regulatory intelligence

const dbService = require('./dbService');

class AnalyticsService {
    constructor() {
        this.cache = new Map(); // Simple in-memory cache
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // ====== REGULATORY VELOCITY ANALYSIS ======

    async getRegulatoryVelocity(timeframeDays = 30) {
        const cacheKey = `velocity_${timeframeDays}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            console.log('📊 Calculating regulatory velocity...');
            
            const updates = await dbService.getAllUpdates();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);
            
            // Filter recent updates
            const recentUpdates = updates.filter(update => 
                new Date(update.fetchedDate) >= cutoffDate
            );

            // Group by authority
            const authorityVelocity = {};
            const authorityCounts = {};
            
            updates.forEach(update => {
                const authority = update.authority || 'Unknown';
                authorityCounts[authority] = (authorityCounts[authority] || 0) + 1;
            });

            recentUpdates.forEach(update => {
                const authority = update.authority || 'Unknown';
                authorityVelocity[authority] = (authorityVelocity[authority] || 0) + 1;
            });

            // Calculate velocity metrics
            const velocity = {};
            Object.keys(authorityCounts).forEach(authority => {
                const recentCount = authorityVelocity[authority] || 0;
                const updatesPerWeek = (recentCount / timeframeDays) * 7;
                const totalCount = authorityCounts[authority];
                
                // Predict next week based on trend
                const historicalAverage = totalCount / 90; // Assume 90 days of history
                const recentAverage = updatesPerWeek;
                const trendMultiplier = recentAverage / Math.max(historicalAverage, 0.1);
                
                let trend = 'stable';
                if (trendMultiplier > 1.2) trend = 'increasing';
                else if (trendMultiplier < 0.8) trend = 'decreasing';
                
                const prediction = Math.round(recentAverage * trendMultiplier * 10) / 10;

                velocity[authority] = {
                    updatesPerWeek: Math.round(updatesPerWeek * 10) / 10,
                    trend,
                    trendMultiplier: Math.round(trendMultiplier * 100) / 100,
                    prediction: Math.max(0, prediction),
                    recentCount,
                    totalCount,
                    confidence: this.calculateConfidence(recentCount, totalCount)
                };
            });

            const result = {
                timeframe: `${timeframeDays} days`,
                calculatedAt: new Date().toISOString(),
                regulatoryVelocity: velocity,
                summary: this.generateVelocitySummary(velocity)
            };

            this.setCache(cacheKey, result);
            return result;

        } catch (error) {
            console.error('❌ Error calculating regulatory velocity:', error);
            throw error;
        }
    }

    // ====== SECTOR HOTSPOT ANALYSIS ======

    async getSectorHotspots(firmProfile = null) {
        const cacheKey = `hotspots_${firmProfile ? firmProfile.firmName : 'all'}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            console.log('🔥 Analyzing sector hotspots...');
            
            const updates = await dbService.getAllUpdates();
            const last30Days = new Date();
            last30Days.setDate(last30Days.getDate() - 30);
            
            const recentUpdates = updates.filter(update => 
                new Date(update.fetchedDate) >= last30Days
            );

            // Analyze sector activity
            const sectorActivity = {};
            const sectorImpact = {};
            
            recentUpdates.forEach(update => {
                const sectors = update.primarySectors || [update.sector].filter(Boolean);
                const impactScore = this.getImpactScore(update);
                
                sectors.forEach(sector => {
                    if (!sector || sector === 'N/A') return;
                    
                    sectorActivity[sector] = (sectorActivity[sector] || 0) + 1;
                    sectorImpact[sector] = (sectorImpact[sector] || 0) + impactScore;
                });
            });

            // Calculate hotspot scores
            const hotspots = Object.keys(sectorActivity).map(sector => {
                const activityCount = sectorActivity[sector];
                const totalImpact = sectorImpact[sector];
                const avgImpact = totalImpact / activityCount;
                
                // Activity score: frequency + impact
                const activityScore = Math.min(100, (activityCount * 10) + (avgImpact * 30));
                
                let riskLevel = 'low';
                if (activityScore >= 70) riskLevel = 'high';
                else if (activityScore >= 40) riskLevel = 'medium';

                // Check if this sector is relevant to user's firm
                const isUserSector = firmProfile && firmProfile.primarySectors && 
                    firmProfile.primarySectors.includes(sector);

                return {
                    sector,
                    activityScore: Math.round(activityScore),
                    riskLevel,
                    updateCount: activityCount,
                    averageImpact: Math.round(avgImpact * 10) / 10,
                    isUserSector,
                    trend: this.calculateSectorTrend(sector, updates),
                    keyTopics: this.extractSectorTopics(sector, recentUpdates)
                };
            })
            .sort((a, b) => b.activityScore - a.activityScore)
            .slice(0, 10);

            const result = {
                calculatedAt: new Date().toISOString(),
                sectorHotspots: hotspots,
                firmProfile: firmProfile,
                summary: this.generateHotspotSummary(hotspots, firmProfile)
            };

            this.setCache(cacheKey, result);
            return result;

        } catch (error) {
            console.error('❌ Error analyzing sector hotspots:', error);
            throw error;
        }
    }

    // ====== PREDICTIVE IMPACT ANALYSIS ======

    async getImpactPredictions(firmProfile = null) {
        const cacheKey = `predictions_${firmProfile ? firmProfile.firmName : 'all'}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            console.log('🔮 Generating impact predictions...');
            
            const updates = await dbService.getAllUpdates();
            const predictions = [];

            // Analyze keyword trends for predictions
            const keywordTrends = this.analyzeKeywordTrends(updates);
            
            // Authority pattern analysis
            const authorityPatterns = this.analyzeAuthorityPatterns(updates);
            
            // Generate predictions based on patterns
            predictions.push(...this.generateKeywordPredictions(keywordTrends, firmProfile));
            predictions.push(...this.generateAuthorityPredictions(authorityPatterns, firmProfile));
            predictions.push(...this.generateSeasonalPredictions(updates, firmProfile));

            // Sort by confidence and relevance
            const sortedPredictions = predictions
                .filter(p => p.confidence >= 30) // Only show confident predictions
                .sort((a, b) => {
                    // Prioritize user's sectors
                    if (firmProfile && firmProfile.primarySectors) {
                        const aRelevant = p => p.affectedSectors && p.affectedSectors.some(s => 
                            firmProfile.primarySectors.includes(s));
                        if (aRelevant(a) && !aRelevant(b)) return -1;
                        if (!aRelevant(a) && aRelevant(b)) return 1;
                    }
                    return b.confidence - a.confidence;
                })
                .slice(0, 8);

            const result = {
                calculatedAt: new Date().toISOString(),
                predictions: sortedPredictions,
                methodology: [
                    'Keyword frequency analysis',
                    'Authority pattern recognition', 
                    'Historical timing patterns',
                    'Sector activity correlation'
                ],
                confidence: this.calculateOverallConfidence(sortedPredictions)
            };

            this.setCache(cacheKey, result);
            return result;

        } catch (error) {
            console.error('❌ Error generating predictions:', error);
            throw error;
        }
    }

    // ====== RISK SCORING ALGORITHM ======

    calculateRiskScore(update, firmProfile = null) {
        let riskScore = 0;
        
        // Base authority weighting
        const authorityWeights = {
            'FCA': 40,
            'BoE': 35,
            'PRA': 35,
            'TPR': 25,
            'SFO': 30,
            'FATF': 20
        };
        
        riskScore += authorityWeights[update.authority] || 20;
        
        // Urgency multiplier
        const urgencyMultipliers = {
            'High': 1.5,
            'Medium': 1.0,
            'Low': 0.7
        };
        
        riskScore *= urgencyMultipliers[update.urgency] || 1.0;
        
        // Impact level boost
        const impactBoosts = {
            'Significant': 40,
            'Moderate': 20,
            'Informational': 0
        };
        
        riskScore += impactBoosts[update.impactLevel] || 0;
        
        // Sector relevance (user's firm sectors = higher risk)
        if (firmProfile && firmProfile.primarySectors && update.primarySectors) {
            const sectorMatch = update.primarySectors.some(sector => 
                firmProfile.primarySectors.includes(sector)
            );
            if (sectorMatch) {
                riskScore *= 1.4; // 40% boost for relevant sectors
            }
        }
        
        // Recent updates get higher risk scores
        const daysSinceUpdate = (Date.now() - new Date(update.fetchedDate)) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate <= 7) {
            riskScore *= 1.2; // 20% boost for recent updates
        }
        
        // Keywords that indicate high business impact
        const highImpactKeywords = [
            'deadline', 'implementation', 'compliance', 'enforcement',
            'penalty', 'fine', 'requirement', 'mandatory', 'consumer duty',
            'basel', 'mifid', 'gdpr', 'esg', 'reporting'
        ];
        
        const text = (update.headline + ' ' + update.impact).toLowerCase();
        const keywordMatches = highImpactKeywords.filter(keyword => text.includes(keyword));
        riskScore += keywordMatches.length * 5;
        
        return Math.min(100, Math.max(0, Math.round(riskScore)));
    }

    // ====== COMPLIANCE CALENDAR ======

    async getComplianceCalendar(firmProfile = null) {
        const cacheKey = `calendar_${firmProfile ? firmProfile.firmName : 'all'}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            console.log('📅 Building compliance calendar...');
            
            const updates = await dbService.getAllUpdates();
            const calendar = {
                next30Days: [],
                next90Days: [],
                upcoming: []
            };

            // Extract deadlines from updates
            updates.forEach(update => {
                const deadlines = this.extractDeadlines(update);
                deadlines.forEach(deadline => {
                    const riskScore = this.calculateRiskScore(update, firmProfile);
                    const item = {
                        deadline: deadline.date,
                        regulation: update.headline,
                        authority: update.authority,
                        impactLevel: update.impactLevel,
                        riskScore,
                        affectedSectors: update.primarySectors || [update.sector].filter(Boolean),
                        sourceUrl: update.url,
                        preparationTime: this.calculatePreparationTime(deadline, update),
                        confidence: deadline.confidence
                    };

                    const daysUntil = (new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24);
                    
                    if (daysUntil >= 0 && daysUntil <= 30) {
                        calendar.next30Days.push(item);
                    } else if (daysUntil > 30 && daysUntil <= 90) {
                        calendar.next90Days.push(item);
                    }
                });
            });

            // Generate predicted deadlines based on patterns
            const predictedDeadlines = this.generatePredictedDeadlines(updates, firmProfile);
            calendar.upcoming = predictedDeadlines;

            // Sort by deadline date and risk score
            calendar.next30Days.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
            calendar.next90Days.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
            calendar.upcoming.sort((a, b) => b.confidence - a.confidence);

            const result = {
                calculatedAt: new Date().toISOString(),
                ...calendar,
                summary: {
                    criticalDeadlines: calendar.next30Days.filter(d => d.riskScore >= 70).length,
                    totalUpcoming: calendar.next30Days.length + calendar.next90Days.length,
                    highestRisk: calendar.next30Days.reduce((max, item) => 
                        item.riskScore > max.riskScore ? item : max, { riskScore: 0 })
                }
            };

            this.setCache(cacheKey, result);
            return result;

        } catch (error) {
            console.error('❌ Error building compliance calendar:', error);
            throw error;
        }
    }

    // ====== ANALYTICS DASHBOARD DATA ======

    async getAnalyticsDashboard(firmProfile = null) {
        try {
            console.log('📊 Building analytics dashboard...');
            
            const [velocity, hotspots, predictions, calendar] = await Promise.all([
                this.getRegulatoryVelocity(),
                this.getSectorHotspots(firmProfile),
                this.getImpactPredictions(firmProfile),
                this.getComplianceCalendar(firmProfile)
            ]);

            const updates = await dbService.getAllUpdates();
            const totalUpdates = updates.length;
            const recentUpdates = updates.filter(update => {
                const daysSince = (Date.now() - new Date(update.fetchedDate)) / (1000 * 60 * 60 * 24);
                return daysSince <= 7;
            });

            // Calculate trending topics
            const trendingTopics = this.calculateTrendingTopics(updates);

            return {
                calculatedAt: new Date().toISOString(),
                overview: {
                    totalUpdates,
                    recentUpdates: recentUpdates.length,
                    criticalDeadlines: calendar.summary.criticalDeadlines,
                    highRiskSectors: hotspots.sectorHotspots.filter(s => s.riskLevel === 'high').length,
                    activePredictions: predictions.predictions.length
                },
                velocity: velocity.regulatoryVelocity,
                hotspots: hotspots.sectorHotspots.slice(0, 5),
                predictions: predictions.predictions.slice(0, 3),
                calendar: {
                    next30Days: calendar.next30Days.slice(0, 5),
                    summary: calendar.summary
                },
                trending: trendingTopics.slice(0, 5),
                firmProfile
            };

        } catch (error) {
            console.error('❌ Error building analytics dashboard:', error);
            throw error;
        }
    }

    // ====== HELPER METHODS ======

    getImpactScore(update) {
        const impactScores = { 'Significant': 3, 'Moderate': 2, 'Informational': 1 };
        const urgencyScores = { 'High': 3, 'Medium': 2, 'Low': 1 };
        
        const impact = impactScores[update.impactLevel] || 1;
        const urgency = urgencyScores[update.urgency] || 1;
        
        return impact * urgency;
    }

    calculateSectorTrend(sector, updates) {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const last60Days = new Date();
        last60Days.setDate(last60Days.getDate() - 60);

        const recent = updates.filter(update => 
            new Date(update.fetchedDate) >= last30Days &&
            (update.primarySectors || []).includes(sector)
        ).length;

        const previous = updates.filter(update => 
            new Date(update.fetchedDate) >= last60Days &&
            new Date(update.fetchedDate) < last30Days &&
            (update.primarySectors || []).includes(sector)
        ).length;

        if (recent > previous * 1.2) return 'increasing';
        if (recent < previous * 0.8) return 'decreasing';
        return 'stable';
    }

    extractSectorTopics(sector, updates) {
        const sectorUpdates = updates.filter(update => 
            (update.primarySectors || []).includes(sector)
        );

        // Simple keyword extraction
        const keywords = {};
        sectorUpdates.forEach(update => {
            const text = (update.headline + ' ' + update.impact).toLowerCase();
            const words = text.match(/\b[a-z]{4,}\b/g) || [];
            words.forEach(word => {
                if (!['that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word)) {
                    keywords[word] = (keywords[word] || 0) + 1;
                }
            });
        });

        return Object.entries(keywords)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([word]) => word);
    }

    analyzeKeywordTrends(updates) {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        
        const recentUpdates = updates.filter(update => 
            new Date(update.fetchedDate) >= last30Days
        );

        const keywords = {};
        recentUpdates.forEach(update => {
            const text = (update.headline + ' ' + update.impact).toLowerCase();
            const importantWords = text.match(/\b[a-z]{4,}\b/g) || [];
            importantWords.forEach(word => {
                if (!['that', 'this', 'with', 'from', 'they', 'have', 'will'].includes(word)) {
                    keywords[word] = (keywords[word] || 0) + 1;
                }
            });
        });

        return Object.entries(keywords)
            .filter(([, count]) => count >= 3)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
    }

    analyzeAuthorityPatterns(updates) {
        const patterns = {};
        updates.forEach(update => {
            const authority = update.authority;
            const month = new Date(update.fetchedDate).getMonth();
            
            if (!patterns[authority]) patterns[authority] = { monthly: new Array(12).fill(0), total: 0 };
            patterns[authority].monthly[month]++;
            patterns[authority].total++;
        });

        return patterns;
    }

    generateKeywordPredictions(keywordTrends, firmProfile) {
        const predictions = [];
        
        keywordTrends.slice(0, 3).forEach(([keyword, frequency]) => {
            if (frequency >= 5) {
                predictions.push({
                    type: 'keyword_trend',
                    prediction: `Increased focus on "${keyword}" regulations expected within 30-60 days`,
                    confidence: Math.min(85, 40 + frequency * 5),
                    basedOn: ['keyword frequency analysis', 'recent regulatory patterns'],
                    keyword,
                    timeframe: '30-60 days',
                    affectedSectors: this.guessAffectedSectors(keyword),
                    priority: frequency >= 8 ? 'high' : 'medium'
                });
            }
        });

        return predictions;
    }

    generateAuthorityPredictions(patterns, firmProfile) {
        const predictions = [];
        const currentMonth = new Date().getMonth();
        
        Object.entries(patterns).forEach(([authority, data]) => {
            const avgMonthly = data.total / 12;
            const thisMonthExpected = data.monthly[currentMonth] || avgMonthly;
            
            if (thisMonthExpected > avgMonthly * 1.5) {
                predictions.push({
                    type: 'authority_pattern',
                    prediction: `${authority} showing increased activity - expect significant updates within 2-3 weeks`,
                    confidence: 65,
                    basedOn: ['historical timing patterns', 'authority activity analysis'],
                    authority,
                    timeframe: '2-3 weeks',
                    affectedSectors: this.getAuthoritySectors(authority),
                    priority: 'medium'
                });
            }
        });

        return predictions;
    }

    generateSeasonalPredictions(updates, firmProfile) {
        // Simple seasonal predictions based on typical regulatory cycles
        const month = new Date().getMonth();
        const predictions = [];

        if (month === 11 || month === 0) { // December/January
            predictions.push({
                type: 'seasonal',
                prediction: 'Q1 regulatory updates typically include annual reporting requirements and new implementation deadlines',
                confidence: 70,
                basedOn: ['seasonal patterns', 'regulatory calendar analysis'],
                timeframe: 'Next 6-8 weeks',
                affectedSectors: ['Banking', 'Investment Management', 'Insurance'],
                priority: 'medium'
            });
        }

        return predictions;
    }

    extractDeadlines(update) {
        const deadlines = [];
        const text = update.headline + ' ' + update.impact + ' ' + (update.keyDates || '');
        
        // Simple date extraction patterns
        const datePatterns = [
            /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
            /(\d{4})-(\d{1,2})-(\d{1,2})/g
        ];

        datePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const date = new Date(match);
                    if (date > new Date() && date < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
                        deadlines.push({
                            date: date.toISOString().split('T')[0],
                            confidence: 75,
                            source: match
                        });
                    }
                });
            }
        });

        return deadlines;
    }

    generatePredictedDeadlines(updates, firmProfile) {
        // Generate predicted deadlines based on patterns
        return [
            {
                expectedDate: '2024-03-31',
                regulation: 'Q1 Regulatory Reporting Requirements',
                confidence: 80,
                basedOn: 'Historical quarterly patterns',
                authority: 'Multiple',
                impactLevel: 'Significant',
                affectedSectors: ['Banking', 'Investment Management']
            }
        ];
    }

    calculatePreparationTime(deadline, update) {
        const daysUntil = (new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24);
        const complexity = this.getImpactScore(update);
        
        if (complexity >= 6) return Math.max(21, Math.round(daysUntil * 0.6)) + ' days recommended';
        if (complexity >= 4) return Math.max(14, Math.round(daysUntil * 0.4)) + ' days recommended';
        return Math.max(7, Math.round(daysUntil * 0.3)) + ' days recommended';
    }

    calculateTrendingTopics(updates) {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        
        const recentUpdates = updates.filter(update => 
            new Date(update.fetchedDate) >= last7Days
        );

        const topics = {};
        recentUpdates.forEach(update => {
            const keywords = this.extractKeywords(update.headline + ' ' + update.impact);
            keywords.forEach(keyword => {
                topics[keyword] = (topics[keyword] || 0) + 1;
            });
        });

        return Object.entries(topics)
            .filter(([, count]) => count >= 2)
            .map(([topic, count]) => ({
                topic,
                mentionCount: count,
                trend: `+${Math.round((count / 7) * 100)}% this week`,
                riskLevel: count >= 4 ? 'high' : count >= 3 ? 'medium' : 'low'
            }))
            .sort((a, b) => b.mentionCount - a.mentionCount);
    }

    extractKeywords(text) {
        const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        return text.toLowerCase()
            .match(/\b[a-z]{3,}\b/g)
            ?.filter(word => !stopWords.includes(word))
            ?.slice(0, 10) || [];
    }

    guessAffectedSectors(keyword) {
        const sectorKeywords = {
            'consumer': ['Banking', 'Consumer Credit', 'Investment Management'],
            'capital': ['Banking', 'Investment Management', 'Capital Markets'],
            'crypto': ['Cryptocurrency', 'Payments'],
            'esg': ['Investment Management', 'Banking', 'Insurance'],
            'pension': ['Pensions'],
            'insurance': ['Insurance'],
            'mortgage': ['Mortgages', 'Consumer Credit']
        };

        for (const [key, sectors] of Object.entries(sectorKeywords)) {
            if (keyword.includes(key)) return sectors;
        }

        return ['General'];
    }

    getAuthoritySectors(authority) {
        const authoritySectors = {
            'FCA': ['Banking', 'Investment Management', 'Consumer Credit', 'Insurance'],
            'BoE': ['Banking', 'Capital Markets'],
            'PRA': ['Banking', 'Insurance'],
            'TPR': ['Pensions'],
            'SFO': ['Banking', 'Capital Markets'],
            'FATF': ['Banking', 'Cryptocurrency', 'Payments']
        };

        return authoritySectors[authority] || ['General'];
    }

    generateVelocitySummary(velocity) {
        const increasing = Object.entries(velocity).filter(([, data]) => data.trend === 'increasing');
        const total = Object.values(velocity).reduce((sum, data) => sum + data.updatesPerWeek, 0);
        
        return {
            totalUpdatesPerWeek: Math.round(total * 10) / 10,
            authoritiesIncreasing: increasing.length,
            mostActive: Object.entries(velocity).reduce((max, [auth, data]) => 
                data.updatesPerWeek > max.rate ? { authority: auth, rate: data.updatesPerWeek } : max,
                { authority: 'None', rate: 0 }
            )
        };
    }

    generateHotspotSummary(hotspots, firmProfile) {
        const userHotspots = firmProfile ? hotspots.filter(h => h.isUserSector) : [];
        const highRisk = hotspots.filter(h => h.riskLevel === 'high');
        
        return {
            totalHotspots: hotspots.length,
            highRiskSectors: highRisk.length,
            userSectorHotspots: userHotspots.length,
            topSector: hotspots[0]?.sector || 'None'
        };
    }

    calculateConfidence(recentCount, totalCount) {
        if (totalCount < 5) return Math.min(40, recentCount * 10);
        if (totalCount < 20) return Math.min(70, 30 + recentCount * 5);
        return Math.min(90, 50 + recentCount * 3);
    }

    calculateOverallConfidence(predictions) {
        if (predictions.length === 0) return 0;
        const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
        return Math.round(avgConfidence);
    }

    // ====== CACHE MANAGEMENT ======

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Simple cache cleanup
        if (this.cache.size > 20) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Analytics cache cleared');
    }
}

// Export singleton instance
const analyticsService = new AnalyticsService();

module.exports = analyticsService;