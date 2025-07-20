// src/models/RegulatoryAlert.js
// Regulatory Alert Model for proactive alerting with business context and firm targeting
// Enables intelligent notification system based on firm profiles and AI insights

const dbService = require('../services/dbService');

class RegulatoryAlert {
    constructor(data = {}) {
        this.id = data.id || null;
        this.updateId = data.updateId || null; // Reference to regulatory_updates table
        this.firmProfileId = data.firmProfileId || null; // Reference to firm_profiles table
        this.aiInsightId = data.aiInsightId || null; // Reference to ai_insights table
        this.alertType = data.alertType || 'general'; // deadline, impact, pattern, urgent, consultation
        this.severity = data.severity || 'medium'; // low, medium, high, critical
        this.title = data.title || '';
        this.message = data.message || '';
        this.businessContext = data.businessContext || {}; // Firm-specific context
        this.actionRequired = data.actionRequired || false;
        this.suggestedActions = data.suggestedActions || []; // Array of suggested actions
        this.deadline = data.deadline || null; // Associated deadline if applicable
        this.urgencyScore = data.urgencyScore || 50; // 0-100 urgency scoring
        this.targetingCriteria = data.targetingCriteria || {}; // Criteria for firm targeting
        this.deliveryChannels = data.deliveryChannels || ['dashboard']; // dashboard, email, sms, webhook
        this.readAt = data.readAt || null; // When alert was marked as read
        this.dismissedAt = data.dismissedAt || null; // When alert was dismissed
        this.escalatedAt = data.escalatedAt || null; // When alert was escalated
        this.metadata = data.metadata || {}; // Additional alert metadata
        this.tags = data.tags || []; // Searchable tags
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.createdAt || new Date();
        this.expiresAt = data.expiresAt || null; // When alert becomes irrelevant
    }

    // Validate alert data
    validate() {
        const errors = [];

        if (!this.title || this.title.trim().length === 0) {
            errors.push('Title is required');
        }

        if (!this.message || this.message.trim().length === 0) {
            errors.push('Message is required');
        }

        const validAlertTypes = ['deadline', 'impact', 'pattern', 'urgent', 'consultation', 'compliance', 'risk'];
        if (!validAlertTypes.includes(this.alertType)) {
            errors.push(`Invalid alert type. Must be one of: ${validAlertTypes.join(', ')}`);
        }

        const validSeverityLevels = ['low', 'medium', 'high', 'critical'];
        if (!validSeverityLevels.includes(this.severity)) {
            errors.push(`Invalid severity level. Must be one of: ${validSeverityLevels.join(', ')}`);
        }

        if (this.urgencyScore < 0 || this.urgencyScore > 100) {
            errors.push('Urgency score must be between 0 and 100');
        }

        const validChannels = ['dashboard', 'email', 'sms', 'webhook', 'push'];
        const invalidChannels = this.deliveryChannels.filter(channel => !validChannels.includes(channel));
        if (invalidChannels.length > 0) {
            errors.push(`Invalid delivery channels: ${invalidChannels.join(', ')}`);
        }

        return errors;
    }

    // Generate business context based on firm profile
    generateBusinessContext(firmProfile, regulatoryUpdate) {
        const context = {
            firmRelevance: {
                score: 0,
                reasons: [],
                sectors: [],
                applicability: 'unknown'
            },
            businessImpact: {
                financial: 'unknown',
                operational: 'unknown',
                compliance: 'unknown',
                timeline: null
            },
            actionPriority: 'medium',
            recommendedResponse: [],
            complianceImplications: [],
            riskFactors: []
        };

        if (!firmProfile) return context;

        // Calculate firm relevance
        let relevanceScore = 0;
        const reasons = [];

        // Sector matching
        if (regulatoryUpdate.sectors && firmProfile.sectors) {
            const matchingSectors = regulatoryUpdate.sectors.filter(sector => 
                firmProfile.sectors.includes(sector)
            );
            if (matchingSectors.length > 0) {
                relevanceScore += 0.4;
                reasons.push(`Directly relevant to ${matchingSectors.join(', ')} sectors`);
                context.firmRelevance.sectors = matchingSectors;
            }
        }

        // Firm type matching
        if (regulatoryUpdate.applicableFirmTypes && 
            regulatoryUpdate.applicableFirmTypes.includes(firmProfile.firmType)) {
            relevanceScore += 0.3;
            reasons.push(`Applicable to ${firmProfile.firmType} firms`);
        }

        // Size considerations
        if (regulatoryUpdate.firmSizeRequirements) {
            const sizeOrder = ['micro', 'small', 'medium', 'large', 'systemic'];
            const requiredMinSize = sizeOrder.indexOf(regulatoryUpdate.firmSizeRequirements.minimum || 'micro');
            const firmSizeIndex = sizeOrder.indexOf(firmProfile.size);
            
            if (firmSizeIndex >= requiredMinSize) {
                relevanceScore += 0.2;
                reasons.push('Firm size meets requirements');
            }
        }

        // Risk appetite considerations
        if (regulatoryUpdate.riskImplications) {
            const riskLevels = ['very_low', 'low', 'medium', 'high', 'very_high'];
            const updateRiskLevel = riskLevels.indexOf(regulatoryUpdate.riskImplications.level || 'medium');
            const firmRiskLevel = riskLevels.indexOf(firmProfile.riskAppetite);
            
            if (updateRiskLevel >= firmRiskLevel) {
                relevanceScore += 0.1;
                reasons.push('Matches firm risk profile');
            }
        }

        context.firmRelevance.score = Math.min(relevanceScore, 1.0);
        context.firmRelevance.reasons = reasons;
        context.firmRelevance.applicability = relevanceScore > 0.5 ? 'high' : 
                                             relevanceScore > 0.3 ? 'medium' : 'low';

        return context;
    }

