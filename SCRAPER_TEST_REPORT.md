# Puppeteer Scraper Testing Report
**Date:** 2026-01-04
**Test Environment:** /Users/adeomosanya/Documents/horizon-scanner-backend
**Database:** PostgreSQL (Neon.tech)

---

## Executive Summary

Tested 4 Puppeteer scrapers that were recently fixed. Results show:
- **2 scrapers need fixes** (FSCA, FIC_SA)
- **1 scraper blocked by bot protection** (CNBV)
- **1 scraper working** (EU_COUNCIL)

Additionally, identified **146 database entries** from the last 24 hours that need AI summaries.

---

## Detailed Test Results

### 1. FSCA (South Africa) - NEEDS FIX

**Status:** FAILING
**Items Extracted:** 0
**URL:** https://www.fsca.co.za/Latest-News/

#### Issues Identified:
1. **Page uses accordion/collapsible sections** for different years (2025, 2024, 2023, 2022)
2. **No traditional `<a>` links** - Uses table rows with `onclick` attributes
3. **Press releases are PDFs** accessed via API endpoints like:
   ```
   /_api/cr3ad_newses(d90decff-badb-f011-8544-000d3ab44730)/cr3ad_document/$value
   ```
4. **Data structure:** Table rows with `data-name` attributes containing press release titles

#### Example Data Found (when manually expanded):
- "FSCA Press Release - FSCA clarifies position on KwaZulu-Natal CoGTA Pension Fund for Amakhosi 7 October 2025"
- "FSCA Press Release - FSCA debars and imposes an administrative penalty on Mr Luan Krige"
- "FSCA Press Release - FSCA imposes R1.7 million administrative penalty on Harith General Partners (Pty) Ltd (FSP 43795)_21 October 2025"

#### Required Fix:
- Scraper needs to:
  1. Click accordion buttons to expand year sections
  2. Extract data from `<tr>` elements with `data-name` attributes
  3. Parse the onclick URL to get document ID
  4. Construct proper download URLs
  5. Extract dates from press release titles (format: "DD Month YYYY")

---

### 2. FIC_SA (South Africa) - NEEDS FIX

**Status:** PARTIAL - Extracting 12 items but POOR QUALITY
**Items Extracted:** 12
**URL:** https://www.fic.gov.za/newsroom/

#### Issues Identified:
1. **Capturing navigation links instead of news articles**
2. Examples of bad data extracted:
   - "General notices" → https://www.fic.gov.za/newsroom/#uc_uc_bullet_tabs_elementor_18f4d07_item2 (navigation)
   - "Submit media query" → https://www.fic.gov.za/newsroom/#elementor-action... (popup link)
3. Only 1 out of 12 items appears to be actual news:
   - "Crime does not take a holiday: Avoid being scammed this festive season" → https://www.fic.gov.za/2025/12/02/holiday-scams/

#### Data Quality Issues:
- Headlines: Mostly navigation text
- URLs: Many contain `#` fragments (hash links to page sections)
- Dates: All `undefined`

#### Required Fix:
- Update selectors to:
  1. Skip hash links (`href.includes('#')`)
  2. Filter out navigation patterns ("General notices", "Submit", etc.)
  3. Target actual blog post structure (WordPress)
  4. Look for date elements in posts

---

### 3. CNBV (Mexico) - BLOCKED

**Status:** FAILING - Bot Protection
**Items Extracted:** 0
**URL:** https://www.gob.mx/cnbv/prensa

#### Issues Identified:
1. **Access Denied error:** "You don't have permission to access 'http://www.gob.mx/cnbv/prensa' on this server."
2. **Error Reference:** #18.8e1e1202.1767567500.4ddfffe9
3. **Bot protection detected** despite using Puppeteer Stealth plugin

#### Possible Solutions:
- Try different user agents
- Add more human-like behavior (mouse movements, scrolling)
- Use residential proxies
- Consider alternative data sources (RSS feeds, API)
- Manual monitoring may be required

---

### 4. EU_COUNCIL - WORKING (with minor issues)

**Status:** WORKING
**Items Extracted:** 20
**URL:** https://www.consilium.europa.eu/en/press/press-releases/

#### Sample Headlines Extracted:
1. "Iran: Statement by the High Representative on behalf of the EU on the arrest and detention of human rights defenders"
   - URL: https://www.consilium.europa.eu/en/press/press-releases/2025/12/30/iran-statement-by-the-high-representative-on-behalf-of-the-eu-on-the-arrest-and-detention-of-human-rights-defenders/

2. "Weekly schedule of President António Costa"
   - URL: https://www.consilium.europa.eu/en/press/press-releases/2025/12/30/weekly-schedule-of-president-antonio-costa/

