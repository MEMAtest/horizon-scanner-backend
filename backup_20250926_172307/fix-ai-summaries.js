const { Pool } = require('pg');

async function fixAISummaries() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/regulatory_updates'
    });

    try {
        console.log('🔧 Cleaning AI summaries with "undefined" suffix...');

        const result = await pool.query(`
            UPDATE regulatory_updates
            SET ai_summary = REPLACE(ai_summary, '.. undefined', '')
            WHERE ai_summary LIKE '%.. undefined%'
            RETURNING id, LEFT(ai_summary, 100) as cleaned_summary;
        `);

        console.log(`✅ Fixed ${result.rowCount} AI summaries`);

        if (result.rows.length > 0) {
            console.log('📋 Sample cleaned summaries:');
            result.rows.slice(0, 3).forEach(row => {
                console.log(`   ID ${row.id}: ${row.cleaned_summary}...`);
            });
        }

    } catch (error) {
        console.error('❌ Error fixing AI summaries:', error);
    } finally {
        await pool.end();
    }
}

fixAISummaries();