/**
 * FCA Handbook Rules Registry
 * Comprehensive mapping of FCA handbook rules with plain English explanations
 * Used for regulatory intelligence and compliance guidance
 */

const FCA_HANDBOOK_RULES = {
  // ============================================
  // PRINCIPLES FOR BUSINESSES (PRIN)
  // ============================================
  'PRIN 1': {
    title: 'Integrity',
    category: 'PRIN',
    summary: 'A firm must conduct its business with integrity.',
    fullDescription: 'This principle requires firms to act honestly and fairly in all their dealings. It underpins trust in financial services.',
    implications: 'Breaches typically involve dishonesty, deception, misleading clients or the regulator, conflicts of interest, or acting in bad faith.',
    typicalBreaches: ['Misleading customers', 'Dishonest conduct', 'Hidden conflicts of interest', 'Fraudulent behaviour'],
    relatedRules: ['PRIN 6', 'PRIN 7', 'APER 1']
  },
  'PRIN 2': {
    title: 'Skill, Care and Diligence',
    category: 'PRIN',
    summary: 'A firm must conduct its business with due skill, care and diligence.',
    fullDescription: 'Firms must act competently and professionally in all activities, ensuring adequate expertise and proper attention to client matters.',
    implications: 'Breaches involve negligent advice, poor service quality, inadequate expertise, failure to follow up on issues, or careless errors.',
    typicalBreaches: ['Negligent advice', 'Poor due diligence', 'Inadequate expertise', 'Failure to investigate'],
    relatedRules: ['SYSC 5', 'SYSC 21', 'APER 2']
  },
  'PRIN 3': {
    title: 'Management and Control',
    category: 'PRIN',
    summary: 'A firm must take reasonable care to organise and control its affairs responsibly and effectively, with adequate risk management systems.',
    fullDescription: 'This requires firms to have robust governance, clear lines of responsibility, and effective systems and controls proportionate to the nature and scale of their business.',
    implications: 'Breaches involve control failures, inadequate governance, lack of oversight, poor risk management, or failure to delegate appropriately.',
    typicalBreaches: ['Control failures', 'Governance gaps', 'Inadequate oversight', 'Poor risk management', 'Unclear responsibilities'],
    relatedRules: ['SYSC 3', 'SYSC 4', 'SYSC 6', 'SYSC 7']
  },
  'PRIN 4': {
    title: 'Financial Prudence',
    category: 'PRIN',
    summary: 'A firm must maintain adequate financial resources.',
    fullDescription: 'Firms must hold sufficient capital and liquid assets to meet their obligations and absorb losses.',
    implications: 'Breaches involve inadequate capital, liquidity shortfalls, or failure to meet prudential requirements.',
    typicalBreaches: ['Capital inadequacy', 'Liquidity failures', 'Prudential breaches'],
    relatedRules: ['GENPRU', 'BIPRU', 'IFPRU']
  },
  'PRIN 5': {
    title: 'Market Conduct',
    category: 'PRIN',
    summary: 'A firm must observe proper standards of market conduct.',
    fullDescription: 'Firms must not engage in market abuse, manipulation, or conduct that undermines market integrity.',
    implications: 'Breaches involve market manipulation, insider dealing, benchmark rigging, or other conduct harming market integrity.',
    typicalBreaches: ['Market manipulation', 'Benchmark misconduct', 'Insider dealing', 'Spoofing'],
    relatedRules: ['MAR', 'COCON', 'PRIN 1']
  },
  'PRIN 6': {
    title: 'Customers\' Interests',
    category: 'PRIN',
    summary: 'A firm must pay due regard to the interests of its customers and treat them fairly.',
    fullDescription: 'This is the cornerstone of treating customers fairly (TCF). Firms must consider customer outcomes in all interactions and product design.',
    implications: 'Breaches involve unfair treatment, prioritising firm interests over customers, unsuitable products, or poor outcomes.',
    typicalBreaches: ['Unfair treatment', 'Customer detriment', 'Suitability failures', 'Poor outcomes'],
    relatedRules: ['COBS 9', 'COBS 2', 'ICOBS 2', 'Consumer Duty']
  },
  'PRIN 7': {
    title: 'Communications with Clients',
    category: 'PRIN',
    summary: 'A firm must pay due regard to the information needs of its clients, and communicate information to them in a way which is clear, fair and not misleading.',
    fullDescription: 'All communications must be accurate, balanced, and understandable. Promotional material must not be deceptive.',
    implications: 'Breaches involve misleading promotions, unclear disclosures, deceptive marketing, or failure to highlight risks.',
    typicalBreaches: ['Misleading promotions', 'Unclear disclosures', 'Hidden risks', 'Deceptive marketing'],
    relatedRules: ['COBS 4', 'ICOBS 3', 'MCOB 3A']
  },
  'PRIN 8': {
    title: 'Conflicts of Interest',
    category: 'PRIN',
    summary: 'A firm must manage conflicts of interest fairly, both between itself and its customers and between a customer and another client.',
    fullDescription: 'Firms must identify, prevent, manage, and disclose conflicts of interest to ensure customers are not disadvantaged.',
    implications: 'Breaches involve unmanaged conflicts, failure to disclose, or allowing conflicts to cause customer detriment.',
    typicalBreaches: ['Unmanaged conflicts', 'Non-disclosure', 'Customer detriment from conflicts'],
    relatedRules: ['SYSC 10', 'COBS 11', 'APER 1']
  },
  'PRIN 9': {
    title: 'Customers: Relationships of Trust',
    category: 'PRIN',
    summary: 'A firm must take reasonable care to ensure the suitability of its advice and discretionary decisions for any customer who is entitled to rely upon its judgment.',
    fullDescription: 'When customers rely on a firm\'s expertise, the firm must ensure its recommendations and decisions are appropriate for that customer.',
    implications: 'Breaches involve unsuitable advice, inappropriate recommendations, or failing to consider customer circumstances.',
    typicalBreaches: ['Unsuitable advice', 'Inappropriate recommendations', 'Failure to assess needs'],
    relatedRules: ['COBS 9', 'COBS 10', 'ICOBS 5']
  },
  'PRIN 10': {
    title: 'Clients\' Assets',
    category: 'PRIN',
    summary: 'A firm must arrange adequate protection for clients\' assets when it is responsible for them.',
    fullDescription: 'Client money and assets must be safeguarded through proper segregation, reconciliation, and custodial arrangements.',
    implications: 'Breaches involve inadequate segregation, reconciliation failures, or loss of client assets.',
    typicalBreaches: ['Client money mixing', 'Reconciliation failures', 'Asset losses', 'Inadequate custody'],
    relatedRules: ['CASS 6', 'CASS 7', 'CASS 5']
  },
  'PRIN 11': {
    title: 'Relations with Regulators',
    category: 'PRIN',
    summary: 'A firm must deal with its regulators in an open and cooperative way, and must disclose to the FCA appropriately anything relating to the firm of which that regulator would reasonably expect notice.',
    fullDescription: 'Firms must proactively inform the FCA of material issues, respond promptly to requests, and not mislead the regulator.',
    implications: 'Breaches involve late disclosure, misleading the FCA, failing to escalate issues, or obstructing investigations.',
    typicalBreaches: ['Late disclosure', 'Misleading regulators', 'Failing to escalate', 'Obstruction'],
    relatedRules: ['SUP 15', 'SUP 16', 'APER 4']
  },
  'PRIN 12': {
    title: 'Consumer Duty',
    category: 'PRIN',
    summary: 'A firm must act to deliver good outcomes for retail customers.',
    fullDescription: 'Introduced in 2023, this principle requires firms to act in good faith, avoid foreseeable harm, and enable customers to pursue their financial objectives.',
    implications: 'Breaches involve failing to deliver good outcomes, causing foreseeable harm, or not acting in good faith.',
    typicalBreaches: ['Poor customer outcomes', 'Foreseeable harm', 'Bad faith conduct'],
    relatedRules: ['PRIN 6', 'PRIN 7', 'Consumer Duty rules']
  },

  // ============================================
  // SENIOR MANAGEMENT ARRANGEMENTS (SYSC)
  // ============================================
  'SYSC 3': {
    title: 'Systems and Controls',
    category: 'SYSC',
    summary: 'Firms must establish and maintain systems and controls appropriate to their business.',
    fullDescription: 'This requires firms to have robust operational systems, clear procedures, and effective internal controls proportionate to their size and complexity.',
    implications: 'Breaches involve control failures, inadequate procedures, poor governance, or operational weaknesses.',
    typicalBreaches: ['Control failures', 'Inadequate procedures', 'System weaknesses', 'Operational failures'],
    relatedRules: ['PRIN 3', 'SYSC 4', 'SYSC 7']
  },
  'SYSC 4': {
    title: 'General Organisational Requirements',
    category: 'SYSC',
    summary: 'Firms must have robust governance arrangements, clear organisational structure, and effective processes.',
    fullDescription: 'This includes clear lines of responsibility, segregation of duties, and proper management information.',
    implications: 'Breaches involve unclear responsibilities, inadequate segregation, or governance failures.',
    typicalBreaches: ['Governance failures', 'Unclear responsibilities', 'Inadequate segregation'],
    relatedRules: ['PRIN 3', 'SYSC 3', 'SYSC 5']
  },
  'SYSC 5': {
    title: 'Employees, Agents and Other Relevant Persons',
    category: 'SYSC',
    summary: 'Firms must ensure employees are competent and properly trained.',
    fullDescription: 'Staff must have appropriate skills, knowledge, and expertise. Firms must provide adequate training and supervision.',
    implications: 'Breaches involve inadequate training, incompetent staff, or insufficient supervision.',
    typicalBreaches: ['Inadequate training', 'Staff incompetence', 'Poor supervision', 'Unqualified staff'],
    relatedRules: ['PRIN 2', 'TC', 'APER 2']
  },
  'SYSC 6': {
    title: 'Compliance, Internal Audit and Financial Crime',
    category: 'SYSC',
    summary: 'Firms must establish effective compliance and internal audit functions, and systems to counter financial crime.',
    fullDescription: 'This requires a compliance function, MLRO, internal audit (where appropriate), and robust financial crime prevention systems.',
    implications: 'Breaches involve compliance failures, inadequate AML systems, lack of MLRO oversight, or internal audit weaknesses.',
    typicalBreaches: ['Compliance failures', 'AML gaps', 'Inadequate MLRO', 'Internal audit weakness'],
    relatedRules: ['PRIN 3', 'SYSC 3', 'MLR']
  },
  'SYSC 7': {
    title: 'Risk Control',
    category: 'SYSC',
    summary: 'Firms must establish and maintain effective risk management systems.',
    fullDescription: 'This includes identifying, measuring, monitoring, and controlling risks, with appropriate risk limits and escalation procedures.',
    implications: 'Breaches involve inadequate risk identification, poor monitoring, or failure to control material risks.',
    typicalBreaches: ['Risk management failures', 'Inadequate monitoring', 'Limit breaches', 'Poor escalation'],
    relatedRules: ['PRIN 3', 'SYSC 3', 'MIFIDPRU']
  },
  'SYSC 8': {
    title: 'Outsourcing',
    category: 'SYSC',
    summary: 'Firms must properly manage outsourcing arrangements.',
    fullDescription: 'When outsourcing functions, firms retain responsibility and must ensure adequate oversight, due diligence, and business continuity.',
    implications: 'Breaches involve inadequate oversight of outsourcers, poor due diligence, or control gaps.',
    typicalBreaches: ['Inadequate outsourcing oversight', 'Poor due diligence', 'Control gaps', 'Continuity failures'],
    relatedRules: ['SYSC 3', 'SYSC 13', 'PRIN 3']
  },
  'SYSC 9': {
    title: 'Record Keeping',
    category: 'SYSC',
    summary: 'Firms must maintain adequate records.',
    fullDescription: 'Records must be sufficient to enable the FCA to monitor compliance and reconstruct transactions.',
    implications: 'Breaches involve inadequate records, failure to retain documents, or inability to demonstrate compliance.',
    typicalBreaches: ['Inadequate records', 'Missing documentation', 'Reconstruction failures'],
    relatedRules: ['COBS 9', 'SUP 16', 'PRIN 11']
  },
  'SYSC 10': {
    title: 'Conflicts of Interest',
    category: 'SYSC',
    summary: 'Firms must establish policies and procedures to identify and manage conflicts of interest.',
    fullDescription: 'This requires written conflicts policies, a conflicts register, and procedures to prevent conflicts causing customer detriment.',
    implications: 'Breaches involve inadequate conflicts policies, failure to identify conflicts, or customer harm from conflicts.',
    typicalBreaches: ['Inadequate conflicts policy', 'Unidentified conflicts', 'Customer harm'],
    relatedRules: ['PRIN 8', 'COBS 11', 'APER 1']
  },
  'SYSC 11': {
    title: 'Liquidity Risk Systems and Controls',
    category: 'SYSC',
    summary: 'Firms must have systems to identify, measure, monitor and control liquidity risk.',
    fullDescription: 'This includes liquidity buffers, stress testing, and contingency funding plans.',
    implications: 'Breaches involve inadequate liquidity risk management or failure to maintain liquidity buffers.',
    typicalBreaches: ['Liquidity risk failures', 'Inadequate buffers', 'Poor stress testing'],
    relatedRules: ['BIPRU', 'MIFIDPRU', 'PRIN 4']
  },
  'SYSC 13': {
    title: 'Operational Risk: Systems and Controls',
    category: 'SYSC',
    summary: 'Firms must have systems to manage operational risk.',
    fullDescription: 'This includes business continuity plans, IT security, and controls over operational processes.',
    implications: 'Breaches involve operational failures, IT security incidents, or business continuity failures.',
    typicalBreaches: ['Operational failures', 'IT security breaches', 'Business continuity gaps'],
    relatedRules: ['SYSC 3', 'SYSC 7', 'PRIN 3']
  },
  'SYSC 18': {
    title: 'Whistleblowing',
    category: 'SYSC',
    summary: 'Firms must have appropriate internal procedures for employees to report concerns.',
    fullDescription: 'Firms must establish confidential channels for reporting wrongdoing and protect whistleblowers from victimisation.',
    implications: 'Breaches involve inadequate whistleblowing procedures or victimisation of whistleblowers.',
    typicalBreaches: ['Inadequate procedures', 'Whistleblower victimisation', 'Poor culture'],
    relatedRules: ['PRIN 11', 'COCON', 'SM&CR']
  },
  'SYSC 19A': {
    title: 'Remuneration Code (BIPRU Firms)',
    category: 'SYSC',
    summary: 'Remuneration policies must not encourage excessive risk-taking.',
    fullDescription: 'Variable remuneration must be linked to sustainable performance and risk-adjusted outcomes.',
    implications: 'Breaches involve remuneration structures that incentivise excessive risk-taking or misconduct.',
    typicalBreaches: ['Excessive risk incentives', 'Poor remuneration governance', 'Misconduct incentives'],
    relatedRules: ['PRIN 3', 'SM&CR', 'SYSC 4']
  },

  // ============================================
  // SUPERVISION (SUP)
  // ============================================
  'SUP 10A': {
    title: 'Approved Persons',
    category: 'SUP',
    summary: 'Firms must ensure individuals performing controlled functions are approved by the FCA.',
    fullDescription: 'Controlled function holders must be assessed as fit and proper before appointment.',
    implications: 'Breaches involve unapproved individuals in controlled functions or failure to assess fitness.',
    typicalBreaches: ['Unapproved persons', 'Fitness failures', 'Late applications'],
    relatedRules: ['SM&CR', 'FIT', 'APER']
  },
  'SUP 12': {
    title: 'Appointed Representatives',
    category: 'SUP',
    summary: 'Principal firms must take reasonable care to ensure their appointed representatives comply with FCA requirements.',
    fullDescription: 'Principals are responsible for AR conduct and must have adequate oversight systems, training, and control over ARs.',
    implications: 'Breaches involve inadequate AR oversight, AR misconduct, or failure to monitor AR activities.',
    typicalBreaches: ['AR misconduct', 'Inadequate oversight', 'Poor monitoring', 'Control failures'],
    relatedRules: ['PRIN 3', 'SYSC 3', 'SYSC 6']
  },
  'SUP 15': {
    title: 'Notifications to the FCA',
    category: 'SUP',
    summary: 'Firms must notify the FCA of certain material changes and events.',
    fullDescription: 'This includes changes to controllers, significant events, breaches, and other matters the FCA would expect to know.',
    implications: 'Breaches involve late notifications, failure to report material issues, or incomplete disclosures.',
    typicalBreaches: ['Late notifications', 'Non-disclosure', 'Incomplete reporting'],
    relatedRules: ['PRIN 11', 'SUP 16', 'APER 4']
  },
  'SUP 16': {
    title: 'Reporting Requirements',
    category: 'SUP',
    summary: 'Firms must submit accurate regulatory reports on time.',
    fullDescription: 'Firms must comply with reporting requirements including GABRIEL submissions, financial reports, and other returns.',
    implications: 'Breaches involve late returns, inaccurate data, or failure to submit required reports.',
    typicalBreaches: ['Late returns', 'Inaccurate data', 'Missing reports'],
    relatedRules: ['PRIN 11', 'SUP 15', 'SYSC 9']
  },
  'SUP 17': {
    title: 'Transaction Reporting',
    category: 'SUP',
    summary: 'Firms must report transactions accurately and completely.',
    fullDescription: 'MiFID firms must report specified transaction details to the FCA accurately and by required deadlines.',
    implications: 'Breaches involve missing reports, inaccurate data, late submissions, or reporting system failures.',
    typicalBreaches: ['Missing reports', 'Inaccurate data', 'Late submissions', 'System failures'],
    relatedRules: ['PRIN 11', 'MAR', 'SYSC 6']
  },

  // ============================================
  // CONDUCT OF BUSINESS (COBS)
  // ============================================
  'COBS 2': {
    title: 'Conduct of Business Obligations',
    category: 'COBS',
    summary: 'Firms must act honestly, fairly and professionally in accordance with the best interests of clients.',
    fullDescription: 'This establishes the fundamental conduct standards for investment business.',
    implications: 'Breaches involve unfair treatment, dishonest conduct, or failing to act in client interests.',
    typicalBreaches: ['Unfair treatment', 'Dishonest conduct', 'Client detriment'],
    relatedRules: ['PRIN 6', 'PRIN 1', 'PRIN 7']
  },
  'COBS 4': {
    title: 'Communicating with Clients',
    category: 'COBS',
    summary: 'Communications must be fair, clear and not misleading.',
    fullDescription: 'All communications including financial promotions must be accurate, balanced, and clearly present risks alongside benefits.',
    implications: 'Breaches involve misleading promotions, unclear disclosures, or unbalanced presentations of risks and benefits.',
    typicalBreaches: ['Misleading promotions', 'Hidden risks', 'Unbalanced presentations', 'Unclear terms'],
    relatedRules: ['PRIN 7', 'CONC 3', 'MCOB 3A']
  },
  'COBS 6': {
    title: 'Information About the Firm, Services and Remuneration',
    category: 'COBS',
    summary: 'Firms must provide clients with information about themselves, services, and costs.',
    fullDescription: 'Clients must receive clear information about the firm, scope of services, charges, and any conflicts of interest.',
    implications: 'Breaches involve inadequate disclosure of charges, services, or conflicts.',
    typicalBreaches: ['Hidden charges', 'Inadequate disclosures', 'Conflicts non-disclosure'],
    relatedRules: ['COBS 2', 'PRIN 7', 'SYSC 10']
  },
  'COBS 9': {
    title: 'Suitability',
    category: 'COBS',
    summary: 'Advice must be suitable for the client based on their circumstances, needs, and objectives.',
    fullDescription: 'When providing personal recommendations, firms must obtain sufficient information to assess suitability and ensure advice is appropriate.',
    implications: 'Breaches involve unsuitable recommendations, inadequate fact-finding, or failure to consider client circumstances.',
    typicalBreaches: ['Unsuitable advice', 'Poor fact-finding', 'Ignoring client needs', 'Inappropriate risk'],
    relatedRules: ['PRIN 9', 'PRIN 6', 'COBS 10']
  },
  'COBS 10': {
    title: 'Appropriateness',
    category: 'COBS',
    summary: 'For non-advised services, firms must assess whether products are appropriate for the client.',
    fullDescription: 'When not providing advice, firms must assess client knowledge and experience to determine if a product is appropriate.',
    implications: 'Breaches involve selling inappropriate products without proper assessment.',
    typicalBreaches: ['Inappropriate products', 'Inadequate assessment', 'Knowledge failures'],
    relatedRules: ['COBS 9', 'PRIN 6', 'COBS 14']
  },
  'COBS 11': {
    title: 'Best Execution',
    category: 'COBS',
    summary: 'Firms must take all sufficient steps to obtain the best possible result for clients when executing orders.',
    fullDescription: 'Best execution considers price, costs, speed, likelihood of execution, and other relevant factors.',
    implications: 'Breaches involve poor execution quality, failure to seek best prices, or inadequate execution policies.',
    typicalBreaches: ['Poor execution', 'Inadequate price seeking', 'Policy failures'],
    relatedRules: ['PRIN 6', 'COBS 2', 'MAR']
  },
  'COBS 14': {
    title: 'Providing Product Information to Clients',
    category: 'COBS',
    summary: 'Firms must provide clients with appropriate information about products.',
    fullDescription: 'This includes key information documents, prospectuses, and other product-specific information.',
    implications: 'Breaches involve inadequate product information or failure to provide required documents.',
    typicalBreaches: ['Inadequate information', 'Missing documents', 'Unclear product terms'],
    relatedRules: ['PRIN 7', 'COBS 4', 'COBS 6']
  },

  // ============================================
  // CLIENT ASSETS (CASS)
  // ============================================
  'CASS 5': {
    title: 'Client Money: Insurance Mediation Activity',
    category: 'CASS',
    summary: 'Insurance intermediaries must protect client money.',
    fullDescription: 'Insurance firms must segregate and protect client money through statutory trusts or other approved arrangements.',
    implications: 'Breaches involve inadequate protection of insurance client money.',
    typicalBreaches: ['Inadequate segregation', 'Trust failures', 'Mixing of funds'],
    relatedRules: ['PRIN 10', 'CASS 6', 'SYSC 3']
  },
  'CASS 6': {
    title: 'Client Money',
    category: 'CASS',
    summary: 'Client money must be segregated and protected.',
    fullDescription: 'Investment firms must hold client money in segregated accounts, conduct daily reconciliations, and maintain records.',
    implications: 'Breaches involve mixing funds, reconciliation failures, inadequate records, or shortfalls.',
    typicalBreaches: ['Mixing funds', 'Reconciliation failures', 'Shortfalls', 'Inadequate records'],
    relatedRules: ['PRIN 10', 'CASS 7', 'SYSC 3']
  },
  'CASS 7': {
    title: 'Client Assets',
    category: 'CASS',
    summary: 'Client assets must be safeguarded.',
    fullDescription: 'Firms must have adequate arrangements for the safeguarding of client assets through proper custody and record-keeping.',
    implications: 'Breaches involve asset losses, inadequate custody arrangements, or reconciliation failures.',
    typicalBreaches: ['Asset losses', 'Custody failures', 'Record-keeping gaps'],
    relatedRules: ['PRIN 10', 'CASS 6', 'SYSC 3']
  },

  // ============================================
  // MARKET CONDUCT (MAR)
  // ============================================
  'MAR 1': {
    title: 'Market Abuse',
    category: 'MAR',
    summary: 'Firms and individuals must not commit or attempt market abuse.',
    fullDescription: 'Market abuse includes insider dealing, unlawful disclosure of inside information, and market manipulation.',
    implications: 'Breaches involve trading on inside information, market manipulation, or spreading false information.',
    typicalBreaches: ['Insider dealing', 'Market manipulation', 'False information', 'Spoofing'],
    relatedRules: ['PRIN 5', 'COCON', 'Criminal offences']
  },
  'MAR 8': {
    title: 'Benchmark Regulation',
    category: 'MAR',
    summary: 'Benchmark administrators and contributors must comply with the Benchmarks Regulation.',
    fullDescription: 'This covers governance, input data quality, and conduct when administering or contributing to benchmarks.',
    implications: 'Breaches involve benchmark manipulation, inadequate governance, or poor input data controls.',
    typicalBreaches: ['Benchmark manipulation', 'Governance failures', 'Data quality issues'],
    relatedRules: ['PRIN 5', 'PRIN 3', 'Criminal offences']
  },

  // ============================================
  // CONDUCT RULES (COCON)
  // ============================================
  'COCON 2.1': {
    title: 'Individual Conduct Rule 1',
    category: 'COCON',
    summary: 'You must act with integrity.',
    fullDescription: 'Individuals must be honest and not engage in deception or misconduct.',
    implications: 'Breaches involve personal dishonesty, deception, or lack of integrity.',
    typicalBreaches: ['Dishonesty', 'Deception', 'Misconduct'],
    relatedRules: ['PRIN 1', 'APER 1', 'SM&CR']
  },
  'COCON 2.2': {
    title: 'Individual Conduct Rule 2',
    category: 'COCON',
    summary: 'You must act with due skill, care and diligence.',
    fullDescription: 'Individuals must perform their role competently and professionally.',
    implications: 'Breaches involve negligence, incompetence, or carelessness.',
    typicalBreaches: ['Negligence', 'Incompetence', 'Carelessness'],
    relatedRules: ['PRIN 2', 'APER 2', 'SM&CR']
  },
  'COCON 2.3': {
    title: 'Individual Conduct Rule 3',
    category: 'COCON',
    summary: 'You must be open and cooperative with the FCA, PRA and other regulators.',
    fullDescription: 'Individuals must proactively disclose issues and cooperate with regulatory investigations.',
    implications: 'Breaches involve misleading regulators, non-disclosure, or obstruction.',
    typicalBreaches: ['Misleading regulators', 'Non-disclosure', 'Obstruction'],
    relatedRules: ['PRIN 11', 'APER 4', 'SM&CR']
  },
  'COCON 2.4': {
    title: 'Individual Conduct Rule 4',
    category: 'COCON',
    summary: 'You must pay due regard to the interests of customers and treat them fairly.',
    fullDescription: 'Individuals must consider customer outcomes and act fairly.',
    implications: 'Breaches involve unfair treatment or disregard for customer interests.',
    typicalBreaches: ['Unfair treatment', 'Customer detriment', 'Ignoring customer needs'],
    relatedRules: ['PRIN 6', 'APER 3', 'SM&CR']
  },
  'COCON 2.5': {
    title: 'Individual Conduct Rule 5',
    category: 'COCON',
    summary: 'You must observe proper standards of market conduct.',
    fullDescription: 'Individuals must not engage in market abuse or misconduct.',
    implications: 'Breaches involve market abuse, manipulation, or undermining market integrity.',
    typicalBreaches: ['Market abuse', 'Manipulation', 'Misconduct'],
    relatedRules: ['PRIN 5', 'MAR 1', 'SM&CR']
  },

  // ============================================
  // INSURANCE CONDUCT (ICOBS)
  // ============================================
  'ICOBS 2': {
    title: 'Insurance Conduct Standards',
    category: 'ICOBS',
    summary: 'Insurance firms must act honestly, fairly and professionally in the best interests of customers.',
    fullDescription: 'This establishes conduct standards for general insurance and pure protection business.',
    implications: 'Breaches involve unfair treatment, mis-selling, or poor customer outcomes.',
    typicalBreaches: ['Mis-selling', 'Unfair treatment', 'Poor outcomes'],
    relatedRules: ['PRIN 6', 'PRIN 7', 'IDD']
  },
  'ICOBS 5': {
    title: 'Insurance Suitability',
    category: 'ICOBS',
    summary: 'Insurance advice must be suitable for the customer.',
    fullDescription: 'When advising on insurance, firms must ensure recommendations are suitable based on customer needs.',
    implications: 'Breaches involve unsuitable insurance recommendations.',
    typicalBreaches: ['Unsuitable recommendations', 'Poor needs assessment', 'Over-insurance'],
    relatedRules: ['PRIN 9', 'PRIN 6', 'ICOBS 2']
  },
  'ICOBS 6': {
    title: 'Claims Handling',
    category: 'ICOBS',
    summary: 'Insurance claims must be handled promptly and fairly.',
    fullDescription: 'Firms must not unreasonably reject claims and must settle them promptly.',
    implications: 'Breaches involve unfair claims rejection, delays, or poor claims handling.',
    typicalBreaches: ['Unfair rejections', 'Claim delays', 'Poor handling'],
    relatedRules: ['PRIN 6', 'DISP', 'Consumer Duty']
  },

  // ============================================
  // MORTGAGE CONDUCT (MCOB)
  // ============================================
  'MCOB 4': {
    title: 'Mortgage Advice and Selling',
    category: 'MCOB',
    summary: 'Mortgage advice must be suitable and based on a fair assessment of customer needs.',
    fullDescription: 'Firms must assess affordability, consider customer needs, and ensure mortgages are suitable.',
    implications: 'Breaches involve unsuitable mortgages, poor affordability assessment, or inadequate advice.',
    typicalBreaches: ['Unsuitable mortgages', 'Affordability failures', 'Poor advice'],
    relatedRules: ['PRIN 6', 'PRIN 9', 'MCOB 11']
  },
  'MCOB 11': {
    title: 'Responsible Lending and Affordability',
    category: 'MCOB',
    summary: 'Lenders must lend responsibly and assess affordability.',
    fullDescription: 'Lenders must ensure borrowers can afford mortgage payments, considering income, expenditure, and future changes.',
    implications: 'Breaches involve irresponsible lending or inadequate affordability assessments.',
    typicalBreaches: ['Irresponsible lending', 'Affordability failures', 'Income verification failures'],
    relatedRules: ['PRIN 6', 'MCOB 4', 'Consumer Duty']
  },

  // ============================================
  // CONSUMER CREDIT (CONC)
  // ============================================
  'CONC 5': {
    title: 'Responsible Lending',
    category: 'CONC',
    summary: 'Consumer credit lenders must assess creditworthiness and lend responsibly.',
    fullDescription: 'Lenders must conduct creditworthiness assessments and not lend where unaffordable.',
    implications: 'Breaches involve irresponsible lending, inadequate assessments, or lending to those who cannot afford.',
    typicalBreaches: ['Irresponsible lending', 'Inadequate assessments', 'Unaffordable lending'],
    relatedRules: ['PRIN 6', 'CONC 6', 'Consumer Duty']
  },
  'CONC 6': {
    title: 'Credit Conduct',
    category: 'CONC',
    summary: 'Consumer credit firms must treat customers fairly throughout the credit lifecycle.',
    fullDescription: 'This covers conduct during the credit relationship including communications, variations, and account management.',
    implications: 'Breaches involve unfair treatment, poor communications, or inappropriate conduct.',
    typicalBreaches: ['Unfair treatment', 'Poor communications', 'Conduct failures'],
    relatedRules: ['PRIN 6', 'PRIN 7', 'CONC 7']
  },
  'CONC 7': {
    title: 'Arrears, Default and Recovery',
    category: 'CONC',
    summary: 'Firms must treat customers in financial difficulty fairly.',
    fullDescription: 'When customers fall into arrears, firms must treat them fairly and with forbearance where appropriate.',
    implications: 'Breaches involve unfair treatment of those in difficulty, excessive charges, or aggressive collections.',
    typicalBreaches: ['Unfair collections', 'Excessive charges', 'Lack of forbearance'],
    relatedRules: ['PRIN 6', 'DISP', 'Consumer Duty']
  }
}

// Export for use in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FCA_HANDBOOK_RULES }
} else if (typeof window !== 'undefined') {
  window.FCA_HANDBOOK_RULES = FCA_HANDBOOK_RULES
}