    // Calculate urgency score based on multiple factors
    calculateUrgencyScore(factors = {}) {
        let score = 50; // Base score

        // Deadline proximity (0-40 points)
        if (factors.deadlineInDays !== undefined) {
            if (factors.deadlineInDays <= 1) score += 40;
            else if (factors.deadlineInDays <= 7) score += 30;
            else if (factors.deadlineInDays <= 30) score += 20;
            else if (factors.deadlineInDays <= 90) score += 10;
        }

        // Business impact (0-25 points)
        if (factors.businessImpactScore) {
            score += Math.round(factors.businessImpactScore * 2.5);
        }

        // Firm relevance (0-20 points)
        if (factors.firmRelevanceScore) {
            score += Math.round(factors.firmRelevanceScore * 20);
        }

        // AI confidence (0-15 points)
        if (factors.aiConfidence) {
            score += Math.round(factors.aiConfidence * 15);
        }

        // Regulatory authority importance (0-10 points)
        if (factors.authorityImportance) {
            const authorityWeights = {
                'FCA': 10,
                'PRA': 10,
                'Bank of England': 9,
                'HM Treasury': 8,
                'ICO': 7,
                'FRC': 6
            };
            score += authorityWeights[factors.authorityImportance] || 5;
        }

        return Math.min(Math.max(score, 0), 100);
    }

    // Generate suggested actions based on alert context
    generateSuggestedActions() {
        const actions = [];

        switch (this.alertType) {
            case 'deadline':
                actions.push({
                    type: 'review',
                    title: 'Review Requirements',
                    description: 'Analyze compliance requirements and current state',
                    priority: 'high',
                    estimatedTime: '2-4 hours'
                });
                actions.push({
                    type: 'plan',
                    title: 'Create Implementation Plan',
                    description: 'Develop timeline and resource allocation plan',
                    priority: 'high',
                    estimatedTime: '4-8 hours'
                });
                break;

            case 'impact':
                actions.push({
                    type: 'assess',
                    title: 'Impact Assessment',
                    description: 'Conduct detailed business impact analysis',
                    priority: 'medium',
                    estimatedTime: '4-6 hours'
                });
                break;

            case 'consultation':
                actions.push({
                    type: 'respond',
                    title: 'Prepare Response',
                    description: 'Draft consultation response',
                    priority: 'medium',
                    estimatedTime: '8-16 hours'
                });
                break;

            case 'urgent':
                actions.push({
                    type: 'escalate',
                    title: 'Escalate Immediately',
                    description: 'Alert senior management and relevant teams',
                    priority: 'critical',
                    estimatedTime: '30 minutes'
                });
                break;
        }

        // Add common actions
        actions.push({
            type: 'monitor',
            title: 'Monitor Developments',
            description: 'Set up monitoring for related updates',
            priority: 'low',
            estimatedTime: '15 minutes'
        });

        return actions;
    }

