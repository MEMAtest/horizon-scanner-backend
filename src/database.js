const { Pool } = require('pg');

class NeonDatabase {
    constructor() {
        // Initialize connection pool
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        this.initialized = false;
        this.initPromise = null;
    }

    async initialize() {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._createTablesIfNotExists();
        await this.initPromise;
        this.initialized = true;
    }

    async _createTablesIfNotExists() {
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
            CREATE INDEX IF NOT EXISTS idx_updates_fetched_date ON updates(fetched_date);
        `;

        try {
            await this.pool.query(createTableQuery);
            console.log('✅ Database tables initialized successfully');
        } catch (error) {
            console.error('❌ Error creating database tables:', error);
            throw error;
        }
    }

    get(collection) {
        if (collection !== 'updates') {
            throw new Error(`Collection '${collection}' not supported`);
        }

        return {
            value: async () => {
                await this.initialize();
                const result = await this.pool.query(
                    'SELECT * FROM updates ORDER BY fetched_date DESC'
                );
                return result.rows.map(this._transformRow);
            },

            find: (query) => ({
                value: async () => {
                    await this.initialize();
                    
                    if (typeof query === 'object' && query.url) {
                        const result = await this.pool.query(
                            'SELECT * FROM updates WHERE url = $1 LIMIT 1',
                            [query.url]
                        );
                        return result.rows.length > 0 ? this._transformRow(result.rows[0]) : null;
                    }
                    
                    // For other query types, get all and filter (simple implementation)
                    const result = await this.pool.query(
                        'SELECT * FROM updates ORDER BY fetched_date DESC'
                    );
                    const rows = result.rows.map(this._transformRow);
                    
                    if (typeof query === 'function') {
                        return rows.find(query);
                    }
                    
                    // Simple object matching
                    return rows.find(item => {
                        return Object.keys(query).every(key => item[key] === query[key]);
                    });
                }
            }),

            push: (item) => ({
                write: async () => {
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
                    `;
                    
                    const values = [
                        item.headline || null,
                        item.impact || null,
                        item.area || null,
                        item.authority || null,
                        item.impactLevel || null,
                        item.urgency || null,
                        item.sector || null,
                        item.keyDates || null,
                        item.url,
                        item.fetchedDate ? new Date(item.fetchedDate) : new Date()
                    ];
                    
                    try {
                        await this.pool.query(insertQuery, values);
                        console.log(`✅ Saved update: ${item.headline || 'Untitled'}`);
                    } catch (error) {
                        console.error('❌ Error saving update:', error);
                        throw error;
                    }
                    
                    return this;
                }
            }),

            remove: (query) => ({
                write: async () => {
                    await this.initialize();
                    
                    if (typeof query === 'object' && query.url) {
                        await this.pool.query('DELETE FROM updates WHERE url = $1', [query.url]);
                    } else {
                        console.warn('Complex remove queries not yet implemented for Neon DB');
                    }
                    
                    return this;
                }
            })
        };
    }

    _transformRow(row) {
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
            fetchedDate: row.fetched_date.toISOString(),
            createdAt: row.created_at.toISOString()
        };
    }

    defaults(defaultData) {
        // No-op for compatibility - table creation handles defaults
        return this;
    }

    write() {
        // No-op for compatibility - operations are automatically written
        return this;
    }

    async close() {
        await this.pool.end();
    }
}

// Create a singleton instance
const db = new NeonDatabase();

// Handle graceful shutdown
process.on('beforeExit', async () => {
    await db.close();
});

module.exports = db;