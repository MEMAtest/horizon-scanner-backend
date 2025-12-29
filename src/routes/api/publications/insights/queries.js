function fetchOutcomeAnalysis(pool) {
  return pool.query(`
      SELECT
        outcome_type,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as with_fine
      FROM fca_enforcement_notices
      WHERE outcome_type IS NOT NULL
      GROUP BY outcome_type
      ORDER BY count DESC
    `);
}

function fetchOutcomeBreaches(pool, outcomeType) {
  return pool.query(`
      SELECT
        primary_breach_type,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as with_fine
      FROM fca_enforcement_notices
      WHERE outcome_type = $1 AND primary_breach_type IS NOT NULL
      GROUP BY primary_breach_type
      ORDER BY count DESC
    `, [outcomeType]);
}

function fetchCaseStudies(pool, limit, outcomeType) {
  const sql = `
      WITH ranked_cases AS (
        SELECT
          publication_id, entity_name, entity_type, frn, outcome_type,
          fine_amount, primary_breach_type, notice_date,
          ai_summary, key_findings, specific_breaches,
          handbook_references, aggravating_factors, mitigating_factors,
          remediation_actions, pdf_url, risk_score,
          ROW_NUMBER() OVER (
            PARTITION BY outcome_type
            ORDER BY COALESCE(risk_score, 0) DESC, COALESCE(fine_amount, 0) DESC, notice_date DESC
          ) as rn
        FROM fca_enforcement_notices
        WHERE ai_summary IS NOT NULL
          ${outcomeType ? 'AND outcome_type = $2' : ''}
      )
      SELECT * FROM ranked_cases
      WHERE rn <= 2
      ORDER BY
        CASE outcome_type
          WHEN 'fine' THEN 1
          WHEN 'cancellation' THEN 2
          WHEN 'prohibition' THEN 3
          WHEN 'restriction' THEN 4
          ELSE 5
        END,
        COALESCE(risk_score, 0) DESC
      LIMIT $1
    `;

  const params = outcomeType ? [limit, outcomeType] : [limit];
  return pool.query(sql, params);
}

function fetchCaseStudySource(pool, publicationId) {
  return pool.query(`
      SELECT publication_id, entity_name, primary_breach_type, outcome_type, fine_amount, notice_date
      FROM fca_enforcement_notices
      WHERE publication_id = $1
    `, [publicationId]);
}

function fetchCaseStudySimilar(pool, sourceCase) {
  return pool.query(`
      SELECT
        publication_id,
        entity_name,
        primary_breach_type,
        outcome_type,
        fine_amount,
        notice_date,
        ai_summary
      FROM fca_enforcement_notices
      WHERE publication_id != $1
        AND primary_breach_type = $2
        AND entity_name != $3
      ORDER BY
        ABS(COALESCE(fine_amount, 0) - $4) ASC,
        notice_date DESC
      LIMIT 3
    `, [sourceCase.publication_id, sourceCase.primary_breach_type, sourceCase.entity_name, sourceCase.fine_amount || 0]);
}

function fetchCaseStudyImpact(pool, sourceCase) {
  return pool.query(`
      SELECT
        COUNT(*) as total_similar_cases,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        AVG(COALESCE(fine_amount, 0)) FILTER (WHERE fine_amount > 0) as avg_fine,
        MIN(notice_date) as first_case,
        MAX(notice_date) as latest_case
      FROM fca_enforcement_notices
      WHERE primary_breach_type = $1
    `, [sourceCase.primary_breach_type]);
}

function fetchRiskIndicators(pool) {
  return pool.query(`
      SELECT
        primary_breach_type,
        COUNT(*) as case_count,
        COUNT(CASE WHEN outcome_type IN ('fine', 'cancellation', 'prohibition') THEN 1 END) as severe_actions,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        AVG(COALESCE(fine_amount, 0)) as avg_fine,
        MAX(COALESCE(fine_amount, 0)) as max_fine,
        MAX(notice_date) as latest_case
      FROM fca_enforcement_notices
      WHERE primary_breach_type IS NOT NULL
      GROUP BY primary_breach_type
      ORDER BY case_count DESC, total_fines DESC
      LIMIT 10
    `);
}