    // Check if alert should be escalated
    shouldEscalate() {
        const escalationCriteria = {
            severity: ['critical'],
            urgencyScore: 80,
            deadlineInDays: 7,
            unreadTimeInHours: 24
        };

        // Check severity
        if (escalationCriteria.severity.includes(this.severity)) {
            return true;
        }

        // Check urgency score
        if (this.urgencyScore >= escalationCriteria.urgencyScore) {
            return true;
        }

        // Check deadline proximity
        if (this.deadline) {
            const daysUntilDeadline = Math.ceil((new Date(this.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilDeadline <= escalationCriteria.deadlineInDays) {
                return true;
            }
        }

        // Check if unread for too long
        if (!this.readAt) {
            const hoursUnread = (new Date() - new Date(this.createdAt)) / (1000 * 60 * 60);
            if (hoursUnread >= escalationCriteria.unreadTimeInHours) {
                return true;
            }
        }

        return false;
    }

    // Mark alert as read
    markAsRead() {
        this.readAt = new Date();
        return this.save();
    }

    // Dismiss alert
    dismiss() {
        this.dismissedAt = new Date();
        this.isActive = false;
        return this.save();
    }

    // Escalate alert
    escalate() {
        this.escalatedAt = new Date();
        this.severity = 'critical';
        this.urgencyScore = Math.max(this.urgencyScore, 90);
        return this.save();
    }

    // Check if alert is expired
    isExpired() {
        if (!this.expiresAt) return false;
        return new Date() > new Date(this.expiresAt);
    }

    // Get alert status
    getStatus() {
        if (this.dismissedAt) return 'dismissed';
        if (this.escalatedAt) return 'escalated';
        if (this.readAt) return 'read';
        if (this.isExpired()) return 'expired';
        return 'unread';
    }

    // Convert to database format
    toDbFormat() {
        return {
            id: this.id,
            update_id: this.updateId,
            firm_profile_id: this.firmProfileId,
            ai_insight_id: this.aiInsightId,
            alert_type: this.alertType,
            severity: this.severity,
            title: this.title,
            message: this.message,
            business_context: JSON.stringify(this.businessContext),
            action_required: this.actionRequired,
            suggested_actions: JSON.stringify(this.suggestedActions),
            deadline: this.deadline,
            urgency_score: this.urgencyScore,
            targeting_criteria: JSON.stringify(this.targetingCriteria),
            delivery_channels: JSON.stringify(this.deliveryChannels),
            read_at: this.readAt,
            dismissed_at: this.dismissedAt,
            escalated_at: this.escalatedAt,
            metadata: JSON.stringify(this.metadata),
            tags: JSON.stringify(this.tags),
            is_active: this.isActive,
            created_at: this.createdAt,
            expires_at: this.expiresAt
        };
    }

    // Create from database format
    static fromDbFormat(dbData) {
        if (!dbData) return null;

        return new RegulatoryAlert({
            id: dbData.id,
            updateId: dbData.update_id,
            firmProfileId: dbData.firm_profile_id,
            aiInsightId: dbData.ai_insight_id,
            alertType: dbData.alert_type,
            severity: dbData.severity,
            title: dbData.title,
            message: dbData.message,
            businessContext: dbData.business_context ? JSON.parse(dbData.business_context) : {},
            actionRequired: dbData.action_required,
            suggestedActions: dbData.suggested_actions ? JSON.parse(dbData.suggested_actions) : [],
            deadline: dbData.deadline,
            urgencyScore: dbData.urgency_score,
            targetingCriteria: dbData.targeting_criteria ? JSON.parse(dbData.targeting_criteria) : {},
            deliveryChannels: dbData.delivery_channels ? JSON.parse(dbData.delivery_channels) : ['dashboard'],
            readAt: dbData.read_at,
            dismissedAt: dbData.dismissed_at,
            escalatedAt: dbData.escalated_at,
            metadata: dbData.metadata ? JSON.parse(dbData.metadata) : {},
            tags: dbData.tags ? JSON.parse(dbData.tags) : [],
            isActive: dbData.is_active,
            createdAt: dbData.created_at,
            expiresAt: dbData.expires_at
        });
    }

    // Save to database
    async save() {
        const errors = this.validate();
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }

        try {
            const dbData = this.toDbFormat();
            
            if (this.id) {
                // Update existing
                const query = `
                    UPDATE regulatory_alerts SET 
                        update_id = $1, firm_profile_id = $2, ai_insight_id = $3, alert_type = $4,
                        severity = $5, title = $6, message = $7, business_context = $8,
                        action_required = $9, suggested_actions = $10, deadline = $11,
                        urgency_score = $12, targeting_criteria = $13, delivery_channels = $14,
                        read_at = $15, dismissed_at = $16, escalated_at = $17, metadata = $18,
                        tags = $19, is_active = $20, expires_at = $21
                    WHERE id = $22
                    RETURNING *
                `;
                const values = [
                    dbData.update_id, dbData.firm_profile_id, dbData.ai_insight_id, dbData.alert_type,
                    dbData.severity, dbData.title, dbData.message, dbData.business_context,
                    dbData.action_required, dbData.suggested_actions, dbData.deadline,
                    dbData.urgency_score, dbData.targeting_criteria, dbData.delivery_channels,
                    dbData.read_at, dbData.dismissed_at, dbData.escalated_at, dbData.metadata,
                    dbData.tags, dbData.is_active, dbData.expires_at, this.id
                ];
                
                const result = await dbService.query(query, values);
                return RegulatoryAlert.fromDbFormat(result.rows[0]);
            } else {
                // Create new
                const query = `
                    INSERT INTO regulatory_alerts (
                        update_id, firm_profile_id, ai_insight_id, alert_type, severity,
                        title, message, business_context, action_required, suggested_actions,
                        deadline, urgency_score, targeting_criteria, delivery_channels,
                        read_at, dismissed_at, escalated_at, metadata, tags, is_active,
                        created_at, expires_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                    RETURNING *
                `;
                const values = [
                    dbData.update_id, dbData.firm_profile_id, dbData.ai_insight_id, dbData.alert_type,
                    dbData.severity, dbData.title, dbData.message, dbData.business_context,
                    dbData.action_required, dbData.suggested_actions, dbData.deadline,
                    dbData.urgency_score, dbData.targeting_criteria, dbData.delivery_channels,
                    dbData.read_at, dbData.dismissed_at, dbData.escalated_at, dbData.metadata,
                    dbData.tags, dbData.is_active, dbData.created_at, dbData.expires_at
                ];
                
                const result = await dbService.query(query, values);
                const savedAlert = RegulatoryAlert.fromDbFormat(result.rows[0]);
                this.id = savedAlert.id;
                return savedAlert;
            }
        } catch (error) {
            console.error('Error saving regulatory alert:', error);
            throw error;
        }
    }

    // Find by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM regulatory_alerts WHERE id = $1';
            const result = await dbService.query(query, [id]);
            return result.rows.length > 0 ? RegulatoryAlert.fromDbFormat(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding regulatory alert:', error);
            throw error;
        }
    }

