// src/services/relevanceService.js
// Phase 1.3: Industry relevance calculation service

const dbService = require('./dbService');
const { INDUSTRY_SECTORS } = require('./aiAnalyzer');

class RelevanceService {
    constructor() {
        this.firmProfile = null;
        this.lastProfileCheck = null;
    }

    // Calculate relevance score for a single update based on firm profile
    calculateRelevanceScore(update, firmProfile) {
        // Default relevance if no firm profile
        if (!firmProfile || !firmProfile.primarySectors || firmProfile.primarySectors.length === 0) {
            return this.getDefaultRelevance(update);
        }

        // Use AI-calculated sector relevance scores if available
        if (update.sectorRelevanceScores && typeof update.sectorRelevanceScores === 'object') {
            return this.calculateFromSectorScores(update.sectorRelevanceScores, firmProfile);
        }

        // Fallback to basic sector matching
        return this.calculateBasicRelevance(update, firmProfile);
    }

    // Calculate relevance using AI sector scores
    calculateFromSectorScores(sectorRelevanceScores, firmProfile) {
        let maxScore = 0;
        let totalScore = 0;
        let matchCount = 0;

        firmProfile.primarySectors.forEach(firmSector => {
            if (sectorRelevanceScores[firmSector] !== undefined) {
                const score = sectorRelevanceScores[firmSector];
                maxScore = Math.max(maxScore, score);
                totalScore += score;
                matchCount++;
            }
        });

        if (matchCount === 0) {
            // No matching sectors, use general score or default
            return sectorRelevanceScores['General'] || 30;
        }

        // Use the highest score among firm's sectors
        // Add bonus for multiple sector matches
        const averageScore = totalScore / matchCount;
        const bonusMultiplier = matchCount > 1 ? 1.1 : 1.0;
        
        return Math.min(100, Math.round(Math.max(maxScore, averageScore) * bonusMultiplier));
    }

    // Basic relevance calculation for updates without AI sector scores
    calculateBasicRelevance(update, firmProfile) {
        let relevanceScore = 40; // Base relevance

        // Check primary sectors match
        if (update.primarySectors && Array.isArray(update.primarySectors)) {
            const hasDirectMatch = update.primarySectors.some(sector => 
                firmProfile.primarySectors.includes(sector)
            );
            if (hasDirectMatch) {
                relevanceScore = 85; // High relevance for direct match
            }
        }

        // Check single sector field
        if (update.sector && firmProfile.primarySectors.includes(update.sector)) {
            relevanceScore = Math.max(relevanceScore, 80);
        }

        // Authority-based adjustments
        if (update.authority) {
            const authorityRelevance = this.getAuthorityRelevance(update.authority, firmProfile);
            relevanceScore = Math.max(relevanceScore, authorityRelevance);
        }

        // Impact level adjustments
        if (update.impactLevel) {
            const impactBonus = this.getImpactBonus(update.impactLevel);
            relevanceScore += impactBonus;
        }

        // Urgency adjustments  
        if (update.urgency) {
            const urgencyBonus = this.getUrgencyBonus(update.urgency);
            relevanceScore += urgencyBonus;
        }

        return Math.min(100, Math.max(0, relevanceScore));
    }

    // Get default relevance when no firm profile exists
    getDefaultRelevance(update) {
        let score = 50; // Neutral relevance

        // Boost for high impact or urgent items
        if (update.impactLevel === 'Significant') score += 15;
        if (update.urgency === 'High') score += 10;
        
        // Authority-based defaults
        const authorityDefaults = {
            'FCA': 60,
            'BoE': 55,
            'PRA': 55,
            'TPR': 45,
            'SFO': 40,
            'FATF': 35
        };

        const authorityScore = authorityDefaults[update.authority] || 50;
        return Math.max(score, authorityScore);
    }

