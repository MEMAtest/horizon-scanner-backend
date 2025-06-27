// ==========================================
// 🔧 FIX 2: src/services/fileDbService.js - Bulletproof Serverless Version
// ==========================================

const fs = require('fs');
const path = require('path');

// 🚨 CRITICAL: Don't import lowdb at module level in serverless
let Low, JSONFile;

const IS_VERCEL = !!process.env.VERCEL;
let db;
let isInitialized = false;

// Lazy load lowdb only when needed
async function loadLowDb() {
    if (!Low || !JSONFile) {
        try {
            const lowdb = require('lowdb');
            Low = lowdb.Low;
            JSONFile = lowdb.JSONFile;
        } catch (error) {
            console.error('Failed to load lowdb:', error);
            // Fallback to native JSON operations
            return null;
        }
    }
    return { Low, JSONFile };
}

// Determine file paths
function getDbPaths() {
    const srcPath = path.join(process.cwd(), 'db.json');
    const destPath = IS_VERCEL ? '/tmp/db.json' : srcPath;
    
    return { srcPath, destPath };
}

// Create minimal db.json if it doesn't exist
function createDefaultDb(filePath) {
    const defaultData = { updates: [] };
    
    try {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        return true;
    } catch (error) {
        console.error('Failed to create default db:', error);
        return false;
    }
}

// Serverless-safe database initialization
async function getDb() {
    if (db && isInitialized) {
        return db;
    }

    try {
        const { srcPath, destPath } = getDbPaths();
        
        // In Vercel, copy source to writable location
        if (IS_VERCEL) {
            try {
                // Check if source exists
                if (fs.existsSync(srcPath)) {
                    // Copy to temp if not already there
                    if (!fs.existsSync(destPath)) {
                        fs.copyFileSync(srcPath, destPath);
                        console.log('✅ Copied db.json to /tmp');
                    }
                } else {
                    // Create default if source doesn't exist
                    if (!fs.existsSync(destPath)) {
                        createDefaultDb(destPath);
                        console.log('✅ Created default db.json in /tmp');
                    }
                }
            } catch (copyError) {
                console.error('Copy operation failed:', copyError);
                // Create minimal db in temp
                createDefaultDb(destPath);
            }
        } else {
            // Local development - create if doesn't exist
            if (!fs.existsSync(destPath)) {
                createDefaultDb(destPath);
                console.log('✅ Created default db.json locally');
            }
        }

        // Try to use lowdb
        const lowdbModules = await loadLowDb();
        
        if (lowdbModules) {
            const { Low, JSONFile } = lowdbModules;
            const adapter = new JSONFile(destPath);
            db = new Low(adapter);
            
            try {
                await db.read();
                db.data = db.data || { updates: [] };
                await db.write();
                isInitialized = true;
                console.log('✅ LowDB initialized successfully');
                return db;
            } catch (dbError) {
                console.error('LowDB operation failed:', dbError);
                // Fall through to manual JSON handling
            }
        }

        // Fallback: Manual JSON operations (more reliable in serverless)
        console.log('📁 Using manual JSON file operations');
        
        db = {
            data: null,
            
            async read() {
                try {
                    const rawData = fs.readFileSync(destPath, 'utf8');
                    this.data = JSON.parse(rawData);
                    this.data = this.data || { updates: [] };
                } catch (error) {
                    console.error('Read error:', error);
                    this.data = { updates: [] };
                }
            },
            
            async write() {
                try {
                    fs.writeFileSync(destPath, JSON.stringify(this.data, null, 2));
                } catch (error) {
                    console.error('Write error:', error);
                    throw error;
                }
            }
        };

        await db.read();
        isInitialized = true;
        console.log('✅ Manual JSON DB initialized');
        return db;

    } catch (error) {
        console.error('Database initialization failed:', error);
        
        // Last resort: In-memory database
        db = {
            data: { updates: [] },
            async read() { /* no-op */ },
            async write() { /* no-op */ }
        };
        
        isInitialized = true;
        console.log('⚠️ Using in-memory database fallback');
        return db;
    }
}

// Public API
async function initialize() {
    try {
        await getDb();
        console.log('✅ FileDB service initialized');
        return true;
    } catch (error) {
        console.error('❌ FileDB initialization failed:', error);
        return false;
    }
}

async function findUpdateByUrl(url) {
    try {
        const dbInstance = await getDb();
        await dbInstance.read();
        return dbInstance.data.updates.find(update => update.url === url);
    } catch (error) {
        console.error('Find operation failed:', error);
        return null;
    }
}

async function addUpdate(update) {
    try {
        const dbInstance = await getDb();
        await dbInstance.read();
        
        // Add timestamp and ID if not present
        const newUpdate = {
            id: Date.now(),
            ...update,
            createdAt: update.createdAt || new Date().toISOString()
        };
        
        dbInstance.data.updates.push(newUpdate);
        await dbInstance.write();
        
        console.log(`✅ Added update: ${update.headline || 'Untitled'}`);
        return newUpdate;
    } catch (error) {
        console.error('Add operation failed:', error);
        throw error;
    }
}

async function getAllUpdates() {
    try {
        const dbInstance = await getDb();
        await dbInstance.read();
        return dbInstance.data.updates || [];
    } catch (error) {
        console.error('Get all operation failed:', error);
        return [];
    }
}

module.exports = {
    initialize,
    findUpdateByUrl,
    addUpdate,
    getAllUpdates,
    
    // Legacy compatibility
    get: async (key) => {
        const dbInstance = await getDb();
        await dbInstance.read();
        return {
            value: () => dbInstance.data[key] || []
        };
    }
};