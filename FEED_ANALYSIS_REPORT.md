# UK Regulatory Feeds - Health Check & Analysis Report

**Date:** 2025-11-25
**Purpose:** Comprehensive analysis of existing feeds and recommendations for additional UK regulatory sources

---

## Executive Summary

**Current Status:**
- **28 active feeds** configured (1 disabled demo feed)
- **71.4% success rate** (20 working, 8 failed)
- **3 feed types:** RSS (17), Web Scraping (7), Puppeteer (4)
- **22 regulatory authorities** covered

**Key Issues:**
- 8 feeds failing due to 403 errors, rate limiting, or redirects
- Missing coverage from key UK regulators (PSR, Companies House, Takeover Panel)
- Some feeds redirected or deprecated

**Recommendations:**
- Fix 8 failing feeds (4 high priority)
- Add 12 new high-value UK regulatory sources
- Implement Companies House Streaming API integration

---

## Part 1: Current Feed Health Check Results

### ✅ Working Feeds (20/28 - 71.4%)

#### **RSS Feeds (14/17 working)**

| Authority | Feed Name | Priority | Status | Size | Notes |
|-----------|-----------|----------|--------|------|-------|
| **FCA** | FCA News RSS | High | ✅ Working | 41.86 KB | Primary UK financial regulator |
| **Bank of England** | BoE News RSS | High | ✅ Working | 25.86 KB | Monetary policy, banking news |
| **Bank of England** | Bank Overground | High | ✅ Working | 26.89 KB | BoE blog, research |
| **Bank of England** | Events | Medium | ✅ Working | 22.97 KB | Speeches, events |
| **Bank of England** | Explainers | Low | ✅ Working | 19.68 KB | Educational content |
| **PRA** | Prudential Regulation Publications | High | ✅ Working | 22.83 KB | Banking supervision |
| **Bank of England** | Publications | Medium | ✅ Working | 22.88 KB | General publications |
| **Bank of England** | Speeches | High | ✅ Working | 22.11 KB | Governor & deputy speeches |
| **Bank of England** | Statistics | Low | ✅ Working | 23.77 KB | Economic data |
| **ESMA** | All News | High | ✅ Working | 50.40 KB | EU securities regulator |
| **FSB** | Publications | High | ✅ Working | 12.64 KB | Global financial stability |
| **HMRC** | Updates RSS | Medium | ✅ Working | 11.73 KB | Tax & revenue updates |
| **HM Government** | Financial Services | Medium | ✅ Working | 12.19 KB | Gov.uk financial services |
| **OFSI** | Sanctions Implementation | High | ✅ Working | 12.27 KB | Financial sanctions |
| **HM Treasury** | Treasury News | High | ✅ Working | 12.71 KB | Policy, consultations |

#### **Web Scraping Feeds (5/7 working)**

| Authority | Feed Name | Priority | Status | Size | Notes |
|-----------|-----------|----------|--------|------|-------|
| **TPR** | Pensions Regulator Updates | Medium | ✅ Working | 90.97 KB | Pensions regulation |
| **CMA** | Competition & Markets News | Low | ✅ Working | 418.94 KB | Competition regulation |
| **ICO** | Data Protection News | Medium | ✅ Working | 35.80 KB | Privacy & data protection |
| **FOS** | Financial Ombudsman News | Medium | ✅ Working | 96.74 KB | Dispute resolution |

#### **Puppeteer Feeds (1/4 working)**

| Authority | Feed Name | Priority | Status | Size | Notes |
|-----------|-----------|----------|--------|------|-------|
| **LSE** | London Stock Exchange News | Medium | ✅ Working | 23.94 KB | Capital markets news |

---

### ❌ Failed Feeds (8/28 - 28.6%)

#### **High Priority Failures (4)**

| Feed | Authority | Type | Error | Reason | Impact |
|------|-----------|------|-------|--------|--------|
| **FATF News & Publications** | FATF | Puppeteer | 403 Forbidden | Bot protection / Cloudflare | Missing AML/CFT global standards |
| **Pay.UK Latest Updates** | Pay.UK | Puppeteer | 403 Forbidden | Bot protection | Missing UK payment systems updates |
| **JMLSG News** | JMLSG | Web Scraping | 403 Forbidden | Bot protection | Missing AML industry guidance |
| **NCA Economic Crime** | NCA | RSS | 403 Forbidden | RSS feed deprecated/protected | Missing law enforcement intelligence |