    // Calculate authority relevance based on firm sectors
    getAuthorityRelevance(authority, firmProfile) {
        const authorityRelevanceMap = {
            'FCA': {
                'Banking': 90,
                'Investment Management': 95,
                'Consumer Credit': 85,
                'Insurance': 70,
                'Payments': 80,
                'Mortgages': 75,
                'Capital Markets': 90,
                'Cryptocurrency': 85,
                'Fintech': 85,
                'General': 60
            },
            'BoE': {
                'Banking': 95,
                'Investment Management': 60,
                'Consumer Credit': 70,
                'Insurance': 50,
                'Payments': 75,
                'Capital Markets': 80,
                'General': 55
            },
            'PRA': {
                'Banking': 95,
                'Investment Management': 80,
                'Insurance': 90,
                'Capital Markets': 70,
                'General': 55
            },
            'TPR': {
                'Pensions': 95,
                'Investment Management': 70,
                'Banking': 40,
                'Insurance': 60,
                'General': 35
            },
            'SFO': {
                'Banking': 70,
                'Investment Management': 75,
                'Capital Markets': 80,
                'General': 40
            },
            'FATF': {
                'Banking': 60,
                'Payments': 70,
                'Cryptocurrency': 85,
                'General': 35
            }
        };

        const authorityMap = authorityRelevanceMap[authority];
        if (!authorityMap) return 40;

        let maxRelevance = 0;
        firmProfile.primarySectors.forEach(sector => {
            if (authorityMap[sector]) {
                maxRelevance = Math.max(maxRelevance, authorityMap[sector]);
            }
        });

        return maxRelevance || (authorityMap['General'] || 40);
    }

    // Get impact level bonus
    getImpactBonus(impactLevel) {
        const bonuses = {
            'Significant': 15,
            'Moderate': 5,
            'Informational': 0
        };
        return bonuses[impactLevel] || 0;
    }

    // Get urgency bonus
    getUrgencyBonus(urgency) {
        const bonuses = {
            'High': 10,
            'Medium': 5,
            'Low': 0
        };
        return bonuses[urgency] || 0;
    }

    // Categorize updates by relevance levels
    categorizeByRelevance(updates, firmProfile) {
        const categorized = {
            high: [],      // 70-100
            medium: [],    // 40-69
            low: []        // 0-39
        };

        updates.forEach(update => {
            const relevanceScore = this.calculateRelevanceScore(update, firmProfile);
            const updateWithScore = { ...update, relevanceScore };

            if (relevanceScore >= 70) {
                categorized.high.push(updateWithScore);
            } else if (relevanceScore >= 40) {
                categorized.medium.push(updateWithScore);
            } else {
                categorized.low.push(updateWithScore);
            }
        });

        // Sort each category by relevance score (highest first)
        Object.keys(categorized).forEach(key => {
            categorized[key].sort((a, b) => b.relevanceScore - a.relevanceScore);
        });

        return categorized;
    }

    // Get cached firm profile or fetch fresh one
    async getFirmProfile() {
        const now = Date.now();
        
        // Cache profile for 5 minutes to avoid repeated DB calls
        if (this.firmProfile && this.lastProfileCheck && (now - this.lastProfileCheck) < 300000) {
            return this.firmProfile;
        }

        try {
            this.firmProfile = await dbService.getFirmProfile();
            this.lastProfileCheck = now;
            return this.firmProfile;
        } catch (error) {
            console.error('❌ Error fetching firm profile:', error);
            return null;
        }
    }

    // Invalidate cached profile (call when profile is updated)
    invalidateProfileCache() {
        this.firmProfile = null;
        this.lastProfileCheck = null;
    }

