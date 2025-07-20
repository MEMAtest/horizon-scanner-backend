// src/models/ComplianceEvent.js
// Compliance Event Model for deadline tracking and implementation phase management
// Enables proactive compliance planning and milestone monitoring

const dbService = require('../services/dbService');

class ComplianceEvent {
    constructor(data = {}) {
        this.id = data.id || null;
        this.updateId = data.updateId || null; // Reference to regulatory_updates table
        this.firmProfileId = data.firmProfileId || null; // Reference to firm_profiles table
        this.eventType = data.eventType || 'deadline'; // deadline, consultation, implementation, review
        this.title = data.title || '';
        this.description = data.description || '';
        this.eventDate = data.eventDate || null; // Main event date (deadline, consultation close, etc.)
        this.notificationDates = data.notificationDates || []; // Array of notification dates
        this.implementationPhases = data.implementationPhases || []; // Array of implementation milestones
        this.priority = data.priority || 'medium'; // low, medium, high, critical
        this.status = data.status || 'pending'; // pending, in_progress, completed, overdue, cancelled
        this.complianceRequirements = data.complianceRequirements || []; // Array of specific requirements
        this.businessImpact = data.businessImpact || {}; // Impact assessment
        this.estimatedEffort = data.estimatedEffort || {}; // Time and resource estimates
        this.dependencies = data.dependencies || []; // Dependencies on other events/systems
        this.assignees = data.assignees || []; // Responsible parties
        this.progress = data.progress || 0; // 0-100 completion percentage
        this.milestones = data.milestones || []; // Key milestones and checkpoints
        this.riskFactors = data.riskFactors || []; // Identified risks and mitigations
        this.documents = data.documents || []; // Related documents and resources
        this.tags = data.tags || []; // Searchable tags
        this.metadata = data.metadata || {}; // Additional event metadata
        this.completedAt = data.completedAt || null; // When event was completed
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    // Validate compliance event data
    validate() {
        const errors = [];

        if (!this.title || this.title.trim().length === 0) {
            errors.push('Title is required');
        }

        if (!this.eventDate) {
            errors.push('Event date is required');
        }

        const validEventTypes = ['deadline', 'consultation', 'implementation', 'review', 'assessment', 'filing'];
        if (!validEventTypes.includes(this.eventType)) {
            errors.push(`Invalid event type. Must be one of: ${validEventTypes.join(', ')}`);
        }

        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (!validPriorities.includes(this.priority)) {
            errors.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
        }

        const validStatuses = ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'];
        if (!validStatuses.includes(this.status)) {
            errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        if (this.progress < 0 || this.progress > 100) {
            errors.push('Progress must be between 0 and 100');
        }

        if (new Date(this.eventDate) < new Date('2020-01-01')) {
            errors.push('Event date must be reasonable');
        }

        return errors;
    }

    // Generate implementation phases based on event type and deadline
    generateImplementationPhases() {
        const phases = [];
        const eventDate = new Date(this.eventDate);
        const today = new Date();
        const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

        switch (this.eventType) {
            case 'deadline':
                if (daysUntilEvent > 90) {
                    phases.push({
                        name: 'Initial Assessment',
                        description: 'Conduct initial impact assessment and scope analysis',
                        dueDate: new Date(eventDate.getTime() - (75 * 24 * 60 * 60 * 1000)), // 75 days before
                        estimatedEffort: '1-2 weeks',
                        status: 'pending',
                        deliverables: ['Impact assessment report', 'Scope document']
                    });
                }

                if (daysUntilEvent > 60) {
                    phases.push({
                        name: 'Planning & Design',
                        description: 'Develop implementation plan and design solutions',
                        dueDate: new Date(eventDate.getTime() - (45 * 24 * 60 * 60 * 1000)), // 45 days before
                        estimatedEffort: '2-3 weeks',
                        status: 'pending',
                        deliverables: ['Implementation plan', 'Solution design', 'Resource allocation']
                    });
                }

                if (daysUntilEvent > 30) {
                    phases.push({
                        name: 'Implementation',
                        description: 'Execute implementation plan and build solutions',
                        dueDate: new Date(eventDate.getTime() - (14 * 24 * 60 * 60 * 1000)), // 14 days before
                        estimatedEffort: '3-4 weeks',
                        status: 'pending',
                        deliverables: ['Implemented solution', 'Testing documentation']
                    });
                }

                phases.push({
                    name: 'Testing & Validation',
                    description: 'Test implementation and validate compliance',
                    dueDate: new Date(eventDate.getTime() - (7 * 24 * 60 * 60 * 1000)), // 7 days before
                    estimatedEffort: '1 week',
                    status: 'pending',
                    deliverables: ['Test results', 'Compliance validation', 'Documentation']
                });
                break;

            case 'consultation':
                phases.push({
                    name: 'Review & Analysis',
                    description: 'Review consultation paper and analyze impact',
                    dueDate: new Date(eventDate.getTime() - (21 * 24 * 60 * 60 * 1000)), // 21 days before
                    estimatedEffort: '1-2 weeks',
                    status: 'pending',
                    deliverables: ['Analysis document', 'Key concerns identified']
                });

                phases.push({
                    name: 'Response Preparation',
                    description: 'Prepare consultation response',
                    dueDate: new Date(eventDate.getTime() - (7 * 24 * 60 * 60 * 1000)), // 7 days before
                    estimatedEffort: '1-2 weeks',
                    status: 'pending',
                    deliverables: ['Draft response', 'Internal review']
                });

                phases.push({
                    name: 'Final Review & Submission',
                    description: 'Final review and submit response',
                    dueDate: new Date(eventDate.getTime() - (1 * 24 * 60 * 60 * 1000)), // 1 day before
                    estimatedEffort: '2-3 days',
                    status: 'pending',
                    deliverables: ['Final response', 'Submission confirmation']
                });
                break;
        }

        return phases;
    }

    // Generate notification schedule
    generateNotificationSchedule() {
        const notifications = [];
        const eventDate = new Date(this.eventDate);
        const standardNotificationDays = [90, 60, 30, 14, 7, 3, 1]; // Days before event

        standardNotificationDays.forEach(days => {
            const notificationDate = new Date(eventDate.getTime() - (days * 24 * 60 * 60 * 1000));
            
            // Only add future notifications
            if (notificationDate > new Date()) {
                notifications.push({
                    date: notificationDate,
                    type: this.getNotificationType(days),
                    message: this.getNotificationMessage(days),
                    channels: this.getNotificationChannels(days),
                    sent: false
                });
            }
        });

        return notifications.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Get notification type based on days remaining
    getNotificationType(daysRemaining) {
        if (daysRemaining <= 1) return 'urgent';
        if (daysRemaining <= 7) return 'high';
        if (daysRemaining <= 30) return 'medium';
        return 'low';
    }

    // Get notification message based on days remaining
    getNotificationMessage(daysRemaining) {
        const eventType = this.eventType.charAt(0).toUpperCase() + this.eventType.slice(1);
        
        if (daysRemaining === 1) {
            return `${eventType} "${this.title}" is due tomorrow!`;
        } else if (daysRemaining <= 7) {
            return `${eventType} "${this.title}" is due in ${daysRemaining} days`;
        } else if (daysRemaining <= 30) {
            return `${eventType} "${this.title}" is due in ${daysRemaining} days - time to start planning`;
        } else {
            return `Upcoming ${eventType.toLowerCase()}: "${this.title}" in ${daysRemaining} days`;
        }
    }

    // Get notification channels based on urgency
    getNotificationChannels(daysRemaining) {
        if (daysRemaining <= 1) return ['dashboard', 'email', 'sms'];
        if (daysRemaining <= 7) return ['dashboard', 'email'];
        return ['dashboard'];
    }

    // Calculate days until event
    getDaysUntilEvent() {
        const today = new Date();
        const eventDate = new Date(this.eventDate);
        return Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    }

    // Check if event is overdue
    isOverdue() {
        return new Date() > new Date(this.eventDate) && this.status !== 'completed';
    }

    // Update status based on current date and progress
    updateStatus() {
        const daysUntil = this.getDaysUntilEvent();
        
        if (this.status === 'completed') {
            return this.status;
        }

        if (daysUntil < 0) {
            this.status = 'overdue';
        } else if (this.progress > 0) {
            this.status = 'in_progress';
        } else if (daysUntil <= 30) {
            // Auto-start events within 30 days if not already started
            this.status = 'in_progress';
        } else {
            this.status = 'pending';
        }

        return this.status;
    }

    // Update progress and milestones
    updateProgress(newProgress, milestone = null) {
        const oldProgress = this.progress;
        this.progress = Math.max(0, Math.min(100, newProgress));
        this.updatedAt = new Date();

        if (milestone) {
            this.milestones.push({
                date: new Date(),
                description: milestone,
                progress: newProgress,
                completedBy: 'system' // Could be enhanced with user tracking
            });
        }

        if (this.progress === 100) {
            this.status = 'completed';
            this.completedAt = new Date();
        }

        return {
            oldProgress,
            newProgress: this.progress,
            milestone,
            statusChange: this.updateStatus()
        };
    }

    // Estimate effort based on event complexity
    estimateEffort() {
        const baseEffort = {
            hours: 8,
            people: 1,
            skillLevel: 'intermediate'
        };

        // Adjust based on event type
        const typeMultipliers = {
            'deadline': 2.0,
            'consultation': 1.5,
            'implementation': 3.0,
            'review': 1.0,
            'assessment': 1.2,
            'filing': 0.5
        };

        // Adjust based on priority
        const priorityMultipliers = {
            'low': 0.8,
            'medium': 1.0,
            'high': 1.5,
            'critical': 2.0
        };

        const typeMultiplier = typeMultipliers[this.eventType] || 1.0;
        const priorityMultiplier = priorityMultipliers[this.priority] || 1.0;

        return {
            hours: Math.round(baseEffort.hours * typeMultiplier * priorityMultiplier),
            people: Math.ceil(baseEffort.people * (typeMultiplier > 2 ? 1.5 : 1)),
            skillLevel: this.priority === 'critical' ? 'expert' : baseEffort.skillLevel,
            estimatedDuration: this.getEstimatedDuration(baseEffort.hours * typeMultiplier * priorityMultiplier)
        };
    }

    // Get estimated duration string
    getEstimatedDuration(hours) {
        if (hours <= 8) return '1 day';
        if (hours <= 40) return `${Math.ceil(hours / 8)} days`;
        if (hours <= 160) return `${Math.ceil(hours / 40)} weeks`;
        return `${Math.ceil(hours / 160)} months`;
    }

    // Convert to database format
    toDbFormat() {
        return {
            id: this.id,
            update_id: this.updateId,
            firm_profile_id: this.firmProfileId,
            event_type: this.eventType,
            title: this.title,
            description: this.description,
            event_date: this.eventDate,
            notification_dates: JSON.stringify(this.notificationDates),
            implementation_phases: JSON.stringify(this.implementationPhases),
            priority: this.priority,
            status: this.status,
            compliance_requirements: JSON.stringify(this.complianceRequirements),
            business_impact: JSON.stringify(this.businessImpact),
            estimated_effort: JSON.stringify(this.estimatedEffort),
            dependencies: JSON.stringify(this.dependencies),
            assignees: JSON.stringify(this.assignees),
            progress: this.progress,
            milestones: JSON.stringify(this.milestones),
            risk_factors: JSON.stringify(this.riskFactors),
            documents: JSON.stringify(this.documents),
            tags: JSON.stringify(this.tags),
            metadata: JSON.stringify(this.metadata),
            completed_at: this.completedAt,
            is_active: this.isActive,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    // Create from database format
    static fromDbFormat(dbData) {
        if (!dbData) return null;

        return new ComplianceEvent({
            id: dbData.id,
            updateId: dbData.update_id,
            firmProfileId: dbData.firm_profile_id,
            eventType: dbData.event_type,
            title: dbData.title,
            description: dbData.description,
            eventDate: dbData.event_date,
            notificationDates: dbData.notification_dates ? JSON.parse(dbData.notification_dates) : [],
            implementationPhases: dbData.implementation_phases ? JSON.parse(dbData.implementation_phases) : [],
            priority: dbData.priority,
            status: dbData.status,
            complianceRequirements: dbData.compliance_requirements ? JSON.parse(dbData.compliance_requirements) : [],
            businessImpact: dbData.business_impact ? JSON.parse(dbData.business_impact) : {},
            estimatedEffort: dbData.estimated_effort ? JSON.parse(dbData.estimated_effort) : {},
            dependencies: dbData.dependencies ? JSON.parse(dbData.dependencies) : [],
            assignees: dbData.assignees ? JSON.parse(dbData.assignees) : [],
            progress: dbData.progress,
            milestones: dbData.milestones ? JSON.parse(dbData.milestones) : [],
            riskFactors: dbData.risk_factors ? JSON.parse(dbData.risk_factors) : [],
            documents: dbData.documents ? JSON.parse(dbData.documents) : [],
            tags: dbData.tags ? JSON.parse(dbData.tags) : [],
            metadata: dbData.metadata ? JSON.parse(dbData.metadata) : {},
            completedAt: dbData.completed_at,
            isActive: dbData.is_active,
            createdAt: dbData.created_at,
            updatedAt: dbData.updated_at
        });
    }

    // Save to database
    async save() {
        const errors = this.validate();
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }

        this.updatedAt = new Date();

        try {
            const dbData = this.toDbFormat();
            
            if (this.id) {
                // Update existing
                const query = `
                    UPDATE compliance_events SET 
                        update_id = $1, firm_profile_id = $2, event_type = $3, title = $4,
                        description = $5, event_date = $6, notification_dates = $7,
                        implementation_phases = $8, priority = $9, status = $10,
                        compliance_requirements = $11, business_impact = $12, estimated_effort = $13,
                        dependencies = $14, assignees = $15, progress = $16, milestones = $17,
                        risk_factors = $18, documents = $19, tags = $20, metadata = $21,
                        completed_at = $22, is_active = $23, updated_at = $24
                    WHERE id = $25
                    RETURNING *
                `;
                const values = [
                    dbData.update_id, dbData.firm_profile_id, dbData.event_type, dbData.title,
                    dbData.description, dbData.event_date, dbData.notification_dates,
                    dbData.implementation_phases, dbData.priority, dbData.status,
                    dbData.compliance_requirements, dbData.business_impact, dbData.estimated_effort,
                    dbData.dependencies, dbData.assignees, dbData.progress, dbData.milestones,
                    dbData.risk_factors, dbData.documents, dbData.tags, dbData.metadata,
                    dbData.completed_at, dbData.is_active, dbData.updated_at, this.id
                ];
                
                const result = await dbService.query(query, values);
                return ComplianceEvent.fromDbFormat(result.rows[0]);
            } else {
                // Create new
                const query = `
                    INSERT INTO compliance_events (
                        update_id, firm_profile_id, event_type, title, description, event_date,
                        notification_dates, implementation_phases, priority, status,
                        compliance_requirements, business_impact, estimated_effort, dependencies,
                        assignees, progress, milestones, risk_factors, documents, tags,
                        metadata, completed_at, is_active, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
                    RETURNING *
                `;
                const values = [
                    dbData.update_id, dbData.firm_profile_id, dbData.event_type, dbData.title,
                    dbData.description, dbData.event_date, dbData.notification_dates,
                    dbData.implementation_phases, dbData.priority, dbData.status,
                    dbData.compliance_requirements, dbData.business_impact, dbData.estimated_effort,
                    dbData.dependencies, dbData.assignees, dbData.progress, dbData.milestones,
                    dbData.risk_factors, dbData.documents, dbData.tags, dbData.metadata,
                    dbData.completed_at, dbData.is_active, dbData.created_at, dbData.updated_at
                ];
                
                const result = await dbService.query(query, values);
                const savedEvent = ComplianceEvent.fromDbFormat(result.rows[0]);
                this.id = savedEvent.id;
                return savedEvent;
            }
        } catch (error) {
            console.error('Error saving compliance event:', error);
            throw error;
        }
    }

    // Find by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM compliance_events WHERE id = $1 AND is_active = true';
            const result = await dbService.query(query, [id]);
            return result.rows.length > 0 ? ComplianceEvent.fromDbFormat(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding compliance event:', error);
            throw error;
        }
    }

    // Find upcoming events
    static async findUpcoming(days = 90, limit = 50) {
        try {
            const futureDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
            const query = `
                SELECT * FROM compliance_events 
                WHERE event_date BETWEEN NOW() AND $1 
                AND is_active = true AND status != 'completed'
                ORDER BY event_date ASC, priority DESC 
                LIMIT $2
            `;
            const result = await dbService.query(query, [futureDate, limit]);
            return result.rows.map(row => ComplianceEvent.fromDbFormat(row));
        } catch (error) {
            console.error('Error finding upcoming compliance events:', error);
            throw error;
        }
    }

    // Find overdue events
    static async findOverdue() {
        try {
            const query = `
                SELECT * FROM compliance_events 
                WHERE event_date < NOW() AND status != 'completed' AND is_active = true
                ORDER BY event_date ASC
            `;
            const result = await dbService.query(query);
            return result.rows.map(row => ComplianceEvent.fromDbFormat(row));
        } catch (error) {
            console.error('Error finding overdue compliance events:', error);
            throw error;
        }
    }

    // Find by firm profile
    static async findByFirmProfile(firmProfileId, includeCompleted = false) {
        try {
            let query = `
                SELECT * FROM compliance_events 
                WHERE firm_profile_id = $1 AND is_active = true
            `;
            
            if (!includeCompleted) {
                query += ` AND status != 'completed'`;
            }
            
            query += ` ORDER BY event_date ASC`;
            
            const result = await dbService.query(query, [firmProfileId]);
            return result.rows.map(row => ComplianceEvent.fromDbFormat(row));
        } catch (error) {
            console.error('Error finding compliance events by firm profile:', error);
            throw error;
        }
    }

    // Get event statistics
    static async getStatistics() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_events,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_events,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_events,
                    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_events,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_events,
                    COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_events,
                    AVG(progress) as avg_progress
                FROM compliance_events 
                WHERE is_active = true AND created_at > NOW() - INTERVAL '6 months'
            `;
            const result = await dbService.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting compliance event statistics:', error);
            throw error;
        }
    }
}

module.exports = ComplianceEvent;