function fetchRiskIndicatorsTotal(pool) {
  return pool.query(`
      SELECT COUNT(*) as total FROM fca_enforcement_notices
      WHERE primary_breach_type IS NOT NULL
    `);
}

function fetchTopFines(pool, limit) {
  return pool.query(`
      SELECT
        entity_name, frn, fine_amount, outcome_type,
        EXTRACT(YEAR FROM notice_date) as year,
        primary_breach_type, ai_summary, pdf_url,
        COALESCE(
          (SELECT string_agg(ref, ', ')
           FROM jsonb_array_elements_text(handbook_references) AS ref
           LIMIT 3),
          ''
        ) as top_references
      FROM fca_enforcement_notices
      WHERE fine_amount > 0
      ORDER BY fine_amount DESC
      LIMIT $1
    `, [limit]);
}

function fetchBreachAnalysisCases(pool, type, limit) {
  return pool.query(`
      SELECT
        entity_name, fine_amount, ai_summary,
        EXTRACT(YEAR FROM notice_date) as year,
        key_findings, handbook_references, pdf_url
      FROM fca_enforcement_notices
      WHERE primary_breach_type = $1 AND fine_amount > 0
      ORDER BY fine_amount DESC
      LIMIT $2
    `, [type, limit]);
}

function fetchBreachAnalysisStats(pool, type) {
  return pool.query(`
      SELECT
        COUNT(*) as total_cases,
        SUM(fine_amount) as total_fines,
        AVG(fine_amount) as avg_fine,
        MAX(fine_amount) as max_fine
      FROM fca_enforcement_notices
      WHERE primary_breach_type = $1
    `, [type]);
}

function fetchBreachAnalysisHandbook(pool, type) {
  return pool.query(`
      SELECT ref, COUNT(*) as count
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(handbook_references) AS ref
      WHERE primary_breach_type = $1
      GROUP BY ref
      ORDER BY count DESC
      LIMIT 5
    `, [type]);
}

function fetchBreachSummaryAggregates(pool) {
  return pool.query(`
      SELECT
        primary_breach_type,
        COUNT(*) as case_count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        MAX(COALESCE(fine_amount, 0)) as max_fine
      FROM fca_enforcement_notices
      WHERE primary_breach_type IS NOT NULL
      GROUP BY primary_breach_type
      ORDER BY total_fines DESC
    `);
}

function fetchBreachSummaryTopCases(pool) {
  return pool.query(`
      SELECT primary_breach_type, entity_name, fine_amount
      FROM (
        SELECT
          primary_breach_type,
          entity_name,
          fine_amount,
          ROW_NUMBER() OVER (PARTITION BY primary_breach_type ORDER BY COALESCE(fine_amount, 0) DESC) as rn
        FROM fca_enforcement_notices
        WHERE primary_breach_type IS NOT NULL AND fine_amount > 0
      ) ranked
      WHERE rn = 1
    `);
}

function fetchHandbookStats(pool, limit) {
  return pool.query(`
      SELECT
        ref,
        COUNT(*) as count,
        SUM(fine_amount) as total_fines,
        AVG(fine_amount) as avg_fine
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(handbook_references) AS ref
      WHERE handbook_references IS NOT NULL AND jsonb_array_length(handbook_references) > 0
      GROUP BY ref
      ORDER BY count DESC
      LIMIT $1
    `, [limit]);
}

function fetchHandbookStatsTotal(pool) {
  return pool.query(`
      SELECT COUNT(*) as total
      FROM fca_enforcement_notices
      WHERE handbook_references IS NOT NULL AND jsonb_array_length(handbook_references) > 0
    `);
}

function fetchRuleCitations(pool) {
  return pool.query(`
      SELECT
        handbook_ref,
        COUNT(*) as case_count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        AVG(COALESCE(fine_amount, 0)) as avg_fine,
        MAX(COALESCE(fine_amount, 0)) as max_fine,
        MIN(notice_date) as first_case,
        MAX(notice_date) as latest_case,
        COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as cases_with_fines
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(handbook_references) AS handbook_ref
      WHERE handbook_references IS NOT NULL AND jsonb_array_length(handbook_references) > 0
      GROUP BY handbook_ref
      ORDER BY case_count DESC
    `);
}