#### **Medium Priority Failures (3)**

| Feed | Authority | Type | Error | Reason | Impact |
|------|-----------|------|-------|--------|--------|
| **FSCS Latest News** | FSCS | RSS | 301 Redirect | Feed URL changed | Missing compensation scheme updates |
| **SFO Press Releases** | SFO | Web Scraping | 301 Redirect | Now on gov.uk | Missing fraud prosecution news |
| **FRC News** | FRC | Web Scraping | 301 Redirect | Relative redirect | Missing audit/accounting regulation |

#### **Low Priority Failures (1)**

| Feed | Authority | Type | Error | Reason | Impact |
|------|-----------|------|-------|--------|--------|
| **Aquis Exchange Announcements** | AQUIS | Puppeteer | 429 Rate Limit | Too many requests | Minor - niche exchange |

---

## Part 2: Missing UK Regulatory Sources

### Critical Gaps - Not Currently Covered

#### **1. Payment Systems Regulator (PSR)** 🔴 HIGH PRIORITY

**Status:** No RSS feed available
**Current Solution:** GovDelivery email subscriptions only
**Impact:** Missing critical payments regulation updates (APP fraud, interchange fees, scheme governance)

**Recommendation:**
- Implement web scraping for `https://www.psr.org.uk/news-and-updates/latest-news/`
- Subscribe to GovDelivery email service and parse emails
- **Note:** [PSR being consolidated into FCA in 2025](https://www.skadden.com/insights/publications/2025/03/uk-government-abolishes-payment-systems-regulator)

**Sectors:** Payments, Fintech, Consumer Protection, Fraud Prevention

---

#### **2. Companies House** 🔴 HIGH PRIORITY

**Status:** No RSS feed - Streaming API available
**Current Solution:** Companies House Streaming API
**Impact:** Missing real-time company filings, director changes, insolvencies

**Recommendation:**
Integrate [Companies House Streaming API](https://developer-specs.company-information.service.gov.uk/streaming-api/guides/overview)

**Available Streams:**
- Filings: `https://stream.companieshouse.gov.uk/filings`
- Companies: `https://stream.companieshouse.gov.uk/companies`
- Insolvency: `https://stream.companieshouse.gov.uk/insolvency-cases`
- Charges: `https://stream.companieshouse.gov.uk/charges`
- Officers: `https://stream.companieshouse.gov.uk/officers`
- PSC: `https://stream.companieshouse.gov.uk/persons-with-significant-control`
- Disqualified Officers: `https://stream.companieshouse.gov.uk/disqualified-officers`

**Authentication:** API key required (free)
**Sectors:** Corporate Governance, Insolvency, Compliance

---

#### **3. London Stock Exchange - RNS Feed** 🟡 MEDIUM PRIORITY

**Status:** Commercial service available
**Current Solution:** LSE Regulatory News Service (RNS)
**Impact:** Missing listed company regulatory announcements

**Recommendation:**
- Free access: LSE RNS website scraping `https://www.lse.co.uk/rns/`
- Paid access: [LSEG RNS Feed](https://www.lseg.com/en/capital-markets/regulatory-news-service)

**Coverage:** 70%+ of UK company news & results announcements
**Sectors:** Capital Markets, Listed Companies, Corporate Actions

---

#### **4. The Takeover Panel** 🟡 MEDIUM PRIORITY

**Status:** No RSS feed
**Current Solution:** Website announcements page
**Impact:** Missing M&A regulatory announcements, takeover rulings

**Recommendation:**
- Web scraping: `https://www.thetakeoverpanel.org.uk/disclosure/regulatory-information-services-riss`
- Monitor announcements page
- [Reference: RIS services](https://www.lse.co.uk/rns/)

**Sectors:** Capital Markets, M&A, Corporate Governance

---

#### **5. Advertising Standards Authority (ASA)** 🟢 LOW PRIORITY

**Status:** Not currently covered
**Type:** Self-regulatory organization (not financial regulator)
**Impact:** Financial services advertising rulings

**Recommendation:**
- Web scraping: `https://www.asa.org.uk/news.html`
- Filter for financial services ads

**Note:** ASA is advertising regulator, not financial regulator. Low priority for financial services focus.
**Sectors:** Consumer Protection, Marketing Compliance

---

### Additional Recommended Sources

#### **6. UK Finance (Trade Association)** 🟡 MEDIUM PRIORITY

**Status:** Not currently covered
**Solution:** RSS feed likely available
**URL:** `https://www.ukfinance.org.uk/news-and-insight`

**Value:** Industry perspective, data, responses to consultations
**Sectors:** Banking, Payments, Trade Association

---

#### **7. Financial Reporting Council (FRC) - Fixed** 🟡 MEDIUM PRIORITY

**Current Status:** ❌ Failing (301 redirect)
**Fix Required:** Update URL to absolute path

**Recommendation:**
```javascript
{
  name: 'FRC News',
  authority: 'FRC',
  url: 'https://www.frc.org.uk/news-and-events/news/',  // Add trailing slash
  type: 'web_scraping'
}
```

---

#### **8. IOSCO (International Organization of Securities Commissions)** 🟢 LOW PRIORITY

**Status:** Not currently covered
**Solution:** RSS feed available
**URL:** `https://www.iosco.org/rss/` (probable)

**Value:** International securities regulation standards
**Context:** [IOSCO published crypto/digital asset recommendations (2025)](https://finreg.aoshearman.com/)
**Sectors:** Capital Markets, International Standards

---

#### **9. UK Statistics Authority** 🟢 LOW PRIORITY

**Status:** Not currently covered
**Solution:** Gov.uk Atom feed
**URL:** `https://www.gov.uk/government/organisations/uk-statistics-authority.atom`

**Value:** Economic statistics, regulatory data quality
**Sectors:** Statistics, Economic Data

---

#### **10. Department for Business and Trade** 🟢 LOW PRIORITY

**Status:** Not currently covered
**Solution:** Gov.uk Atom feed
**URL:** `https://www.gov.uk/government/organisations/department-for-business-and-trade.atom`

**Value:** Business policy, trade regulations
**Sectors:** Policy, Trade, Business Regulation

---

#### **11. ARGA (Audit, Reporting and Governance Authority)** ⏸️ FUTURE

**Status:** Not yet established
**Timeline:** [Delayed - no current timetable](https://www.complianceweek.com/regulatory-policy/uk-delays-audit-reforms-even-as-regulator-piles-on-financial-pressure/36209.article)
**When Available:** Will replace FRC

**Note:** Monitor for establishment. 66 MPs called for reforms in September 2025.
**Sectors:** Audit, Corporate Governance, Accounting

---

#### **12. Financial Ombudsman Service - Decisions Feed** 🟡 MEDIUM PRIORITY

**Current Status:** Commented out (404 error)
**Alternative:** Web scraping decisions database

**Recommendation:**
```javascript
{
  name: 'FOS Case Decisions',
  authority: 'FOS',
  url: 'https://www.financial-ombudsman.org.uk/decisions',
  type: 'web_scraping',
  description: 'Published case decisions and rulings'
}
```

**Value:** Case law, precedents, industry trends
**Sectors:** Consumer Protection, Dispute Resolution

---

## Part 3: Feed Analysis by Category

### By Authority (Top 10)

| Authority | Feed Count | All Working? | Priority |
|-----------|------------|--------------|----------|
| Bank of England | 7 | ✅ Yes | High |
| FCA | 1 | ✅ Yes | High |
| PRA | 1 | ✅ Yes | High |
| HM Treasury | 1 | ✅ Yes | High |
| ESMA | 1 | ✅ Yes | High |
| FSB | 1 | ✅ Yes | High |
| HMRC | 1 | ✅ Yes | Medium |
| OFSI | 1 | ✅ Yes | High |
| ICO | 1 | ✅ Yes | Medium |
| FOS | 1 | ✅ Yes | Medium |

### By Feed Type

| Type | Total | Working | Failed | Success Rate |
|------|-------|---------|--------|--------------|
| RSS | 17 | 14 | 3 | 82.4% |
| Web Scraping | 7 | 5 | 2 | 71.4% |
| Puppeteer | 4 | 1 | 3 | 25.0% |

**Analysis:** Puppeteer feeds have lowest success rate (25%) due to bot protection. Consider switching to API integrations where available.

### By Sector Coverage

| Sector | Feed Count | Notes |
|--------|------------|-------|
| Banking | 15 | Well covered |
| Capital Markets | 8 | Good coverage |
| AML & Financial Crime | 6 | Some failures (FATF, JMLSG, NCA) |
| Payments | 3 | Missing PSR |
| Policy | 7 | Good coverage |
| Consumer Protection | 5 | Good coverage |
| Insurance | 4 | Adequate coverage |
| Pensions | 1 | Limited to TPR |
| Data Protection | 1 | ICO only |
| Competition | 1 | CMA only |

---

## Part 4: Immediate Action Plan

### Priority 1: Fix Failing High-Priority Feeds (Week 1)

#### 1. **FSCS Feed** - Simple URL update
```javascript
// BEFORE
url: 'https://www.fscs.org.uk/about-fscs/latest-news/feed/'

// AFTER - Check their news page for updated RSS link
url: 'https://www.fscs.org.uk/about-us/news/feed/' // Or similar
```

#### 2. **SFO Feed** - Update to gov.uk
```javascript
{
  name: 'SFO Press Releases',
  authority: 'Serious Fraud Office',
  url: 'https://www.gov.uk/government/organisations/serious-fraud-office.atom',
  type: 'rss',
  description: 'Serious Fraud Office - Press Releases and News'
}
```

#### 3. **FRC Feed** - Fix redirect
```javascript
// Add trailing slash or use absolute URL
url: 'https://www.frc.org.uk/news-and-events/news/'
```

#### 4. **Pay.UK** - Switch to different method
**Options:**
- a) Implement Puppeteer with proper headers/user agent
- b) Switch to API if available
- c) GovDelivery email subscription parsing

#### 5. **FATF, JMLSG, NCA** - Implement Puppeteer with anti-bot measures
**Requirements:**
- Proper user agent rotation
- Request rate limiting
- Cookie handling
- Consider proxy rotation if needed

---

### Priority 2: Add Missing High-Value Sources (Week 2-3)

#### Week 2
1. **PSR News** - Web scraping implementation
2. **Companies House** - Streaming API integration (requires development)
3. **UK Finance** - Add RSS feed

#### Week 3
4. **FOS Decisions** - Web scraping implementation
5. **LSE RNS** - Web scraping free tier
6. **IOSCO** - Add RSS feed if available

---

### Priority 3: Monitoring & Maintenance (Ongoing)

1. **Daily Health Checks**
   - Run `node test-all-feeds.js` daily
   - Alert on failures
   - Track success rates

2. **Weekly Review**
   - Review new authorities/sources
   - Check for deprecated feeds
   - Update selectors for web scraping

3. **Monthly Audit**
   - Comprehensive feed analysis
   - Coverage gap analysis
   - User feedback incorporation

---

## Part 5: Technical Recommendations

### A. Feed Reliability Improvements

1. **Implement Feed Health Dashboard**
   - Real-time status monitoring
   - Historical uptime tracking
   - Alert notifications

2. **Retry Logic**
   - Exponential backoff for failed requests
   - Fallback to alternative sources
   - Cache last successful fetch

3. **Anti-Bot Protection Handling**
   - Implement proper user agents
   - Request rate limiting (respect robots.txt)
   - Consider headless browser pool for Puppeteer feeds

### B. New Feed Type: Streaming API

For Companies House and similar sources:

```javascript
{
  name: 'Companies House Filings',
  authority: 'Companies House',
  type: 'streaming_api',
  url: 'https://stream.companieshouse.gov.uk/filings',
  auth: {
    type: 'api_key',
    key: process.env.COMPANIES_HOUSE_API_KEY
  },
  priority: 'high'
}
```

**Implementation needed:**
- New streaming API handler
- WebSocket/long-polling support
- Event buffering and processing

### C. Data Quality Monitoring

1. **Content Validation**
   - Verify RSS/XML structure
   - Check for empty feeds
   - Validate date formats

2. **Duplicate Detection**
   - Cross-feed deduplication
   - URL fingerprinting
   - Content hashing

3. **Relevance Filtering**
   - Keyword detection
   - Sector tagging
   - Priority scoring

---

## Part 6: Cost-Benefit Analysis

### Free Sources (Recommended)

| Source | Implementation Effort | Value | ROI |
|--------|----------------------|-------|-----|
| PSR Web Scraping | Medium | High | ⭐⭐⭐⭐⭐ |
| SFO gov.uk RSS | Low | Medium | ⭐⭐⭐⭐⭐ |
| FSCS Fix | Low | High | ⭐⭐⭐⭐⭐ |
| FRC Fix | Low | Medium | ⭐⭐⭐⭐ |
| Companies House API | High | Very High | ⭐⭐⭐⭐ |
| FOS Decisions | Medium | Medium | ⭐⭐⭐ |
| UK Finance RSS | Low | Medium | ⭐⭐⭐⭐ |

### Paid Sources (Optional)

| Source | Cost | Value | Recommended? |
|--------|------|-------|--------------|
| LSE RNS Premium | £££ | High | ❌ Not yet - use free tier |
| Bloomberg Regulatory | £££££ | Very High | ❌ Too expensive |
| Reuters Regulatory | £££££ | Very High | ❌ Too expensive |

---

## Summary & Next Steps

### Current State
- ✅ 71.4% of feeds working
- ❌ Missing critical sources (PSR, Companies House)
- ⚠️ 8 feeds need fixing

### Recommended Timeline

**Week 1: Quick Wins**
- Fix 3 simple redirects (FSCS, SFO, FRC)
- Update feed health monitoring
- Document all feed issues

**Week 2-3: High-Value Additions**
- Add PSR web scraping
- Implement UK Finance RSS
- Fix Pay.UK with Puppeteer improvements

**Week 4: Strategic Integration**
- Begin Companies House Streaming API integration
- Add FOS Decisions scraping
- Implement LSE RNS free tier

**Ongoing:**
- Daily health checks
- Weekly feed review
- Monthly coverage analysis

### Success Metrics

**Target Goals (3 months):**
- 🎯 95% feed success rate
- 🎯 35+ active feeds
- 🎯 25+ regulatory authorities covered
- 🎯 Companies House integration complete
- 🎯 <5 minute average feed latency

---

## Appendices

### Appendix A: Failed Feed Details

Full error logs available in test output. Common failure patterns:

1. **403 Forbidden** (5 feeds)
   - FATF, Pay.UK, JMLSG, NCA
   - Cause: Bot protection (Cloudflare, custom WAF)
   - Solution: Puppeteer with anti-bot measures

2. **301 Redirects** (3 feeds)
   - FSCS, SFO, FRC
   - Cause: URLs changed/moved
   - Solution: Update to new URLs

3. **429 Rate Limit** (1 feed)
   - Aquis Exchange
   - Cause: Too many requests
   - Solution: Implement rate limiting

### Appendix B: Regulatory Landscape 2025

**Major Changes:**
- PSR consolidation into FCA (announced March 2025)
- [ARGA creation delayed](https://www.complianceweek.com/regulatory-policy/uk-delays-audit-reforms-even-as-regulator-piles-on-financial-pressure/36209.article) (no timeline)
- [10-year Financial Services Growth Strategy](https://www.hsfkramer.com/notes/fsrandcorpcrime/2025-posts/the-uk-governments-10-year-strategy-for-financial-services-rewiring-the-financial-regulatory-system) announced July 2025

**Impact on Feeds:**
- Monitor PSR→FCA transition (may affect feed URLs)
- Watch for ARGA establishment (will replace FRC)
- New FCA competitiveness mandate may increase publications

### Appendix C: Testing Script

Run comprehensive health check:
```bash
node test-all-feeds.js
```

Output includes:
- Feed-by-feed status
- Success/failure breakdown
- Error details
- Performance metrics

---

**Report End**

---

## Sources

- [UK Government Abolishes Payment Systems Regulator](https://www.skadden.com/insights/publications/2025/03/uk-government-abolishes-payment-systems-regulator)
- [Companies House Streaming API Documentation](https://developer-specs.company-information.service.gov.uk/streaming-api/guides/overview)
- [LSE Regulatory News Service](https://www.lseg.com/en/capital-markets/regulatory-news-service)
- [UK Delays Audit Reforms - ARGA Timeline](https://www.complianceweek.com/regulatory-policy/uk-delays-audit-reforms-even-as-regulator-piles-on-financial-pressure/36209.article)
- [UK 10-Year Financial Services Strategy](https://www.hsfkramer.com/notes/fsrandcorpcrime/2025-posts/the-uk-governments-10-year-strategy-for-financial-services-rewiring-the-financial-regulatory-system)
- [FCA and PRA 2025 Strategy Documents](https://www.skadden.com/insights/publications/2025/04/uk-financial-regulation-update)
- [The Takeover Panel RIS Services](https://www.thetakeoverpanel.org.uk/disclosure/regulatory-information-services-riss)
