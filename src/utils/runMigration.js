// Migration Runner Utility - Phase 1
// File: src/utils/runMigration.js

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

class MigrationRunner {
    constructor() {
        this.pool = null;
        this.fallbackMode = false;
    }

    async initialize() {
        try {
            if (process.env.DATABASE_URL) {
                console.log('🔗 Connecting to PostgreSQL for migration...');
                this.pool = new Pool({
                    connectionString: process.env.DATABASE_URL,
                    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
                });
                
                // Test connection
                const client = await this.pool.connect();
                await client.query('SELECT NOW()');
                client.release();
                
                console.log('✅ PostgreSQL connected successfully');
                this.fallbackMode = false;
                
            } else {
                throw new Error('DATABASE_URL not configured');
            }
        } catch (error) {
            console.warn('⚠️ PostgreSQL connection failed, using JSON fallback mode:', error.message);
            this.fallbackMode = true;
        }
    }

    async runMigrations() {
        console.log('🚀 Starting Phase 1 database migrations...');
        
        if (this.fallbackMode) {
            console.log('📄 Setting up JSON fallback mode...');
            await this.setupJSONFallback();
            return;
        }

        try {
            const client = await this.pool.connect();
            
            try {
                // Start transaction
                await client.query('BEGIN');
                
                // Check if we need to run migrations
                const needsMigration = await this.checkMigrationNeeded(client);
                
                if (!needsMigration) {
                    console.log('✅ Database already up to date, no migration needed');
                    await client.query('COMMIT');
                    return;
                }
                
                console.log('🔧 Running Phase 1 AI Intelligence migration...');
                
                // Run the migration
                await this.runAIIntelligenceMigration(client);
                
                // Commit transaction
                await client.query('COMMIT');
                console.log('✅ Phase 1 migration completed successfully');
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    async checkMigrationNeeded(client) {
        try {
            // Check if AI columns exist in regulatory_updates
            const result = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'regulatory_updates' AND column_name = 'ai_summary'
            `);
            
            return result.rows.length === 0;
            
        } catch (error) {
            console.log('🔧 Base table doesn\'t exist, will create everything');
            return true;
        }
    }

    async runAIIntelligenceMigration(client) {
        // Create base regulatory_updates table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS regulatory_updates (
                id SERIAL PRIMARY KEY,
                headline VARCHAR(500) NOT NULL,
                summary TEXT,
                url VARCHAR(1000) UNIQUE,
                authority VARCHAR(200),
                published_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                impact_level VARCHAR(50) DEFAULT 'Informational',
                urgency VARCHAR(20) DEFAULT 'Low',
                sector VARCHAR(100),
                area VARCHAR(200)
            )
        `);
        
        console.log('📋 Base regulatory_updates table ready');
        
        // Add AI intelligence fields to regulatory_updates
        const aiFields = [
            'ADD COLUMN IF NOT EXISTS ai_summary TEXT',
            'ADD COLUMN IF NOT EXISTS business_impact_score INTEGER DEFAULT 0',
            'ADD COLUMN IF NOT EXISTS ai_tags JSONB DEFAULT \'[]\'::jsonb',
            'ADD COLUMN IF NOT EXISTS cross_references JSONB DEFAULT \'[]\'::jsonb',
            'ADD COLUMN IF NOT EXISTS firm_types_affected JSONB DEFAULT \'[]\'::jsonb',
            'ADD COLUMN IF NOT EXISTS compliance_deadline DATE',
            'ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2) DEFAULT 0.0',
            'ADD COLUMN IF NOT EXISTS sector_relevance_scores JSONB DEFAULT \'{}\'::jsonb',
            'ADD COLUMN IF NOT EXISTS implementation_phases JSONB DEFAULT \'[]\'::jsonb',
            'ADD COLUMN IF NOT EXISTS required_resources JSONB DEFAULT \'{}\'::jsonb'
        ];
        
        for (const field of aiFields) {
            await client.query(`ALTER TABLE regulatory_updates ${field}`);
        }
        
        console.log('🤖 AI intelligence fields added to regulatory_updates');
        
        // Create AI insights table
        await client.query(`
            CREATE TABLE IF NOT EXISTS ai_insights (
                id SERIAL PRIMARY KEY,
                update_id INTEGER REFERENCES regulatory_updates(id),
                insight_type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                summary TEXT NOT NULL,
                impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
                urgency_level VARCHAR(20) CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
                affected_firm_types JSONB DEFAULT '[]'::jsonb,
                affected_firm_sizes JSONB DEFAULT '[]'::jsonb,
                probability_score DECIMAL(3,2) DEFAULT 0.0,
                evidence_sources JSONB DEFAULT '[]'::jsonb,
                recommendations JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        `);
        
        console.log('🧠 AI insights table created');
        
        // Create firm profiles table
        await client.query(`
            CREATE TABLE IF NOT EXISTS firm_profiles (
                id SERIAL PRIMARY KEY,
                firm_name VARCHAR(255) NOT NULL,
                firm_size VARCHAR(20) CHECK (firm_size IN ('small', 'medium', 'large')),
                primary_sectors JSONB DEFAULT '[]'::jsonb,
                regulatory_appetite VARCHAR(20) CHECK (regulatory_appetite IN ('conservative', 'moderate', 'aggressive')),
                key_business_lines JSONB DEFAULT '[]'::jsonb,
                geographic_focus JSONB DEFAULT '[]'::jsonb,
                compliance_maturity VARCHAR(20) CHECK (compliance_maturity IN ('basic', 'developing', 'advanced')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('🏢 Firm profiles table created');
        
        // Create early warning signals table
        await client.query(`
            CREATE TABLE IF NOT EXISTS early_warning_signals (
                id SERIAL PRIMARY KEY,
                signal_type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                confidence_level VARCHAR(20) CHECK (confidence_level IN ('low', 'medium', 'high')),
                potential_impact VARCHAR(20) CHECK (potential_impact IN ('low', 'medium', 'high', 'critical')),
                estimated_timeline VARCHAR(100),
                supporting_updates JSONB DEFAULT '[]'::jsonb,
                affected_sectors JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        `);
        
        console.log('⚠️ Early warning signals table created');
        
        // Create weekly roundup cache table
        await client.query(`
            CREATE TABLE IF NOT EXISTS weekly_roundups (
                id SERIAL PRIMARY KEY,
                week_start_date DATE NOT NULL,
                total_updates INTEGER DEFAULT 0,
                top_authorities JSONB DEFAULT '[]'::jsonb,
                key_themes JSONB DEFAULT '[]'::jsonb,
                high_impact_updates JSONB DEFAULT '[]'::jsonb,
                sector_activity JSONB DEFAULT '{}'::jsonb,
                enforcement_highlights JSONB DEFAULT '[]'::jsonb,
                upcoming_deadlines JSONB DEFAULT '[]'::jsonb,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(week_start_date)
            )
        `);
        
        console.log('📋 Weekly roundups cache table created');
        
        // Create authority spotlight cache table  
        await client.query(`
            CREATE TABLE IF NOT EXISTS authority_spotlights (
                id SERIAL PRIMARY KEY,
                authority VARCHAR(100) NOT NULL,
                analysis_date DATE NOT NULL,
                focus_areas JSONB DEFAULT '[]'::jsonb,
                activity_level VARCHAR(20) CHECK (activity_level IN ('low', 'moderate', 'high')),
                key_initiatives JSONB DEFAULT '[]'::jsonb,
                enforcement_trends VARCHAR(100),
                upcoming_actions JSONB DEFAULT '[]'::jsonb,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(authority, analysis_date)
            )
        `);
        
        console.log('🏛️ Authority spotlights cache table created');
        
        // Create performance indices
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_regulatory_updates_ai_tags ON regulatory_updates USING GIN (ai_tags)',
            'CREATE INDEX IF NOT EXISTS idx_regulatory_updates_firm_types ON regulatory_updates USING GIN (firm_types_affected)',
            'CREATE INDEX IF NOT EXISTS idx_regulatory_updates_business_impact ON regulatory_updates (business_impact_score DESC)',
            'CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published_date ON regulatory_updates (published_date DESC)',
            'CREATE INDEX IF NOT EXISTS idx_regulatory_updates_authority ON regulatory_updates (authority)',
            'CREATE INDEX IF NOT EXISTS idx_ai_insights_type_urgency ON ai_insights (insight_type, urgency_level)',
            'CREATE INDEX IF NOT EXISTS idx_ai_insights_active ON ai_insights (is_active) WHERE is_active = true',
            'CREATE INDEX IF NOT EXISTS idx_early_warning_active ON early_warning_signals (is_active) WHERE is_active = true',
            'CREATE INDEX IF NOT EXISTS idx_weekly_roundups_date ON weekly_roundups (week_start_date DESC)'
        ];
        
        for (const indexQuery of indices) {
            await client.query(indexQuery);
        }
        
        console.log('📊 Performance indices created');
        
        // Insert default firm profile
        await client.query(`
            INSERT INTO firm_profiles (
                firm_name, firm_size, primary_sectors, regulatory_appetite,
                key_business_lines, geographic_focus, compliance_maturity
            ) VALUES (
                'Demo Financial Services',
                'medium',
                '["Banking", "Investment Management"]',
                'moderate',
                '["Retail Banking", "Wealth Management", "Corporate Finance"]',
                '["UK", "EU"]',
                'developing'
            ) ON CONFLICT DO NOTHING
        `);
        
        console.log('🏢 Default firm profile inserted');
        
        // Add function to automatically update timestamps
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);
        
        await client.query(`
            DROP TRIGGER IF EXISTS update_firm_profiles_updated_at ON firm_profiles;
            CREATE TRIGGER update_firm_profiles_updated_at 
                BEFORE UPDATE ON firm_profiles 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
        
        await client.query(`
            DROP TRIGGER IF EXISTS update_early_warning_updated_at ON early_warning_signals;
            CREATE TRIGGER update_early_warning_updated_at 
                BEFORE UPDATE ON early_warning_signals 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
        
        console.log('⚙️ Database triggers created');
        
        // Insert sample AI insight for demonstration
        await client.query(`
            INSERT INTO ai_insights (
                insight_type, title, summary, impact_score, urgency_level,
                affected_firm_types, probability_score
            ) VALUES (
                'system_ready',
                'AI Intelligence System Operational',
                'The enhanced AI regulatory intelligence platform is now active and analyzing regulatory updates. Expect improved impact scoring, sector-specific analysis, and proactive insights.',
                6,
                'medium',
                '["Banking", "Investment Management", "Insurance"]',
                0.95
            ) ON CONFLICT DO NOTHING
        `);
        
        console.log('🤖 Sample AI insight inserted');
    }

    async setupJSONFallback() {
        const dataDir = path.join(__dirname, '../../data');
        
        try {
            await fs.mkdir(dataDir, { recursive: true });
            
            // Create enhanced updates.json structure
            const updatesFile = path.join(dataDir, 'updates.json');
            try {
                await fs.access(updatesFile);
                console.log('📄 updates.json already exists');
            } catch {
                const sampleUpdates = [
                    {
                        id: 1,
                        headline: "FCA publishes guidance on AI governance in financial services",
                        summary: "The Financial Conduct Authority has released comprehensive guidance on artificial intelligence governance frameworks for financial institutions.",
                        url: "https://www.fca.org.uk/news/ai-governance-guidance-2024",
                        authority: "FCA",
                        published_date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        impact_level: "Significant",
                        urgency: "High",
                        sector: "Banking",
                        area: "Governance",
                        ai_summary: "New AI governance requirements will require significant policy updates and compliance framework changes for firms using AI systems.",
                        business_impact_score: 8,
                        ai_tags: ["impact:significant", "urgency:high", "sector:banking", "area:governance", "type:guidance"],
                        firm_types_affected: ["Banking", "Investment Management", "Insurance"],
                        ai_confidence_score: 0.92,
                        sector_relevance_scores: {
                            "Banking": 95,
                            "Investment Management": 85,
                            "Insurance": 80
                        },
                        implementation_phases: [
                            {
                                phase: "Gap Analysis",
                                duration: "2-4 weeks",
                                description: "Review current AI governance practices",
                                effort: "High"
                            },
                            {
                                phase: "Policy Development",
                                duration: "6-8 weeks", 
                                description: "Develop AI governance policies and procedures",
                                effort: "High"
                            }
                        ],
                        required_resources: {
                            totalEffortDays: 64,
                            estimatedCost: {
                                internal: "£51,200",
                                external: "£10,000 - £20,000",
                                total: "£61,200"
                            },
                            roleBreakdown: [
                                {
                                    role: "Compliance Officer",
                                    effort: "32 days",
                                    skills: ["AI governance", "Policy development", "Risk assessment"]
                                },
                                {
                                    role: "Legal Counsel", 
                                    effort: "16 days",
                                    skills: ["Regulatory law", "AI regulation", "Risk assessment"]
                                }
                            ]
                        }
                    }
                ];
                
                await fs.writeFile(updatesFile, JSON.stringify(sampleUpdates, null, 2));
                console.log('📄 Created updates.json with sample data');
            }
            
            // Create ai_insights.json
            const insightsFile = path.join(dataDir, 'ai_insights.json');
            try {
                await fs.access(insightsFile);
                console.log('📄 ai_insights.json already exists');
            } catch {
                const sampleInsights = [
                    {
                        id: 1,
                        insight_type: "system_ready",
                        title: "AI Intelligence System Operational",
                        summary: "The enhanced AI regulatory intelligence platform is now active and analyzing regulatory updates. Enhanced impact scoring, sector-specific analysis, and proactive insights are now available.",
                        impact_score: 6,
                        urgency_level: "medium",
                        affected_firm_types: ["Banking", "Investment Management", "Insurance"],
                        affected_firm_sizes: ["small", "medium", "large"],
                        probability_score: 0.95,
                        evidence_sources: ["System initialization", "AI analyzer status"],
                        recommendations: ["Explore AI-powered weekly roundups", "Review enhanced impact scoring", "Configure firm-specific preferences"],
                        created_at: new Date().toISOString(),
                        is_active: true
                    }
                ];
                
                await fs.writeFile(insightsFile, JSON.stringify(sampleInsights, null, 2));
                console.log('📄 Created ai_insights.json with sample data');
            }
            
            // Create firm_profiles.json
            const profilesFile = path.join(dataDir, 'firm_profiles.json');
            try {
                await fs.access(profilesFile);
                console.log('📄 firm_profiles.json already exists');
            } catch {
                const sampleProfiles = [
                    {
                        id: 1,
                        firm_name: "Demo Financial Services",
                        firm_size: "medium",
                        primary_sectors: ["Banking", "Investment Management"],
                        regulatory_appetite: "moderate",
                        key_business_lines: ["Retail Banking", "Wealth Management", "Corporate Finance"],
                        geographic_focus: ["UK", "EU"],
                        compliance_maturity: "developing",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ];
                
                await fs.writeFile(profilesFile, JSON.stringify(sampleProfiles, null, 2));
                console.log('📄 Created firm_profiles.json with sample data');
            }
            
            console.log('✅ JSON fallback mode setup complete');
            
        } catch (error) {
            console.error('❌ Error setting up JSON fallback:', error);
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

// CLI Runner
async function runMigrationCLI() {
    const migrationRunner = new MigrationRunner();
    
    try {
        console.log('🚀 Phase 1 Migration Runner Starting...');
        console.log('=====================================\n');
        
        await migrationRunner.initialize();
        await migrationRunner.runMigrations();
        
        console.log('\n=====================================');
        console.log('✅ Phase 1 Migration Completed Successfully!');
        console.log('\nNext Steps:');
        console.log('1. Start the application: npm start');
        console.log('2. Visit http://localhost:3000 to see the enhanced platform');
        console.log('3. Check /test endpoint for system health');
        console.log('4. Explore AI features like /api/ai/weekly-roundup');
        
    } catch (error) {
        console.error('\n❌ Migration Failed:');
        console.error(error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Check DATABASE_URL environment variable');
        console.error('2. Ensure PostgreSQL is running (or use JSON fallback mode)');
        console.error('3. Verify database permissions');
        process.exit(1);
        
    } finally {
        await migrationRunner.close();
        process.exit(0);
    }
}

// Export for use in other modules
module.exports = {
    MigrationRunner,
    runMigrationCLI
};

// Run if called directly
if (require.main === module) {
    runMigrationCLI();
}