// src/services/dbService.js
// PHASE 2 ENHANCED: Smart Categorization Schema + Backward Compatibility
// ADDITIONS: categories, contentType, sourceType fields with migration support

const fs = require('fs').promises;
const path = require('path');

class DatabaseService {
    constructor() {
        this.initialized = false;
        this.usePostgres = !!process.env.DATABASE_URL;
        this.pg = null;
        this.pool = null;
        this.jsonFile = path.join(process.cwd(), 'data', 'updates.json');
        this.workspaceFile = path.join(process.cwd(), 'data', 'workspace.json');
        this.schemaVersion = null;
        console.log(`📊 Database Service: Using ${this.usePostgres ? 'PostgreSQL' : 'JSON file'} storage`);
    }

    async initialize() {
        if (this.initialized) {
            console.log('📊 Database already initialized');
            return;
        }

        try {
            if (this.usePostgres) {
                await this.initializePostgres();
            } else {
                await this.initializeJsonFile();
            }
            this.initialized = true;
            console.log('✅ Database service initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    async initializePostgres() {
        console.log('📊 Initializing PostgreSQL connection...');
        
        const { Pool } = require('pg');
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        const client = await this.pool.connect();
        console.log('✅ PostgreSQL connection established');

        try {
            await this.checkAndMigrateSchema(client);
        } finally {
            client.release();
        }
        
        console.log('✅ PostgreSQL schema ready');
    }

    async checkAndMigrateSchema(client) {
        // Check if updates table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'updates'
            );
        `);

        if (!tableExists.rows[0].exists) {
            // Create fresh Phase 2 schema with all new columns
            await this.createPhase2Schema(client);
            this.schemaVersion = 'v3_phase2';
            return;
        }

        // Check which columns exist in the updates table
        const columns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'updates' 
            AND table_schema = 'public';
        `);

        const existingColumns = columns.rows.map(row => row.column_name);
        console.log('📊 Existing columns:', existingColumns);

        // Determine schema version and migrate if needed
        if (existingColumns.includes('categories') && existingColumns.includes('content_type') && existingColumns.includes('source_type')) {
            this.schemaVersion = 'v3_phase2';
            console.log('✅ Phase 2 schema detected - all categorization features available');
        } else if (existingColumns.includes('primary_sectors')) {
            this.schemaVersion = 'v2';
            console.log('📊 Schema v2 detected - migrating to Phase 2 schema...');
            await this.migrateToPhase2(client);
        } else {
            this.schemaVersion = 'v1';
            console.log('📊 Schema v1 detected - migrating to Phase 2 schema...');
            await this.migrateToPhase2(client);
        }

        // Ensure workspace tables exist
        await this.createWorkspaceTables(client);
    }

