const AUTHORITY_REGISTRY = [
  {
    id: 'ACPR',
    name: 'Autorite de Controle Prudentiel et de Resolution',
    acronym: 'ACPR',
    region: 'Europe',
    country: 'France',
    aliases: ['Autorite de Controle Prudentiel', 'Autorite de Controle Prudentiel et de Resolution', 'ACPR'],
    logo: '/images/regulators/acpr.svg'
  },
  {
    id: 'ADGM',
    name: 'Abu Dhabi Global Market',
    acronym: 'ADGM',
    region: 'Middle East',
    country: 'UAE',
    aliases: ['Abu Dhabi Global Market', 'ADGM'],
    logo: '/images/regulators/adgm.svg'
  },
  {
    id: 'AFM',
    name: 'Authority for the Financial Markets',
    acronym: 'AFM',
    region: 'Europe',
    country: 'Netherlands',
    aliases: ['Authority for the Financial Markets', 'AFM'],
    logo: '/images/regulators/afm.svg'
  },
  {
    id: 'AMF',
    name: 'Autorite des Marches Financiers',
    acronym: 'AMF',
    region: 'Europe',
    country: 'France',
    aliases: ['Autorite des Marches Financiers', 'AMF'],
    logo: '/images/regulators/amf.svg'
  },
  {
    id: 'APRA',
    name: 'Australian Prudential Regulation Authority',
    acronym: 'APRA',
    region: 'Asia-Pacific',
    country: 'Australia',
    aliases: ['Australian Prudential Regulation Authority', 'APRA'],
    logo: '/images/regulators/apra.svg'
  },
  {
    id: 'AQUIS',
    name: 'Aquis Exchange',
    acronym: 'Aquis',
    region: 'Europe',
    country: 'UK',
    aliases: ['Aquis Exchange', 'Aquis Exchange PLC', 'AQUIS'],
    logo: '/images/regulators/aquis.png'
  },
  {
    id: 'ASA',
    name: 'Advertising Standards Authority',
    acronym: 'ASA',
    region: 'UK',
    country: 'UK',
    aliases: ['Advertising Standards Authority', 'ASA'],
    logo: '/images/regulators/asa.png'
  },
  {
    id: 'ASIC',
    name: 'Australian Securities and Investments Commission',
    acronym: 'ASIC',
    region: 'Asia-Pacific',
    country: 'Australia',
    aliases: ['Australian Securities and Investments Commission', 'ASIC'],
    logo: '/images/regulators/asic.svg'
  },
  {
    id: 'AUSTRAC',
    name: 'Australian Transaction Reports and Analysis Centre',
    acronym: 'AUSTRAC',
    region: 'Asia-Pacific',
    country: 'Australia',
    aliases: ['Australian Transaction Reports and Analysis Centre', 'AUSTRAC'],
    logo: '/images/regulators/austrac.png'
  },
  {
    id: 'BAFIN',
    name: 'Federal Financial Supervisory Authority',
    acronym: 'BaFin',
    region: 'Europe',
    country: 'Germany',
    aliases: ['Federal Financial Supervisory Authority', 'BaFin', 'BAFIN'],
    logo: '/images/regulators/bafin.png'
  },
  {
    id: 'BASEL_INSTITUTE',
    name: 'Basel Institute on Governance',
    acronym: 'Basel Institute',
    region: 'Global',
    country: 'International',
    aliases: ['Basel Institute on Governance', 'Basel Institute', 'BASEL_INSTITUTE'],
    logo: '/images/regulators/basel-institute.svg'
  },
  {
    id: 'BCB',
    name: 'Banco Central do Brasil',
    acronym: 'BCB',
    region: 'Americas',
    country: 'Brazil',
    aliases: ['Banco Central do Brasil', 'BCB'],
    logo: '/images/regulators/bcb.png'
  },
  {
    id: 'BCBS',
    name: 'Basel Committee on Banking Supervision',
    acronym: 'BCBS',
    region: 'Global',
    country: 'International',
    aliases: ['Basel Committee on Banking Supervision', 'BCBS'],
    logo: '/images/regulators/bis.gif'
  },
  {
    id: 'BIS',
    name: 'Bank for International Settlements',
    acronym: 'BIS',
    region: 'Global',
    country: 'International',
    aliases: ['Bank for International Settlements', 'BIS'],
    logo: '/images/regulators/bis.gif'
  },
  {
    id: 'Bank of England',
    name: 'Bank of England',
    acronym: 'BoE',
    region: 'UK',
    country: 'UK',
    aliases: ['Bank of England', 'BoE', 'Bank of England (BoE)'],
    logo: '/images/regulators/boe.svg'
  },
  {
    id: 'Bank of Italy',
    name: 'Bank of Italy',
    acronym: 'BdI',
    region: 'Europe',
    country: 'Italy',
    aliases: ["Banca d'Italia", 'Bank of Italy'],
    logo: '/images/regulators/bank-of-italy.svg'
  },
  {
    id: 'CBI',
    name: 'Central Bank of Ireland',
    acronym: 'CBI',
    region: 'Europe',
    country: 'Ireland',
    aliases: ['Central Bank of Ireland', 'CBI'],
    logo: '/images/regulators/cbi.png'
  },
  {
    id: 'CBUAE',
    name: 'Central Bank of the United Arab Emirates',
    acronym: 'CBUAE',
    region: 'Middle East',
    country: 'UAE',
    aliases: ['Central Bank of the United Arab Emirates', 'Central Bank of the UAE', 'CBUAE'],
    logo: '/images/regulators/cbuae.jpg'
  },
  {
    id: 'CFPB',
    name: 'Consumer Financial Protection Bureau',
    acronym: 'CFPB',
    region: 'Americas',
    country: 'US',
    aliases: ['Consumer Financial Protection Bureau', 'CFPB'],
    logo: '/images/regulators/cfpb.png'
  },
  {
    id: 'CFTC',
    name: 'Commodity Futures Trading Commission',
    acronym: 'CFTC',
    region: 'Americas',
    country: 'US',
    aliases: ['Commodity Futures Trading Commission', 'CFTC'],
    logo: '/images/regulators/cftc.png'
  },
  {
    id: 'CIMA',
    name: 'Cayman Islands Monetary Authority',
    acronym: 'CIMA',
    region: 'Caribbean',
    country: 'Cayman Islands',
    aliases: ['Cayman Islands Monetary Authority', 'CIMA'],
    logo: '/images/regulators/cima.png'
  },
  {
    id: 'CNBV',
    name: 'National Banking and Securities Commission',
    acronym: 'CNBV',
    region: 'Americas',
    country: 'Mexico',
    aliases: ['Comision Nacional Bancaria y de Valores', 'CNBV', 'National Banking and Securities Commission'],
    logo: '/images/regulators/cnbv.png'
  },
  {
    id: 'CNMV',
    name: 'Comision Nacional del Mercado de Valores',
    acronym: 'CNMV',
    region: 'Europe',
    country: 'Spain',
    aliases: ['Comision Nacional del Mercado de Valores', 'CNMV'],
    logo: '/images/regulators/cnmv.svg'
  },
  {
    id: 'CONSOB',
    name: 'Commissione Nazionale per le Societa e la Borsa',
    acronym: 'CONSOB',
    region: 'Europe',
    country: 'Italy',
    aliases: ['Commissione Nazionale per le Societa e la Borsa', 'CONSOB'],
    logo: '/images/regulators/consob.png'
  },
  {
    id: 'CSRC',
    name: 'China Securities Regulatory Commission',
    acronym: 'CSRC',
    region: 'Asia-Pacific',
    country: 'China',
    aliases: ['China Securities Regulatory Commission', 'CSRC'],
    logo: '/images/regulators/csrc.png'
  },
  {
    id: 'CVM',
    name: 'Comissao de Valores Mobiliarios',
    acronym: 'CVM',
    region: 'Americas',
    country: 'Brazil',
    aliases: ['Comissao de Valores Mobiliarios', 'CVM'],
    logo: '/images/regulators/cvm.png'
  },
  {
    id: 'Competition and Markets Authority',
    name: 'Competition and Markets Authority',
    acronym: 'CMA',
    region: 'UK',
    country: 'UK',
    aliases: ['Competition and Markets Authority', 'CMA'],
    logo: '/images/regulators/cma.png'
  },
  {
    id: 'DBT',
    name: 'Department for Business and Trade',
    acronym: 'DBT',
    region: 'UK',
    country: 'UK',
    aliases: ['Department for Business and Trade', 'DBT'],
    logo: '/images/regulators/govuk.svg'
  },
  {
    id: 'DFSA',
    name: 'Dubai Financial Services Authority',
    acronym: 'DFSA',
    region: 'Middle East',
    country: 'UAE',
    aliases: ['Dubai Financial Services Authority', 'DFSA'],
    logo: '/images/regulators/dfsa.png'
  },
  {
    id: 'DNB',
    name: 'De Nederlandsche Bank',
    acronym: 'DNB',
    region: 'Europe',
    country: 'Netherlands',
    aliases: ['De Nederlandsche Bank', 'DNB'],
    logo: '/images/regulators/dnb.svg'
  },
  {
    id: 'EBA',
    name: 'European Banking Authority',
    acronym: 'EBA',
    region: 'Europe',
    country: 'EU',
    aliases: ['European Banking Authority', 'EBA', 'EBA (European Banking Authority)'],
    logo: '/images/regulators/eba.svg'
  },
  {
    id: 'ECB',
    name: 'European Central Bank',
    acronym: 'ECB',
    region: 'Europe',
    country: 'EU',
    aliases: ['European Central Bank', 'ECB'],
    logo: '/images/regulators/ecb.svg'
  },
  {
    id: 'EC',
    name: 'European Commission',
    acronym: 'EC',
    region: 'Europe',
    country: 'EU',
    aliases: ['European Commission', 'EC'],
    logo: '/images/regulators/ec.svg'
  },
  {
    id: 'EEAS',
    name: 'European External Action Service',
    acronym: 'EEAS',
    region: 'Europe',
    country: 'EU',
    aliases: ['European External Action Service', 'EEAS'],
    logo: '/images/regulators/eeas.png'
  },
  {
    id: 'EGMONT',
    name: 'Egmont Group',
    acronym: 'Egmont',
    region: 'Global',
    country: 'International',
    aliases: ['Egmont Group', 'EGMONT'],
    logo: '/images/regulators/egmont.svg'
  },
  {
    id: 'EIOPA',
    name: 'European Insurance and Occupational Pensions Authority',
    acronym: 'EIOPA',
    region: 'Europe',
    country: 'EU',
    aliases: ['European Insurance and Occupational Pensions Authority', 'EIOPA'],
    logo: '/images/regulators/eiopa.svg'
  },
  {
    id: 'ESMA',
    name: 'European Securities and Markets Authority',
    acronym: 'ESMA',
    region: 'Europe',
    country: 'EU',
    aliases: ['European Securities and Markets Authority', 'ESMA'],
    logo: '/images/regulators/esma.png'
  },
  {
    id: 'EU_COUNCIL',
    name: 'Council of the European Union',
    acronym: 'EU Council',
    region: 'Europe',
    country: 'EU',
    aliases: ['Council of the European Union', 'Council of the EU', 'EU Council', 'EU_COUNCIL'],
    logo: '/images/regulators/eu-council.png'
  },
  {
    id: 'FATF',
    name: 'Financial Action Task Force',
    acronym: 'FATF',
    region: 'Global',
    country: 'International',
    aliases: ['Financial Action Task Force', 'FATF'],
    logo: '/images/regulators/fatf.svg'
  },
  {
    id: 'FCA',
    name: 'Financial Conduct Authority',
    acronym: 'FCA',
    region: 'UK',
    country: 'UK',
    aliases: ['Financial Conduct Authority', 'FCA'],
    logo: '/images/regulators/fca.png'
  },
  {
    id: 'FDIC',
    name: 'Federal Deposit Insurance Corporation',
    acronym: 'FDIC',
    region: 'Americas',
    country: 'US',
    aliases: ['Federal Deposit Insurance Corporation', 'FDIC'],
    logo: '/images/regulators/fdic.svg'
  },
  {
    id: 'FEDERAL_RESERVE',
    name: 'Federal Reserve System',
    acronym: 'Fed',
    region: 'Americas',
    country: 'US',
    aliases: ['Federal Reserve System', 'Federal Reserve', 'FEDERAL_RESERVE'],
    logo: '/images/regulators/federal-reserve.png'
  },
  {
    id: 'FIC_SA',
    name: 'Financial Intelligence Centre',
    acronym: 'FIC',
    region: 'Africa',
    country: 'South Africa',
    aliases: ['Financial Intelligence Centre', 'FIC', 'FIC South Africa', 'FIC_SA'],
    logo: '/images/regulators/fic.png'
  },
  {
    id: 'CBN',
    name: 'Central Bank of Nigeria',
    acronym: 'CBN',
    region: 'Africa',
    country: 'Nigeria',
    aliases: ['Central Bank of Nigeria', 'CBN'],
    logo: '/images/regulators/cbn.png'
  },
  {
    id: 'CBE',
    name: 'Central Bank of Egypt',
    acronym: 'CBE',
    region: 'Africa',
    country: 'Egypt',
    aliases: ['Central Bank of Egypt', 'CBE'],
    logo: '/images/regulators/cbe.png'
  },
  {
    id: 'FI_SWEDEN',
    name: 'Finansinspektionen',
    acronym: 'FI',
    region: 'Europe',
    country: 'Sweden',
    aliases: ['Finansinspektionen', 'Swedish Financial Supervisory Authority', 'FI_SWEDEN', 'FI Sweden'],
    logo: '/images/regulators/fi.svg'
  },
  {
    id: 'FINMA',
    name: 'Swiss Financial Market Supervisory Authority',
    acronym: 'FINMA',
    region: 'Europe',
    country: 'Switzerland',
    aliases: ['Swiss Financial Market Supervisory Authority', 'FINMA'],
    logo: '/images/regulators/finma.png'
  },
  {
    id: 'FINRA',
    name: 'Financial Industry Regulatory Authority',
    acronym: 'FINRA',
    region: 'Americas',
    country: 'US',
    aliases: ['Financial Industry Regulatory Authority', 'FINRA'],
    logo: '/images/regulators/finra.svg'
  },
  {
    id: 'FOS',
    name: 'Financial Ombudsman Service',
    acronym: 'FOS',
    region: 'UK',
    country: 'UK',
    aliases: ['Financial Ombudsman Service', 'FOS'],
    logo: '/images/regulators/fos.png'
  },
  {
    id: 'FRC',
    name: 'Financial Reporting Council',
    acronym: 'FRC',
    region: 'UK',
    country: 'UK',
    aliases: ['Financial Reporting Council', 'FRC'],
    logo: '/images/regulators/frc.svg'
  },
  {
    id: 'FSB',
    name: 'Financial Stability Board',
    acronym: 'FSB',
    region: 'Global',
    country: 'International',
    aliases: ['Financial Stability Board', 'FSB'],
    logo: '/images/regulators/fsb.svg'
  },
  {
    id: 'FSCA',
    name: 'Financial Sector Conduct Authority',
    acronym: 'FSCA',
    region: 'Africa',
    country: 'South Africa',
    aliases: ['Financial Sector Conduct Authority', 'FSCA'],
    logo: '/images/regulators/fsca.png'
  },
  {
    id: 'FSCS',
    name: 'Financial Services Compensation Scheme',
    acronym: 'FSCS',
    region: 'UK',
    country: 'UK',
    aliases: ['Financial Services Compensation Scheme', 'FSCS'],
    logo: '/images/regulators/fscs.png'
  },
  {
    id: 'GAMBLING_COMMISSION',
    name: 'Gambling Commission',
    acronym: 'Gambling Commission',
    region: 'UK',
    country: 'UK',
    aliases: ['Gambling Commission', 'GAMBLING_COMMISSION'],
    logo: '/images/regulators/gambling-commission.png'
  },
  {
    id: 'HKMA',
    name: 'Hong Kong Monetary Authority',
    acronym: 'HKMA',
    region: 'Asia-Pacific',
    country: 'Hong Kong',
    aliases: ['Hong Kong Monetary Authority', 'HKMA'],
    logo: '/images/regulators/hkma.jpg'
  },
  {
    id: 'HM Government',
    name: 'HM Government',
    acronym: 'HMG',
    region: 'UK',
    country: 'UK',
    aliases: ['HM Government', 'HMG'],
    logo: '/images/regulators/govuk.svg'
  },
  {
    id: 'HM Treasury',
    name: 'HM Treasury',
    acronym: 'HMT',
    region: 'UK',
    country: 'UK',
    aliases: ['HM Treasury', 'HMT', 'HM Treasury, Office of Financial Sanctions Implementation'],
    logo: '/images/regulators/govuk.svg'
  },
  {
    id: 'HMRC',
    name: 'HM Revenue & Customs',
    acronym: 'HMRC',
    region: 'UK',
    country: 'UK',
    aliases: ['HM Revenue & Customs', 'HM Revenue and Customs', 'HMRC'],
    logo: '/images/regulators/govuk.svg'
  },
  {
    id: 'HSE',
    name: 'Health and Safety Executive',
    acronym: 'HSE',
    region: 'UK',
    country: 'UK',
    aliases: ['Health and Safety Executive', 'HSE'],
    logo: '/images/regulators/hse.svg'
  },
  {
    id: 'ICO',
    name: "Information Commissioner's Office",
    acronym: 'ICO',
    region: 'UK',
    country: 'UK',
    aliases: ["Information Commissioner's Office", 'Information Commissioner Office', 'ICO'],
    logo: '/images/regulators/ico.svg'
  },
  {
    id: 'IOSCO',
    name: 'International Organization of Securities Commissions',
    acronym: 'IOSCO',
    region: 'Global',
    country: 'International',
    aliases: ['International Organization of Securities Commissions', 'IOSCO'],
    logo: '/images/regulators/iosco.svg'
  },
  {
    id: 'JFSA',
    name: 'Japan Financial Services Agency',
    acronym: 'JFSA',
    region: 'Asia-Pacific',
    country: 'Japan',
    aliases: ['Japan Financial Services Agency', 'JFSA'],
    logo: '/images/regulators/jfsa.svg'
  },
  {
    id: 'JMLSG',
    name: 'Joint Money Laundering Steering Group',
    acronym: 'JMLSG',
    region: 'UK',
    country: 'UK',
    aliases: ['Joint Money Laundering Steering Group', 'JMLSG'],
    logo: '/images/regulators/jmlsg.png'
  },
  {
    id: 'LSE',
    name: 'London Stock Exchange',
    acronym: 'LSE',
    region: 'UK',
    country: 'UK',
    aliases: ['London Stock Exchange', 'LSE'],
    logo: '/images/regulators/lse.svg'
  },
  {
    id: 'MAS',
    name: 'Monetary Authority of Singapore',
    acronym: 'MAS',
    region: 'Asia-Pacific',
    country: 'Singapore',
    aliases: ['Monetary Authority of Singapore', 'MAS'],
    logo: '/images/regulators/mas.svg'
  },
  {
    id: 'NCA',
    name: 'National Crime Agency',
    acronym: 'NCA',
    region: 'UK',
    country: 'UK',
    aliases: ['National Crime Agency', 'NCA'],
    logo: '/images/regulators/nca.png'
  },
  {
    id: 'NFRA_INDIA',
    name: 'National Financial Reporting Authority',
    acronym: 'NFRA',
    region: 'Asia-Pacific',
    country: 'India',
    aliases: ['National Financial Reporting Authority', 'NFRA India', 'NFRA_INDIA'],
    logo: '/images/regulators/nfra-india.png'
  },
  {
    id: 'NFRA',
    name: 'National Financial Regulatory Administration',
    acronym: 'NFRA',
    region: 'Asia-Pacific',
    country: 'China',
    aliases: ['National Financial Regulatory Administration', 'NFRA', 'NFRA China', 'CBIRC'],
    logo: '/images/regulators/nfra-china.png'
  },
  {
    id: 'OCC',
    name: 'Office of the Comptroller of the Currency',
    acronym: 'OCC',
    region: 'Americas',
    country: 'US',
    aliases: ['Office of the Comptroller of the Currency', 'OCC'],
    logo: '/images/regulators/occ.svg'
  },
  {
    id: 'OFAC',
    name: 'Office of Foreign Assets Control',
    acronym: 'OFAC',
    region: 'Americas',
    country: 'US',
    aliases: ['Office of Foreign Assets Control', 'OFAC'],
    logo: '/images/regulators/treasury-seal.png'
  },
  {
    id: 'OFCOM',
    name: 'Office of Communications',
    acronym: 'OFCOM',
    region: 'UK',
    country: 'UK',
    aliases: ['Office of Communications', 'Ofcom', 'OFCOM'],
    logo: '/images/regulators/ofcom.svg'
  },
  {
    id: 'OFSI',
    name: 'Office of Financial Sanctions Implementation',
    acronym: 'OFSI',
    region: 'UK',
    country: 'UK',
    aliases: ['Office of Financial Sanctions Implementation', 'OFSI'],
    logo: '/images/regulators/govuk.svg'
  },
  {
    id: 'PBOC',
    name: "People's Bank of China",
    acronym: 'PBOC',
    region: 'Asia-Pacific',
    country: 'China',
    aliases: ["People's Bank of China", 'PBOC'],
    logo: '/images/regulators/pboc.png'
  },
  {
    id: 'PRA',
    name: 'Prudential Regulation Authority',
    acronym: 'PRA',
    region: 'UK',
    country: 'UK',
    aliases: ['Prudential Regulation Authority', 'PRA', 'Prudential Regulation Authority (PRA)'],
    logo: '/images/regulators/pra.png'
  },
  {
    id: 'Pay.UK',
    name: 'Pay.UK',
    acronym: 'Pay.UK',
    region: 'UK',
    country: 'UK',
    aliases: ['Pay.UK', 'Pay UK', 'PayUK'],
    logo: '/images/regulators/pay-uk.png'
  },
  {
    id: 'PSR',
    name: 'Payment Systems Regulator',
    acronym: 'PSR',
    region: 'UK',
    country: 'UK',
    aliases: ['Payment Systems Regulator', 'PSR'],
    logo: '/images/regulators/psr.png'
  },
  {
    id: 'QCB',
    name: 'Qatar Central Bank',
    acronym: 'QCB',
    region: 'Middle East',
    country: 'Qatar',
    aliases: ['Qatar Central Bank', 'QCB'],
    logo: '/images/regulators/qcb.svg'
  },
  {
    id: 'RBI',
    name: 'Reserve Bank of India',
    acronym: 'RBI',
    region: 'Asia-Pacific',
    country: 'India',
    aliases: ['Reserve Bank of India', 'RBI'],
    logo: '/images/regulators/rbi.jpg'
  },
  {
    id: 'SAMA',
    name: 'Saudi Central Bank',
    acronym: 'SAMA',
    region: 'Middle East',
    country: 'Saudi Arabia',
    aliases: ['Saudi Central Bank', 'Saudi Arabian Monetary Authority', 'SAMA'],
    logo: '/images/regulators/sama.jpg'
  },
  {
    id: 'SARB',
    name: 'South African Reserve Bank',
    acronym: 'SARB',
    region: 'Africa',
    country: 'South Africa',
    aliases: ['South African Reserve Bank', 'SARB'],
    logo: '/images/regulators/sarb.jpg'
  },
  {
    id: 'SEC',
    name: 'Securities and Exchange Commission',
    acronym: 'SEC',
    region: 'Americas',
    country: 'US',
    aliases: ['Securities and Exchange Commission', 'SEC'],
    logo: '/images/regulators/sec.png'
  },
  {
    id: 'SEBI',
    name: 'Securities and Exchange Board of India',
    acronym: 'SEBI',
    region: 'Asia-Pacific',
    country: 'India',
    aliases: ['Securities and Exchange Board of India', 'SEBI'],
    logo: '/images/regulators/sebi.jpg'
  },
  {
    id: 'SFC',
    name: 'Securities and Futures Commission',
    acronym: 'SFC',
    region: 'Asia-Pacific',
    country: 'Hong Kong',
    aliases: ['Securities and Futures Commission', 'SFC'],
    logo: '/images/regulators/sfc.svg'
  },
  {
    id: 'Serious Fraud Office',
    name: 'Serious Fraud Office',
    acronym: 'SFO',
    region: 'UK',
    country: 'UK',
    aliases: ['Serious Fraud Office', 'SFO'],
    logo: '/images/regulators/sfo.png'
  },
  {
    id: 'SRA',
    name: 'Solicitors Regulation Authority',
    acronym: 'SRA',
    region: 'UK',
    country: 'UK',
    aliases: ['Solicitors Regulation Authority', 'SRA'],
    logo: '/images/regulators/sra.svg'
  },
  {
    id: 'The Pensions Regulator',
    name: 'The Pensions Regulator',
    acronym: 'TPR',
    region: 'UK',
    country: 'UK',
    aliases: ['The Pensions Regulator', 'Pensions Regulator', 'TPR'],
    logo: '/images/regulators/tpr.svg'
  },
  {
    id: 'Treasury Committee',
    name: 'Treasury Committee',
    acronym: 'Treasury Committee',
    region: 'UK',
    country: 'UK',
    aliases: ['Treasury Committee', 'UK Treasury Committee'],
    logo: '/images/regulators/govuk.svg'
  },
  {
    id: 'WOLFSBERG',
    name: 'Wolfsberg Group',
    acronym: 'Wolfsberg',
    region: 'Global',
    country: 'International',
    aliases: ['Wolfsberg Group', 'WOLFSBERG'],
    logo: '/images/regulators/wolfsberg.jpg'
  }
]

