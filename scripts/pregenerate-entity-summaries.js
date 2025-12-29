/**
 * Pre-generate Entity Summaries Script
 * Generates AI summaries for all repeat offenders upfront
 * Run: node scripts/pregenerate-entity-summaries.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Use existing aiAnalyzer service
let aiAnalyzer = null;
try {
  aiAnalyzer = require('../src/services/aiAnalyzer');
} catch (err) {
  console.warn('AI Analyzer not available, using template summaries only');
}

// Rate limiting
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between requests
const BATCH_SIZE = 10;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateSummary(entityData) {
  if (!aiAnalyzer) return null;

  const { entity_name, count, total_fines, years, breach_types, actions } = entityData;

  const prompt = `Based on this entity's FCA enforcement history, write a 2-4 sentence summary explaining the pattern of violations and what this suggests about their compliance posture. Be specific and analytical.

Entity: ${entity_name}
Total enforcement actions: ${count}
Year range: ${years.length > 0 ? `${Math.min(...years)} to ${Math.max(...years)}` : 'Unknown'}
Breach types: ${breach_types.join(', ') || 'Various'}
Total fines: £${total_fines.toLocaleString()}

Individual action summaries:
${actions.slice(0, 5).map((a, i) => `${i + 1}. ${a.year || '?'}: ${a.breach_type || 'Unknown breach'} - ${a.outcome_type || 'enforcement action'}${a.fine_amount > 0 ? ` (£${parseFloat(a.fine_amount).toLocaleString()})` : ''}`).join('\n')}

Respond with ONLY the summary text, no JSON formatting.`;

  try {
    const response = await aiAnalyzer.makeGroqRequest(prompt);
    return response?.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error(`Error generating summary for ${entity_name}:`, error.message);
    return null;
  }
}

function generateBasicSummary(entityData) {
  const { entity_name, count, total_fines, years, breach_types } = entityData;

  const yearSpan = years.length > 1
    ? `between ${Math.min(...years)} and ${Math.max(...years)}`
    : years.length === 1
      ? `in ${years[0]}`
      : '';

  const breachText = breach_types.length > 0
    ? `primarily involving ${breach_types.slice(0, 2).join(' and ')}`
    : '';

  const fineText = total_fines > 0
    ? `totaling £${total_fines.toLocaleString()} in fines`
    : '';

  return `${entity_name} has faced ${count} FCA enforcement action${count > 1 ? 's' : ''} ${yearSpan}${breachText ? `, ${breachText}` : ''}${fineText ? `, ${fineText}` : ''}. ${count > 2 ? 'This pattern of repeated regulatory issues suggests persistent compliance weaknesses that require significant operational improvements.' : count > 1 ? 'Multiple enforcement actions indicate ongoing compliance challenges.' : ''}`;
}

async function getRepeatOffenders() {
  const result = await pool.query(`
    SELECT
      entity_name,
      COUNT(*) as count,
      SUM(COALESCE(fine_amount, 0)) as total_fines,
      ARRAY_AGG(DISTINCT EXTRACT(YEAR FROM notice_date)::int) FILTER (WHERE notice_date IS NOT NULL) as years,
      ARRAY_AGG(DISTINCT primary_breach_type) FILTER (WHERE primary_breach_type IS NOT NULL) as breach_types
    FROM fca_enforcement_notices
    WHERE entity_name IS NOT NULL
    GROUP BY entity_name
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);

  return result.rows;
}

async function getEntityActions(entityName) {
  const result = await pool.query(`
    SELECT
      EXTRACT(YEAR FROM notice_date)::int as year,
      outcome_type,
      fine_amount,
      primary_breach_type as breach_type,
      ai_summary
    FROM fca_enforcement_notices
    WHERE entity_name = $1
    ORDER BY notice_date DESC
    LIMIT 5
  `, [entityName]);

  return result.rows;
}

async function saveSummary(entityData, summary, aiGenerated = false) {
  try {
    await pool.query(`
      INSERT INTO entity_summaries
        (entity_name, summary, enforcement_count, total_fines, breach_types, years, ai_model, generated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (entity_name)
      DO UPDATE SET
        summary = EXCLUDED.summary,
        enforcement_count = EXCLUDED.enforcement_count,
        total_fines = EXCLUDED.total_fines,
        breach_types = EXCLUDED.breach_types,
        years = EXCLUDED.years,
        ai_model = EXCLUDED.ai_model,
        generated_at = NOW(),
        updated_at = NOW()
    `, [
      entityData.entity_name,
      summary,
      entityData.count,
      entityData.total_fines,
      entityData.breach_types || [],
      entityData.years || [],
      aiGenerated ? 'llama-3.1-70b' : 'template'
    ]);
    return true;
  } catch (error) {
    console.error(`Error saving summary for ${entityData.entity_name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting entity summary pre-generation...\n');

  try {
    // Get all repeat offenders
    const offenders = await getRepeatOffenders();
    console.log(`Found ${offenders.length} repeat offenders to process\n`);

    // Check which already have summaries
    const existing = await pool.query('SELECT entity_name FROM entity_summaries');
    const existingSet = new Set(existing.rows.map(r => r.entity_name.toLowerCase()));

    const toProcess = offenders.filter(o => !existingSet.has(o.entity_name.toLowerCase()));
    console.log(`${existingSet.size} already have summaries, ${toProcess.length} to generate\n`);

    let processed = 0;
    let aiSuccess = 0;
    let templateFallback = 0;
    let errors = 0;

    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BATCH_SIZE);

      for (const offender of batch) {
        try {
          // Get detailed actions for this entity
          const actions = await getEntityActions(offender.entity_name);
          const entityData = { ...offender, actions };

          // Try AI generation first
          let summary = await generateSummary(entityData);
          let aiGenerated = !!summary;

          // Fall back to template if AI fails
          if (!summary) {
            summary = generateBasicSummary(entityData);
            templateFallback++;
          } else {
            aiSuccess++;
          }

          // Save to database
          const saved = await saveSummary(entityData, summary, aiGenerated);
          if (saved) {
            processed++;
            console.log(`✅ [${processed}/${toProcess.length}] ${offender.entity_name} - ${aiGenerated ? 'AI' : 'Template'}`);
          } else {
            errors++;
          }

          // Rate limiting
          await sleep(RATE_LIMIT_DELAY);

        } catch (error) {
          console.error(`❌ Error processing ${offender.entity_name}:`, error.message);
          errors++;
        }
      }

      console.log(`\nBatch complete. Progress: ${processed}/${toProcess.length}\n`);
    }

    console.log('\n📊 Summary Generation Complete!');
    console.log(`   Total processed: ${processed}`);
    console.log(`   AI summaries: ${aiSuccess}`);
    console.log(`   Template fallbacks: ${templateFallback}`);
    console.log(`   Errors: ${errors}`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSummary, generateBasicSummary, getRepeatOffenders };