    async createPhase2Schema(client) {
        console.log('📊 Creating Phase 2 database schema with smart categorization...');
        
        // Create updates table with all Phase 2 categorization columns
        await client.query(`
            CREATE TABLE IF NOT EXISTS updates (
                id SERIAL PRIMARY KEY,
                headline TEXT NOT NULL,
                impact TEXT,
                area TEXT,
                authority TEXT,
                impact_level TEXT,
                urgency TEXT,
                sector TEXT,
                key_dates TEXT,
                
                -- Phase 1.3 columns
                primary_sectors JSONB,
                sector_relevance_scores JSONB,
                relevance_score INTEGER DEFAULT 0,
                
                -- Phase 2 NEW: Smart Categorization columns
                categories JSONB DEFAULT '[]'::jsonb,
                content_type VARCHAR(100),
                source_type VARCHAR(100),
                ai_confidence_score INTEGER DEFAULT 0,
                processing_metadata JSONB DEFAULT '{}'::jsonb,
                
                url TEXT UNIQUE,
                fetched_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.createWorkspaceTables(client);
        await this.createPhase2Indexes(client);
        
        console.log('✅ Phase 2 schema created successfully');
    }

    async migrateToPhase2(client) {
        console.log('🔄 Migrating database to Phase 2 schema...');
        
        try {
            // Add Phase 2 categorization columns
            await client.query(`
                ALTER TABLE updates 
                ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS content_type VARCHAR(100),
                ADD COLUMN IF NOT EXISTS source_type VARCHAR(100),
                ADD COLUMN IF NOT EXISTS ai_confidence_score INTEGER DEFAULT 0,
                ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}'::jsonb,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            `);

            // Add Phase 1.3 columns if they don't exist (for v1 -> Phase 2 migration)
            await client.query(`
                ALTER TABLE updates 
                ADD COLUMN IF NOT EXISTS primary_sectors JSONB,
                ADD COLUMN IF NOT EXISTS sector_relevance_scores JSONB,
                ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 0;
            `);

            await this.createPhase2Indexes(client);

            this.schemaVersion = 'v3_phase2';
            console.log('✅ Migration to Phase 2 complete');
        } catch (error) {
            console.error('❌ Phase 2 migration failed:', error);
            // Continue with previous schema - features will be limited but functional
            this.schemaVersion = this.schemaVersion || 'v2';
        }
    }

    async createPhase2Indexes(client) {
        // Create indexes for Phase 2 categorization performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_updates_categories ON updates USING gin(categories);
            CREATE INDEX IF NOT EXISTS idx_updates_content_type ON updates(content_type);
            CREATE INDEX IF NOT EXISTS idx_updates_source_type ON updates(source_type);
            CREATE INDEX IF NOT EXISTS idx_updates_ai_confidence ON updates(ai_confidence_score);
            CREATE INDEX IF NOT EXISTS idx_updates_updated_at ON updates(updated_at);
        `);

        // Existing indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_updates_url ON updates(url);
            CREATE INDEX IF NOT EXISTS idx_updates_fetched_date ON updates(fetched_date);
            CREATE INDEX IF NOT EXISTS idx_updates_authority ON updates(authority);
            CREATE INDEX IF NOT EXISTS idx_updates_relevance ON updates(relevance_score);
        `);
    }

    async createWorkspaceTables(client) {
        // Firm profile table
        await client.query(`
            CREATE TABLE IF NOT EXISTS firm_profile (
                id SERIAL PRIMARY KEY,
                firm_name VARCHAR(255),
                primary_sectors JSONB,
                firm_size VARCHAR(50),
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Pinned items table
        await client.query(`
            CREATE TABLE IF NOT EXISTS pinned_items (
                id SERIAL PRIMARY KEY,
                update_url VARCHAR(500) UNIQUE,
                update_title TEXT,
                update_authority TEXT,
                pinned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT
            )
        `);

        // Saved searches table
        await client.query(`
            CREATE TABLE IF NOT EXISTS saved_searches (
                id SERIAL PRIMARY KEY,
                search_name VARCHAR(255),
                filter_params JSONB,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Custom alerts table
        await client.query(`
            CREATE TABLE IF NOT EXISTS custom_alerts (
                id SERIAL PRIMARY KEY,
                alert_name VARCHAR(255),
                alert_conditions JSONB,
                is_active BOOLEAN DEFAULT true,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    async initializeJsonFile() {
        console.log('📊 Initializing JSON file storage...');
        
        const dataDir = path.dirname(this.jsonFile);
        
        try {
            await fs.access(dataDir);
        } catch {
            await fs.mkdir(dataDir, { recursive: true });
            console.log('📁 Created data directory');
        }

        // Initialize main updates file with Phase 2 structure
        try {
            await fs.access(this.jsonFile);
            console.log('✅ Updates JSON file exists');
            
            // Check if we need to upgrade JSON structure
            const data = await fs.readFile(this.jsonFile, 'utf8');
            const parsed = JSON.parse(data);
            
            // Add Phase 2 fields to existing updates if they don't exist
            if (parsed.updates && parsed.updates.length > 0) {
                let upgraded = false;
                parsed.updates = parsed.updates.map(update => {
                    if (!update.categories) {
                        update.categories = [];
                        update.contentType = null;
                        update.sourceType = null;
                        update.aiConfidenceScore = 0;
                        update.processingMetadata = {};
                        update.updatedAt = new Date().toISOString();
                        upgraded = true;
                    }
                    return update;
                });
                
                if (upgraded) {
                    await fs.writeFile(this.jsonFile, JSON.stringify(parsed, null, 2));
                    console.log('📊 Upgraded JSON structure to Phase 2');
                }
            }
        } catch {
            await fs.writeFile(this.jsonFile, JSON.stringify({ 
                updates: [],
                metadata: {
                    version: 'v3_phase2',
                    created: new Date().toISOString()
                }
            }, null, 2));
            console.log('📄 Created new Phase 2 updates JSON file');
        }

        // Initialize workspace file
        try {
            await fs.access(this.workspaceFile);
            console.log('✅ Workspace JSON file exists');
        } catch {
            const workspaceData = {
                firmProfile: null,
                pinnedItems: [],
                savedSearches: [],
                customAlerts: []
            };
            await fs.writeFile(this.workspaceFile, JSON.stringify(workspaceData, null, 2));
            console.log('📄 Created new workspace JSON file');
        }

        this.schemaVersion = 'v3_phase2'; // JSON storage always supports all features
    }

    // ====== ENHANCED SAVE UPDATE WITH PHASE 2 CATEGORIZATION ======

    async saveUpdate(updateData) {
        await this.initialize();

        if (!updateData.headline || !updateData.url) {
            throw new Error('Update must have headline and url');
        }

        // Ensure Phase 2 fields have defaults
        const enhancedUpdateData = {
            ...updateData,
            categories: updateData.categories || [],
            contentType: updateData.contentType || null,
            sourceType: updateData.sourceType || null,
            aiConfidenceScore: updateData.aiConfidenceScore || 0,
            processingMetadata: updateData.processingMetadata || {},
            updatedAt: new Date().toISOString()
        };

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                if (this.schemaVersion === 'v3_phase2') {
                    // Full Phase 2 insert with all categorization fields
                    await client.query(`
                        INSERT INTO updates (
                            headline, impact, area, authority, impact_level, 
                            urgency, sector, key_dates, primary_sectors, 
                            sector_relevance_scores, relevance_score, 
                            categories, content_type, source_type, 
                            ai_confidence_score, processing_metadata,
                            url, fetched_date, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                        ON CONFLICT (url) DO UPDATE SET
                            headline = EXCLUDED.headline,
                            impact = EXCLUDED.impact,
                            primary_sectors = EXCLUDED.primary_sectors,
                            sector_relevance_scores = EXCLUDED.sector_relevance_scores,
                            relevance_score = EXCLUDED.relevance_score,
                            categories = EXCLUDED.categories,
                            content_type = EXCLUDED.content_type,
                            source_type = EXCLUDED.source_type,
                            ai_confidence_score = EXCLUDED.ai_confidence_score,
                            processing_metadata = EXCLUDED.processing_metadata,
                            updated_at = EXCLUDED.updated_at
                    `, [
                        enhancedUpdateData.headline,
                        enhancedUpdateData.impact,
                        enhancedUpdateData.area,
                        enhancedUpdateData.authority,
                        enhancedUpdateData.impactLevel,
                        enhancedUpdateData.urgency,
                        enhancedUpdateData.sector,
                        enhancedUpdateData.keyDates,
                        JSON.stringify(enhancedUpdateData.primarySectors || []),
                        JSON.stringify(enhancedUpdateData.sectorRelevanceScores || {}),
                        enhancedUpdateData.relevanceScore || 0,
                        JSON.stringify(enhancedUpdateData.categories),
                        enhancedUpdateData.contentType,
                        enhancedUpdateData.sourceType,
                        enhancedUpdateData.aiConfidenceScore,
                        JSON.stringify(enhancedUpdateData.processingMetadata),
                        enhancedUpdateData.url,
                        enhancedUpdateData.fetchedDate || new Date().toISOString(),
                        enhancedUpdateData.updatedAt
                    ]);
                } else {
                    // Fallback for older schemas
                    await this.saveUpdateLegacy(client, enhancedUpdateData);
                }
                console.log(`💾 Saved to PostgreSQL (${this.schemaVersion}): ${enhancedUpdateData.headline.substring(0, 50)}...`);
            } finally {
                client.release();
            }
        } else {
            // JSON file storage with Phase 2 fields
            const data = await fs.readFile(this.jsonFile, 'utf8');
            const parsed = JSON.parse(data);
            
            const existingIndex = parsed.updates.findIndex(u => u.url === enhancedUpdateData.url);
            
            if (existingIndex >= 0) {
                parsed.updates[existingIndex] = enhancedUpdateData;
                console.log(`💾 Updated in JSON: ${enhancedUpdateData.headline.substring(0, 50)}...`);
            } else {
                parsed.updates.push(enhancedUpdateData);
                console.log(`💾 Added to JSON: ${enhancedUpdateData.headline.substring(0, 50)}...`);
            }
            
            await fs.writeFile(this.jsonFile, JSON.stringify(parsed, null, 2));
        }
    }

    async saveUpdateLegacy(client, updateData) {
        // Fallback for v1/v2 schemas
        if (this.schemaVersion === 'v2') {
            await client.query(`
                INSERT INTO updates (
                    headline, impact, area, authority, impact_level, 
                    urgency, sector, key_dates, primary_sectors, 
                    sector_relevance_scores, relevance_score, url, fetched_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (url) DO UPDATE SET
                    headline = EXCLUDED.headline,
                    impact = EXCLUDED.impact,
                    primary_sectors = EXCLUDED.primary_sectors,
                    sector_relevance_scores = EXCLUDED.sector_relevance_scores,
                    relevance_score = EXCLUDED.relevance_score
            `, [
                updateData.headline,
                updateData.impact,
                updateData.area,
                updateData.authority,
                updateData.impactLevel,
                updateData.urgency,
                updateData.sector,
                updateData.keyDates,
                JSON.stringify(updateData.primarySectors || []),
                JSON.stringify(updateData.sectorRelevanceScores || {}),
                updateData.relevanceScore || 0,
                updateData.url,
                updateData.fetchedDate || new Date().toISOString()
            ]);
        } else {
            // v1 schema
            await client.query(`
                INSERT INTO updates (
                    headline, impact, area, authority, impact_level, 
                    urgency, sector, key_dates, url, fetched_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (url) DO UPDATE SET
                    headline = EXCLUDED.headline,
                    impact = EXCLUDED.impact
            `, [
                updateData.headline,
                updateData.impact,
                updateData.area,
                updateData.authority,
                updateData.impactLevel,
                updateData.urgency,
                updateData.sector,
                updateData.keyDates,
                updateData.url,
                updateData.fetchedDate || new Date().toISOString()
            ]);
        }
    }

    // ====== ENHANCED RETRIEVAL WITH PHASE 2 CATEGORIZATION ======

    async getAllUpdates() {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                if (this.schemaVersion === 'v3_phase2') {
                    const result = await client.query(`
                        SELECT 
                            headline,
                            impact,
                            area,
                            authority,
                            impact_level as "impactLevel",
                            urgency,
                            sector,
                            key_dates as "keyDates",
                            primary_sectors as "primarySectors",
                            sector_relevance_scores as "sectorRelevanceScores",
                            relevance_score as "relevanceScore",
                            categories,
                            content_type as "contentType",
                            source_type as "sourceType",
                            ai_confidence_score as "aiConfidenceScore",
                            processing_metadata as "processingMetadata",
                            url,
                            fetched_date as "fetchedDate",
                            updated_at as "updatedAt"
                        FROM updates 
                        ORDER BY fetched_date DESC
                    `);
                    return result.rows;
                } else {
                    // Legacy schema query with default Phase 2 values
                    return await this.getAllUpdatesLegacy(client);
                }
            } finally {
                client.release();
            }
        } else {
            const data = await fs.readFile(this.jsonFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.updates || [];
        }
    }

    async getAllUpdatesLegacy(client) {
        const columnsQuery = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'updates' 
            AND table_schema = 'public';
        `);
        const existingColumns = columnsQuery.rows.map(row => row.column_name);

        // Build query based on available columns
        let selectClause = `
            headline,
            impact,
            area,
            authority,
            impact_level as "impactLevel",
            urgency,
            sector,
            key_dates as "keyDates",
            url,
            fetched_date as "fetchedDate"
        `;

        if (existingColumns.includes('primary_sectors')) {
            selectClause += `,
                primary_sectors as "primarySectors",
                sector_relevance_scores as "sectorRelevanceScores",
                relevance_score as "relevanceScore"
            `;
        }

        const result = await client.query(`
            SELECT ${selectClause}
            FROM updates 
            ORDER BY fetched_date DESC
        `);

        // Add default Phase 2 values for legacy data
        return result.rows.map(row => ({
            ...row,
            primarySectors: row.primarySectors || [row.sector].filter(Boolean),
            sectorRelevanceScores: row.sectorRelevanceScores || {},
            relevanceScore: row.relevanceScore || 50,
            categories: [], // Default empty categories
            contentType: null, // Default null content type
            sourceType: null, // Default null source type
            aiConfidenceScore: 0, // Default zero confidence
            processingMetadata: {}, // Default empty metadata
            updatedAt: row.fetchedDate || new Date().toISOString()
        }));
    }

    // ====== PHASE 2: CATEGORY-BASED FILTERING METHODS ======

    async getUpdatesByCategory(category) {
        await this.initialize();

        if (this.usePostgres && this.schemaVersion === 'v3_phase2') {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    SELECT * FROM updates 
                    WHERE categories @> $1::jsonb
                    ORDER BY fetched_date DESC
                `, [JSON.stringify([category])]);
                
                return result.rows;
            } finally {
                client.release();
            }
        } else {
            // JSON fallback or legacy schema
            const allUpdates = await this.getAllUpdates();
            return allUpdates.filter(update => 
                update.categories && update.categories.includes(category)
            );
        }
    }

    async getUpdatesByContentType(contentType) {
        await this.initialize();

        if (this.usePostgres && this.schemaVersion === 'v3_phase2') {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    SELECT * FROM updates 
                    WHERE content_type = $1
                    ORDER BY fetched_date DESC
                `, [contentType]);
                
                return result.rows;
            } finally {
                client.release();
            }
        } else {
            const allUpdates = await this.getAllUpdates();
            return allUpdates.filter(update => update.contentType === contentType);
        }
    }

    async getUpdatesBySourceType(sourceType) {
        await this.initialize();

        if (this.usePostgres && this.schemaVersion === 'v3_phase2') {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    SELECT * FROM updates 
                    WHERE source_type = $1
                    ORDER BY fetched_date DESC
                `, [sourceType]);
                
                return result.rows;
            } finally {
                client.release();
            }
        } else {
            const allUpdates = await this.getAllUpdates();
            return allUpdates.filter(update => update.sourceType === sourceType);
        }
    }

    // ====== ANALYTICS SUPPORT METHODS ======

    async getCategoryDistribution() {
        const updates = await this.getAllUpdates();
        const categoryCount = {};
        
        updates.forEach(update => {
            if (update.categories && Array.isArray(update.categories)) {
                update.categories.forEach(category => {
                    categoryCount[category] = (categoryCount[category] || 0) + 1;
                });
            }
        });
        
        return Object.entries(categoryCount)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
    }

    async getContentTypeDistribution() {
        const updates = await this.getAllUpdates();
        const contentTypeCount = {};
        
        updates.forEach(update => {
            const type = update.contentType || 'Unknown';
            contentTypeCount[type] = (contentTypeCount[type] || 0) + 1;
        });
        
        return Object.entries(contentTypeCount)
            .map(([contentType, count]) => ({ contentType, count }))
            .sort((a, b) => b.count - a.count);
    }

    async getSourceTypeDistribution() {
        const updates = await this.getAllUpdates();
        const sourceTypeCount = {};
        
        updates.forEach(update => {
            const type = update.sourceType || 'Unknown';
            sourceTypeCount[type] = (sourceTypeCount[type] || 0) + 1;
        });
        
        return Object.entries(sourceTypeCount)
            .map(([sourceType, count]) => ({ sourceType, count }))
            .sort((a, b) => b.count - a.count);
    }

    // ====== EXISTING METHODS (MAINTAINED FOR BACKWARD COMPATIBILITY) ======

    async updateExists(url) {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query('SELECT 1 FROM updates WHERE url = $1 LIMIT 1', [url]);
                return result.rows.length > 0;
            } finally {
                client.release();
            }
        } else {
            const data = await fs.readFile(this.jsonFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.updates.some(u => u.url === url);
        }
    }

    async getUpdateCount() {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query('SELECT COUNT(*) FROM updates');
                return parseInt(result.rows[0].count);
            } finally {
                client.release();
            }
        } else {
            const data = await fs.readFile(this.jsonFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.updates.length;
        }
    }

    // [All existing firm profile and workspace methods remain unchanged...]
    // (Keeping existing methods for backward compatibility)
    
    async saveFirmProfile(profileData) {
        await this.initialize();

        const profile = {
            firmName: profileData.firmName || 'Unknown',
            primarySectors: profileData.primarySectors || [],
            firmSize: profileData.firmSize || 'Medium',
            updatedDate: new Date().toISOString()
        };

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                await client.query('DELETE FROM firm_profile');
                await client.query(`
                    INSERT INTO firm_profile (firm_name, primary_sectors, firm_size, updated_date)
                    VALUES ($1, $2, $3, $4)
                `, [profile.firmName, JSON.stringify(profile.primarySectors), profile.firmSize, profile.updatedDate]);
                
                console.log(`✅ Firm profile saved: ${profile.firmName}`);
                return profile;
            } finally {
                client.release();
            }
        } else {
            const data = await fs.readFile(this.workspaceFile, 'utf8');
            const workspace = JSON.parse(data);
            workspace.firmProfile = profile;
            await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2));
            console.log(`✅ Firm profile saved to JSON: ${profile.firmName}`);
            return profile;
        }
    }

    async getFirmProfile() {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    SELECT firm_name as "firmName", primary_sectors as "primarySectors", 
                           firm_size as "firmSize", updated_date as "updatedDate"
                    FROM firm_profile ORDER BY created_date DESC LIMIT 1
                `);
                return result.rows[0] || null;
            } catch (error) {
                console.log('📊 Firm profile table not ready yet, returning null');
                return null;
            } finally {
                client.release();
            }
        } else {
            try {
                const data = await fs.readFile(this.workspaceFile, 'utf8');
                const workspace = JSON.parse(data);
                return workspace.firmProfile || null;
            } catch (error) {
                console.log('📊 Workspace file not ready yet, returning null');
                return null;
            }
        }
    }

    // ====== PINNED ITEMS METHODS (COMPLETE IMPLEMENTATION) ======

    async addPinnedItem(updateUrl, updateTitle, updateAuthority, notes = '') {
        await this.initialize();

        const pinnedItem = {
            updateUrl,
            updateTitle,
            updateAuthority,
            notes,
            pinnedDate: new Date().toISOString()
        };

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                await client.query(`
                    INSERT INTO pinned_items (update_url, update_title, update_authority, notes, pinned_date)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (update_url) DO UPDATE SET
                        notes = EXCLUDED.notes,
                        pinned_date = EXCLUDED.pinned_date
                `, [updateUrl, updateTitle, updateAuthority, notes, pinnedItem.pinnedDate]);
                
                console.log(`📌 Pinned item: ${updateTitle.substring(0, 50)}...`);
                return pinnedItem;
            } catch (error) {
                console.log('📊 Pinned items table not ready, using JSON fallback');
                return this.addPinnedItemJSON(pinnedItem);
            } finally {
                client.release();
            }
        } else {
            return this.addPinnedItemJSON(pinnedItem);
        }
    }

    async addPinnedItemJSON(pinnedItem) {
        try {
            const data = await fs.readFile(this.workspaceFile, 'utf8');
            const workspace = JSON.parse(data);
            
            workspace.pinnedItems = workspace.pinnedItems || [];
            workspace.pinnedItems = workspace.pinnedItems.filter(item => item.updateUrl !== pinnedItem.updateUrl);
            workspace.pinnedItems.push(pinnedItem);
            
            await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2));
            return pinnedItem;
        } catch (error) {
            console.error('Error saving pinned item to JSON:', error);
            throw error;
        }
    }

    async getPinnedItems() {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    SELECT update_url as "updateUrl", update_title as "updateTitle",
                           update_authority as "updateAuthority", notes, pinned_date as "pinnedDate"
                    FROM pinned_items ORDER BY pinned_date DESC
                `);
                return result.rows;
            } catch (error) {
                console.log('📊 Pinned items table not ready, using JSON fallback');
                return this.getPinnedItemsJSON();
            } finally {
                client.release();
            }
        } else {
            return this.getPinnedItemsJSON();
        }
    }

    async getPinnedItemsJSON() {
        try {
            const data = await fs.readFile(this.workspaceFile, 'utf8');
            const workspace = JSON.parse(data);
            return workspace.pinnedItems || [];
        } catch (error) {
            return [];
        }
    }

    async removePinnedItem(updateUrl) {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query('DELETE FROM pinned_items WHERE update_url = $1', [updateUrl]);
                console.log(`🗑️ Unpinned item: ${updateUrl}`);
                return result.rowCount > 0;
            } catch (error) {
                console.log('📊 Using JSON fallback for unpin');
                return this.removePinnedItemJSON(updateUrl);
            } finally {
                client.release();
            }
        } else {
            return this.removePinnedItemJSON(updateUrl);
        }
    }

    async removePinnedItemJSON(updateUrl) {
        try {
            const data = await fs.readFile(this.workspaceFile, 'utf8');
            const workspace = JSON.parse(data);
            
            const initialLength = (workspace.pinnedItems || []).length;
            workspace.pinnedItems = (workspace.pinnedItems || []).filter(item => item.updateUrl !== updateUrl);
            
            await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2));
            return workspace.pinnedItems.length < initialLength;
        } catch (error) {
            return false;
        }
    }

    // ====== SAVED SEARCHES METHODS (COMPLETE IMPLEMENTATION) ======

    async saveSearch(searchName, filterParams) {
        await this.initialize();
        
        const savedSearch = {
            id: Date.now(),
            searchName,
            filterParams,
            createdDate: new Date().toISOString()
        };

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    INSERT INTO saved_searches (search_name, filter_params, created_date)
                    VALUES ($1, $2, $3) RETURNING id
                `, [searchName, JSON.stringify(filterParams), savedSearch.createdDate]);
                savedSearch.id = result.rows[0].id;
                console.log(`🔍 Saved search: ${searchName}`);
                client.release();
                return savedSearch;
            } catch (error) {
                console.log('📊 Using JSON fallback for saved search');
                client.release();
            }
        }

        // JSON fallback
        try {
            const data = await fs.readFile(this.workspaceFile, 'utf8').catch(() => '{"savedSearches":[]}');
            const workspace = JSON.parse(data);
            workspace.savedSearches = workspace.savedSearches || [];
            workspace.savedSearches.push(savedSearch);
            await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2));
            console.log(`🔍 Saved search to JSON: ${searchName}`);
            return savedSearch;
        } catch (error) {
            console.error('Error saving search:', error);
            throw error;
        }
    }

    async getSavedSearches() {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    SELECT id, search_name as "searchName", filter_params as "filterParams",
                           created_date as "createdDate"
                    FROM saved_searches ORDER BY created_date DESC
                `);
                client.release();
                return result.rows;
            } catch (error) {
                console.log('📊 Using JSON fallback for saved searches');
                client.release();
            }
        }

        // JSON fallback
        try {
            const data = await fs.readFile(this.workspaceFile, 'utf8');
            const workspace = JSON.parse(data);
            return workspace.savedSearches || [];
        } catch (error) {
            return [];
        }
    }

    async deleteSearch(searchId) {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query('DELETE FROM saved_searches WHERE id = $1', [searchId]);
                console.log(`🗑️ Deleted search: ${searchId}`);
                client.release();
                return result.rowCount > 0;
            } catch (error) {
                console.log('📊 Using JSON fallback for delete search');
                client.release();
            }
        }

        // JSON fallback
        try {
            const data = await fs.readFile(this.workspaceFile, 'utf8');
            const workspace = JSON.parse(data);
            
            const initialLength = (workspace.savedSearches || []).length;
            workspace.savedSearches = (workspace.savedSearches || []).filter(search => search.id != searchId);
            
            await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2));
            return workspace.savedSearches.length < initialLength;
        } catch (error) {
            return false;
        }
    }

    // ====== CUSTOM ALERTS METHODS (COMPLETE IMPLEMENTATION) ======

    async createAlert(alertName, conditions) {
        await this.initialize();
        
        const alert = {
            id: Date.now(),
            alertName,
            alertConditions: conditions,
            isActive: true,
            createdDate: new Date().toISOString()
        };

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    INSERT INTO custom_alerts (alert_name, alert_conditions, is_active, created_date)
                    VALUES ($1, $2, $3, $4) RETURNING id
                `, [alertName, JSON.stringify(conditions), true, alert.createdDate]);
                alert.id = result.rows[0].id;
                console.log(`🚨 Created alert: ${alertName}`);
                client.release();
                return alert;
            } catch (error) {
                console.log('📊 Using JSON fallback for alert creation');
                client.release();
            }
        }

        // JSON fallback
        try {
            const data = await fs.readFile(this.workspaceFile, 'utf8').catch(() => '{"customAlerts":[]}');
            const workspace = JSON.parse(data);
            workspace.customAlerts = workspace.customAlerts || [];
            workspace.customAlerts.push(alert);
            await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2));
            console.log(`🚨 Created alert in JSON: ${alertName}`);
            return alert;
        } catch (error) {
            console.error('Error creating alert:', error);
            throw error;
        }
    }

    async getActiveAlerts() {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    SELECT id, alert_name as "alertName", alert_conditions as "alertConditions",
                           is_active as "isActive", created_date as "createdDate"
                    FROM custom_alerts WHERE is_active = true ORDER BY created_date DESC
                `);
                client.release();
                return result.rows;
            } catch (error) {
                console.log('📊 Using JSON fallback for active alerts');
                client.release();
            }
        }

        // JSON fallback
        try {
            const data = await fs.readFile(this.workspaceFile, 'utf8');
            const workspace = JSON.parse(data);
            return (workspace.customAlerts || []).filter(alert => alert.isActive !== false);
        } catch (error) {
            return [];
        }
    }

    async toggleAlert(alertId, isActive) {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                const result = await client.query(
                    'UPDATE custom_alerts SET is_active = $1 WHERE id = $2',
                    [isActive, alertId]
                );
                console.log(`🔄 Toggled alert ${alertId}: ${isActive ? 'active' : 'inactive'}`);
                client.release();
                return result.rowCount > 0;
            } catch (error) {
                console.log('📊 Using JSON fallback for toggle alert');
                client.release();
            }
        }

        // JSON fallback
        try {
            const data = await fs.readFile(this.workspaceFile, 'utf8');
            const workspace = JSON.parse(data);
            
            const alert = (workspace.customAlerts || []).find(a => a.id == alertId);
            if (alert) {
                alert.isActive = isActive;
                await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2));
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    async cleanup() {
        if (this.usePostgres) {
            console.log('🧹 Cleaning up invalid PostgreSQL entries...');
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    DELETE FROM updates 
                    WHERE headline = 'N/A' 
                    OR impact = 'N/A' 
                    OR authority = 'N/A'
                    OR headline LIKE '%Welcome to%'
                    OR headline LIKE '%test%'
                    OR sector = 'N/A'
                `);
                console.log(`🧹 Cleaned ${result.rowCount} invalid entries from PostgreSQL`);
                return result.rowCount;
            } finally {
                client.release();
            }
        } else {
            console.log('🧹 Cleaning up invalid JSON entries...');
            const data = await fs.readFile(this.jsonFile, 'utf8');
            const parsed = JSON.parse(data);
            
            const before = parsed.updates.length;
            parsed.updates = parsed.updates.filter(update => {
                return update.headline !== 'N/A' && 
                       update.impact !== 'N/A' && 
                       update.authority !== 'N/A' &&
                       !update.headline.includes('Welcome to') &&
                       !update.headline.includes('test') &&
                       update.sector !== 'N/A';
            });
            
            const cleaned = before - parsed.updates.length;
            await fs.writeFile(this.jsonFile, JSON.stringify(parsed, null, 2));
            console.log(`🧹 Cleaned ${cleaned} invalid entries from JSON`);
            return cleaned;
        }
    }

    async close() {
        if (this.usePostgres && this.pool) {
            await this.pool.end();
            console.log('🔐 PostgreSQL connection pool closed');
        }
    }
}

// Export singleton instance
const dbService = new DatabaseService();
module.exports = dbService;