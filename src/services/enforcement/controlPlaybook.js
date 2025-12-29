const controlPlaybook = {
  'Anti-Money Laundering': {
    headline: 'Strengthen AML governance and monitoring to avoid repeat FCA criticism.',
    controls: [
      'Run an annual enterprise-wide AML risk assessment covering customer types, products, and geographies.',
      'Deploy automated transaction monitoring with documented scenario tuning and QA sign-off.',
      'Evidence independent quality assurance of SAR determinations and timely reporting to the NCA.'
    ],
    monitoring: [
      'Quarterly MI on alert backlog, SAR volumes, and typologies presented to the MLRO and board risk committee.',
      'Documented model validation of transaction monitoring rules at least every 12 months.'
    ],
    riskIfIgnored: 'FCA expects firms to prove they understand and actively mitigate financial crime risk. Weak controls attract multi-million pound penalties and skilled-person reviews.'
  },
  'Systems and Controls': {
    headline: 'Operational controls gaps keep driving fines - tighten oversight and evidencing.',
    controls: [
      'Implement RCSA coverage for key operational processes with action tracking for high residual risks.',
      'Introduce change-management checkpoints that validate regulatory obligations before go-live.',
      'Maintain auditable control testing with escalation when repeated deficiencies are detected.'
    ],
    monitoring: [
      'Monthly control effectiveness dashboards shared with COO and Internal Audit.',
      'Formal closure evidence for remediation tasks, signed off by control owners.'
    ],
    riskIfIgnored: 'Control environment failures often highlight weak governance and supervision. FCA sanctions typically reference missing audit trails and senior manager accountability lapses.'
  },
  'Customer Treatment': {
    headline: 'Reinforce customer outcome testing to anticipate Consumer Duty scrutiny.',
    controls: [
      'Design outcome testing across the customer journey with thresholds linked to fair value indicators.',
      'Create escalation routes for vulnerable-customer cases and track remediation through root-cause forums.',
      'Maintain product governance minutes evidencing challenge and approvals.'
    ],
    monitoring: [
      'Monthly MI on complaints, root causes, redress amounts, and vulnerable customer handling.',
      'Bi-annual board attestations confirming Consumer Duty monitoring effectiveness.'
    ],
    riskIfIgnored: 'Failures in treating customers fairly quickly escalate into high-profile enforcement, particularly under the Consumer Duty regime.'
  },
  'Market Abuse': {
    headline: 'Market abuse surveillance must be demonstrably calibrated and independently reviewed.',
    controls: [
      'Document rationale for each surveillance scenario with periodic parameter reviews.',
      'Ensure trade data completeness checks with reconciliations to front-office systems.',
      'Provide targeted training to front-office and control staff on suspicious pattern escalation.'
    ],
    monitoring: [
      'Monthly surveillance effectiveness reports including alert volumes, tuning decisions, and QA sampling.',
      'Independent model validation of surveillance tools at least every 18 months.'
    ],
    riskIfIgnored: 'Gaps in surveillance tooling and governance underpin many of the FCA\'s largest market abuse fines.'
  },
  'Financial Crime': {
    headline: 'Broaden financial crime controls beyond AML to cover sanctions, fraud, and emerging risks.',
    controls: [
      'Centralise adverse media, sanctions, and PEP screening with auditable overrides.',
      'Deploy fraud analytics with thresholds tuned to product-specific risk and geared to rapid customer communication.',
      'Maintain scenario-based playbooks covering sanctions breaches and law-enforcement requests.'
    ],
    monitoring: [
      'Dashboard tracking sanctions hits, override justifications, and breach escalations each month.',
      'Annual combined assurance review spanning AML, CTF, sanctions, and fraud controls.'
    ],
    riskIfIgnored: 'Regulators expect holistic financial crime defences. Fragmented controls create exposure to enforcement and senior manager accountability challenges.'
  }
}

module.exports = controlPlaybook