function fetchRuleCitationsTotal(pool) {
  return pool.query(`
      SELECT COUNT(*) as total FROM fca_enforcement_notices
      WHERE handbook_references IS NOT NULL AND jsonb_array_length(handbook_references) > 0
    `);
}

function fetchCommonFindings(pool, limit) {
  return pool.query(`
      SELECT
        finding,
        COUNT(*) as frequency
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(key_findings) AS finding
      WHERE key_findings IS NOT NULL AND jsonb_array_length(key_findings) > 0
      GROUP BY finding
      ORDER BY frequency DESC
      LIMIT $1
    `, [limit]);
}

function fetchAggravatingFactors(pool, limit) {
  return pool.query(`
      SELECT
        factor,
        COUNT(*) as count,
        AVG(fine_amount) as avg_fine
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(aggravating_factors) AS factor
      WHERE aggravating_factors IS NOT NULL
        AND jsonb_array_length(aggravating_factors) > 0
        AND fine_amount > 0
      GROUP BY factor
      ORDER BY count DESC
      LIMIT $1
    `, [limit]);
}

function fetchMitigatingFactors(pool, limit) {
  return pool.query(`
      SELECT
        factor,
        COUNT(*) as count,
        AVG(fine_amount) as avg_fine
      FROM fca_enforcement_notices,
           jsonb_array_elements_text(mitigating_factors) AS factor
      WHERE mitigating_factors IS NOT NULL
        AND jsonb_array_length(mitigating_factors) > 0
        AND fine_amount > 0
      GROUP BY factor
      ORDER BY count DESC
      LIMIT $1
    `, [limit]);
}

function fetchTimeline(pool) {
  return pool.query(`
      SELECT
        EXTRACT(YEAR FROM notice_date)::int as year,
        COUNT(*)::int as case_count,
        COALESCE(SUM(fine_amount), 0) as total_fines,
        COALESCE(MAX(fine_amount), 0) as max_fine
      FROM fca_enforcement_notices
      WHERE notice_date IS NOT NULL AND fine_amount > 0
      GROUP BY EXTRACT(YEAR FROM notice_date)
      ORDER BY year DESC
    `);
}

function fetchYearlyTotals(pool) {
  return pool.query(`
      SELECT
        EXTRACT(YEAR FROM notice_date) as year,
        COUNT(*) as total_count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as fines_with_amount
      FROM fca_enforcement_notices
      WHERE notice_date IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM notice_date)
      ORDER BY year DESC
    `);
}

function fetchYearlyOutcomeBreakdown(pool) {
  return pool.query(`
      SELECT
        EXTRACT(YEAR FROM notice_date) as year,
        outcome_type,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines
      FROM fca_enforcement_notices
      WHERE notice_date IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM notice_date), outcome_type
      ORDER BY year DESC, count DESC
    `);
}

function fetchYearlyBiggestCases(pool) {
  return pool.query(`
      SELECT year, entity_name, fine_amount, outcome_type, primary_breach_type
      FROM (
        SELECT
          EXTRACT(YEAR FROM notice_date) as year,
          entity_name,
          fine_amount,
          outcome_type,
          primary_breach_type,
          ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM notice_date) ORDER BY COALESCE(fine_amount, 0) DESC) as rn
        FROM fca_enforcement_notices
        WHERE notice_date IS NOT NULL AND fine_amount > 0
      ) ranked
      WHERE rn = 1
      ORDER BY year DESC
    `);
}

function fetchYearDetailMonthly(pool, year) {
  return pool.query(`
      SELECT
        EXTRACT(MONTH FROM notice_date) as month,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        COUNT(CASE WHEN fine_amount > 0 THEN 1 END) as fines_count
      FROM fca_enforcement_notices
      WHERE EXTRACT(YEAR FROM notice_date) = $1
      GROUP BY EXTRACT(MONTH FROM notice_date)
      ORDER BY month
    `, [year]);
}

