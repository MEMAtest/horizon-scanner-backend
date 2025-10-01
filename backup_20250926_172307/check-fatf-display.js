// check-fatf-display.js
const dbService = require('./src/services/dbService');

async function checkFATFDisplay() {
    await dbService.initialize();
    
    // Get FATF items sorted by date (newest first)
    const updates = await dbService.getEnhancedUpdates({ 
        authority: 'FATF',
        limit: 20
    });
    
    console.log(`\n📊 FATF items in database (sorted by date):\n`);
    
    updates.forEach(update => {
        const pubDate = update.publishedDate || update.published_date;
        const fetchDate = update.fetchedDate || update.fetched_date || update.created_at;
        
        console.log(`ID ${update.id}:`);
        console.log(`  Headline: ${update.headline}`);
        console.log(`  Published: ${pubDate}`);
        console.log(`  Fetched: ${fetchDate}`);
        console.log(`  Is today? ${isToday(new Date(fetchDate))}`);
        console.log('');
    });
    
    // Check if there's a specific item marked as "today"
    const todayItems = updates.filter(u => {
        const date = u.fetchedDate || u.fetched_date || u.created_at;
        return isToday(new Date(date));
    });
    
    if (todayItems.length > 0) {
        console.log(`⚠️ Found ${todayItems.length} FATF items marked as "today":`);
        todayItems.forEach(item => {
            console.log(`  - ID ${item.id}: "${item.headline}"`);
        });
    }
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

checkFATFDisplay().catch(console.error);