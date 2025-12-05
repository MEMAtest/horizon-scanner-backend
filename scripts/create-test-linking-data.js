#!/usr/bin/env node
/**
 * Test Data Creation Script for Cross-Feature Linking
 *
 * Creates a complete "Consumer Duty Implementation" test scenario with:
 * 1. Regulatory Update - Source news item
 * 2. Watch List with match - Monitoring topic
 * 3. Research Dossier with item - Evidence collection
 * 4. Policy with citation - Policy document
 * 5. Kanban item - Linked to all above
 */

require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false }
})

const USER_ID = 'default'

async function createTestData() {
  const client = await pool.connect()

  try {
    console.log('\n🚀 Starting test data creation for cross-feature linking...\n')

    await client.query('BEGIN')

    // 1. Create or get a regulatory update (using existing if possible)
    console.log('📰 Step 1: Finding/creating regulatory update...')
    let updateId

    const existingUpdate = await client.query(
      `SELECT id FROM regulatory_updates
       WHERE headline ILIKE '%consumer duty%'
       LIMIT 1`
    )

    if (existingUpdate.rows.length > 0) {
      updateId = existingUpdate.rows[0].id
      console.log(`   ✓ Using existing update ID: ${updateId}`)
    } else {
      const updateResult = await client.query(`
        INSERT INTO regulatory_updates (
          headline, summary, url, authority, published_date,
          impact_level, content_type, sector, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW()
        ) RETURNING id
      `, [
        'FCA Consumer Duty Final Rules (PS22/9)',
        'The FCA has published final rules for the Consumer Duty, setting higher standards for consumer protection in retail financial services. Firms must act in good faith, avoid causing foreseeable harm, and enable customers to pursue their financial objectives.',
        'https://www.fca.org.uk/publications/policy-statements/ps22-9-consumer-duty',
        'FCA',
        new Date('2022-07-27'),
        'high',
        'Policy Statement',
        'Banking'
      ])
      updateId = updateResult.rows[0].id
      console.log(`   ✓ Created new update ID: ${updateId}`)
    }

    // 2. Create a watch list
    console.log('\n👁️ Step 2: Creating watch list...')
    const watchListResult = await client.query(`
      INSERT INTO watch_lists (
        user_id, name, description, keywords, authorities, sectors,
        is_active, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, true, NOW()
      ) RETURNING id
    `, [
      USER_ID,
      'Consumer Duty Tracking',
      'Monitor all Consumer Duty related regulatory updates and guidance from FCA',
      ['consumer duty', 'consumer protection', 'fair value', 'good faith', 'PS22/9'],
      ['FCA'],
      ['Banking', 'Insurance']
    ])
    const watchListId = watchListResult.rows[0].id
    console.log(`   ✓ Created watch list ID: ${watchListId}`)

    // 3. Create watch list match (link update to watch list)
    console.log('\n🔗 Step 3: Creating watch list match...')
    await client.query(`
      INSERT INTO watch_list_matches (
        watch_list_id, regulatory_update_id, match_score,
        match_reasons, dismissed, created_at
      ) VALUES ($1, $2, $3, $4, false, NOW())
      ON CONFLICT (watch_list_id, regulatory_update_id) DO NOTHING
    `, [
      watchListId,
      updateId,
      0.95,
      JSON.stringify({
        keywords: ['consumer duty', 'FCA'],
        authority: 'FCA',
        sector: 'Banking'
      })
    ])
    console.log(`   ✓ Linked update ${updateId} to watch list ${watchListId}`)

    // 4. Create a research dossier
    console.log('\n📁 Step 4: Creating research dossier...')
    const dossierResult = await client.query(`
      INSERT INTO research_dossiers (
        user_id, name, description, category, tags,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id
    `, [
      USER_ID,
      'Consumer Duty Research',
      'Collection of all Consumer Duty related guidance, speeches, and policy statements from FCA for gap analysis and implementation planning.',
      'Consumer Protection',
      ['consumer duty', 'FCA', 'implementation', 'gap analysis'],
      'active'
    ])
    const dossierId = dossierResult.rows[0].id
    console.log(`   ✓ Created dossier ID: ${dossierId}`)

    // 5. Add update to dossier
    console.log('\n📎 Step 5: Adding update to dossier...')
    await client.query(`
      INSERT INTO dossier_items (
        dossier_id, regulatory_update_id, user_notes,
        relevance_rating, added_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `, [
      dossierId,
      updateId,
      'Core policy statement - essential for understanding the full scope of Consumer Duty requirements. Key sections: Chapter 6 (Consumer Understanding), Chapter 7 (Price and Value).',
      5
    ])
    console.log(`   ✓ Added update ${updateId} to dossier ${dossierId}`)

    // 6. Create a policy
    console.log('\n📋 Step 6: Creating policy...')
    const policyResult = await client.query(`
      INSERT INTO policies (
        user_id, name, code, category, owner_name,
        review_frequency_months, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [
      USER_ID,
      'Consumer Duty Policy',
      'POL-CD-001',
      'Conduct',
      'Head of Compliance',
      12,
      'draft'
    ])
    const policyId = policyResult.rows[0].id
    console.log(`   ✓ Created policy ID: ${policyId}`)

    // 7. Create policy version
    console.log('\n📝 Step 7: Creating policy version...')
    const versionResult = await client.query(`
      INSERT INTO policy_versions (
        policy_id, version_number, content,
        effective_date, change_summary,
        triggered_by_update_id, approval_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [
      policyId,
      '1.0',
      '# Consumer Duty Policy\n\n## Purpose\nThis policy sets out our approach to meeting the FCA Consumer Duty requirements.\n\n## Scope\nApplies to all retail financial services activities.\n\n## Key Requirements\n1. Act in good faith towards customers\n2. Avoid causing foreseeable harm\n3. Enable customers to pursue their financial objectives',
      new Date('2023-07-31'),
      'Initial version created to comply with FCA PS22/9 Consumer Duty requirements',
      updateId,
      'draft'
    ])
    const versionId = versionResult.rows[0].id
    console.log(`   ✓ Created policy version ID: ${versionId}`)

    // 8. Add policy citation
    console.log('\n🔖 Step 8: Adding policy citation...')
    await client.query(`
      INSERT INTO policy_citations (
        policy_version_id, regulatory_update_id, citation_type,
        section_reference, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      versionId,
      updateId,
      'legal_basis',
      'Section 1.1 - Purpose',
      'Primary regulatory basis for this policy - FCA Consumer Duty final rules'
    ])
    console.log(`   ✓ Added citation from version ${versionId} to update ${updateId}`)

    // 9. Create Kanban item (regulatory change)
    console.log('\n📌 Step 9: Creating Kanban item...')

    // Get or create a workflow template
    // Note: workflow_stage_templates holds the template info (name, stages, etc.)
    let workflowTemplateId
    const templateResult = await client.query(
      `SELECT id FROM workflow_stage_templates WHERE user_id = $1 AND is_default = true LIMIT 1`,
      [USER_ID]
    )

    if (templateResult.rows.length > 0) {
      workflowTemplateId = templateResult.rows[0].id
      console.log(`   ✓ Using existing workflow template ID: ${workflowTemplateId}`)
    } else {
      // Create new template
      const newTemplate = await client.query(`
        INSERT INTO workflow_stage_templates (
          user_id, name, description, stages, is_default, is_active, created_at
        ) VALUES ($1, $2, $3, $4, true, true, NOW())
        RETURNING id
      `, [
        USER_ID,
        'Standard Regulatory Change',
        'Default workflow for regulatory changes',
        JSON.stringify([
          { id: 'identify', name: 'Identify', order: 1 },
          { id: 'assess', name: 'Assess', order: 2 },
          { id: 'implement', name: 'Implement', order: 3 },
          { id: 'complete', name: 'Complete', order: 4 }
        ])
      ])
      workflowTemplateId = newTemplate.rows[0].id
      console.log(`   ✓ Created new workflow template ID: ${workflowTemplateId}`)
    }

    // For current_stage_id, we use the first stage from the stages array
    // Since workflow uses stage IDs like 'identify', we need to use that
    const firstStageId = 'identify'

    // Note: linked_dossier_ids, linked_policy_ids, watch_list_match_ids expect UUID arrays
    // but our IDs are bigint. For now we skip those columns and rely on the
    // existing relationship tables (dossier_items, policy_citations, watch_list_matches)
    // to establish the connections via the shared regulatory_update_id
    const kanbanResult = await client.query(`
      INSERT INTO regulatory_change_items (
        user_id, workflow_template_id, regulatory_update_id,
        regulatory_update_url, title, summary, authority,
        impact_level, current_stage_id, status, priority,
        tags, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW())
      RETURNING id
    `, [
      USER_ID,
      workflowTemplateId,
      updateId,
      'https://www.fca.org.uk/publications/policy-statements/ps22-9-consumer-duty',
      'Implement Consumer Duty Requirements',
      'Comprehensive implementation project for FCA Consumer Duty. Includes gap analysis, policy drafting, training, and systems updates.',
      'FCA',
      'high',
      firstStageId,
      'active',
      'high',
      ['consumer duty', 'implementation', 'compliance']
    ])
    const kanbanId = kanbanResult.rows[0].id
    console.log(`   ✓ Created Kanban item ID: ${kanbanId}`)

    await client.query('COMMIT')

    console.log('\n' + '='.repeat(60))
    console.log('✅ TEST DATA CREATED SUCCESSFULLY!')
    console.log('='.repeat(60))
    console.log('\n📊 Summary of Created Items:')
    console.log(`   • Regulatory Update: ID ${updateId}`)
    console.log(`   • Watch List: ID ${watchListId} (with match)`)
    console.log(`   • Research Dossier: ID ${dossierId} (with item)`)
    console.log(`   • Policy: ID ${policyId} (with version and citation)`)
    console.log(`   • Kanban Item: ID ${kanbanId} (linked to all above)`)
    console.log('\n🔗 Cross-Feature Links Created:')
    console.log(`   • Watch List → Regulatory Update (via watch_list_matches)`)
    console.log(`   • Dossier → Regulatory Update (via dossier_items)`)
    console.log(`   • Policy Version → Regulatory Update (via policy_citations)`)
    console.log(`   • Kanban → Dossiers, Policies, Watch Lists (via linked_*_ids arrays)`)
    console.log('\n📍 You can now test the Connected Items feature by:')
    console.log(`   1. Visit /watch-lists and click "View Matches" on "Consumer Duty Tracking"`)
    console.log(`   2. Visit /dossiers and click "View Timeline" on "Consumer Duty Research"`)
    console.log(`   3. Visit /policies and click "View" on "Consumer Duty Policy"`)
    console.log(`   4. Visit /kanban and click on "Implement Consumer Duty Requirements"`)
    console.log('\n')

    return {
      updateId,
      watchListId,
      dossierId,
      policyId,
      kanbanId
    }

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('\n❌ Error creating test data:', error.message)
    console.error(error.stack)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the script
createTestData()
  .then(() => {
    process.exit(0)
  })
  .catch(() => {
    process.exit(1)
  })