3. "Human rights violations in Russia: EU imposes sanctions on two additional individuals"
   - URL: https://www.consilium.europa.eu/en/press/press-releases/2025/12/22/human-rights-violations-in-russia-eu-imposes-sanctions-on-two-additional-individuals/

#### Data Quality:
- ✓ Headlines are REAL news articles
- ✓ URLs point to actual press releases
- ✗ Dates are `undefined` (date extraction needs improvement)
- ⚠ Some headlines include metadata text from the page (e.g., "22:55", "Council of the EU")

#### Recommended Improvements:
- Clean up headline text to remove timestamps and source labels
- Fix date extraction from `<time>` elements

---

## Database Summary Analysis

### Entries Needing AI Summaries (Last 24 Hours)

| Authority | Entries Without Summary |
|-----------|------------------------|
| FSCS | 25 |
| SEBI | 20 |
| CONSOB | 20 |
| EU_COUNCIL | 20 |
| FSCA | 20 |
| CFTC | 20 |
| CBN | 10 |
| BCBS | 10 |
| CBE | 1 |
| **TOTAL** | **146** |

### All Entries (Last 24 Hours)

| Authority | Total | With Summary | Without Summary |
|-----------|-------|--------------|-----------------|
| FCA | 83 | 83 | 0 |
| FSCS | 25 | 0 | 25 |
| SEBI | 20 | 0 | 20 |
| CFTC | 20 | 0 | 20 |
| CONSOB | 20 | 0 | 20 |
| EU_COUNCIL | 20 | 0 | 20 |
| FSCA | 20 | 0 | 20 |
| JPMorgan | 15 | 15 | 0 |
| CBN | 10 | 0 | 10 |
| BCBS | 10 | 0 | 10 |
| Barclays | 8 | 8 | 0 |
| BofA | 7 | 7 | 0 |
| HSBC | 7 | 7 | 0 |
| JMLSG | 3 | 3 | 0 |
| CBE | 1 | 0 | 1 |
| EEAS | 1 | 1 | 0 |

### Key Observations:
1. **FCA scraper** is working perfectly - all 83 entries have AI summaries
2. **Bank scrapers** (JPMorgan, Barclays, BofA, HSBC) are working - all have summaries
3. **International scrapers** are saving data but **AI summary generation is failing**
4. **146 entries** need AI summaries generated

---

## Recommendations

### Immediate Actions:

1. **Fix FSCA Scraper**
   - Update selectors to handle accordion/table structure
   - Extract data from `data-name` attributes
   - Parse dates from title text

2. **Fix FIC_SA Scraper**
   - Add hash link filtering
   - Improve navigation link detection
   - Find proper WordPress post selectors

3. **Improve EU_COUNCIL Scraper**
   - Clean headline text
   - Fix date extraction

4. **CNBV - Consider Alternatives**
   - Bot protection makes automated scraping difficult
   - May require manual monitoring or alternative approach

5. **Fix AI Summary Generation**
   - Investigate why 146 international entries don't have summaries
   - Check AI service integration for international scrapers
   - Verify summary generation is called after scraping

### Testing Checklist for Next Iteration:

- [ ] FSCA extracts >10 items with real headlines
- [ ] FSCA URLs are valid (not hash links)
- [ ] FIC_SA filters out navigation links
- [ ] FIC_SA extracts dates
- [ ] EU_COUNCIL cleans headline text
- [ ] EU_COUNCIL extracts dates
- [ ] All scrapers trigger AI summary generation
- [ ] No navigation/utility links in results

---

## Technical Details

### Test Files Created:
- `/Users/adeomosanya/Documents/horizon-scanner-backend/test-scrapers.js`
- `/Users/adeomosanya/Documents/horizon-scanner-backend/inspect-pages.js`
- `/Users/adeomosanya/Documents/horizon-scanner-backend/inspect-fsca-detailed.js`
- `/Users/adeomosanya/Documents/horizon-scanner-backend/inspect-fsca-accordion.js`
- `/Users/adeomosanya/Documents/horizon-scanner-backend/inspect-fic.js`
- `/Users/adeomosanya/Documents/horizon-scanner-backend/check-db-summaries.js`

### Screenshots Generated:
- `/tmp/fsca-page.png` - Shows accordion structure
- `/tmp/cnbv-page.png` - Shows "Access Denied" error

---

## Conclusion

**Working:** 1/4 scrapers (25%)
**Needs Fix:** 2/4 scrapers (50%)
**Blocked:** 1/4 scrapers (25%)

The fixes applied improved the scrapers, but additional work is needed to handle:
1. Non-standard page structures (accordions, tables)
2. Navigation link filtering
3. Date extraction
4. Bot protection
5. AI summary generation integration

**Priority:** Fix AI summary generation first, as 146 entries are waiting for summaries. Then fix FSCA and FIC_SA scrapers.
