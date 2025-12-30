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
    type: 'web_scraping',
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
    url: 'https://www.finra.org/media-center/news-releases',
    type: 'web_scraping',
    description: 'Financial Industry Regulatory Authority - News',
    priority: 'high',
    recencyDays: 30,
    country: 'US',
    region: 'Americas',
    sectors: ['Investment Management', 'Broker-Dealer', 'Capital Markets']
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
    url: 'https://www.occ.gov/news-issuances/news-releases/index-news-releases.html',
    type: 'web_scraping',
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
    url: 'https://www.mas.gov.sg/news',
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
    url: 'https://www.hkma.gov.hk/eng/news-and-media/press-releases/',
    type: 'web_scraping',
    description: 'Hong Kong Monetary Authority - Press Releases',
    priority: 'high',
    recencyDays: 30,
    country: 'Hong Kong',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Financial Stability', 'Payment Services']
  },
  {
    name: 'ASIC Media Releases',
    authority: 'ASIC',
    url: 'https://asic.gov.au/about-asic/news-centre/news-items/',
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
    url: 'https://www.eiopa.europa.eu/media-centre/news_en',
    type: 'web_scraping',
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
    url: 'https://www.eba.europa.eu/rss.xml',
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
    url: 'https://www.bis.org/press/index.htm',
    type: 'web_scraping',
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
    url: 'https://www.iosco.org/news/',
    type: 'web_scraping',
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

  // US - OFAC (Sanctions)
  {
    name: 'OFAC Sanctions Updates',
    authority: 'OFAC',
    url: 'https://ofac.treasury.gov/recent-actions',
    type: 'puppeteer',
    description: 'US Treasury OFAC - Sanctions listings, SDN updates, enforcement',
    priority: 'high',
    recencyDays: 30,
    country: 'US',
    region: 'Americas',
    sectors: ['Sanctions', 'AML & Financial Crime', 'Banking', 'Compliance']
  },

  // FRANCE
  {
    name: 'AMF News (France)',
    authority: 'AMF',
    url: 'https://www.amf-france.org/en/news-publications/news-releases',
    type: 'puppeteer',
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
    type: 'puppeteer',
    description: 'Autorité de Contrôle Prudentiel - Banking/Insurance supervision',
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
    url: 'https://www.bafin.de/EN/PublikationenDaten/Publikationen/publikationen_node_en.html',
    type: 'puppeteer',
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
    url: 'https://www.centralbank.ie/news-media',
    type: 'puppeteer',
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
    url: 'https://www.afm.nl/nl-nl/nieuws',
    type: 'puppeteer',
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
    url: 'https://www.dnb.nl/nieuws/',
    type: 'puppeteer',
    description: 'De Nederlandsche Bank - Prudential supervision',
    priority: 'high',
    recencyDays: 30,
    country: 'Netherlands',
    region: 'Europe',
    sectors: ['Banking', 'Insurance', 'Pension Funds', 'Financial Stability']
  },

  // SPAIN
  {
    name: 'CNMV News (Spain)',
    authority: 'CNMV',
    url: 'https://www.cnmv.es/portal/home.aspx?lang=en',
    type: 'puppeteer',
    description: 'Comisión Nacional del Mercado de Valores - Securities regulator',
    priority: 'high',
    recencyDays: 30,
    country: 'Spain',
    region: 'Europe',
    sectors: ['Capital Markets', 'Investment Management', 'Listed Companies']
  },

  // ITALY
  {
    name: 'CONSOB Press Releases (Italy)',
    authority: 'CONSOB',
    url: 'https://www.consob.it/web/consob-and-its-activities/press-releases',
    type: 'puppeteer',
    description: 'Commissione Nazionale per le Società e la Borsa - Securities',
    priority: 'high',
    recencyDays: 30,
    country: 'Italy',
    region: 'Europe',
    sectors: ['Capital Markets', 'Corporate Governance', 'Listed Companies']
  },

  // SWEDEN
  {
    name: 'Finansinspektionen (Sweden)',
    authority: 'FI_SWEDEN',
    url: 'https://www.fi.se/en/published/',
    type: 'puppeteer',
    description: 'Swedish Financial Supervisory Authority - All publications',
    priority: 'high',
    recencyDays: 30,
    country: 'Sweden',
    region: 'Europe',
    sectors: ['Banking', 'Insurance', 'Capital Markets', 'Consumer Credit']
  },

  // EU CROSS-BORDER
  {
    name: 'EU Council Sanctions',
    authority: 'EU_COUNCIL',
    url: 'https://www.consilium.europa.eu/en/policies/sanctions/',
    type: 'puppeteer',
    description: 'EU Council - Sanctions packages, listings changes',
    priority: 'high',
    recencyDays: 30,
    country: 'EU',
    region: 'Europe',
    sectors: ['Sanctions', 'AML & Financial Crime', 'Compliance']
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
