/**
 * Fix region/country data for international scrapers
 */
require('dotenv').config();
const dbService = require('../src/services/dbService');

// Map of authorities to their correct region/country
const AUTHORITY_MAPPING = {
  'CFTC': { region: 'Americas', country: 'USA' },
  'SEBI': { region: 'Asia-Pacific', country: 'India' },
  'CONSOB': { region: 'Europe', country: 'Italy' },
  'BCBS': { region: 'International', country: 'International' },
  'FSCA': { region: 'Africa', country: 'South Africa' },
  'FIC_SA': { region: 'Africa', country: 'South Africa' },
  'EU_COUNCIL': { region: 'Europe', country: 'EU' },
  'CBN': { region: 'Africa', country: 'Nigeria' },
  'CBE': { region: 'Africa', country: 'Egypt' },
  'FSCS': { region: 'Europe', country: 'UK' },
  'MAS': { region: 'Asia-Pacific', country: 'Singapore' },
  'HKMA': { region: 'Asia-Pacific', country: 'Hong Kong' },
  'SARB': { region: 'Africa', country: 'South Africa' },
  'AUSTRAC': { region: 'Asia-Pacific', country: 'Australia' },
  'FATF': { region: 'International', country: 'International' },
  'OFAC': { region: 'Americas', country: 'USA' },
  'AMF_FR': { region: 'Europe', country: 'France' },
  'BaFin': { region: 'Europe', country: 'Germany' },
  'CBI': { region: 'Europe', country: 'Ireland' },
  'FI_SE': { region: 'Europe', country: 'Sweden' },
  'ACPR': { region: 'Europe', country: 'France' },
  'AFM': { region: 'Europe', country: 'Netherlands' },
  'DNB': { region: 'Europe', country: 'Netherlands' },
  'CNMV': { region: 'Europe', country: 'Spain' }
};

async function fixRegions() {
  console.log('Fixing region/country data for international scrapers...\n');

  try {
    const client = await dbService.pool.connect();

    try {
      let totalUpdated = 0;

      for (const [authority, data] of Object.entries(AUTHORITY_MAPPING)) {
        const result = await client.query(`
          UPDATE regulatory_updates
          SET region = $1, country = $2
          WHERE authority = $3
            AND (region = 'UK' OR region IS NULL OR country = 'UK' OR country IS NULL)
          RETURNING id
        `, [data.region, data.country, authority]);

        if (result.rows.length > 0) {
          console.log(`  ${authority}: Updated ${result.rows.length} records -> ${data.region}/${data.country}`);
          totalUpdated += result.rows.length;
        }
      }

      console.log(`\nTotal records updated: ${totalUpdated}`);

      // Show final counts
      const counts = await client.query(`
        SELECT authority, region, country, COUNT(*) as total
        FROM regulatory_updates
        WHERE authority IN (${Object.keys(AUTHORITY_MAPPING).map((_, i) => `$${i+1}`).join(', ')})
        GROUP BY authority, region, country
        ORDER BY authority
      `, Object.keys(AUTHORITY_MAPPING));

      console.log('\nUpdated region/country by authority:');
      console.log('Authority'.padEnd(15) + 'Region'.padEnd(20) + 'Country'.padEnd(20) + 'Count');
      console.log('-'.repeat(70));
      counts.rows.forEach(r => {
        console.log((r.authority || 'N/A').padEnd(15) + (r.region || 'N/A').padEnd(20) + (r.country || 'N/A').padEnd(20) + r.total);
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Fix failed:', error.message);
  }

  process.exit(0);
}

fixRegions();
