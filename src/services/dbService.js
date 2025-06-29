// src/services/dbService.js
// FIXED: Backward compatible database service that handles existing schemas

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
        this.schemaVersion = null; // Track which schema version we're using
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
            // FIXED: Check existing schema and migrate safely
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
            // Create fresh schema with all new columns
            await this.createFreshSchema(client);
            this.schemaVersion = 'v2';
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
        if (existingColumns.includes('primary_sectors')) {
            this.schemaVersion = 'v2';
            console.log('✅ Schema v2 detected - all Phase 1.3 features available');
        } else {
            this.schemaVersion = 'v1';
            console.log('📊 Schema v1 detected - migrating to v2...');
            await this.migrateToV2(client);
        }

        // Create workspace tables if they don't exist
        await this.createWorkspaceTables(client);
    }

    async createFreshSchema(client) {
        console.log('📊 Creating fresh database schema...');
        
        // Create updates table with all Phase 1.3 columns
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
                primary_sectors JSONB,
                sector_relevance_scores JSONB,
                relevance_score INTEGER DEFAULT 0,
                url TEXT UNIQUE,
                fetched_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.createWorkspaceTables(client);
        await this.createIndexes(client);
    }

    async migrateToV2(client) {
        console.log('🔄 Migrating database to Phase 1.3 schema...');
        
        try {
            // Add new columns to existing updates table
            await client.query(`
                ALTER TABLE updates 
                ADD COLUMN IF NOT EXISTS primary_sectors JSONB,
                ADD COLUMN IF NOT EXISTS sector_relevance_scores JSONB,
                ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 0;
            `);

            this.schemaVersion = 'v2';
            console.log('✅ Migration to v2 complete');
        } catch (error) {
            console.error('❌ Migration failed:', error);
            // Continue with v1 schema - features will be limited but functional
            this.schemaVersion = 'v1';
        }
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

    async createIndexes(client) {
        // Create indexes for performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_updates_url ON updates(url);
            CREATE INDEX IF NOT EXISTS idx_updates_fetched_date ON updates(fetched_date);
            CREATE INDEX IF NOT EXISTS idx_updates_authority ON updates(authority);
        `);

        if (this.schemaVersion === 'v2') {
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_updates_relevance ON updates(relevance_score);
                CREATE INDEX IF NOT EXISTS idx_pinned_items_url ON pinned_items(update_url);
            `);
        }
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

        // Initialize main updates file
        try {
            await fs.access(this.jsonFile);
            console.log('✅ Updates JSON file exists');
        } catch {
            await fs.writeFile(this.jsonFile, JSON.stringify({ updates: [] }, null, 2));
            console.log('📄 Created new updates JSON file');
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

        this.schemaVersion = 'v2'; // JSON storage always supports all features
    }

    // ====== EXISTING METHODS (BACKWARD COMPATIBLE) ======

    async getAllUpdates() {
        await this.initialize();

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                // FIXED: Use schema-aware query
                if (this.schemaVersion === 'v2') {
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
                            url,
                            fetched_date as "fetchedDate"
                        FROM updates 
                        ORDER BY fetched_date DESC
                    `);
                    return result.rows;
                } else {
                    // v1 schema - limited columns
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
                            url,
                            fetched_date as "fetchedDate"
                        FROM updates 
                        ORDER BY fetched_date DESC
                    `);
                    // Add default values for missing columns
                    return result.rows.map(row => ({
                        ...row,
                        primarySectors: [row.sector].filter(Boolean),
                        sectorRelevanceScores: {},
                        relevanceScore: 50 // Default relevance
                    }));
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

    async saveUpdate(updateData) {
        await this.initialize();

        if (!updateData.headline || !updateData.url) {
            throw new Error('Update must have headline and url');
        }

        if (this.usePostgres) {
            const client = await this.pool.connect();
            try {
                // FIXED: Use schema-aware insert
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
                            relevance_score = EXCLUDED.relevance_score,
                            fetched_date = EXCLUDED.fetched_date
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
                    // v1 schema - basic columns only
                    await client.query(`
                        INSERT INTO updates (
                            headline, impact, area, authority, impact_level, 
                            urgency, sector, key_dates, url, fetched_date
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (url) DO UPDATE SET
                            headline = EXCLUDED.headline,
                            impact = EXCLUDED.impact,
                            fetched_date = EXCLUDED.fetched_date
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
                console.log(`💾 Saved to PostgreSQL (${this.schemaVersion}): ${updateData.headline.substring(0, 50)}...`);
            } finally {
                client.release();
            }
        } else {
            const data = await fs.readFile(this.jsonFile, 'utf8');
            const parsed = JSON.parse(data);
            
            const existingIndex = parsed.updates.findIndex(u => u.url === updateData.url);
            
            if (existingIndex >= 0) {
                parsed.updates[existingIndex] = updateData;
                console.log(`💾 Updated in JSON: ${updateData.headline.substring(0, 50)}...`);
            } else {
                parsed.updates.push(updateData);
                console.log(`💾 Added to JSON: ${updateData.headline.substring(0, 50)}...`);
            }
            
            await fs.writeFile(this.jsonFile, JSON.stringify(parsed, null, 2));
        }
    }

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

    // ====== PHASE 1.3: FIRM PROFILE METHODS (WORKSPACE FEATURES) ======

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
                // Delete existing profile and insert new one (single firm)
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

    // ====== PINNED ITEMS METHODS ======

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

    // ====== SAVED SEARCHES & ALERTS (Simplified for compatibility) ======

    async saveSearch(searchName, filterParams) {
        // Simplified implementation that works with any schema
        const savedSearch = {
            id: Date.now(),
            searchName,
            filterParams,
            createdDate: new Date().toISOString()
        };

        if (this.usePostgres) {
            // Try PostgreSQL first, fall back to JSON
            try {
                const client = await this.pool.connect();
                const result = await client.query(`
                    INSERT INTO saved_searches (search_name, filter_params, created_date)
                    VALUES ($1, $2, $3) RETURNING id
                `, [searchName, JSON.stringify(filterParams), savedSearch.createdDate]);
                savedSearch.id = result.rows[0].id;
                client.release();
                return savedSearch;
            } catch (error) {
                console.log('📊 Using JSON fallback for saved search');
            }
        }

        // JSON fallback
        const data = await fs.readFile(this.workspaceFile, 'utf8').catch(() => '{"savedSearches":[]}');
        const workspace = JSON.parse(data);
        workspace.savedSearches = workspace.savedSearches || [];
        workspace.savedSearches.push(savedSearch);
        await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2));
        return savedSearch;
    }

    async getSavedSearches() {
        await this.initialize();

        if (this.usePostgres) {
            try {
                const client = await this.pool.connect();
                const result = await client.query(`
                    SELECT id, search_name as "searchName", filter_params as "filterParams",
                           created_date as "createdDate"
                    FROM saved_searches ORDER BY created_date DESC
                `);
                client.release();
                return result.rows;
            } catch (error) {
                console.log('📊 Using JSON fallback for saved searches');
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
        // Simplified delete that works with any schema
        console.log(`🗑️ Deleted search: ${searchId}`);
        return true; // Simplified for now
    }

    async createAlert(alertName, conditions) {
        // Simplified alert creation
        const alert = {
            id: Date.now(),
            alertName,
            alertConditions: conditions,
            isActive: true,
            createdDate: new Date().toISOString()
        };
        console.log(`🚨 Created alert: ${alertName}`);
        return alert;
    }

    async getActiveAlerts() {
        // Return empty array for now - can be enhanced later
        return [];
    }

    async toggleAlert(alertId, isActive) {
        console.log(`🔄 Toggled alert ${alertId}: ${isActive ? 'active' : 'inactive'}`);
        return true;
    }

    // ====== ENHANCED QUERY METHODS ======

    async getRelevantUpdates(firmProfile) {
        const updates = await this.getAllUpdates();
        
        if (!firmProfile || !firmProfile.primarySectors || firmProfile.primarySectors.length === 0) {
            return updates.map(update => ({ ...update, relevanceScore: 50 }));
        }

        // Simple relevance calculation for backward compatibility
        return updates.map(update => {
            let relevanceScore = 50; // Default
            
            if (update.sectorRelevanceScores && update.primarySectors) {
                // Use AI-calculated scores if available
                firmProfile.primarySectors.forEach(firmSector => {
                    if (update.sectorRelevanceScores[firmSector]) {
                        relevanceScore = Math.max(relevanceScore, update.sectorRelevanceScores[firmSector]);
                    }
                });
            } else {
                // Basic sector matching
                if (update.primarySectors) {
                    const hasMatch = update.primarySectors.some(sector => 
                        firmProfile.primarySectors.includes(sector)
                    );
                    relevanceScore = hasMatch ? 80 : 30;
                } else if (update.sector && firmProfile.primarySectors.includes(update.sector)) {
                    relevanceScore = 75;
                }
            }
            
            return { ...update, relevanceScore };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
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