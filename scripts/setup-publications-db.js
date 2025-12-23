#!/usr/bin/env node

/**
 * FCA Publications Database Setup
 *
 * Initializes the publications tables in the database
 *
 * Usage:
 *   node scripts/setup-publications-db.js [options]
 *
 * Options:
 *   --drop               Drop existing tables before creating
 *   --dry-run            Show SQL without executing
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

async function main() {
  console.log('========================================');
  console.log('FCA Publications Database Setup');
  console.log('========================================\n');

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Read schema file
  const schemaPath = path.join(__dirname, '../sql/fca_publications_schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error(`ERROR: Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log(`Database: ${process.env.DATABASE_URL.substring(0, 30)}...`);
  console.log(`Schema file: ${schemaPath}`);
  console.log(`Drop tables: ${args.drop || false}`);
  console.log(`Dry run: ${args['dry-run'] || false}\n`);

  if (args['dry-run']) {
    console.log('SQL to execute:\n');
    console.log('-'.repeat(60));
    console.log(schema.substring(0, 2000));
    if (schema.length > 2000) {
      console.log(`\n... (${schema.length - 2000} more characters)`);
    }
    console.log('-'.repeat(60));
    console.log('\nDRY RUN - No changes made');
    process.exit(0);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('Connected to database\n');

    // Drop tables if requested
    if (args.drop) {
      console.log('Dropping existing tables...');
      await client.query(`
        DROP TABLE IF EXISTS fca_publication_full_text CASCADE;
        DROP TABLE IF EXISTS fca_enforcement_notices CASCADE;
        DROP TABLE IF EXISTS fca_publications_index CASCADE;
        DROP TABLE IF EXISTS fca_scraping_progress CASCADE;
        DROP TABLE IF EXISTS fca_breach_taxonomy CASCADE;
        DROP VIEW IF EXISTS fca_enforcement_dashboard CASCADE;
        DROP VIEW IF EXISTS fca_breach_summary CASCADE;
        DROP VIEW IF EXISTS fca_processing_status CASCADE;
        DROP FUNCTION IF EXISTS update_publications_timestamp CASCADE;
      `);
      console.log('Tables dropped\n');
    }

    // Execute schema
    console.log('Creating tables...');
    await client.query(schema);
    console.log('Schema executed successfully\n');

    // Verify tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'fca_%'
      ORDER BY table_name
    `);

    console.log('Created tables:');
    for (const row of tablesResult.rows) {
      console.log(`  - ${row.table_name}`);
    }

    // Check views
    const viewsResult = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name LIKE 'fca_%'
      ORDER BY table_name
    `);

    if (viewsResult.rows.length > 0) {
      console.log('\nCreated views:');
      for (const row of viewsResult.rows) {
        console.log(`  - ${row.table_name}`);
      }
    }

    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename LIKE 'fca_%'
      ORDER BY indexname
    `);

    console.log(`\nCreated ${indexResult.rows.length} indexes`);

    client.release();
    console.log('\n========================================');
    console.log('Setup Complete!');
    console.log('========================================');

  } catch (error) {
    console.error('Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