    // Find by firm profile
    static async findByFirmProfile(firmProfileId, includeRead = false) {
        try {
            let query = `
                SELECT * FROM regulatory_alerts 
                WHERE firm_profile_id = $1 AND is_active = true
            `;
            
            if (!includeRead) {
                query += ' AND read_at IS NULL';
            }
            
            query += ' ORDER BY urgency_score DESC, created_at DESC';
            
            const result = await dbService.query(query, [firmProfileId]);
            return result.rows.map(row => RegulatoryAlert.fromDbFormat(row));
        } catch (error) {
            console.error('Error finding alerts by firm profile:', error);
            throw error;
        }
    }

    // Find unread alerts
    static async findUnread(limit = 50) {
        try {
            const query = `
                SELECT * FROM regulatory_alerts 
                WHERE read_at IS NULL AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY urgency_score DESC, created_at DESC 
                LIMIT $1
            `;
            const result = await dbService.query(query, [limit]);
            return result.rows.map(row => RegulatoryAlert.fromDbFormat(row));
        } catch (error) {
            console.error('Error finding unread alerts:', error);
            throw error;
        }
    }

    // Find alerts requiring escalation
    static async findForEscalation() {
        try {
            const query = `
                SELECT * FROM regulatory_alerts 
                WHERE escalated_at IS NULL AND is_active = true 
                AND (
                    severity = 'critical' OR 
                    urgency_score >= 80 OR
                    (deadline IS NOT NULL AND deadline <= NOW() + INTERVAL '7 days') OR
                    (read_at IS NULL AND created_at <= NOW() - INTERVAL '24 hours')
                )
                ORDER BY urgency_score DESC, created_at ASC
            `;
            const result = await dbService.query(query);
            return result.rows.map(row => RegulatoryAlert.fromDbFormat(row));
        } catch (error) {
            console.error('Error finding alerts for escalation:', error);
            throw error;
        }
    }

    // Get alert statistics
    static async getStatistics() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_alerts,
                    COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread_alerts,
                    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_alerts,
                    COUNT(CASE WHEN escalated_at IS NOT NULL THEN 1 END) as escalated_alerts,
                    AVG(urgency_score) as avg_urgency_score
                FROM regulatory_alerts 
                WHERE is_active = true AND created_at > NOW() - INTERVAL '30 days'
            `;
            const result = await dbService.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting alert statistics:', error);
            throw error;
        }
    }
}

module.exports = RegulatoryAlert;