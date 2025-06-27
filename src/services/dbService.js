// src/services/dbService.js
const { Pool } = require('pg');

let pool;

function getPool() {
    if (!pool) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable not set.');
        }
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }
    return pool;
}

async function getAnalyticsData() {
    const pool = getPool();
    const client = await pool.connect();
    try {
        const monthlyQuery = `SELECT to_char(created_at, 'YYYY-MM') as month, COUNT(*) as count FROM updates GROUP BY month ORDER BY month;`;
        const sectorQuery = `SELECT sector, COUNT(*) as count FROM updates WHERE sector IS NOT NULL AND sector <> 'N/A' GROUP BY sector ORDER BY count DESC;`;
        const authorityQuery = `SELECT authority, COUNT(*) as count FROM updates WHERE authority IS NOT NULL AND authority <> 'N/A' GROUP BY authority ORDER BY count DESC;`;

        const [monthlyRes, sectorRes, authorityRes] = await Promise.all([
            client.query(monthlyQuery),
            client.query(sectorQuery),
            client.query(authorityQuery)
        ]);

        return {
            monthlyActivity: monthlyRes.rows,
            sectorDistribution: sectorRes.rows,
            authorityActivity: authorityRes.rows
        };
    } finally {
        client.release();
    }
}

async function runCleanup() {
    const pool = getPool();
    const client = await pool.connect();
    try {
        const query = `
            DELETE FROM updates 
            WHERE headline = 'N/A' 
            OR impact = 'N/A' 
            OR authority = 'N/A'
            OR headline LIKE '%Welcome to%'
            OR headline LIKE '%test%'
            OR sector = 'N/A'`;
        const res = await client.query(query);
        return { deletedCount: res.rowCount };
    } finally {
        client.release();
    }
}


module.exports = {
    getPool,
    getAnalyticsData,
    runCleanup
};
