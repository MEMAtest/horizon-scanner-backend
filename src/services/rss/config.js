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
    name: 'FCA Dear CEO Letters',
    authority: 'FCA',
    url: 'https://www.fca.org.uk/publications/search-results?category=policy%20and%20guidance-dear%20ceo%20letters&sort_by=dmetaZ',
    type: 'puppeteer',
    description: 'FCA - Dear CEO Letters on supervisory priorities and thematic issues',
    priority: 'high',
    recencyDays: 90,
    sectors: ['Banking', 'Investment Management', 'Insurance', 'Consumer Credit', 'Payments']
  },
  {
    name: 'FCA Market Watch',
    authority: 'FCA',
    url: 'https://www.fca.org.uk/publications?category%5B%5D=market-watch',
    type: 'puppeteer',
    description: 'FCA - Market Watch newsletter on market conduct and regulatory themes',
    priority: 'high',
    recencyDays: 60,
    sectors: ['Capital Markets', 'Investment Management', 'Market Conduct']
  },
  {
    name: 'FCA Portfolio Letters',
    authority: 'FCA',
    url: 'https://www.fca.org.uk/publications/search-results?category=policy%20and%20guidance-portfolio%20letters',
    type: 'puppeteer',
    description: 'FCA - Portfolio letters to specific sector firms',
    priority: 'high',
    recencyDays: 90,
    sectors: ['Banking', 'Investment Management', 'Insurance', 'Consumer Credit']
  },
  {
    name: 'FCA Thematic Reviews',
    authority: 'FCA',
    url: 'https://www.fca.org.uk/publications?category%5B%5D=thematic-review',
    type: 'puppeteer',
    description: 'FCA - Multi-firm thematic reviews and supervisory findings',
    priority: 'high',
    recencyDays: 90,
    sectors: ['Banking', 'Investment Management', 'Insurance', 'Consumer Credit']
  },
  {
    name: 'FCA Supervisory Notices',
    authority: 'FCA',
    url: 'https://www.fca.org.uk/publications?category%5B%5D=supervisory-notice',
    type: 'puppeteer',
    description: 'FCA - Supervisory notices on firm-specific regulatory actions',
    priority: 'medium',
    recencyDays: 60,
    sectors: ['Banking', 'Investment Management', 'Insurance', 'Capital Markets']
  },
  {
    name: 'FCA Discussion Papers',
    authority: 'FCA',
    url: 'https://www.fca.org.uk/publications?category%5B%5D=discussion-paper',
    type: 'puppeteer',
    description: 'FCA - Discussion papers on policy development and regulatory approach',
    priority: 'high',
    recencyDays: 90,
    sectors: ['Policy', 'Banking', 'Investment Management', 'Capital Markets']
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
    url: 'https://www.sfo.gov.uk/press-room/',
    type: 'web_scraping',
    selector: '.news-item',
    titleSelector: '.news-item__title a',
    linkSelector: '.news-item__title a',
    dateSelector: '.news-item__date',
    summarySelector: '.news-item__excerpt',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['AML & Financial Crime', 'Banking']
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
    url: 'https://www.frc.org.uk/news-and-events/news',
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
  {
    name: 'JMLSG News',
    authority: 'JMLSG',
    url: 'https://www.jmlsg.org.uk/latest-news/',
    type: 'web_scraping',
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
    name: 'Financial Services Compensation Scheme RSS',
    authority: 'FSCS',
    url: 'https://www.fscs.org.uk/about-fscs/latest-news/feed/',
    type: 'rss',
    description: 'Financial Services Compensation Scheme - Firm failures, compensation triggers, levy guidance',
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
    url: 'https://www.nationalcrimeagency.gov.uk/component/tags/tag/economic-crime?format=feed&type=rss',
    type: 'rss',
    description: 'National Crime Agency - Economic crime alerts, SAR guidance, AML intelligence',
    priority: 'medium',
    recencyDays: 30,
    sectors: ['AML & Financial Crime', 'Banking', 'Compliance', 'Law Enforcement']
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
