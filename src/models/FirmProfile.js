// src/models/FirmProfile.js
// Firm Intelligence Profiling Model
// Tracks firm characteristics for AI-powered relevance scoring and personalized insights

const dbService = require('../services/dbService');

class FirmProfile {
    constructor(data = {}) {
        this.id = data.id || null;
        this.firmName = data.firmName || '';
        this.firmType = data.firmType || 'unknown'; // bank, insurer, investment_firm, payment_service, etc.
        this.size = data.size || 'unknown'; // micro, small, medium, large, systemic
        this.sectors = data.sectors || []; // JSON array of relevant sectors
        this.jurisdictions = data.jurisdictions || ['UK']; // Primary jurisdictions
        this.riskAppetite = data.riskAppetite || 'medium'; // low, medium, high, very_high
        this.complianceMaturity = data.complianceMaturity || 50; // 0-100 score
        this.businessModel = data.businessModel || {}; // JSON object with business specifics
        this.regulatoryFocus = data.regulatoryFocus || []; // Areas of regulatory concern
        this.aiPreferences = data.aiPreferences || this.getDefaultAIPreferences();
        this.lastUpdated = data.lastUpdated || new Date();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.createdAt || new Date();
    }

    // Default AI analysis preferences
    getDefaultAIPreferences() {
        return {
            relevanceThreshold: 0.3, // Minimum relevance score to show
            urgencyWeighting: 1.2, // Multiplier for urgent items
            sectorWeighting: 1.5, // Boost for firm's primary sectors
            deadlineAlertDays: [30, 14, 7, 3, 1], // Days before deadline to alert
            analysisDepth: 'standard', // basic, standard, detailed
            summaryFrequency: 'weekly', // daily, weekly, monthly
            notificationTypes: ['deadline', 'high_impact', 'sector_specific'],
            confidenceThreshold: 0.6 // Minimum AI confidence to act on
        };
    }

    // Validate firm profile data
    validate() {
        const errors = [];

        if (!this.firmName || this.firmName.trim().length === 0) {
            errors.push('Firm name is required');
        }

        const validFirmTypes = [
            'bank', 'building_society', 'credit_union', 'insurer', 'reinsurer',
            'investment_firm', 'asset_manager', 'pension_provider', 'payment_service',
            'e_money_institution', 'crypto_exchange', 'fintech', 'other'
        ];
        if (!validFirmTypes.includes(this.firmType)) {
            errors.push(`Invalid firm type. Must be one of: ${validFirmTypes.join(', ')}`);
        }

        const validSizes = ['micro', 'small', 'medium', 'large', 'systemic', 'unknown'];
        if (!validSizes.includes(this.size)) {
            errors.push(`Invalid size. Must be one of: ${validSizes.join(', ')}`);
        }

        const validRiskLevels = ['very_low', 'low', 'medium', 'high', 'very_high'];
        if (!validRiskLevels.includes(this.riskAppetite)) {
            errors.push(`Invalid risk appetite. Must be one of: ${validRiskLevels.join(', ')}`);
        }

        if (this.complianceMaturity < 0 || this.complianceMaturity > 100) {
            errors.push('Compliance maturity must be between 0 and 100');
        }

        return errors;
    }

    // Calculate relevance score for a regulatory update
    calculateRelevance(update) {
        let score = 0;
        const weights = {
            sector: 0.4,
            firmType: 0.3,
            jurisdiction: 0.2,
            size: 0.1
        };

        // Sector relevance
        if (update.sectors && this.sectors.length > 0) {
            const sectorMatch = update.sectors.some(sector => 
                this.sectors.includes(sector)
            );
            if (sectorMatch) score += weights.sector;
        }

        // Firm type relevance
        if (update.applicableFirmTypes && update.applicableFirmTypes.includes(this.firmType)) {
            score += weights.firmType;
        }

        // Jurisdiction relevance
        if (update.jurisdiction && this.jurisdictions.includes(update.jurisdiction)) {
            score += weights.jurisdiction;
        }

        // Size relevance (if update specifies size requirements)
        if (update.firmSizeRequirements) {
            const sizeOrder = ['micro', 'small', 'medium', 'large', 'systemic'];
            const updateMinSize = sizeOrder.indexOf(update.firmSizeRequirements.minimum || 'micro');
            const firmSizeIndex = sizeOrder.indexOf(this.size);
            
            if (firmSizeIndex >= updateMinSize) {
                score += weights.size;
            }
        }

        // Apply AI preferences
        score *= this.aiPreferences.sectorWeighting || 1;
        
        return Math.min(score, 1.0); // Cap at 1.0
    }

    // Get business context for AI analysis
    getBusinessContext() {
        return {
            firmProfile: {
                name: this.firmName,
                type: this.firmType,
                size: this.size,
                sectors: this.sectors,
                riskAppetite: this.riskAppetite,
                complianceMaturity: this.complianceMaturity
            },
            analysisPreferences: this.aiPreferences,
            focusAreas: this.regulatoryFocus
        };
    }

    // Update compliance maturity based on activities
    updateComplianceMaturity(adjustment, reason) {
        const oldScore = this.complianceMaturity;
        this.complianceMaturity = Math.max(0, Math.min(100, this.complianceMaturity + adjustment));
        this.lastUpdated = new Date();

        return {
            oldScore,
            newScore: this.complianceMaturity,
            adjustment,
            reason,
            timestamp: this.lastUpdated
        };
    }