function fetchYearDetailOutcomes(pool, year) {
  return pool.query(`
      SELECT
        outcome_type,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines
      FROM fca_enforcement_notices
      WHERE EXTRACT(YEAR FROM notice_date) = $1
      GROUP BY outcome_type
      ORDER BY count DESC
    `, [year]);
}

function fetchYearDetailBreaches(pool, year) {
  return pool.query(`
      SELECT
        primary_breach_type,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines
      FROM fca_enforcement_notices
      WHERE EXTRACT(YEAR FROM notice_date) = $1
        AND primary_breach_type IS NOT NULL
      GROUP BY primary_breach_type
      ORDER BY count DESC
      LIMIT 10
    `, [year]);
}

function fetchYearDetailComparison(pool, prevYear) {
  return pool.query(`
      SELECT
        EXTRACT(MONTH FROM notice_date) as month,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines
      FROM fca_enforcement_notices
      WHERE EXTRACT(YEAR FROM notice_date) = $1
      GROUP BY EXTRACT(MONTH FROM notice_date)
      ORDER BY month
    `, [prevYear]);
}

function fetchYearDetailTotals(pool, year) {
  return pool.query(`
      SELECT
        COUNT(*) as total_count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        AVG(COALESCE(fine_amount, 0)) FILTER (WHERE fine_amount > 0) as avg_fine,
        MAX(fine_amount) as max_fine
      FROM fca_enforcement_notices
      WHERE EXTRACT(YEAR FROM notice_date) = $1
    `, [year]);
}

function fetchReoffenders(pool, limit) {
  return pool.query(`
      SELECT
        entity_name,
        COUNT(*) as enforcement_count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        MIN(notice_date) as first_action,
        MAX(notice_date) as latest_action,
        array_agg(DISTINCT outcome_type) FILTER (WHERE outcome_type IS NOT NULL) as outcome_types,
        array_agg(DISTINCT primary_breach_type) FILTER (WHERE primary_breach_type IS NOT NULL) as breach_types,
        array_agg(DISTINCT EXTRACT(YEAR FROM notice_date)::int ORDER BY EXTRACT(YEAR FROM notice_date)::int) as years
      FROM fca_enforcement_notices
      WHERE entity_name IS NOT NULL
        AND entity_name != 'Full legal name of firm or individual'
      GROUP BY entity_name
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, SUM(COALESCE(fine_amount, 0)) DESC
      LIMIT $1
    `, [limit]);
}

function fetchThemes(pool) {
  return pool.query(`
      SELECT
        primary_breach_type,
        EXTRACT(YEAR FROM notice_date) as year,
        COUNT(*) as count,
        SUM(COALESCE(fine_amount, 0)) as total_fines,
        AVG(COALESCE(fine_amount, 0)) FILTER (WHERE fine_amount > 0) as avg_fine
      FROM fca_enforcement_notices
      WHERE notice_date IS NOT NULL AND primary_breach_type IS NOT NULL
      GROUP BY primary_breach_type, EXTRACT(YEAR FROM notice_date)
      ORDER BY primary_breach_type, year DESC
    `);
}

module.exports = {
  fetchOutcomeAnalysis,
  fetchOutcomeBreaches,
  fetchCaseStudies,
  fetchCaseStudySource,
  fetchCaseStudySimilar,
  fetchCaseStudyImpact,
  fetchRiskIndicators,
  fetchRiskIndicatorsTotal,
  fetchTopFines,
  fetchBreachAnalysisCases,
  fetchBreachAnalysisStats,
  fetchBreachAnalysisHandbook,
  fetchBreachSummaryAggregates,
  fetchBreachSummaryTopCases,
  fetchHandbookStats,
  fetchHandbookStatsTotal,
  fetchRuleCitations,
  fetchRuleCitationsTotal,
  fetchCommonFindings,
  fetchAggravatingFactors,
  fetchMitigatingFactors,
  fetchTimeline,
  fetchYearlyTotals,
  fetchYearlyOutcomeBreakdown,
  fetchYearlyBiggestCases,
  fetchYearDetailMonthly,
  fetchYearDetailOutcomes,
  fetchYearDetailBreaches,
  fetchYearDetailComparison,
  fetchYearDetailTotals,
  fetchReoffenders,
  fetchThemes
};