const normalizeKey = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim()

const getDisplayCode = (record) => {
  if (!record) return ''
  if (record.acronym) return record.acronym
  const id = record.id || ''
  if (!id || id.includes('_')) return ''
  return id
}

const resolveAuthorityRecord = (value) => {
  const key = normalizeKey(value)
  if (!key) return null
  return AUTHORITY_REGISTRY.find(record => {
    const candidates = [record.id, record.name, record.acronym].concat(record.aliases || [])
    return candidates.some(candidate => normalizeKey(candidate) === key)
  }) || null
}

const formatAuthorityLabel = (record) => {
  if (!record) return ''
  const name = record.name || record.id || ''
  const displayCode = getDisplayCode(record)
  if (displayCode && name && normalizeKey(displayCode) !== normalizeKey(name)) {
    return `${displayCode} - ${name}`
  }
  return name || displayCode
}

const normalizeAuthorityName = (value) => {
  const record = resolveAuthorityRecord(value)
  return record ? (record.id || record.name || value) : value
}

const getAuthorityDisplayName = (value) => {
  const record = resolveAuthorityRecord(value)
  return record ? formatAuthorityLabel(record) : (value || '')
}

const normalizeAuthorityEntries = (authorities = []) => {
  if (!Array.isArray(authorities)) return []
  return authorities.map(entry => {
    if (!entry) return { name: '', count: 0 }
    if (typeof entry === 'string') {
      return { name: entry, count: 0 }
    }
    const name = entry.name || entry.authority || ''
    const count = Number(entry.count) || 0
    return { name, count }
  }).filter(entry => entry.name)
}