    // Convert to database format
    toDbFormat() {
        return {
            id: this.id,
            firm_name: this.firmName,
            firm_type: this.firmType,
            size: this.size,
            sectors: JSON.stringify(this.sectors),
            jurisdictions: JSON.stringify(this.jurisdictions),
            risk_appetite: this.riskAppetite,
            compliance_maturity: this.complianceMaturity,
            business_model: JSON.stringify(this.businessModel),
            regulatory_focus: JSON.stringify(this.regulatoryFocus),
            ai_preferences: JSON.stringify(this.aiPreferences),
            last_updated: this.lastUpdated,
            is_active: this.isActive,
            created_at: this.createdAt
        };
    }

    // Create from database format
    static fromDbFormat(dbData) {
        if (!dbData) return null;

        return new FirmProfile({
            id: dbData.id,
            firmName: dbData.firm_name,
            firmType: dbData.firm_type,
            size: dbData.size,
            sectors: dbData.sectors ? JSON.parse(dbData.sectors) : [],
            jurisdictions: dbData.jurisdictions ? JSON.parse(dbData.jurisdictions) : ['UK'],
            riskAppetite: dbData.risk_appetite,
            complianceMaturity: dbData.compliance_maturity,
            businessModel: dbData.business_model ? JSON.parse(dbData.business_model) : {},
            regulatoryFocus: dbData.regulatory_focus ? JSON.parse(dbData.regulatory_focus) : [],
            aiPreferences: dbData.ai_preferences ? JSON.parse(dbData.ai_preferences) : undefined,
            lastUpdated: dbData.last_updated,
            isActive: dbData.is_active,
            createdAt: dbData.created_at
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
                    UPDATE firm_profiles SET 
                        firm_name = $1, firm_type = $2, size = $3, sectors = $4,
                        jurisdictions = $5, risk_appetite = $6, compliance_maturity = $7,
                        business_model = $8, regulatory_focus = $9, ai_preferences = $10,
                        last_updated = $11, is_active = $12
                    WHERE id = $13
                    RETURNING *
                `;
                const values = [
                    dbData.firm_name, dbData.firm_type, dbData.size, dbData.sectors,
                    dbData.jurisdictions, dbData.risk_appetite, dbData.compliance_maturity,
                    dbData.business_model, dbData.regulatory_focus, dbData.ai_preferences,
                    dbData.last_updated, dbData.is_active, this.id
                ];
                
                const result = await dbService.query(query, values);
                return FirmProfile.fromDbFormat(result.rows[0]);
            } else {
                // Create new
                const query = `
                    INSERT INTO firm_profiles (
                        firm_name, firm_type, size, sectors, jurisdictions,
                        risk_appetite, compliance_maturity, business_model,
                        regulatory_focus, ai_preferences, last_updated, is_active, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    RETURNING *
                `;
                const values = [
                    dbData.firm_name, dbData.firm_type, dbData.size, dbData.sectors,
                    dbData.jurisdictions, dbData.risk_appetite, dbData.compliance_maturity,
                    dbData.business_model, dbData.regulatory_focus, dbData.ai_preferences,
                    dbData.last_updated, dbData.is_active, dbData.created_at
                ];
                
                const result = await dbService.query(query, values);
                const savedProfile = FirmProfile.fromDbFormat(result.rows[0]);
                this.id = savedProfile.id;
                return savedProfile;
            }
        } catch (error) {
            console.error('Error saving firm profile:', error);
            throw error;
        }
    }

    // Find by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM firm_profiles WHERE id = $1 AND is_active = true';
            const result = await dbService.query(query, [id]);
            return result.rows.length > 0 ? FirmProfile.fromDbFormat(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding firm profile:', error);
            throw error;
        }
    }

    // Find by name
    static async findByName(firmName) {
        try {
            const query = 'SELECT * FROM firm_profiles WHERE firm_name ILIKE $1 AND is_active = true';
            const result = await dbService.query(query, [`%${firmName}%`]);
            return result.rows.map(row => FirmProfile.fromDbFormat(row));
        } catch (error) {
            console.error('Error finding firm profile by name:', error);
            throw error;
        }
    }

    // Get all active profiles
    static async findAll() {
        try {
            const query = 'SELECT * FROM firm_profiles WHERE is_active = true ORDER BY firm_name';
            const result = await dbService.query(query);
            return result.rows.map(row => FirmProfile.fromDbFormat(row));
        } catch (error) {
            console.error('Error finding all firm profiles:', error);
            throw error;
        }
    }

    // Find by firm type
    static async findByType(firmType) {
        try {
            const query = 'SELECT * FROM firm_profiles WHERE firm_type = $1 AND is_active = true';
            const result = await dbService.query(query, [firmType]);
            return result.rows.map(row => FirmProfile.fromDbFormat(row));
        } catch (error) {
            console.error('Error finding firm profiles by type:', error);
            throw error;
        }
    }

    // Get default profile for anonymous users
    static getDefaultProfile() {
        return new FirmProfile({
            firmName: 'Default User',
            firmType: 'other',
            size: 'medium',
            sectors: ['general'],
            riskAppetite: 'medium',
            complianceMaturity: 50
        });
    }
}

module.exports = FirmProfile;