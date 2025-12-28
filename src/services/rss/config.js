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
    name: 'National Crime Agency - Economic Crime',
    authority: 'NCA',
    url: 'https://www.nationalcrimeagency.gov.uk/news?tag=economic-crime',
    type: 'web_scraping',
    description: 'National Crime Agency - Economic crime alerts, SAR guidance, AML intelligence',
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
    type: 'web_scraping',
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
    authority: 'FCA',
    url: 'https://www.fca.org.uk/publications/search-results?category=policy%20and%20guidance-consultation%20papers&sort_by=dmetaZ',
    type: 'web_scraping',
    selector: '.search-item',
    titleSelector: '.search-item__clickthrough',
    linkSelector: '.search-item__clickthrough',
    dateSelector: '.meta-item.published-date',
    summarySelector: '.search-item__body',
    description: 'FCA Consultation Papers - Active consultations with response deadlines',
    priority: 'high',
    recencyDays: 90,
    extractDates: true,
    useGeneric: true,
    sectors: ['Multi-sector', 'Banking', 'Investment Management', 'Consumer Credit']
  },
  {
    name: 'FCA Discussion Papers',
    authority: 'FCA',
    url: 'https://www.fca.org.uk/publications/search-results?category=policy%20and%20guidance-discussion%20papers&sort_by=dmetaZ',
    type: 'web_scraping',
    selector: '.search-item',
    titleSelector: '.search-item__clickthrough',
    linkSelector: '.search-item__clickthrough',
    dateSelector: '.meta-item.published-date',
    summarySelector: '.search-item__body',
    description: 'FCA Discussion Papers - Early stage policy discussions',
    priority: 'medium',
    recencyDays: 90,
    extractDates: true,
    useGeneric: true,
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