const getAuthorityIndex = (authorities = []) => {
  const entries = normalizeAuthorityEntries(authorities)
  const countsById = new Map()

  entries.forEach(entry => {
    const record = resolveAuthorityRecord(entry.name)
    if (!record) return
    const id = record.id || record.name || entry.name
    countsById.set(id, (countsById.get(id) || 0) + entry.count)
  })

  const items = AUTHORITY_REGISTRY.map(record => {
    const id = record.id || record.name || ''
    const name = record.name || record.id || id
    const code = getDisplayCode(record)
    const logo = record.logo
    const logoAlt = record.logoAlt || (name ? `${name} logo` : '')

    return {
      id,
      name,
      code,
      label: formatAuthorityLabel(record),
      count: countsById.get(id) || 0,
      region: record.region,
      country: record.country,
      logo,
      logoAlt
    }
  })

  entries.forEach(entry => {
    if (resolveAuthorityRecord(entry.name)) return
    items.push({
      id: entry.name,
      name: entry.name,
      code: entry.name,
      label: entry.name,
      count: entry.count || 0
    })
  })

  return items.sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))
}

const getAcronymIndex = (authorities = []) => {
  const list = getAuthorityIndex(authorities)
  return list
    .filter(item => item.code && item.name && normalizeKey(item.code) !== normalizeKey(item.name))
    .sort((a, b) => a.code.localeCompare(b.code, 'en', { sensitivity: 'base' }))
}

module.exports = {
  AUTHORITY_REGISTRY,
  formatAuthorityLabel,
  getAcronymIndex,
  getAuthorityDisplayName,
  getAuthorityIndex,
  normalizeAuthorityName,
  resolveAuthorityRecord
}
