// src/services/dbService.js
// Database service with PostgreSQL primary and file fallback

const { Pool } = require('pg');

class DatabaseService {
    constructor() {
        this.pool = null;
        this.initialized = false;
        this.usingFallback = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            if (process.env.DATABASE_URL) {
                // Initialize PostgreSQL connection
                this.pool = new Pool({
                    connectionString: process.env.DATABASE_URL,
                    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
                });

                // Test connection
                const client = await this.pool.connect();
                await client.query('SELECT NOW()');
                client.release();

                // Create tables if they don't exist
                await this.createTables();
                
                console.log('✅ PostgreSQL database initialized successfully');
                this.initialized = true;
            } else {
                throw new Error('DATABASE_URL not provided');
            }
        } catch (error) {
            console.error('❌ PostgreSQL initialization failed:', error.message);
            console.log('🔄 Falling back to file database...');
            
            // Use file database fallback
            const fileDb = require('./fileDbService');
            await fileDb.initialize();
            this.usingFallback = true;
            this.initialized = true;
            
            // Delegate methods to file database
            this.getAllUpdates = fileDb.getAllUpdates.bind(fileDb);
            this.saveUpdate = fileDb.saveUpdate.bind(fileDb);
            this.findUpdate = fileDb.findUpdate.bind(fileDb);
            this.healthCheck = fileDb.healthCheck.bind(fileDb);
            
            console.log('✅ File database fallback initialized');
        }
    }

    async createTables() {
        if (this.usingFallback) return;

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS updates (
                id SERIAL PRIMARY KEY,
                headline TEXT,
                impact TEXT,
                area TEXT,
                authority TEXT,
                impact_level TEXT,
                urgency TEXT,
                sector TEXT,
                key_dates TEXT,
                url TEXT UNIQUE,
                fetched_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_updates_url ON updates(url);
            CREATE INDEX IF NOT EXISTS idx_updates_sector ON updates(sector);
            CREATE INDEX IF NOT EXISTS idx_updates_authority ON updates(authority);
            CREATE INDEX IF NOT EXISTS idx_updates_fetched_date ON updates(fetched_date);
        `;

        try {
            await this.pool.query(createTableQuery);
            console.log('✅ Database tables created/verified successfully');
        } catch (error) {
            console.error('❌ Error creating database tables:', error);
            throw error;
        }
    }

    async getAllUpdates() {
        if (this.usingFallback) {
            // Method will be delegated to file database
            return [];
        }

        await this.initialize();

        try {
            const result = await this.pool.query(
                'SELECT * FROM updates ORDER BY fetched_date DESC'
            );
            
            return result.rows.map(this.transformRow);
        } catch (error) {
            console.error('❌ Error retrieving updates:', error);
            throw error;
        }
    }

    async saveUpdate(updateData) {
        if (this.usingFallback) {
            // Method will be delegated to file database
            return;
        }

        await this.initialize();

        const insertQuery = `
            INSERT INTO updates (headline, impact, area, authority, impact_level, urgency, sector, key_dates, url, fetched_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (url) DO UPDATE SET
                headline = EXCLUDED.headline,
                impact = EXCLUDED.impact,
                area = EXCLUDED.area,
                authority = EXCLUDED.authority,
                impact_level = EXCLUDED.impact_level,
                urgency = EXCLUDED.urgency,
                sector = EXCLUDED.sector,
                key_dates = EXCLUDED.key_dates,
                fetched_date = EXCLUDED.fetched_date
            RETURNING id
        `;

        const values = [
            updateData.headline || null,
            updateData.impact || null,
            updateData.area || null,
            updateData.authority || null,
            updateData.impactLevel || null,
            updateData.urgency || null,
            updateData.sector || null,
            updateData.keyDates || null,
            updateData.url,
            updateData.fetchedDate ? new Date(updateData.fetchedDate) : new Date()
        ];

        try {
            const result = await this.pool.query(insertQuery, values);
            console.log(`✅ Saved update: ${updateData.headline || 'Untitled'} (ID: ${result.rows[0].id})`);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error saving update:', error);
            throw error;
        }
    }

    async findUpdate(url) {
        if (this.usingFallback) {
            // Method will be delegated to file database
            return null;
        }

        await this.initialize();

        try {
            const result = await this.pool.query(
                'SELECT * FROM updates WHERE url = $1 LIMIT 1',
                [url]
            );

            return result.rows.length > 0 ? this.transformRow(result.rows[0]) : null;
        } catch (error) {
            console.error('❌ Error finding update:', error);
            throw error;
        }
    }

    async deleteUpdate(url) {
        if (this.usingFallback) {
            throw new Error('Delete not implemented for file database');
        }

        await this.initialize();

        try {
            const result = await this.pool.query('DELETE FROM updates WHERE url = $1', [url]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('❌ Error deleting update:', error);
            throw error;
        }
    }

    async getUpdatesByAuthority(authority) {
        if (this.usingFallback) {
            const allUpdates = await this.getAllUpdates();
            return allUpdates.filter(update => update.authority === authority);
        }

        await this.initialize();

        try {
            const result = await this.pool.query(
                'SELECT * FROM updates WHERE authority = $1 ORDER BY fetched_date DESC',
                [authority]
            );

            return result.rows.map(this.transformRow);
        } catch (error) {
            console.error('❌ Error retrieving updates by authority:', error);
            throw error;
        }
    }

    async getUpdatesBySector(sector) {
        if (this.usingFallback) {
            const allUpdates = await this.getAllUpdates();
            return allUpdates.filter(update => update.sector === sector);
        }

        await this.initialize();

        try {
            const result = await this.pool.query(
                'SELECT * FROM updates WHERE sector = $1 ORDER BY fetched_date DESC',
                [sector]
            );

            return result.rows.map(this.transformRow);
        } catch (error) {
            console.error('❌ Error retrieving updates by sector:', error);
            throw error;
        }
    }

    async getRecentUpdates(days = 7) {
        if (this.usingFallback) {
            const allUpdates = await this.getAllUpdates();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            return allUpdates.filter(update => 
                new Date(update.fetchedDate) >= cutoffDate
            );
        }

        await this.initialize();

        try {
            const result = await this.pool.query(
                'SELECT * FROM updates WHERE fetched_date >= NOW() - INTERVAL $1 DAYS ORDER BY fetched_date DESC',
                [days]
            );

            return result.rows.map(this.transformRow);
        } catch (error) {
            console.error('❌ Error retrieving recent updates:', error);
            throw error;
        }
    }

    async getAnalytics() {
        if (this.usingFallback) {
            const allUpdates = await this.getAllUpdates();
            
            // Basic analytics calculation
            const analytics = {
                total: allUpdates.length,
                byAuthority: {},
                bySector: {},
                byImpactLevel: {},
                byUrgency: {}
            };

            allUpdates.forEach(update => {
                // Count by authority
                analytics.byAuthority[update.authority] = (analytics.byAuthority[update.authority] || 0) + 1;
                
                // Count by sector
                analytics.bySector[update.sector] = (analytics.bySector[update.sector] || 0) + 1;
                
                // Count by impact level
                analytics.byImpactLevel[update.impactLevel] = (analytics.byImpactLevel[update.impactLevel] || 0) + 1;
                
                // Count by urgency
                analytics.byUrgency[update.urgency] = (analytics.byUrgency[update.urgency] || 0) + 1;
            });

            return analytics;
        }

        await this.initialize();

        try {
            const result = await this.pool.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN authority = 'FCA' THEN 1 END) as fca_count,
                    COUNT(CASE WHEN authority = 'BoE' THEN 1 END) as boe_count,
                    COUNT(CASE WHEN authority = 'PRA' THEN 1 END) as pra_count,
                    COUNT(CASE WHEN authority = 'TPR' THEN 1 END) as tpr_count,
                    COUNT(CASE WHEN authority = 'SFO' THEN 1 END) as sfo_count,
                    COUNT(CASE WHEN authority = 'FATF' THEN 1 END) as fatf_count,
                    COUNT(CASE WHEN impact_level = 'Significant' THEN 1 END) as significant_count,
                    COUNT(CASE WHEN impact_level = 'Moderate' THEN 1 END) as moderate_count,
                    COUNT(CASE WHEN impact_level = 'Informational' THEN 1 END) as informational_count,
                    COUNT(CASE WHEN urgency = 'High' THEN 1 END) as high_urgency,
                    COUNT(CASE WHEN urgency = 'Medium' THEN 1 END) as medium_urgency,
                    COUNT(CASE WHEN urgency = 'Low' THEN 1 END) as low_urgency,
                    COUNT(CASE WHEN fetched_date >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_count
                FROM updates
            `);

            return result.rows[0];
        } catch (error) {
            console.error('❌ Error retrieving analytics:', error);
            throw error;
        }
    }

    async healthCheck() {
        if (this.usingFallback) {
            return { status: 'healthy', type: 'file_database' };
        }

        try {
            await this.initialize();
            
            // Test basic query
            const result = await this.pool.query('SELECT COUNT(*) as count FROM updates');
            
            return { 
                status: 'healthy', 
                type: 'postgresql',
                recordCount: parseInt(result.rows[0].count)
            };
        } catch (error) {
            throw new Error(`Database health check failed: ${error.message}`);
        }
    }

    transformRow(row) {
        return {
            id: row.id,
            headline: row.headline,
            impact: row.impact,
            area: row.area,
            authority: row.authority,
            impactLevel: row.impact_level,
            urgency: row.urgency,
            sector: row.sector,
            keyDates: row.key_dates,
            url: row.url,
            fetchedDate: row.fetched_date ? row.fetched_date.toISOString() : null,
            createdAt: row.created_at ? row.created_at.toISOString() : null
        };
    }

    async close() {
        if (this.pool && !this.usingFallback) {
            await this.pool.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Create singleton instance
const dbService = new DatabaseService();

// Handle graceful shutdown
process.on('beforeExit', async () => {
    await dbService.close();
});

module.exports = dbService;
