const BASE_URL = 'https://www.fca.org.uk'

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const DEFAULT_REQUEST_DELAY = 2000

const BREACH_TYPE_ENTRIES = [
  ['market abuse', 'MARKET_ABUSE'],
  ['insider dealing', 'INSIDER_DEALING'],
  ['money laundering', 'AML_FAILURES'],
  ['aml', 'AML_FAILURES'],
  ['anti-money laundering', 'AML_FAILURES'],
  ['systems and controls', 'SYSTEMS_CONTROLS'],
  ['client money', 'CLIENT_MONEY'],
  ['conduct', 'CONDUCT_RISK'],
  ['treating customers fairly', 'TREATING_CUSTOMERS'],
  ['tcf', 'TREATING_CUSTOMERS'],
  ['prudential', 'PRUDENTIAL'],
  ['reporting', 'REPORTING'],
  ['governance', 'GOVERNANCE'],
  ['misleading', 'MISLEADING_STATEMENTS'],
  ['market making', 'MARKET_MAKING']
]

module.exports = {
  BASE_URL,
  DEFAULT_USER_AGENT,
  DEFAULT_REQUEST_DELAY,
  BREACH_TYPE_ENTRIES
}
