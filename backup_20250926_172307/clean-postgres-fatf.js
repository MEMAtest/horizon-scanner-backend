// clean-postgres-fatf.js
const dbService = require('./src/services/dbService');

async function cleanPostgresFATF() {
    await dbService.initialize();
    
    console.log('🔍 Checking PostgreSQL FATF data...\n');
    
    // Get all FATF updates from PostgreSQL
    const updates = await dbService.getEnhancedUpdates({ 
        authority: 'FATF',
        limit: 100 
    });
    
    console.log(`Found ${updates.length} FATF items in PostgreSQL\n`);
    
    for (const update of updates) {
        console.log(`ID ${update.id}: ${update.headline}`);
        
        // Remove fallback entries
        if (update.headline?.includes('FATF News Available') ||
            update.headline?.includes('FATF Updates Available') ||
            update.headline?.includes('Check FATF')) {
            
            console.log(`  → Deleting fallback entry ID ${update.id}`);
            await dbService.deleteUpdate(update.id);
        }
    }
    
    // Check what remains
    const remaining = await dbService.getEnhancedUpdates({ 
        authority: 'FATF',
        limit: 100 
    });
    
    console.log(`\n✅ Cleaned. ${remaining.length} FATF items remain:`);
    remaining.forEach(item => {
        console.log(`  ${item.headline?.substring(0, 60)}...`);
    });
}

cleanPostgresFATF().catch(console.error);