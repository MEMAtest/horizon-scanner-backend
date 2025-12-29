async function updateTrends() {
  try {
    console.log('📊 Updating enforcement trends...')

    // The triggers in the database should handle most of this automatically,
    // but we can run additional calculations here if needed

    // Update firm history for repeat offender analysis
    await this.db.query(`
                INSERT INTO fca_firm_history (
                    firm_name,
                    normalized_name,
                    total_fines,
                    fine_count,
                    first_fine_date,
                    latest_fine_date,
                    is_repeat_offender
                )
                SELECT
                    firm_individual,
                    normalize_firm_name(firm_individual),
                    SUM(amount) FILTER (WHERE amount IS NOT NULL),
                    COUNT(*),
                    MIN(date_issued),
                    MAX(date_issued),
                    COUNT(*) > 1
                FROM fca_fines
                WHERE processing_status = 'completed'
                GROUP BY firm_individual
                ON CONFLICT (normalized_name)
                DO UPDATE SET
                    total_fines = EXCLUDED.total_fines,
                    fine_count = EXCLUDED.fine_count,
                    latest_fine_date = EXCLUDED.latest_fine_date,
                    is_repeat_offender = EXCLUDED.is_repeat_offender,
                    updated_at = CURRENT_TIMESTAMP
            `)

    console.log('✅ Trends updated successfully')
  } catch (error) {
    console.error('❌ Error updating trends:', error)
    throw error
  }
}

module.exports = {
  updateTrends
}