    // Get relevance statistics for all updates
    async getRelevanceStats() {
        try {
            const firmProfile = await this.getFirmProfile();
            const updates = await dbService.getAllUpdates();
            
            const categorized = this.categorizeByRelevance(updates, firmProfile);
            
            const stats = {
                total: updates.length,
                high: categorized.high.length,
                medium: categorized.medium.length,
                low: categorized.low.length,
                averageRelevance: 0,
                firmProfile: firmProfile
            };

            // Calculate average relevance
            if (updates.length > 0) {
                const totalRelevance = [...categorized.high, ...categorized.medium, ...categorized.low]
                    .reduce((sum, update) => sum + update.relevanceScore, 0);
                stats.averageRelevance = Math.round(totalRelevance / updates.length);
            }

            return stats;
        } catch (error) {
            console.error('❌ Error calculating relevance stats:', error);
            throw error;
        }
    }

    // Get sector-specific relevance insights
    async getSectorRelevanceInsights(targetSector) {
        try {
            const updates = await dbService.getAllUpdates();
            
            const sectorUpdates = updates.filter(update => {
                // Check if update is relevant to the target sector
                if (update.sectorRelevanceScores && update.sectorRelevanceScores[targetSector]) {
                    return update.sectorRelevanceScores[targetSector] >= 50;
                }
                
                if (update.primarySectors && update.primarySectors.includes(targetSector)) {
                    return true;
                }
                
                return update.sector === targetSector;
            });

            return {
                sector: targetSector,
                totalUpdates: sectorUpdates.length,
                averageRelevance: this.calculateAverageSectorRelevance(sectorUpdates, targetSector),
                recentCount: this.getRecentCount(sectorUpdates),
                topAuthorities: this.getTopAuthorities(sectorUpdates),
                impactDistribution: this.getImpactDistribution(sectorUpdates)
            };
        } catch (error) {
            console.error(`❌ Error getting sector insights for ${targetSector}:`, error);
            throw error;
        }
    }

    // Helper methods for sector insights
    calculateAverageSectorRelevance(updates, sector) {
        if (updates.length === 0) return 0;
        
        let totalRelevance = 0;
        updates.forEach(update => {
            if (update.sectorRelevanceScores && update.sectorRelevanceScores[sector]) {
                totalRelevance += update.sectorRelevanceScores[sector];
            } else {
                totalRelevance += 50; // Default for legacy updates
            }
        });
        
        return Math.round(totalRelevance / updates.length);
    }

    getRecentCount(updates) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        return updates.filter(update => {
            const updateDate = new Date(update.fetchedDate);
            return updateDate >= sevenDaysAgo;
        }).length;
    }

    getTopAuthorities(updates) {
        const authorityCount = {};
        updates.forEach(update => {
            const authority = update.authority || 'Unknown';
            authorityCount[authority] = (authorityCount[authority] || 0) + 1;
        });
        
        return Object.entries(authorityCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([authority, count]) => ({ authority, count }));
    }

    getImpactDistribution(updates) {
        const distribution = { Significant: 0, Moderate: 0, Informational: 0 };
        updates.forEach(update => {
            const impact = update.impactLevel || 'Informational';
            if (distribution.hasOwnProperty(impact)) {
                distribution[impact]++;
            }
        });
        return distribution;
    }

    // Update all existing updates with new relevance scores
    async recalculateAllRelevanceScores() {
        console.log('🔄 Recalculating relevance scores for all updates...');
        
        try {
            const firmProfile = await this.getFirmProfile();
            const updates = await dbService.getAllUpdates();
            
            let updatedCount = 0;
            
            for (const update of updates) {
                const newRelevanceScore = this.calculateRelevanceScore(update, firmProfile);
                
                if (newRelevanceScore !== update.relevanceScore) {
                    update.relevanceScore = newRelevanceScore;
                    await dbService.saveUpdate(update);
                    updatedCount++;
                }
            }
            
            console.log(`✅ Recalculated relevance for ${updatedCount} updates`);
            return {
                totalUpdates: updates.length,
                updatedCount,
                firmProfile
            };
            
        } catch (error) {
            console.error('❌ Error recalculating relevance scores:', error);
            throw error;
        }
    }
}

// Export singleton instance
const relevanceService = new RelevanceService();

module.exports = relevanceService;