const { getDbPool, getPipeline } = require('../helpers');
const queries = require('./queries');
const {
  parseLimit,
  parseLimitOrDefault,
  parseYearParam,
  validateReferencesArray
} = require('./validation');

function getPool() {
  return getPipeline()?.pool || getDbPool();
}

function formatBreachLabel(type) {
  if (!type) return 'Unknown';
  const labels = {
    PRINCIPLES: 'Principles Breaches',
    AML: 'AML/KYC Failures',
    SYSTEMS_CONTROLS: 'Systems & Controls Gaps',
    MARKET_ABUSE: 'Market Abuse',
    MIS_SELLING: 'Mis-selling',
    CLIENT_MONEY: 'Client Money Issues',
    CONDUCT: 'Conduct Failures',
    PRUDENTIAL: 'Prudential Requirements',
    REPORTING: 'Regulatory Reporting Delays',
    GOVERNANCE: 'Governance Deficiencies',
    FINANCIAL_CRIME: 'Financial Crime',
    APPROVED_PERSONS: 'Approved Persons Issues',
    CONSUMER_DUTY: 'Consumer Duty Failures',
    OTHER: 'Other Breaches'
  };
  return labels[type] || type.replace(/_/g, ' ').split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

const outcomeExplanations = {
  fine: {
    label: 'Fines',
    description: 'Monetary penalties for significant rule breaches',
    triggers: [
      'Serious breaches of FCA Principles or rules',
      'Consumer harm resulting from misconduct',
      'Systemic control failures',
      'Market manipulation or abuse'
    ]
  },
  prohibition: {
    label: 'Prohibitions',
    description: 'Individual banned from holding regulated role',
    triggers: [
      'Lack of fitness and propriety',
      'Misconduct by approved persons',
      'Criminal convictions',
      'Dishonesty or lack of integrity',
      'SM&CR breaches by senior managers'
    ]
  },
  cancellation: {
    label: 'Cancellations',
    description: 'Firm loses FCA authorisation',
    triggers: [
      'Firm ceased trading / voluntarily gave up permission',
      'Failed to meet threshold conditions',
      'Non-payment of fees',
      'Failure to submit regulatory returns',
      'Consumer credit firms not meeting requirements'
    ]
  },
  restriction: {
    label: 'Restrictions',
    description: 'Firm limited in activities it can perform',
    triggers: [
      'Specific control deficiencies identified',
      'Risk management failures',
      'Voluntary restrictions to address issues',
      'Interim measure pending full investigation'
    ]
  },
  censure: {
    label: 'Public Censures',
    description: 'Public reprimand without financial penalty',
    triggers: [
      'Breaches not warranting fine',
      'Firm demonstrated strong remediation',
      'Lesser severity misconduct',
      'Alternative to fine due to financial hardship'
    ]
  },
  public_statement: {
    label: 'Public Statements',
    description: 'Formal regulatory statement about conduct',
    triggers: [
      'Guidance for industry',
      'Warning about specific practices',
      'Clarification of regulatory expectations'
    ]
  },
  warning: {
    label: 'Warnings',
    description: 'Preliminary notice of potential enforcement',
    triggers: [
      'Early stage of enforcement process',
      'Initial findings requiring response',
      'Notification of regulatory concerns'
    ]
  },
  supervisory_notice: {
    label: 'Supervisory Notices',
    description: 'Formal supervisory action notice',
    triggers: [
      'Variation of permission',
      'Imposition of requirements',
      'Supervisory intervention'
    ]
  },
  voluntary_requirement: {
    label: 'Voluntary Requirements',
    description: 'Firm-initiated remedial commitments',
    triggers: [
      'Self-identified issues',
      'Proactive remediation',
      'Agreement with FCA on improvements'
    ]
  },
  other: {
    label: 'Other Actions',
    description: 'Miscellaneous enforcement actions',
    triggers: [
      'Various regulatory interventions',
      'Case-specific outcomes'
    ]
  }
};

const breachLabels = {
  PRINCIPLES: 'Principles',
  AML: 'AML',
  SYSTEMS_CONTROLS: 'Systems & Controls',
  MARKET_ABUSE: 'Market Abuse',
  MIS_SELLING: 'Mis-selling',
  CLIENT_MONEY: 'Client Money',
  CONDUCT: 'Conduct',
  PRUDENTIAL: 'Prudential',
  REPORTING: 'Reporting',
  GOVERNANCE: 'Governance',
  FINANCIAL_CRIME: 'Financial Crime',
  COMPLAINTS: 'Complaints',
  FINANCIAL_PROMOTIONS: 'Financial Promotions',
  APPROVED_PERSONS: 'Approved Persons'
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function getOutcomeAnalysis(req, res) {
  try {
    const pool = getPool();
    const outcomeResult = await queries.fetchOutcomeAnalysis(pool);
    const total = outcomeResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0);

    const outcomes = outcomeResult.rows.map(row => {
      const type = row.outcome_type;
      const explanation = outcomeExplanations[type] || {
        label: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
        description: 'Regulatory enforcement action',
        triggers: []
      };

      return {
        type,
        label: explanation.label,
        count: parseInt(row.count),
        percentage: ((parseInt(row.count) / total) * 100).toFixed(1),
        totalFines: parseFloat(row.total_fines) || 0,
        withFine: parseInt(row.with_fine) || 0,
        description: explanation.description,
        triggers: explanation.triggers
      };
    });

    const topOutcome = outcomes[0];
    const insight = topOutcome
      ? `${topOutcome.label} account for ${topOutcome.percentage}% of all enforcement actions. ${topOutcome.description.toLowerCase()}.`
      : null;

    res.json({
      success: true,
      data: {
        outcomes,
        total,
        insight
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting outcome analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getOutcomeBreaches(req, res) {
  try {
    const { outcomeType } = req.params;
    const pool = getPool();
    const result = await queries.fetchOutcomeBreaches(pool, outcomeType);
    const total = result.rows.reduce((sum, r) => sum + parseInt(r.count), 0);

    const breaches = result.rows.map(row => ({
      type: row.primary_breach_type,
      label: breachLabels[row.primary_breach_type] || row.primary_breach_type,
      count: parseInt(row.count),
      percentage: total > 0 ? ((parseInt(row.count) / total) * 100).toFixed(1) : 0,
      totalFines: parseFloat(row.total_fines) || 0,
      withFine: parseInt(row.with_fine) || 0
    }));

    res.json({
      success: true,
      data: {
        outcomeType,
        breaches,
        total
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting outcome breaches:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getCaseStudies(req, res) {
  try {
    const { outcome_type } = req.query;
    const limit = parseLimit(req.query.limit, 5);
    const pool = getPool();
    const result = await queries.fetchCaseStudies(pool, limit, outcome_type);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        fine_amount: parseFloat(row.fine_amount) || 0,
        key_findings: row.key_findings || [],
        handbook_references: row.handbook_references || [],
        aggravating_factors: row.aggravating_factors || [],
        mitigating_factors: row.mitigating_factors || []
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting case studies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getCaseStudySimilar(req, res) {
  try {
    const { publicationId } = req.params;
    const pool = getPool();

    const sourceResult = await queries.fetchCaseStudySource(pool, publicationId);

    if (sourceResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const sourceCase = sourceResult.rows[0];
    const similarResult = await queries.fetchCaseStudySimilar(pool, sourceCase);
    const impactResult = await queries.fetchCaseStudyImpact(pool, sourceCase);

    const impactStats = impactResult.rows[0];

    res.json({
      success: true,
      data: {
        sourceCase: {
          publicationId: sourceCase.publication_id,
          entityName: sourceCase.entity_name,
          breachType: sourceCase.primary_breach_type,
          outcomeType: sourceCase.outcome_type,
          fineAmount: parseFloat(sourceCase.fine_amount) || 0
        },
        similarCases: similarResult.rows.map(row => ({
          publicationId: row.publication_id,
          entityName: row.entity_name,
          breachType: row.primary_breach_type,
          outcomeType: row.outcome_type,
          fineAmount: parseFloat(row.fine_amount) || 0,
          year: row.notice_date ? new Date(row.notice_date).getFullYear() : null,
          summary: row.ai_summary
        })),
        industryImpact: {
          totalCases: parseInt(impactStats.total_similar_cases) || 0,
          totalFines: parseFloat(impactStats.total_fines) || 0,
          avgFine: parseFloat(impactStats.avg_fine) || 0,
          yearRange: impactStats.first_case && impactStats.latest_case
            ? `${new Date(impactStats.first_case).getFullYear()}-${new Date(impactStats.latest_case).getFullYear()}`
            : null
        }
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting similar cases:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getRiskIndicators(req, res) {
  try {
    const pool = getPool();
    const result = await queries.fetchRiskIndicators(pool);
    const totalResult = await queries.fetchRiskIndicatorsTotal(pool);
    const totalCases = parseInt(totalResult.rows[0]?.total || 1);

    const indicators = result.rows.map(row => {
      const caseCount = parseInt(row.case_count);
      const severeActions = parseInt(row.severe_actions);
      const percentage = ((caseCount / totalCases) * 100).toFixed(1);
      const severityRatio = severeActions / caseCount;

      let riskLevel = 'low';
      if (percentage > 15 || severityRatio > 0.5) riskLevel = 'high';
      else if (percentage > 5 || severityRatio > 0.3) riskLevel = 'medium';

      return {
        breachType: row.primary_breach_type,
        label: formatBreachLabel(row.primary_breach_type),
        caseCount,
        percentage: parseFloat(percentage),
        severeActions,
        totalFines: parseFloat(row.total_fines || 0),
        avgFine: parseFloat(row.avg_fine || 0),
        maxFine: parseFloat(row.max_fine || 0),
        latestCase: row.latest_case,
        riskLevel
      };
    });

    res.json({
      success: true,
      data: indicators,
      totalCases
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting risk indicators:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getTopFines(req, res) {
  try {
    const limit = parseLimit(req.query.limit, 10);
    const pool = getPool();
    const result = await queries.fetchTopFines(pool, limit);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        fine_amount: parseFloat(row.fine_amount) || 0,
        year: row.year ? parseInt(row.year) : null
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting top fines:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getBreachAnalysis(req, res) {
  try {
    const { type } = req.params;
    const limit = parseLimit(req.query.limit, 5);
    const pool = getPool();

    const casesResult = await queries.fetchBreachAnalysisCases(pool, type, limit);
    const statsResult = await queries.fetchBreachAnalysisStats(pool, type);
    const handbookResult = await queries.fetchBreachAnalysisHandbook(pool, type);

    res.json({
      success: true,
      data: {
        breachType: type,
        stats: {
          totalCases: parseInt(statsResult.rows[0]?.total_cases || 0),
          totalFines: parseFloat(statsResult.rows[0]?.total_fines || 0),
          avgFine: parseFloat(statsResult.rows[0]?.avg_fine || 0),
          maxFine: parseFloat(statsResult.rows[0]?.max_fine || 0)
        },
        topHandbookRefs: handbookResult.rows,
        examples: casesResult.rows.map(row => ({
          ...row,
          fine_amount: parseFloat(row.fine_amount) || 0,
          year: row.year ? parseInt(row.year) : null,
          key_findings: row.key_findings || [],
          handbook_references: row.handbook_references || []
        }))
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting breach analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getBreachSummary(req, res) {
  try {
    const pool = getPool();
    const aggregates = await queries.fetchBreachSummaryAggregates(pool);
    const topCases = await queries.fetchBreachSummaryTopCases(pool);

    const topCaseMap = {};
    topCases.rows.forEach(row => {
      topCaseMap[row.primary_breach_type] = {
        entity: row.entity_name,
        fine: parseFloat(row.fine_amount || 0)
      };
    });

    res.json({
      success: true,
      data: aggregates.rows.map(row => ({
        breachType: row.primary_breach_type,
        caseCount: parseInt(row.case_count),
        totalFines: parseFloat(row.total_fines || 0),
        maxFine: parseFloat(row.max_fine || 0),
        topCase: topCaseMap[row.primary_breach_type] || { entity: 'N/A', fine: 0 }
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting breach summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getHandbookStats(req, res) {
  try {
    const limit = parseLimit(req.query.limit, 15);
    const pool = getPool();
    const result = await queries.fetchHandbookStats(pool, limit);
    const totalResult = await queries.fetchHandbookStatsTotal(pool);

    const total = parseInt(totalResult.rows[0]?.total || 1);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        reference: row.ref,
        count: parseInt(row.count),
        percentage: ((parseInt(row.count) / total) * 100).toFixed(1),
        totalFines: parseFloat(row.total_fines || 0),
        avgFine: parseFloat(row.avg_fine || 0)
      })),
      total
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting handbook stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getRuleCitations(req, res) {
  try {
    const pool = getPool();
    const result = await queries.fetchRuleCitations(pool);
    const totalResult = await queries.fetchRuleCitationsTotal(pool);
    const totalCases = parseInt(totalResult.rows[0]?.total || 1);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        rule: row.handbook_ref,
        caseCount: parseInt(row.case_count),
        percentage: ((parseInt(row.case_count) / totalCases) * 100).toFixed(1),
        totalFines: parseFloat(row.total_fines || 0),
        avgFine: parseFloat(row.avg_fine || 0),
        maxFine: parseFloat(row.max_fine || 0),
        casesWithFines: parseInt(row.cases_with_fines || 0),
        firstCase: row.first_case,
        latestCase: row.latest_case
      })),
      totalCases
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting rule citations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getHandbookRule(req, res) {
  try {
    const { reference } = req.params;
    const fcaHandbook = require('../../../../services/fcaHandbookService');

    const details = fcaHandbook.getRuleDetails(decodeURIComponent(reference));
    const color = fcaHandbook.getCategoryColor(details.category);

    res.json({
      success: true,
      data: {
        ...details,
        color
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting handbook rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getHandbookBatch(req, res) {
  try {
    const { references } = req.body;
    const validation = validateReferencesArray(references);
    if (validation.error) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const fcaHandbook = require('../../../../services/fcaHandbookService');
    const results = fcaHandbook.getBatchRuleDetails(references);

    for (const [ref, details] of Object.entries(results)) {
      results[ref].color = fcaHandbook.getCategoryColor(details.category);
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting batch handbook rules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getCommonFindings(req, res) {
  try {
    const limit = parseLimit(req.query.limit, 20);
    const pool = getPool();
    const result = await queries.fetchCommonFindings(pool, limit);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        finding: row.finding,
        frequency: parseInt(row.frequency)
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting common findings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getFineModifiers(req, res) {
  try {
    const limit = parseLimit(req.query.limit, 10);
    const pool = getPool();
    const aggravatingResult = await queries.fetchAggravatingFactors(pool, limit);
    const mitigatingResult = await queries.fetchMitigatingFactors(pool, limit);

    res.json({
      success: true,
      data: {
        aggravating: aggravatingResult.rows.map(row => ({
          factor: row.factor,
          count: parseInt(row.count),
          avgFine: parseFloat(row.avg_fine || 0)
        })),
        mitigating: mitigatingResult.rows.map(row => ({
          factor: row.factor,
          count: parseInt(row.count),
          avgFine: parseFloat(row.avg_fine || 0)
        }))
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting fine modifiers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getTimeline(req, res) {
  try {
    const pool = getPool();
    const result = await queries.fetchTimeline(pool);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        year: row.year,
        caseCount: row.case_count,
        totalFines: parseFloat(row.total_fines || 0),
        maxFine: parseFloat(row.max_fine || 0)
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting timeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getYearlyBreakdown(req, res) {
  try {
    const pool = getPool();
    const yearlyTotals = await queries.fetchYearlyTotals(pool);
    const outcomeBreakdown = await queries.fetchYearlyOutcomeBreakdown(pool);
    const biggestCases = await queries.fetchYearlyBiggestCases(pool);

    const yearlyData = {};

    yearlyTotals.rows.forEach(row => {
      const year = row.year ? parseInt(row.year) : null;
      if (year) {
        yearlyData[year] = {
          year,
          totalCount: parseInt(row.total_count),
          totalFines: parseFloat(row.total_fines || 0),
          finesWithAmount: parseInt(row.fines_with_amount),
          outcomes: {},
          biggestCase: null
        };
      }
    });

    outcomeBreakdown.rows.forEach(row => {
      const year = row.year ? parseInt(row.year) : null;
      if (year && yearlyData[year]) {
        const outcomeType = row.outcome_type || 'unknown';
        yearlyData[year].outcomes[outcomeType] = {
          count: parseInt(row.count),
          totalFines: parseFloat(row.total_fines || 0)
        };
      }
    });

    biggestCases.rows.forEach(row => {
      const year = row.year ? parseInt(row.year) : null;
      if (year && yearlyData[year]) {
        yearlyData[year].biggestCase = {
          entityName: row.entity_name,
          fineAmount: parseFloat(row.fine_amount || 0),
          outcomeType: row.outcome_type,
          breachType: row.primary_breach_type
        };
      }
    });

    res.json({
      success: true,
      data: Object.values(yearlyData).sort((a, b) => b.year - a.year)
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting yearly breakdown:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getYearDetails(req, res) {
  try {
    const pool = getPool();
    const parsed = parseYearParam(req.params.year);

    if (parsed.error) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const year = parsed.year;

    const monthlyResult = await queries.fetchYearDetailMonthly(pool, year);
    const outcomeResult = await queries.fetchYearDetailOutcomes(pool, year);
    const breachResult = await queries.fetchYearDetailBreaches(pool, year);

    const prevYear = year - 1;
    const comparisonResult = await queries.fetchYearDetailComparison(pool, prevYear);
    const totalsResult = await queries.fetchYearDetailTotals(pool, year);

    const monthly = monthNames.map((name, idx) => {
      const monthNum = idx + 1;
      const row = monthlyResult.rows.find(r => parseInt(r.month) === monthNum);
      return {
        month: monthNum,
        name,
        count: row ? parseInt(row.count) : 0,
        fines: row ? parseFloat(row.total_fines) : 0
      };
    });

    const prevYearMonthly = monthNames.map((name, idx) => {
      const monthNum = idx + 1;
      const row = comparisonResult.rows.find(r => parseInt(r.month) === monthNum);
      return {
        month: monthNum,
        name,
        count: row ? parseInt(row.count) : 0,
        fines: row ? parseFloat(row.total_fines) : 0
      };
    });

    res.json({
      success: true,
      data: {
        year,
        totals: {
          count: parseInt(totalsResult.rows[0]?.total_count || 0),
          fines: parseFloat(totalsResult.rows[0]?.total_fines || 0),
          avgFine: parseFloat(totalsResult.rows[0]?.avg_fine || 0),
          maxFine: parseFloat(totalsResult.rows[0]?.max_fine || 0)
        },
        monthly,
        outcomes: outcomeResult.rows.map(r => ({
          type: r.outcome_type || 'unknown',
          count: parseInt(r.count),
          fines: parseFloat(r.total_fines || 0)
        })),
        breaches: breachResult.rows.map(r => ({
          type: r.primary_breach_type,
          count: parseInt(r.count),
          fines: parseFloat(r.total_fines || 0)
        })),
        comparison: {
          year: prevYear,
          monthly: prevYearMonthly
        }
      }
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting year details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getReoffenders(req, res) {
  try {
    const pool = getPool();
    const limit = parseLimitOrDefault(req.query.limit, 50);
    const result = await queries.fetchReoffenders(pool, limit);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        entityName: row.entity_name,
        enforcementCount: parseInt(row.enforcement_count),
        totalFines: parseFloat(row.total_fines || 0),
        firstAction: row.first_action,
        latestAction: row.latest_action,
        outcomeTypes: row.outcome_types || [],
        breachTypes: row.breach_types || [],
        years: row.years || []
      }))
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting reoffenders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getThemes(req, res) {
  try {
    const pool = getPool();
    const result = await queries.fetchThemes(pool);

    const themes = {};
    result.rows.forEach(row => {
      const breachType = row.primary_breach_type;
      if (!themes[breachType]) {
        themes[breachType] = {
          breachType,
          totalCount: 0,
          totalFines: 0,
          yearlyData: []
        };
      }
      themes[breachType].totalCount += parseInt(row.count);
      themes[breachType].totalFines += parseFloat(row.total_fines || 0);
      themes[breachType].yearlyData.push({
        year: row.year ? parseInt(row.year) : null,
        count: parseInt(row.count),
        totalFines: parseFloat(row.total_fines || 0),
        avgFine: parseFloat(row.avg_fine || 0)
      });
    });

    res.json({
      success: true,
      data: Object.values(themes).sort((a, b) => b.totalFines - a.totalFines)
    });
  } catch (error) {
    console.error('[PublicationsAPI] Error getting themes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getOutcomeAnalysis,
  getOutcomeBreaches,
  getCaseStudies,
  getCaseStudySimilar,
  getRiskIndicators,
  getTopFines,
  getBreachAnalysis,
  getBreachSummary,
  getHandbookStats,
  getRuleCitations,
  getHandbookRule,
  getHandbookBatch,
  getCommonFindings,
  getFineModifiers,
  getTimeline,
  getYearlyBreakdown,
  getYearDetails,
  getReoffenders,
  getThemes
};
