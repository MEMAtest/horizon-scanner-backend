const feedSources = [
  {
    name: 'FCA News RSS',
    authority: 'FCA',
    url: 'https://www.fca.org.uk/news/rss.xml',
    type: 'rss',
    description: 'Financial Conduct Authority - News, Press Releases, Speeches, Statements',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Banking', 'Investment Management', 'Consumer Credit', 'Insurance']
  },
  // ============================================
  // DEAR CEO LETTERS & SUPERVISORY COMMUNICATIONS
  // Premium supervisory content - high priority
  // ============================================
  {
    name: 'FCA Dear CEO Letters',
    authority: 'FCA',
    url: 'https://www.fca.org.uk/publications/search-results?category=dear-ceo-letters',
    type: 'puppeteer',
    description: 'FCA Dear CEO Letters - Critical supervisory communications to firm leadership',
    priority: 'critical',
    recencyDays: 1825, // 5 years
    extractDates: true,
    documentType: 'dear_ceo_letter',
    sectors: ['Multi-sector', 'Banking', 'Investment Management', 'Consumer Credit', 'Insurance', 'Payments']
  },
  {
    name: 'PRA Supervisory Statements',
    authority: 'PRA',
    url: 'https://www.bankofengland.co.uk/prudential-regulation/publication',
    type: 'puppeteer',
    description: 'PRA Supervisory Statements (SS) and Policy Statements (PS) - Binding prudential expectations',
    priority: 'critical',
    recencyDays: 1825, // 5 years
    extractDates: true,
    documentType: 'supervisory_statement',
    sectors: ['Banking', 'Insurance', 'Investment Firms', 'Capital Requirements']
  },
  {
    name: 'Bank of England News RSS',
    authority: 'Bank of England',
    url: 'https://www.bankofengland.co.uk/rss/news',
    type: 'rss',
    description: 'Bank of England - News and Speeches',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Banking', 'Capital Markets', 'Payments', 'Fintech']
  },
  {
    name: 'Bank of England - Bank Overground',
    authority: 'Bank of England',
    url: 'https://www.bankofengland.co.uk/rss/bank-overground',
    type: 'rss',
    description: 'Bank of England - Bank Overground Blog',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Banking', 'Economics', 'Policy', 'Research']
  },
  {
    name: 'Bank of England - Events',
    authority: 'Bank of England',
    url: 'https://www.bankofengland.co.uk/rss/events',
    type: 'rss',
    description: 'Bank of England - Events and Speeches',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Banking', 'Policy', 'Capital Markets']
  },
  {
    name: 'Bank of England - Explainers',
    authority: 'Bank of England',
    url: 'https://www.bankofengland.co.uk/rss/knowledgebank',
    type: 'rss',
    description: 'Bank of England - Educational Explainers (KnowledgeBank)',
    priority: 'low',
    recencyDays: 30,
    sectors: ['Banking', 'Education', 'Policy']
  },
  {
    name: 'Bank of England - Prudential Regulation Publications',
    authority: 'PRA',
    url: 'https://www.bankofengland.co.uk/rss/prudential-regulation-publications',
    type: 'rss',
    description: 'Prudential Regulation Authority - Publications',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Banking', 'Insurance', 'Prudential Regulation', 'Capital Requirements']
  },
  {
    name: 'Bank of England - Publications',
    authority: 'Bank of England',
    url: 'https://www.bankofengland.co.uk/rss/publications',
    type: 'rss',
    description: 'Bank of England - General Publications',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Banking', 'Policy', 'Research', 'Capital Markets']
  },
  {
    name: 'Bank of England - Speeches',
    authority: 'Bank of England',
    url: 'https://www.bankofengland.co.uk/rss/speeches',
    type: 'rss',
    description: 'Bank of England - Speeches',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Banking', 'Policy', 'Capital Markets']
  },
  {
    name: 'Bank of England - Statistics',
    authority: 'Bank of England',
    url: 'https://www.bankofengland.co.uk/rss/statistics',
    type: 'rss',
    description: 'Bank of England - Statistical Releases',
    priority: 'low',
    recencyDays: 30,
    sectors: ['Banking', 'Statistics', 'Economics']
  },
  {
    name: 'ESMA All News',
    authority: 'ESMA',
    url: 'https://www.esma.europa.eu/rss.xml',
    type: 'rss',
    description: 'European Securities and Markets Authority - Full Press/News Feed',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Capital Markets', 'Investment Management', 'Cryptocurrency']
  },
  {
    name: 'FSB Publications',
    authority: 'FSB',
    url: 'https://www.fsb.org/feed/',
    type: 'rss',
    description: 'Financial Stability Board - Global Policy & Press Updates',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Banking', 'Capital Markets', 'Fintech', 'Cryptocurrency']
  },
  {
    name: 'FATF News & Publications',
    authority: 'FATF',
    url: 'https://www.fatf-gafi.org/en/the-fatf/news.html',
    type: 'puppeteer',
    description: 'Financial Action Task Force - News and Publications (Puppeteer)',
    priority: 'high',
    recencyDays: 30,
    sectors: ['AML & Financial Crime', 'Banking', 'Compliance']
  },
  {
    name: 'Aquis Exchange Announcements',
    authority: 'AQUIS',
    url: 'https://www.aquis.eu/stock-exchange/announcements',
    type: 'puppeteer',
    description: 'Aquis Stock Exchange - Company Announcements',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Capital Markets', 'Listed Companies', 'Market News']
  },
  {
    name: 'London Stock Exchange News',
    authority: 'LSE',
    url: 'https://www.londonstockexchange.com/discover/news-and-insights?tab=latest',
    type: 'puppeteer',
    description: 'London Stock Exchange - Latest News and Insights',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Capital Markets', 'Market News', 'Investment']
  },
  {
    name: 'Pay.UK Latest Updates',
    authority: 'Pay.UK',
    url: 'https://www.wearepay.uk/news-and-insight/latest-updates/',
    type: 'puppeteer',
    description: 'Pay.UK - Latest updates on payment systems, CASS, Faster Payments, Bacs',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Payments', 'Fintech', 'Banking', 'Financial Market Infrastructure']
  },
  {
    name: 'HMRC Updates RSS',
    authority: 'HMRC',
    url: 'https://www.gov.uk/government/organisations/hm-revenue-customs.atom',
    type: 'rss',
    description: 'HM Revenue & Customs Updates',
    priority: 'medium',
    recencyDays: 14,
    sectors: ['Tax', 'AML & Financial Crime']
  },
  {
    name: 'Gov.UK Financial Services',
    authority: 'HM Government',
    url: 'https://www.gov.uk/search/news-and-communications.atom?keywords=financial+services',
    type: 'rss',
    description: 'UK Government Financial Services News',
    priority: 'medium',
    recencyDays: 14,
    sectors: ['General', 'Banking', 'Insurance']
  },
  {
    name: 'TPR Updates',
    authority: 'The Pensions Regulator',
    url: 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases',
    type: 'web_scraping',
    selector: '.listing__item',
    titleSelector: '.listing__item-title a',
    linkSelector: '.listing__item-title a',
    dateSelector: '.listing__item-date',
    summarySelector: '.listing__item-summary',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Pensions']
  },
  {
    name: 'SFO Press Releases',
    authority: 'Serious Fraud Office',
    url: 'https://www.gov.uk/government/organisations/serious-fraud-office.atom',
    type: 'rss',
    description: 'Serious Fraud Office - Press Releases, Case Updates, Enforcement News',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['AML & Financial Crime', 'Banking', 'Enforcement']
  },
  {
    name: 'CMA News',
    authority: 'Competition and Markets Authority',
    url: 'https://www.gov.uk/search/news-and-communications?organisations%5B%5D=competition-and-markets-authority',
    type: 'web_scraping',
    selector: '.gem-c-document-list__item',
    titleSelector: '.gem-c-document-list__item-title a',
    linkSelector: '.gem-c-document-list__item-title a',
    dateSelector: '.gem-c-document-list__item-metadata',
    summarySelector: '.gem-c-document-list__item-description',
    priority: 'low',
    recencyDays: 14,
    sectors: ['Competition', 'Consumer Protection']
  },
  {
    name: 'ICO News',
    authority: 'ICO',
    url: 'https://ico.org.uk/about-the-ico/media-centre/',
    type: 'web_scraping',
    selector: '.news-item',
    titleSelector: '.news-item__title a',
    linkSelector: '.news-item__title a',
    dateSelector: '.news-item__date',
    summarySelector: '.news-item__excerpt',
    priority: 'medium',
    recencyDays: 14,
    sectors: ['Data Protection', 'Privacy']
  },
  {
    name: 'FRC News',
    authority: 'FRC',
    url: 'https://www.frc.org.uk/news-and-events/news/',
    type: 'web_scraping',
    selector: '.news-listing__item',
    titleSelector: '.news-listing__title a',
    linkSelector: '.news-listing__title a',
    dateSelector: '.news-listing__date',
    summarySelector: '.news-listing__summary',
    priority: 'low',
    recencyDays: 14,
    sectors: ['Audit & Accounting', 'Professional Services']
  },
  // NOTE: ARGA (Audit, Reporting and Governance Authority) delayed - no launch date
  // Will replace FRC when established. Uncomment when available.
  /*
  {
    name: 'ARGA News',
    authority: 'ARGA',
    url: 'https://www.arga.gov.uk/news/feed/', // URL TBD
    type: 'rss',
    description: 'Audit, Reporting and Governance Authority - Audit regulation, corporate governance, FRC successor',
    priority: 'high',
    recencyDays: 14,
    sectors: ['Audit & Accounting', 'Corporate Governance', 'Professional Services']
  },
  */
  {
    name: 'JMLSG News',
    authority: 'JMLSG',
    url: 'https://www.jmlsg.org.uk/latest-news/',
    type: 'puppeteer',
    description: 'Joint Money Laundering Steering Group - Latest News',
    priority: 'high',
    recencyDays: 30,
    sectors: ['AML & Financial Crime', 'Banking', 'Compliance']
  },
  {
    name: 'Financial Ombudsman Service News',
    authority: 'FOS',
    url: 'https://www.financial-ombudsman.org.uk/news',
    type: 'web_scraping',
    description: 'Financial Ombudsman Service - News and Updates',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Consumer Protection', 'Dispute Resolution', 'Financial Services']
  },
  // NOTE: PSR does not provide RSS feeds - uses GovDelivery email subscriptions
  // Consider web scraping https://www.psr.org.uk/news-and-updates/ in future
  /*
  {
    name: 'Payment Systems Regulator RSS',
    authority: 'PSR',
    url: 'https://www.psr.org.uk/news/press-releases/feed/',
    type: 'rss',
    description: 'Payment Systems Regulator - Press Releases on APP fraud, interchange fees, payment scheme governance',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Payments', 'Fintech', 'Consumer Protection', 'Fraud Prevention']
  },
  */
  {
    name: 'FSCS News',
    authority: 'FSCS',
    url: 'https://www.fscs.org.uk/about-us/',
    type: 'web_scraping',
    description: 'Financial Services Compensation Scheme - Firm failures, compensation, levy guidance',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Consumer Protection', 'Banking', 'Insurance', 'Resolution']
  },
  {
    name: 'Office of Financial Sanctions Implementation',
    authority: 'OFSI',
    url: 'https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation.atom',
    type: 'rss',
    description: 'OFSI - Sanctions regime updates, enforcement notices, asset freezing',
    priority: 'high',
    recencyDays: 30,
    sectors: ['AML & Financial Crime', 'Sanctions', 'Compliance', 'Banking']
  },
  {
    name: 'HM Treasury',
    authority: 'HM Treasury',
    url: 'https://www.gov.uk/government/organisations/hm-treasury.atom',
    type: 'rss',
    description: 'HM Treasury - Policy statements, consultations, sanctions listings, economic announcements',
    priority: 'high',
    recencyDays: 14,
    sectors: ['Policy', 'Banking', 'Sanctions', 'Financial Services']
  },
  {
    name: 'Department for Business and Trade',
    authority: 'DBT',
    url: 'https://www.gov.uk/government/organisations/department-for-business-and-trade.atom',
    type: 'rss',
    description: 'Department for Business and Trade - Policy updates, consultations, trade regulations, business guidance',
    priority: 'high',
    recencyDays: 14,
    sectors: [
      'Trade Policy',
      'Business Regulation',
      'Export Control',
      'Investment',
      'Trade Negotiations',
      'Corporate Governance',
      'Intellectual Property'
    ]
  },
  // NOTE: BoE does not have a dedicated FMI supervision RSS feed
  // FMI content is covered in the general Publications feed
  /*
  {
    name: 'Bank of England - Financial Market Infrastructure Supervision',
    authority: 'Bank of England',
    url: 'https://www.bankofengland.co.uk/rss/financial-market-infrastructure-supervision',
    type: 'rss',
    description: 'Bank of England - FMI supervision notices for CCPs, CHAPS, payment systems',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Capital Markets', 'Payments', 'Financial Market Infrastructure', 'Banking']
  },
  */
  // NOTE: FOS decisions feed returns 404 - may need web scraping approach
  // Consider scraping https://www.financial-ombudsman.org.uk/decisions
  /*
  {
    name: 'Financial Ombudsman Service - Decisions',
    authority: 'FOS',
    url: 'https://www.financial-ombudsman.org.uk/decisions/feed',
    type: 'rss',
    description: 'Financial Ombudsman - Published case decisions and rulings',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Consumer Protection', 'Dispute Resolution', 'Case Law', 'Financial Services']
  },
  */
  {
    name: 'National Crime Agency - News',
    authority: 'NCA',
    url: 'https://www.nationalcrimeagency.gov.uk/news',
    type: 'puppeteer',
    description: 'National Crime Agency - News, economic crime alerts, AML intelligence',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['AML & Financial Crime', 'Banking', 'Compliance', 'Law Enforcement']
  },
  // ============================================
  // NEW REGULATORS - Added December 2025
  // ============================================
  {
    name: 'SRA Recent Decisions',
    authority: 'SRA',
    url: 'https://www.sra.org.uk/contact-centre/rss/recent-decisions/',
    type: 'rss',
    description: 'Solicitors Regulation Authority - Recent Enforcement Decisions',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Legal Services', 'Professional Conduct', 'Enforcement']
  },
  {
    name: 'SRA Press Releases',
    authority: 'SRA',
    url: 'https://www.sra.org.uk/news/news/',
    type: 'web_scraping',
    description: 'Solicitors Regulation Authority - News and Press Releases',
    priority: 'medium',
    recencyDays: 60,
    sectors: ['Legal Services', 'Professional Conduct']
  },
  {
    name: 'Gambling Commission News',
    authority: 'GAMBLING_COMMISSION',
    url: 'https://www.gamblingcommission.gov.uk/news/latest',
    type: 'web_scraping',
    description: 'UK Gambling Commission - News and Enforcement',
    priority: 'high',
    recencyDays: 30,
    sectors: ['Gambling', 'Consumer Protection', 'Licensing']
  },
  {
    name: 'HSE Press Releases',
    authority: 'HSE',
    url: 'https://press.hse.gov.uk/',
    type: 'web_scraping',
    description: 'Health and Safety Executive - Press Releases',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Health & Safety', 'Workplace', 'Enforcement']
  },
  {
    name: 'Ofcom News',
    authority: 'OFCOM',
    url: 'https://www.ofcom.org.uk/news-and-updates',
    type: 'puppeteer',
    description: 'Ofcom - Communications Regulator News',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Telecommunications', 'Broadcasting', 'Digital']
  },
  {
    name: 'ASA News',
    authority: 'ASA',
    url: 'https://www.asa.org.uk/advice-and-resources/news.html',
    type: 'puppeteer',
    description: 'Advertising Standards Authority - News and Rulings',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['Advertising', 'Consumer Protection', 'Marketing']
  },
  // ============================================
  // CALENDAR-FOCUSED SOURCES - Added for deadline extraction
  // ============================================
  {
    name: 'FCA Consultation Papers',
    authority: 'FCA_CP',
    url: 'https://www.fca.org.uk/publications/search-results?category=policy%20and%20guidance-consultation%20papers&sort_by=dmetaZ',
    type: 'puppeteer',
    description: 'FCA Consultation Papers - Active consultations with response deadlines',
    priority: 'high',
    recencyDays: 90,
    extractDates: true,
    sectors: ['Multi-sector', 'Banking', 'Investment Management', 'Consumer Credit']
  },
  {
    name: 'FCA Discussion Papers',
    authority: 'FCA_DP',
    url: 'https://www.fca.org.uk/publications/search-results?category=policy%20and%20guidance-discussion%20papers&sort_by=dmetaZ',
    type: 'puppeteer',
    description: 'FCA Discussion Papers - Early stage policy discussions',
    priority: 'medium',
    recencyDays: 90,
    extractDates: true,
    sectors: ['Multi-sector', 'Banking', 'Insurance']
  },
  {
    name: 'PRA Consultation Papers',
    authority: 'PRA',
    url: 'https://www.bankofengland.co.uk/rss/prudential-regulation-publications',
    type: 'rss',
    titlePrefix: ['CP'],
    description: 'PRA Consultation Papers - Prudential regulation consultations',
    priority: 'high',
    recencyDays: 90,
    extractDates: true,
    sectors: ['Banking', 'Insurance', 'Prudential Regulation']
  },
  {
    name: 'PRA Policy Statements',
    authority: 'PRA',
    url: 'https://www.bankofengland.co.uk/rss/prudential-regulation-publications',
    type: 'rss',
    titlePrefix: ['PS'],
    description: 'PRA Policy Statements - Final rules with implementation dates',
    priority: 'high',
    recencyDays: 90,
    extractDates: true,
    sectors: ['Banking', 'Insurance', 'Prudential Regulation']
  },
  {
    name: 'ICO Consultations',
    authority: 'ICO',
    url: 'https://ico.org.uk/about-the-ico/consultations/',
    type: 'web_scraping',
    selector: '.consultation-item',
    titleSelector: '.consultation-item__title a',
    linkSelector: '.consultation-item__title a',
    dateSelector: '.consultation-item__date',
    summarySelector: '.consultation-item__excerpt',
    description: 'ICO Consultations - Data protection and privacy consultations',
    priority: 'medium',
    recencyDays: 90,
    extractDates: true,
    sectors: ['Data Protection', 'Privacy', 'GDPR']
  },
  {
    name: 'TPR Consultations',
    authority: 'The Pensions Regulator',
    url: 'https://www.thepensionsregulator.gov.uk/en/document-library/consultations',
    type: 'web_scraping',
    selector: '.listing__item',
    titleSelector: '.listing__item-title a',
    linkSelector: '.listing__item-title a',
    dateSelector: '.listing__item-date',
    summarySelector: '.listing__item-summary',
    description: 'TPR Consultations - Pensions regulation consultations',
    priority: 'medium',
    recencyDays: 90,
    extractDates: true,
    sectors: ['Pensions']
  },
  // ============================================
  // INTERNATIONAL REGULATORS - Added December 2025
  // ============================================

  // US REGULATORS
  {
    name: 'SEC Press Releases',
    authority: 'SEC',
    url: 'https://www.sec.gov/news/pressreleases.rss',
    type: 'rss',
    description: 'US Securities and Exchange Commission - Press Releases',
    priority: 'high',
    recencyDays: 30,
    country: 'US',
    region: 'Americas',
    sectors: ['Capital Markets', 'Investment Management', 'Corporate Finance', 'Securities Regulation']
  },
  {
    name: 'CFTC Press Releases',
    authority: 'CFTC',
    url: 'https://www.cftc.gov/PressRoom/PressReleases',
    type: 'puppeteer',
    description: 'US Commodity Futures Trading Commission - Press Releases',
    priority: 'high',
    recencyDays: 30,
    country: 'US',
    region: 'Americas',
    sectors: ['Derivatives', 'Capital Markets', 'Trading', 'Cryptocurrency']
  },
  {
    name: 'FINRA News Releases',
    authority: 'FINRA',
    url: 'http://feeds.finra.org/FINRANews',
    type: 'rss',
    description: 'Financial Industry Regulatory Authority - News releases and speeches',
    priority: 'high',
    recencyDays: 30,
    country: 'US',
    region: 'Americas',
    sectors: ['Investment Management', 'Broker-Dealer', 'Capital Markets']
  },
  {
    name: 'FINRA Notices',
    authority: 'FINRA',
    url: 'http://feeds.finra.org/FINRANotices',
    type: 'rss',
    description: 'FINRA regulatory, election, information, and trade reporting notices',
    priority: 'high',
    recencyDays: 60,
    country: 'US',
    region: 'Americas',
    sectors: ['Broker-Dealer', 'Market Regulation', 'Compliance']
  },
  {
    name: 'FINRA Rule Filings',
    authority: 'FINRA',
    url: 'http://feeds.finra.org/FINRARuleFilings',
    type: 'rss',
    description: 'FINRA rule filings',
    priority: 'high',
    recencyDays: 90,
    country: 'US',
    region: 'Americas',
    sectors: ['Broker-Dealer', 'Market Regulation', 'Compliance']
  },
  {
    name: 'FINRA Dispute Resolution Rule Filings',
    authority: 'FINRA',
    url: 'http://feeds.finra.org/DisputeResolutionRuleFilings',
    type: 'rss',
    description: 'FINRA dispute resolution rule filings',
    priority: 'medium',
    recencyDays: 90,
    country: 'US',
    region: 'Americas',
    sectors: ['Dispute Resolution', 'Compliance', 'Broker-Dealer']
  },
  {
    name: 'FINRA UPC Advisories',
    authority: 'FINRA',
    url: 'http://feeds.finra.org/FINRAUPCAdvisories',
    type: 'rss',
    description: 'FINRA Unified Performance and Compliance advisories',
    priority: 'medium',
    recencyDays: 90,
    country: 'US',
    region: 'Americas',
    sectors: ['Compliance', 'Broker-Dealer']
  },
  {
    name: 'FINRA Compliance Podcast',
    authority: 'FINRA',
    url: 'http://feeds.finra.org/FINRACompliancePodcast',
    type: 'rss',
    description: 'FINRA Unscripted compliance podcast',
    priority: 'low',
    recencyDays: 180,
    country: 'US',
    region: 'Americas',
    sectors: ['Compliance', 'Training']
  },
  {
    name: 'Federal Reserve Monetary Policy',
    authority: 'FEDERAL_RESERVE',
    url: 'https://www.federalreserve.gov/feeds/press_monetary.xml',
    type: 'rss',
    description: 'US Federal Reserve - Monetary Policy Releases',
    priority: 'high',
    recencyDays: 30,
    country: 'US',
    region: 'Americas',
    sectors: ['Banking', 'Monetary Policy', 'Financial Stability', 'Capital Markets']
  },
  {
    name: 'OCC News Releases',
    authority: 'OCC',
    url: 'https://www.occ.gov/rss/occ_news.xml',
    type: 'rss',
    description: 'Office of the Comptroller of the Currency - News Releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'US',
    region: 'Americas',
    sectors: ['Banking', 'Consumer Protection', 'Licensing']
  },

  // APAC REGULATORS
  {
    name: 'MAS Media Releases',
    authority: 'MAS',
    url: 'https://www.mas.gov.sg/news?content_type=Media%20Releases',
    type: 'web_scraping',
    description: 'Monetary Authority of Singapore - Media Releases',
    priority: 'high',
    recencyDays: 30,
    country: 'Singapore',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Insurance', 'Capital Markets', 'Payment Services', 'Fintech']
  },
  {
    name: 'HKMA Press Releases',
    authority: 'HKMA',
    url: 'https://www.hkma.gov.hk/eng/other-information/rss/rss_press-release.xml',
    type: 'rss',
    description: 'Hong Kong Monetary Authority - Press Releases',
    priority: 'high',
    recencyDays: 30,
    country: 'Hong Kong',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Financial Stability', 'Payment Services']
  },
  {
    name: 'HKMA Circulars',
    authority: 'HKMA',
    url: 'https://www.hkma.gov.hk/eng/other-information/rss/rss_circulars.xml',
    type: 'rss',
    description: 'Hong Kong Monetary Authority - Circulars to Authorized Institutions',
    priority: 'high',
    recencyDays: 30,
    country: 'Hong Kong',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Prudential Regulation', 'Compliance']
  },
  {
    name: 'HKMA Guidelines',
    authority: 'HKMA',
    url: 'https://www.hkma.gov.hk/eng/other-information/rss/rss_guidelines.xml',
    type: 'rss',
    description: 'Hong Kong Monetary Authority - Supervisory Policy Manual Guidelines',
    priority: 'high',
    recencyDays: 30,
    country: 'Hong Kong',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Capital Requirements', 'Risk Management']
  },
  {
    name: 'HKMA Consultations',
    authority: 'HKMA',
    url: 'https://www.hkma.gov.hk/eng/other-information/rss/rss_consultations.xml',
    type: 'rss',
    description: 'Hong Kong Monetary Authority - Policy Consultations',
    priority: 'high',
    recencyDays: 60,
    country: 'Hong Kong',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Policy', 'Regulatory Reform']
  },
  {
    name: 'ASIC Media Releases',
    authority: 'ASIC',
    url: 'https://www.asic.gov.au/newsroom/media-releases/',
    type: 'web_scraping',
    description: 'Australian Securities and Investments Commission - Media Releases',
    priority: 'high',
    recencyDays: 30,
    country: 'Australia',
    region: 'Asia-Pacific',
    sectors: ['Capital Markets', 'Consumer Protection', 'Investment Management']
  },

  // EU ADDITIONAL
  {
    name: 'ECB Press Releases',
    authority: 'ECB',
    url: 'https://www.ecb.europa.eu/rss/press.html',
    type: 'rss',
    description: 'European Central Bank - Press Releases',
    priority: 'high',
    recencyDays: 30,
    country: 'EU',
    region: 'Europe',
    sectors: ['Banking', 'Monetary Policy', 'Financial Stability']
  },
  {
    name: 'EIOPA News',
    authority: 'EIOPA',
    url: 'https://www.eiopa.europa.eu/media/news_en',
    type: 'puppeteer',
    description: 'European Insurance and Occupational Pensions Authority - News',
    priority: 'high',
    recencyDays: 30,
    country: 'EU',
    region: 'Europe',
    sectors: ['Insurance', 'Pension Funds', 'Consumer Protection']
  },
  {
    name: 'EBA News',
    authority: 'EBA',
    url: 'https://eba.europa.eu/news-press/news/rss.xml',
    type: 'rss',
    description: 'European Banking Authority - News',
    priority: 'high',
    recencyDays: 30,
    country: 'EU',
    region: 'Europe',
    sectors: ['Banking', 'Capital Requirements', 'Consumer Protection']
  },

  // INTERNATIONAL BODIES
  {
    name: 'BIS Press Releases',
    authority: 'BIS',
    url: 'https://www.bis.org/doclist/all_pressrels.rss',
    type: 'rss',
    description: 'Bank for International Settlements - Press Releases',
    priority: 'high',
    recencyDays: 30,
    country: 'International',
    region: 'International',
    sectors: ['Banking', 'Financial Stability', 'Monetary Policy']
  },
  {
    name: 'IOSCO Media Releases',
    authority: 'IOSCO',
    url: 'https://www.iosco.org/',
    type: 'puppeteer',
    description: 'International Organization of Securities Commissions - Media Releases',
    priority: 'high',
    recencyDays: 30,
    country: 'International',
    region: 'International',
    sectors: ['Capital Markets', 'Securities Regulation', 'Investment Management']
  },
  {
    name: 'BCBS Publications',
    authority: 'BCBS',
    url: 'https://www.bis.org/bcbs/publications.htm',
    type: 'web_scraping',
    description: 'Basel Committee on Banking Supervision - Publications',
    priority: 'high',
    recencyDays: 60,
    country: 'International',
    region: 'International',
    sectors: ['Banking', 'Capital Requirements', 'Prudential Regulation']
  },

  // ============================================
  // EUROPEAN NATIONAL REGULATORS - Added December 2025
  // Financial regulators focus (no data protection)
  // ============================================

  // US - OFAC (Sanctions) - Puppeteer (works locally, bot protection)
  {
    name: 'OFAC Sanctions Updates',
    authority: 'OFAC',
    url: 'https://ofac.treasury.gov/recent-actions',
    type: 'puppeteer',
    description: 'US Treasury OFAC - Sanctions listings, SDN updates, enforcement',
    priority: 'medium', // Works with local Puppeteer
    recencyDays: 30,
    country: 'US',
    region: 'Americas',
    sectors: ['Sanctions', 'AML & Financial Crime', 'Banking', 'Compliance']
  },

  // FRANCE
  {
    name: 'AMF News (France)',
    authority: 'AMF',
    url: 'https://www.amf-france.org/en/flux-rss/display/21',
    type: 'rss',
    description: 'Autorité des Marchés Financiers - News, warnings, sanctions',
    priority: 'high',
    recencyDays: 30,
    country: 'France',
    region: 'Europe',
    sectors: ['Capital Markets', 'Investment Management', 'Consumer Protection']
  },
  {
    name: 'ACPR News (France)',
    authority: 'ACPR',
    url: 'https://acpr.banque-france.fr/en/news',
    type: 'web_scraping',
    description: 'Autorité de Contrôle Prudentiel - Banking/Insurance supervision (no RSS)',
    priority: 'high',
    recencyDays: 30,
    country: 'France',
    region: 'Europe',
    sectors: ['Banking', 'Insurance', 'Prudential Regulation', 'AML & Financial Crime']
  },

  // GERMANY
  {
    name: 'BaFin Publications (Germany)',
    authority: 'BAFIN',
    url: 'https://www.bafin.de/EN/Service/TopNavigation/RSS/_function/rssnewsfeed.xml',
    type: 'rss',
    description: 'Bundesanstalt für Finanzdienstleistungsaufsicht - All publications',
    priority: 'high',
    recencyDays: 30,
    country: 'Germany',
    region: 'Europe',
    sectors: ['Banking', 'Insurance', 'Capital Markets', 'Consumer Protection']
  },

  // IRELAND
  {
    name: 'Central Bank of Ireland News',
    authority: 'CBI',
    url: 'https://www.centralbank.ie/feeds/news-media-feed',
    type: 'rss',
    description: 'Central Bank of Ireland - News, enforcement, speeches',
    priority: 'high',
    recencyDays: 30,
    country: 'Ireland',
    region: 'Europe',
    sectors: ['Banking', 'Insurance', 'Capital Markets', 'AML & Financial Crime']
  },

  // NETHERLANDS
  {
    name: 'AFM News (Netherlands)',
    authority: 'AFM',
    url: 'https://www.afm.nl/en/rss-feed/nieuws-professionals',
    type: 'rss',
    description: 'Autoriteit Financiële Markten - Market conduct supervision',
    priority: 'high',
    recencyDays: 30,
    country: 'Netherlands',
    region: 'Europe',
    sectors: ['Capital Markets', 'Investment Management', 'Consumer Protection']
  },
  {
    name: 'DNB News (Netherlands)',
    authority: 'DNB',
    url: 'https://www.dnb.nl/en/rss/16451/6882',
    type: 'rss',
    description: 'De Nederlandsche Bank - General news feed',
    skipUserAgent: true,
    priority: 'medium',
    recencyDays: 30,
    country: 'Netherlands',
    region: 'Europe',
    sectors: ['Banking', 'Insurance', 'Pension Funds', 'Financial Stability']
  },

  // ITALY - No RSS available, using web scraping
  {
    name: 'CONSOB Press Releases (Italy)',
    authority: 'CONSOB',
    url: 'https://www.consob.it/web/consob-and-its-activities/press-releases',
    type: 'web_scraping',
    description: 'Commissione Nazionale per le Società e la Borsa - Securities',
    priority: 'disabled', // JS-rendered page, not scrapeble with cheerio
    recencyDays: 30,
    country: 'Italy',
    region: 'Europe',
    sectors: ['Capital Markets', 'Corporate Governance', 'Listed Companies']
  },
  {
    name: 'Bank of Italy News',
    authority: 'Bank of Italy',
    url: 'https://www.bancaditalia.it/media/notizie/index.html?page=1',
    type: 'web_scraping',
    description: 'Banca d\'Italia - News and public communications',
    priority: 'medium',
    recencyDays: 30,
    country: 'Italy',
    region: 'Europe',
    sectors: ['Banking', 'Monetary Policy', 'Financial Stability']
  },

  // SWEDEN
  {
    name: 'Finansinspektionen (Sweden)',
    authority: 'FI_SWEDEN',
    url: 'https://www.fi.se/en/published/all-published-material/rss',
    type: 'rss',
    description: 'Swedish Financial Supervisory Authority - All publications',
    priority: 'high',
    recencyDays: 30,
    country: 'Sweden',
    region: 'Europe',
    sectors: ['Banking', 'Insurance', 'Capital Markets', 'Consumer Credit']
  },

  // EU CROSS-BORDER - No RSS available, using web scraping
  {
    name: 'EU Council Sanctions',
    authority: 'EU_COUNCIL',
    url: 'https://www.consilium.europa.eu/en/press/press-releases/',
    type: 'puppeteer',
    description: 'EU Council - Sanctions packages, listings changes',
    priority: 'medium',
    recencyDays: 30,
    country: 'EU',
    region: 'Europe',
    sectors: ['Sanctions', 'AML & Financial Crime', 'Compliance']
  },
  {
    name: 'EEAS Press Material',
    authority: 'EEAS',
    url: 'https://www.eeas.europa.eu/eeas/press-material_en?f%5B0%5D=pm_category%3AStatement/Declaration',
    type: 'web_scraping',
    description: 'European External Action Service - Press material statements and declarations',
    priority: 'medium',
    recencyDays: 30,
    country: 'EU',
    region: 'Europe',
    sectors: ['International Policy', 'Sanctions', 'Regulatory Statements']
  },

  // ============================================
  // AML/CFT INDUSTRY BODIES - Added December 2025
  // Critical for financial crime intelligence
  // ============================================
  {
    name: 'Basel Institute on Governance',
    authority: 'BASEL_INSTITUTE',
    url: 'https://baselgovernance.org/rss.xml',
    type: 'rss',
    description: 'Basel Institute - AML Index, anti-corruption, collective action',
    priority: 'high',
    recencyDays: 30,
    country: 'International',
    region: 'International',
    sectors: ['AML & Financial Crime', 'Anti-Corruption', 'Compliance', 'Risk Assessment']
  },
  {
    name: 'Wolfsberg Group News',
    authority: 'WOLFSBERG',
    url: 'https://wolfsberg-group.org/news',
    type: 'puppeteer',
    description: 'Wolfsberg Group - AML/KYC/CTF standards from 12 global banks',
    priority: 'high',
    recencyDays: 60,
    country: 'International',
    region: 'International',
    sectors: ['AML & Financial Crime', 'KYC', 'Banking', 'Correspondent Banking']
  },
  {
    name: 'Wolfsberg Group Resources',
    authority: 'WOLFSBERG',
    url: 'https://wolfsberg-group.org/resources',
    type: 'puppeteer',
    description: 'Wolfsberg Group - Publications, guidance, standards',
    priority: 'high',
    recencyDays: 90,
    country: 'International',
    region: 'International',
    sectors: ['AML & Financial Crime', 'KYC', 'Banking', 'Due Diligence']
  },
  {
    name: 'Egmont Group News',
    authority: 'EGMONT',
    url: 'https://egmontgroup.org/news-and-events/',
    type: 'puppeteer',
    description: 'Egmont Group - FIU cooperation, information sharing',
    priority: 'high',
    recencyDays: 60,
    country: 'International',
    region: 'International',
    sectors: ['AML & Financial Crime', 'FIU', 'Information Sharing', 'SAR']
  },

  // ============================================
  // MIDDLE EAST REGULATORS - Added December 2025
  // Major financial centers, strong AML focus
  // ============================================
  {
    name: 'DFSA Announcements',
    authority: 'DFSA',
    url: 'https://www.dfsa.ae/news',
    type: 'puppeteer',
    description: 'Dubai Financial Services Authority - News and enforcement',
    priority: 'high',
    recencyDays: 30,
    country: 'UAE',
    region: 'Middle East',
    sectors: ['Banking', 'Capital Markets', 'Insurance', 'AML & Financial Crime']
  },
  {
    name: 'CBUAE News',
    authority: 'CBUAE',
    url: 'https://www.centralbank.ae/en/news-and-publications/news-and-insights/',
    type: 'puppeteer',
    description: 'Central Bank of UAE - News, regulations, AML guidance',
    priority: 'high',
    recencyDays: 30,
    country: 'UAE',
    region: 'Middle East',
    sectors: ['Banking', 'AML & Financial Crime', 'Payment Services', 'Licensing']
  },
  {
    name: 'ADGM FSRA News',
    authority: 'ADGM',
    url: 'https://www.adgm.com/media/announcements',
    type: 'puppeteer',
    description: 'Abu Dhabi Global Market FSRA - Regulatory announcements',
    priority: 'high',
    recencyDays: 30,
    country: 'UAE',
    region: 'Middle East',
    sectors: ['Banking', 'Capital Markets', 'Fintech', 'Digital Assets']
  },
  {
    name: 'SAMA News',
    authority: 'SAMA',
    url: 'https://www.sama.gov.sa/en-US/News/Pages/AllNews.aspx',
    type: 'puppeteer',
    description: 'Saudi Arabian Monetary Authority - News and circulars',
    priority: 'high',
    recencyDays: 30,
    country: 'Saudi Arabia',
    region: 'Middle East',
    sectors: ['Banking', 'Insurance', 'AML & Financial Crime', 'Payment Services']
  },
  {
    name: 'QCB News',
    authority: 'QCB',
    url: 'https://www.qcb.gov.qa/en/Pages/allnews.aspx',
    type: 'web_scraping',
    description: 'Qatar Central Bank - News and regulations',
    priority: 'medium',
    recencyDays: 30,
    country: 'Qatar',
    region: 'Middle East',
    sectors: ['Banking', 'AML & Financial Crime', 'Financial Stability']
  },

  // ============================================
  // LATIN AMERICA REGULATORS - Added December 2025
  // Brazil (largest market) and Mexico
  // ============================================
  {
    name: 'BCB Brazil News',
    authority: 'BCB',
    url: 'https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/noticias',
    type: 'rss',
    description: 'Banco Central do Brasil - News feed',
    priority: 'high',
    recencyDays: 30,
    country: 'Brazil',
    region: 'Americas',
    sectors: ['Banking', 'Payment Services', 'AML & Financial Crime', 'Cryptocurrency']
  },
  {
    name: 'CVM Board Decisions',
    authority: 'CVM',
    url: 'https://conteudo.cvm.gov.br/feed/decisoes.xml',
    type: 'rss',
    description: 'Comissão de Valores Mobiliários - Board decisions feed',
    priority: 'high',
    timeout: 30000,
    recencyDays: 30,
    country: 'Brazil',
    region: 'Americas',
    sectors: ['Capital Markets', 'Investment Management', 'Corporate Governance']
  },
  {
    name: 'CVM Sanctioning Decisions',
    authority: 'CVM',
    url: 'https://conteudo.cvm.gov.br/feed/sancionadores.xml',
    type: 'rss',
    description: 'Comissão de Valores Mobiliários - Sanctioning decisions feed',
    priority: 'high',
    timeout: 30000,
    recencyDays: 180,
    country: 'Brazil',
    region: 'Americas',
    sectors: ['Capital Markets', 'Enforcement', 'Corporate Governance']
  },
  {
    name: 'CVM Public Hearings',
    authority: 'CVM',
    url: 'https://conteudo.cvm.gov.br/feed/audiencias.xml',
    type: 'rss',
    description: 'Comissão de Valores Mobiliários - Public hearings feed',
    priority: 'medium',
    timeout: 30000,
    recencyDays: 90,
    country: 'Brazil',
    region: 'Americas',
    sectors: ['Capital Markets', 'Policy', 'Consultations']
  },
  {
    name: 'CVM Collegiate Reports',
    authority: 'CVM',
    url: 'https://conteudo.cvm.gov.br/feed/informativos_colegiado.xml',
    type: 'rss',
    description: 'Comissão de Valores Mobiliários - Collegiate reports feed',
    priority: 'medium',
    timeout: 30000,
    recencyDays: 90,
    country: 'Brazil',
    region: 'Americas',
    sectors: ['Capital Markets', 'Corporate Governance']
  },
  {
    name: 'CNBV Mexico News',
    authority: 'CNBV',
    url: 'https://www.gob.mx/cnbv/prensa',
    type: 'puppeteer',
    description: 'Comisión Nacional Bancaria y de Valores - Banking and securities',
    priority: 'high',
    recencyDays: 30,
    country: 'Mexico',
    region: 'Americas',
    sectors: ['Banking', 'Capital Markets', 'AML & Financial Crime', 'Fintech']
  },

  // ============================================
  // AFRICA REGULATORS - Added December 2025
  // South Africa (most developed financial market)
  // ============================================
  {
    name: 'SARB News & Publications',
    authority: 'SARB',
    url: 'https://www.resbank.co.za/bin/sarb/solr/publications/rss',
    type: 'rss',
    description: 'South African Reserve Bank - News and publications RSS',
    priority: 'high',
    recencyDays: 30,
    country: 'South Africa',
    region: 'Africa',
    sectors: ['Banking', 'Financial Stability', 'Monetary Policy', 'AML & Financial Crime']
  },
  {
    name: 'FSCA Media Releases',
    authority: 'FSCA',
    url: 'https://www.fsca.co.za/Latest-News/',
    type: 'puppeteer',
    description: 'Financial Sector Conduct Authority - Market conduct regulator',
    priority: 'high',
    recencyDays: 30,
    country: 'South Africa',
    region: 'Africa',
    sectors: ['Capital Markets', 'Insurance', 'Consumer Protection', 'Cryptocurrency']
  },
  {
    name: 'FIC South Africa',
    authority: 'FIC_SA',
    url: 'https://www.fic.gov.za/',
    type: 'puppeteer',
    description: 'Financial Intelligence Centre - AML/CFT guidance and alerts',
    priority: 'high',
    recencyDays: 30,
    country: 'South Africa',
    region: 'Africa',
    sectors: ['AML & Financial Crime', 'Banking', 'Compliance', 'Terrorism Financing']
  },
  {
    name: 'CBN Nigeria News',
    authority: 'CBN',
    url: 'https://www.cbn.gov.ng/NewsArchive/News.html',
    type: 'puppeteer',
    description: 'Central Bank of Nigeria - News and regulatory updates',
    priority: 'high',
    recencyDays: 30,
    country: 'Nigeria',
    region: 'Africa',
    sectors: ['Banking', 'Monetary Policy', 'AML & Financial Crime', 'Payment Services']
  },
  {
    name: 'CBE Egypt News',
    authority: 'CBE',
    url: 'https://www.cbe.org.eg/en/news-publications/news',
    type: 'puppeteer',
    description: 'Central Bank of Egypt - News and publications',
    priority: 'high',
    recencyDays: 30,
    country: 'Egypt',
    region: 'Africa',
    sectors: ['Banking', 'Monetary Policy', 'AML & Financial Crime', 'Payment Services']
  },

  // ============================================
  // UK ADDITIONAL REGULATORS - Added January 2026
  // ============================================
  {
    name: 'FSCS News',
    authority: 'FSCS',
    url: 'https://www.fscs.org.uk/news/',
    type: 'puppeteer',
    description: 'Financial Services Compensation Scheme - Consumer protection news',
    priority: 'high',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'Europe',
    sectors: ['Consumer Protection', 'Banking', 'Insurance', 'Investment Management']
  },

  // ============================================
  // ASIA REGULATORS - Added December 2025
  // China, India, Japan (major economies)
  // ============================================
  {
    name: 'PBOC News',
    authority: 'PBOC',
    url: 'http://www.pbc.gov.cn/en/3688110/3688172/index.html',
    type: 'web_scraping',
    description: 'People\'s Bank of China - News and announcements',
    priority: 'disabled', // JS-rendered page, not scrapeble with cheerio
    recencyDays: 30,
    country: 'China',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Monetary Policy', 'AML & Financial Crime', 'Payment Services']
  },
  {
    name: 'CSRC News',
    authority: 'CSRC',
    url: 'http://www.csrc.gov.cn/csrc_en/c102028/common_list.shtml',
    type: 'web_scraping',
    description: 'China Securities Regulatory Commission - Securities news',
    priority: 'high',
    recencyDays: 30,
    country: 'China',
    region: 'Asia-Pacific',
    sectors: ['Capital Markets', 'Investment Management', 'Corporate Finance']
  },
  {
    name: 'NFRA China News',
    authority: 'NFRA',
    url: 'https://www.nfra.gov.cn/en/view/pages/ItemList.html?itemPId=973&itemId=980&itemUrl=ItemListRightList.html&itemTitle=News%20and%20Events&itemPTitle=News%20and%20Events',
    type: 'puppeteer',
    description: 'National Financial Regulatory Administration - Banking and insurance news',
    priority: 'high',
    recencyDays: 30,
    country: 'China',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Insurance', 'Prudential Regulation']
  },
  {
    name: 'RBI Press Releases',
    authority: 'RBI',
    url: 'https://rbi.org.in/Scripts/BS_PressreleaseDisplay.aspx',
    type: 'puppeteer',
    description: 'Reserve Bank of India - Press releases',
    priority: 'high',
    recencyDays: 30,
    country: 'India',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Payment Services', 'AML & Financial Crime', 'Fintech']
  },
  {
    name: 'SEBI Press Releases',
    authority: 'SEBI',
    url: 'https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListingAll=yes&sid=1&ssid=2&smession=No',
    type: 'web_scraping',
    description: 'Securities and Exchange Board of India - Press releases',
    priority: 'high',
    recencyDays: 30,
    country: 'India',
    region: 'Asia-Pacific',
    sectors: ['Capital Markets', 'Investment Management', 'Corporate Governance']
  },
  {
    name: 'JFSA News',
    authority: 'JFSA',
    url: 'https://www.fsa.go.jp/fsaEnNewsList_rss2.xml',
    type: 'rss',
    description: 'Japan Financial Services Agency - News releases',
    priority: 'high',
    recencyDays: 30,
    country: 'Japan',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Capital Markets', 'Insurance', 'AML & Financial Crime']
  },

  // ============================================
  // AUSTRALIA REGULATORS - Added December 2025
  // Strong AML focus
  // ============================================
  {
    name: 'APRA Media Releases',
    authority: 'APRA',
    url: 'https://www.apra.gov.au/news-and-publications',
    type: 'puppeteer',
    description: 'Australian Prudential Regulation Authority - News and publications',
    priority: 'high',
    recencyDays: 30,
    country: 'Australia',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Insurance', 'Superannuation', 'Prudential Regulation']
  },
  {
    name: 'AUSTRAC Media Releases',
    authority: 'AUSTRAC',
    url: 'https://www.austrac.gov.au/news-and-media/media-release',
    type: 'puppeteer',
    description: 'Australian Transaction Reports and Analysis Centre - AML/CTF regulator',
    priority: 'high',
    recencyDays: 30,
    country: 'Australia',
    region: 'Asia-Pacific',
    sectors: ['AML & Financial Crime', 'Banking', 'Remittances', 'Cryptocurrency']
  },

  // ============================================
  // CARIBBEAN REGULATORS - Added December 2025
  // Major offshore financial center
  // ============================================
  {
    name: 'CIMA Industry Notices',
    authority: 'CIMA',
    url: 'https://www.cima.ky/general-industry-notices',
    type: 'puppeteer',
    description: 'Cayman Islands Monetary Authority - Industry notices and regulatory updates',
    priority: 'high',
    recencyDays: 30,
    country: 'Cayman Islands',
    region: 'Caribbean',
    sectors: ['Banking', 'Investment Management', 'Insurance', 'AML & Financial Crime']
  },

  // ============================================
  // GLOBAL BANK NEWS - Added January 2026
  // Major global banks - press releases and news
  // source_category: 'bank_news' separates from regulatory
  // NOTE: Changed from puppeteer to scraping for Vercel serverless compatibility
  // ============================================
  {
    name: 'JPMorgan Chase News',
    authority: 'JPMorgan',
    url: 'https://www.jpmorganchase.com/newsroom',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'JPMorgan Chase - Press releases and corporate news',
    priority: 'medium',
    recencyDays: 30,
    country: 'United States',
    region: 'Americas',
    sectors: ['Banking', 'Capital Markets', 'Wealth Management']
  },
  {
    name: 'Bank of America News',
    authority: 'BofA',
    url: 'https://newsroom.bankofamerica.com/content/newsroom/press-releases.html',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Bank of America - Newsroom and press releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'United States',
    region: 'Americas',
    sectors: ['Banking', 'Capital Markets', 'Wealth Management']
  },
  {
    name: 'Citigroup News',
    authority: 'Citigroup',
    url: 'https://www.citigroup.com/global/news/press-release',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Citigroup - Global news and press releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'United States',
    region: 'Americas',
    sectors: ['Banking', 'Capital Markets', 'Wealth Management']
  },
  {
    name: 'Wells Fargo News',
    authority: 'WellsFargo',
    url: 'https://newsroom.wf.com/news-releases/',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Wells Fargo - Newsroom and press releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'United States',
    region: 'Americas',
    sectors: ['Banking', 'Consumer Finance', 'Wealth Management']
  },
  {
    name: 'Goldman Sachs News',
    authority: 'Goldman',
    url: 'https://www.goldmansachs.com/pressroom',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Goldman Sachs - Pressroom and announcements',
    priority: 'medium',
    recencyDays: 30,
    country: 'United States',
    region: 'Americas',
    sectors: ['Investment Banking', 'Capital Markets', 'Asset Management']
  },
  {
    name: 'Morgan Stanley News',
    authority: 'MorganStanley',
    url: 'https://www.morganstanley.com/about-us-newsroom',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Morgan Stanley - Newsroom and press releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'United States',
    region: 'Americas',
    sectors: ['Investment Banking', 'Wealth Management', 'Capital Markets']
  },
  {
    name: 'HSBC News',
    authority: 'HSBC',
    url: 'https://www.hsbc.com/news-and-views/news',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'HSBC - News and media releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'Europe',
    sectors: ['Banking', 'Wealth Management', 'Capital Markets']
  },
  {
    name: 'Barclays News',
    authority: 'Barclays',
    url: 'https://home.barclays/news/press-releases/',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Barclays - Press releases and corporate news',
    priority: 'medium',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'Europe',
    sectors: ['Banking', 'Investment Banking', 'Consumer Finance']
  },
  {
    name: 'Deutsche Bank News',
    authority: 'DeutscheBank',
    url: 'https://www.db.com/newsroom/',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Deutsche Bank - Newsroom and media centre',
    priority: 'medium',
    recencyDays: 30,
    country: 'Germany',
    region: 'Europe',
    sectors: ['Investment Banking', 'Capital Markets', 'Corporate Banking']
  },
  {
    name: 'UBS News',
    authority: 'UBS',
    url: 'https://www.ubs.com/global/en/media/news.html',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'UBS - Media and press releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'Switzerland',
    region: 'Europe',
    sectors: ['Wealth Management', 'Investment Banking', 'Asset Management']
  },

  // ============================================
  // UK BANKS - Added January 2026
  // Major UK high street and challenger banks
  // ============================================
  {
    name: 'Lloyds Banking Group News',
    authority: 'Lloyds',
    url: 'https://www.lloydsbankinggroup.com/media/press-releases.html',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Lloyds Banking Group - Press releases (includes Halifax, Bank of Scotland)',
    priority: 'medium',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'UK',
    sectors: ['Banking', 'Consumer Finance', 'Insurance']
  },
  {
    name: 'NatWest Group News',
    authority: 'NatWest',
    url: 'https://www.natwestgroup.com/news-and-insights/news-room/press-releases.html',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'NatWest Group - Press releases and news',
    priority: 'medium',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'UK',
    sectors: ['Banking', 'Consumer Finance', 'Corporate Banking']
  },
  {
    name: 'Santander UK News',
    authority: 'SantanderUK',
    url: 'https://www.santander.co.uk/about-santander/media-centre/press-releases',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Santander UK - Media centre and press releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'UK',
    sectors: ['Banking', 'Consumer Finance', 'Mortgages']
  },
  {
    name: 'Nationwide Building Society News',
    authority: 'Nationwide',
    url: 'https://www.nationwide.co.uk/media/news/',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Nationwide Building Society - Media centre and news',
    priority: 'high',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'UK',
    sectors: ['Banking', 'Mortgages', 'Building Societies']
  },
  {
    name: 'TSB News',
    authority: 'TSB',
    url: 'https://www.tsb.co.uk/news-releases.html',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'TSB Bank - News releases',
    priority: 'high',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'UK',
    sectors: ['Banking', 'Consumer Finance']
  },
  {
    name: 'Monzo Blog',
    authority: 'Monzo',
    url: 'https://monzo.com/blog',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Monzo - Blog and product updates',
    priority: 'medium',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'UK',
    sectors: ['Banking', 'Fintech', 'Payments']
  },
  {
    name: 'Starling Bank News',
    authority: 'Starling',
    url: 'https://www.starlingbank.com/news/',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Starling Bank - News and press releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'UK',
    sectors: ['Banking', 'Fintech', 'Payments']
  },
  {
    name: 'Revolut News',
    authority: 'Revolut',
    url: 'https://www.revolut.com/news/',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Revolut - News and announcements',
    priority: 'medium',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'UK',
    sectors: ['Banking', 'Fintech', 'Payments', 'Cryptocurrency']
  },
  {
    name: 'Metro Bank News',
    authority: 'MetroBank',
    url: 'https://www.metrobankonline.co.uk/about-us/press-releases/',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Metro Bank - Press releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'UK',
    sectors: ['Banking', 'Consumer Finance']
  },
  {
    name: 'Virgin Money News',
    authority: 'VirginMoney',
    url: 'https://www.virginmoneyukplc.com/newsroom/all-news-and-releases/',
    type: 'web_scraping',
    source_category: 'bank_news',
    description: 'Virgin Money UK - Newsroom and releases',
    priority: 'medium',
    recencyDays: 30,
    country: 'United Kingdom',
    region: 'UK',
    sectors: ['Banking', 'Consumer Finance', 'Credit Cards']
  },

  {
    name: 'Demo Regulatory Updates',
    authority: 'Demo Authority',
    url: 'demo',
    type: 'demo',
    priority: 'disabled',
    recencyDays: 7
  }
]

module.exports = {
  feedSources
}
