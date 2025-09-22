// FCA Fines Scraper Service
// Enhanced Horizon Scanner - Enforcement Data Module

const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { Pool } = require('pg');

class FCAFinesScraper {
    constructor(dbConfig) {
        this.db = new Pool(dbConfig);
        this.baseUrl = 'https://www.fca.org.uk';
        this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.requestDelay = 2000; // 2 seconds between requests
        this.maxRetries = 3;

        // Standard breach type mappings
        this.breachTypeMap = new Map([
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
        ]);
    }

    async initializeDatabase() {
        try {
            console.log('🗄️ Initializing FCA fines database schema...');

            // Check if the main table already exists
            const existsResult = await this.db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'fca_fines'
                )
            `);

            if (existsResult.rows[0].exists) {
                console.log('✅ FCA fines database schema already exists');
                return;
            }

            const fs = require('fs');
            const path = require('path');

            const schemaPath = path.join(__dirname, '../../sql/fca_fines_schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                await this.db.query(schema);
                console.log('✅ FCA fines database schema initialized successfully');
            } else {
                console.log('⚠️ Schema file not found, skipping database initialization');
            }
        } catch (error) {
            console.error('❌ Error initializing database:', error);
            throw error;
        }
    }

    async startScraping(options = {}) {
        const {
            startYear = 2013,
            endYear = new Date().getFullYear(),
            useHeadless = true,
            forceScrape = false
        } = options;

        console.log(`🕷️ Starting FCA fines scraping from ${startYear} to ${endYear}...`);

        // Start scraping log
        const scrapeLogId = await this.startScrapingLog();

        let totalFines = 0;
        let newFines = 0;
        let errors = [];

        try {
            for (let year = startYear; year <= endYear; year++) {
                console.log(`📅 Scraping year ${year}...`);

                try {
                    const yearResults = await this.scrapeYear(year, useHeadless, forceScrape);
                    totalFines += yearResults.total;
                    newFines += yearResults.new;

                    console.log(`✅ Year ${year} completed: ${yearResults.total} fines found, ${yearResults.new} new`);
                } catch (error) {
                    console.error(`❌ Error scraping year ${year}:`, error.message);
                    errors.push({ year, error: error.message });
                }

                // Rate limiting between years
                if (year < endYear) {
                    await this.delay(this.requestDelay);
                }
            }

            await this.completeScrapingLog(scrapeLogId, {
                status: 'completed',
                totalFines,
                newFines,
                errors: errors.length > 0 ? JSON.stringify(errors) : null
            });

            console.log(`🎉 FCA fines scraping completed!`);
            console.log(`   📊 Total fines processed: ${totalFines}`);
            console.log(`   🆕 New fines added: ${newFines}`);
            if (errors.length > 0) {
                console.log(`   ⚠️ Errors encountered: ${errors.length}`);
            }

            return {
                success: true,
                totalFines,
                newFines,
                errors
            };

        } catch (error) {
            await this.completeScrapingLog(scrapeLogId, {
                status: 'failed',
                errors: error.message
            });
            throw error;
        }
    }

    async scrapeStructuredFinesPage(year, useHeadless = true) {
        let browser;
        const fines = [];

        try {
            console.log(`   📋 Trying structured fines page for ${year}...`);

            browser = await puppeteer.launch({
                headless: useHeadless,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // FCA uses this URL pattern for annual fines pages
            const url = `https://www.fca.org.uk/news/news-stories/${year}-fines`;

            console.log(`   🔍 Accessing: ${url}`);

            const response = await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            if (!response || response.status() !== 200) {
                console.log(`   ⚠️ Page not found or error for ${year}`);
                return { fines: [] };
            }

            // Extract fines from the table
            const tableData = await page.evaluate(() => {
                const results = [];

                // Find the main content table with fines data
                const tables = document.querySelectorAll('table');

                for (const table of tables) {
                    const rows = table.querySelectorAll('tr');

                    // Skip if less than 2 rows (header + data)
                    if (rows.length < 2) continue;

                    // Check if this looks like a fines table by examining headers
                    const headerRow = rows[0];
                    const headerText = headerRow.textContent.toLowerCase();

                    if (headerText.includes('firm') && (headerText.includes('amount') || headerText.includes('fine'))) {
                        console.log('Found fines table');

                        // Process data rows (skip header)
                        for (let i = 1; i < rows.length; i++) {
                            const row = rows[i];
                            const cells = row.querySelectorAll('td, th');

                            if (cells.length >= 3) {
                                const firmCell = cells[0];
                                const dateCell = cells[1];
                                const amountCell = cells[2];
                                const reasonCell = cells[3] || { textContent: '' };

                                const firm = firmCell.textContent?.trim();
                                const dateText = dateCell.textContent?.trim();
                                const amountText = amountCell.textContent?.trim();
                                const reason = reasonCell.textContent?.trim();

                                // Extract links if present
                                const linkEl = firmCell.querySelector('a') || row.querySelector('a');
                                const url = linkEl ? linkEl.href : '';

                                if (firm && amountText && amountText.match(/£|[0-9]/)) {
                                    results.push({
                                        firm,
                                        dateText,
                                        amountText,
                                        reason,
                                        url,
                                        source: 'structured_table'
                                    });
                                }
                            }
                        }
                        break; // Found the main table, stop looking
                    }
                }

                return results;
            });

            console.log(`   📊 Extracted ${tableData.length} entries from table`);

            // Process each entry
            for (const entry of tableData) {
                try {
                    const fine = {
                        fine_reference: `FCA-${year}-${String(fines.length + 1).padStart(3, '0')}`,
                        firm_individual: entry.firm,
                        amount: this.parseAmount(entry.amountText),
                        amount_text: entry.amountText,
                        date_issued: this.parseDate(entry.dateText, year),
                        summary: entry.reason || `Enforcement action against ${entry.firm}`,
                        final_notice_url: entry.url || `https://www.fca.org.uk/news/news-stories/${year}-fines`,
                        source_url: `https://www.fca.org.uk/news/news-stories/${year}-fines`,
                        year_issued: year,
                        month_issued: this.parseDate(entry.dateText, year) ? new Date(this.parseDate(entry.dateText, year)).getMonth() + 1 : 1,
                        quarter_issued: this.parseDate(entry.dateText, year) ? Math.ceil((new Date(this.parseDate(entry.dateText, year)).getMonth() + 1) / 3) : 1,
                        processing_status: 'completed',
                        breach_categories: this.extractBreachCategories(entry.reason),
                        affected_sectors: this.extractSectors(entry.firm),
                        customer_impact_level: this.assessImpactLevel(entry.amountText),
                        risk_score: this.calculateRiskScore(entry.amountText, entry.reason),
                        scraped_content: JSON.stringify(entry)
                    };

                    fines.push(fine);
                } catch (error) {
                    console.error(`   ⚠️ Error processing entry:`, error.message);
                }
            }

            await browser.close();
            browser = null;

            return { fines };

        } catch (error) {
            console.error(`   ❌ Error scraping structured page for ${year}:`, error.message);
            if (browser) {
                await browser.close();
            }
            return { fines: [] };
        }
    }

    async scrapeYear(year, useHeadless = true, forceScrape = false) {
        let browser;
        let totalFines = 0;
        let newFines = 0;

        try {
            // Try structured fines pages first (more reliable)
            console.log(`   📋 Attempting structured scraping for ${year}...`);
            const structuredFines = await this.scrapeStructuredFinesPage(year, useHeadless);

            if (structuredFines && structuredFines.length > 0) {
                console.log(`   📋 Found ${structuredFines.length} fines via structured page for ${year}`);
                totalFines = structuredFines.length;

                // Save each fine from structured scraping
                for (const fine of structuredFines) {
                    const saved = await this.saveFine(fine, forceScrape);
                    if (saved.isNew) newFines++;
                }

                return { totalFines, newFines };
            }

            // Fallback to RSS/news feeds approach
            console.log(`   📰 Structured scraping found no results, trying news feeds for ${year}...`);
            const newsResults = await this.scrapeNewsFeeds(year);
            if (newsResults && newsResults.fines && newsResults.fines.length > 0) {
                console.log(`   📰 Found ${newsResults.fines.length} fines via news feeds for ${year}`);

                for (const fine of newsResults.fines) {
                    const saved = await this.saveFine(fine, forceScrape);
                    totalFines++;
                    if (saved.isNew) newFines++;
                }

                return { totalFines, newFines };
            }

            // Fallback to Puppeteer scraping
            console.log(`   🤖 Using Puppeteer for year ${year}...`);
            browser = await puppeteer.launch({
                headless: useHeadless ? 'new' : false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            const page = await browser.newPage();
            await page.setUserAgent(this.userAgent);

            // Set viewport and timeout
            await page.setViewport({ width: 1920, height: 1080 });
            page.setDefaultTimeout(30000);

            const searchUrls = [
                `${this.baseUrl}/news?search=fine+${year}&type=news`,
                `${this.baseUrl}/news?search=enforcement+${year}&type=news`,
                `${this.baseUrl}/news?search=penalty+${year}&type=news`
            ];

            for (const url of searchUrls) {
                try {
                    console.log(`   🔍 Searching: ${url}`);
                    await page.goto(url, { waitUntil: 'networkidle0' });

                    const fines = await this.extractFinesFromPage(page, year);

                    for (const fine of fines) {
                        const saved = await this.saveFine(fine, forceScrape);
                        totalFines++;
                        if (saved.isNew) newFines++;
                    }

                    await this.delay(this.requestDelay);
                } catch (error) {
                    console.error(`   ⚠️ Error processing URL ${url}:`, error.message);
                }
            }

        } finally {
            if (browser) {
                await browser.close();
            }
        }

        return { total: totalFines, new: newFines };
    }

    async scrapeNewsFeeds(year) {
        const fines = [];

        try {
            // Try FCA news RSS feed first
            const rssUrl = `${this.baseUrl}/news/rss`;
            const response = await axios.get(rssUrl, {
                headers: { 'User-Agent': this.userAgent },
                timeout: 10000
            });

            const $ = cheerio.load(response.data, { xmlMode: true });

            $('item').each((i, item) => {
                const $item = $(item);
                const title = $item.find('title').text();
                const pubDate = new Date($item.find('pubDate').text());
                const link = $item.find('link').text();
                const description = $item.find('description').text();

                // Check if this is a fine-related article from the target year
                if (pubDate.getFullYear() === year && this.isFineRelated(title, description)) {
                    fines.push({
                        title,
                        url: link,
                        date: pubDate,
                        description,
                        source: 'rss'
                    });
                }
            });

        } catch (error) {
            console.log(`   ⚠️ RSS feed scraping failed for ${year}: ${error.message}`);
        }

        return { fines };
    }

    async extractFinesFromPage(page, year) {
        const fines = [];

        try {
            // Wait for search results to load
            await page.waitForSelector('.search-results, .news-list, .content', { timeout: 10000 });

            const articles = await page.evaluate((targetYear) => {
                const results = [];

                // Define fine-related check function inside page.evaluate context
                function isFineRelated(title, description = '') {
                    const text = (title + ' ' + description).toLowerCase();
                    const fineKeywords = [
                        'fine', 'fined', 'penalty', 'penalised', 'penalized',
                        'enforcement', 'breach', 'violation', 'sanctions',
                        'disciplinary', 'misconduct', 'censure', 'action against'
                    ];
                    return fineKeywords.some(keyword => text.includes(keyword));
                }

                // Look for different possible selectors
                const selectors = [
                    '.search-result',
                    '.news-item',
                    '.article-item',
                    '.content-item',
                    'article'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);

                    elements.forEach(element => {
                        const titleEl = element.querySelector('h2, h3, h4, .title, .headline');
                        const linkEl = element.querySelector('a');
                        const dateEl = element.querySelector('.date, .published, time');
                        const summaryEl = element.querySelector('.summary, .excerpt, p');

                        if (titleEl && linkEl) {
                            const title = titleEl.textContent.trim();
                            const url = linkEl.href;
                            const dateText = dateEl ? dateEl.textContent.trim() : '';
                            const summary = summaryEl ? summaryEl.textContent.trim() : '';

                            // Check if this looks like a fine announcement
                            if (isFineRelated(title, summary)) {
                                results.push({
                                    title,
                                    url,
                                    dateText,
                                    summary
                                });
                            }
                        }
                    });

                    if (results.length > 0) break; // Found results with this selector
                }

                return results;
            }, year);

            // Process each article
            for (const article of articles) {
                try {
                    const fine = await this.extractFineDetails(page, article, year);
                    if (fine) {
                        fines.push(fine);
                    }
                } catch (error) {
                    console.error(`   ⚠️ Error extracting fine details:`, error.message);
                }
            }

        } catch (error) {
            console.error(`   ⚠️ Error extracting fines from page:`, error.message);
        }

        return fines;
    }

    async extractFineDetails(page, article, year) {
        try {
            // Navigate to the individual article
            await page.goto(article.url, { waitUntil: 'networkidle0' });
            await this.delay(1000);

            const details = await page.evaluate(() => {
                const content = document.querySelector('.content, .article-content, main, .news-content');
                if (!content) return null;

                const text = content.textContent || '';
                const html = content.innerHTML || '';

                // Extract fine amount using regex
                const amountRegex = /(?:fine|penalty|paid?)\s*(?:of)?\s*£([\d,]+(?:\.\d{2})?)\s*(?:million|m)?/gi;
                const amounts = [];
                let match;

                while ((match = amountRegex.exec(text)) !== null) {
                    amounts.push(match[1]);
                }

                // Extract firm/individual name
                const firmRegex = /(?:firm|company|individual|person)\s+([A-Z][A-Za-z\s&.,-]+?)(?:\s+(?:has|was|is|will|must))/gi;
                const firmMatch = firmRegex.exec(text);
                const firmName = firmMatch ? firmMatch[1].trim() : null;

                // Extract date
                const dateRegex = /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi;
                const dateMatch = dateRegex.exec(text);

                return {
                    fullText: text,
                    amounts,
                    firmName,
                    dateText: dateMatch ? dateMatch[1] : null,
                    html
                };
            });

            if (!details || details.amounts.length === 0) {
                return null;
            }

            // Process the extracted data
            const amount = this.parseAmount(details.amounts[0]);
            const date = this.parseDate(details.dateText, year);
            const breachType = this.extractBreachType(details.fullText);
            const firmCategory = this.categorizeFirm(details.firmName, details.fullText);

            return {
                fine_reference: this.generateFineReference(details.firmName, date, amount),
                date_issued: date,
                firm_individual: details.firmName || 'Unknown',
                amount: amount,
                amount_text: details.amounts[0],
                summary: this.extractSummary(details.fullText),
                breach_type: breachType,
                firm_category: firmCategory,
                final_notice_url: article.url,
                press_release_url: article.url,
                year_issued: date.getFullYear(),
                month_issued: date.getMonth() + 1,
                quarter_issued: Math.ceil((date.getMonth() + 1) / 3),
                scraped_content: details.fullText,
                source_url: article.url,
                processing_status: 'pending'
            };

        } catch (error) {
            console.error(`Error extracting fine details from ${article.url}:`, error.message);
            return null;
        }
    }

    // NEW METHOD: Scrape structured FCA fines pages (e.g., /news/news-stories/2023-fines)
    async scrapeStructuredFinesPage(year, useHeadless = true) {
        const url = `https://www.fca.org.uk/news/news-stories/${year}-fines`;
        console.log(`   📊 Accessing structured fines page: ${url}`);

        const browser = await puppeteer.launch({
            headless: useHeadless,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        const fines = [];

        try {
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
            await this.delay(2000);

            // Extract table data from the structured fines page
            const tableData = await page.evaluate(() => {
                // Look for tables containing fines data
                const tables = document.querySelectorAll('table');
                const results = [];

                for (const table of tables) {
                    const headers = [];
                    const headerRow = table.querySelector('thead tr, tr:first-child');

                    if (headerRow) {
                        const headerCells = headerRow.querySelectorAll('th, td');
                        for (const cell of headerCells) {
                            headers.push(cell.textContent.trim().toLowerCase());
                        }
                    }

                    // Check if this table contains fines data
                    const hasFirmColumn = headers.some(h => h.includes('firm') || h.includes('company') || h.includes('individual'));
                    const hasAmountColumn = headers.some(h => h.includes('amount') || h.includes('fine') || h.includes('penalty') || h.includes('£'));

                    if (hasFirmColumn && hasAmountColumn) {
                        // Extract data rows
                        const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');

                        for (const row of dataRows) {
                            const cells = row.querySelectorAll('td, th');
                            if (cells.length >= 2) {
                                const rowData = {};

                                for (let i = 0; i < cells.length && i < headers.length; i++) {
                                    const header = headers[i];
                                    const cellText = cells[i].textContent.trim();

                                    if (header.includes('firm') || header.includes('company') || header.includes('individual')) {
                                        rowData.firm = cellText;
                                    } else if (header.includes('amount') || header.includes('fine') || header.includes('penalty') || header.includes('£')) {
                                        rowData.amount = cellText;
                                    } else if (header.includes('date')) {
                                        rowData.date = cellText;
                                    } else if (header.includes('reason') || header.includes('breach') || header.includes('type')) {
                                        rowData.reason = cellText;
                                    } else if (header.includes('notice') || header.includes('link') || header.includes('url')) {
                                        const link = cells[i].querySelector('a');
                                        if (link) {
                                            rowData.noticeUrl = link.href;
                                        }
                                    }
                                }

                                if (rowData.firm && rowData.amount) {
                                    results.push(rowData);
                                }
                            }
                        }
                    }
                }

                return results;
            });

            console.log(`   📊 Found ${tableData.length} fines in structured table`);

            // Process each fine from the table
            for (const rowData of tableData) {
                try {
                    const fine = this.processTableRowData(rowData, year, url);
                    if (fine) {
                        fines.push(fine);
                    }
                } catch (error) {
                    console.error(`   ⚠️ Error processing table row:`, error.message);
                }
            }

        } catch (error) {
            console.error(`   ⚠️ Error scraping structured page ${url}:`, error.message);
        } finally {
            await browser.close();
        }

        return fines;
    }

    // Helper method to process table row data into fine object
    processTableRowData(rowData, year, sourceUrl) {
        try {
            // Parse amount
            const amount = this.parseAmountFromText(rowData.amount);

            // Parse date or use default for the year
            const date = rowData.date ? this.parseDateFromText(rowData.date, year) : new Date(year, 5, 15); // Default to mid-year

            // Extract breach categories from reason text
            const breachCategories = this.extractBreachCategories(rowData.reason || '');

            return {
                fine_reference: this.generateFineReference(rowData.firm, date, amount),
                date_issued: date,
                firm_individual: rowData.firm,
                amount: amount,
                amount_text: rowData.amount,
                summary: rowData.reason || 'Fine details from structured FCA page',
                breach_categories: breachCategories,
                breach_type: breachCategories.length > 0 ? breachCategories[0] : 'Regulatory Breach',
                firm_category: this.categorizeFirm(rowData.firm, rowData.reason || ''),
                final_notice_url: rowData.noticeUrl || sourceUrl,
                press_release_url: sourceUrl,
                year_issued: date.getFullYear(),
                month_issued: date.getMonth() + 1,
                quarter_issued: Math.ceil((date.getMonth() + 1) / 3),
                scraped_content: JSON.stringify(rowData),
                source_url: sourceUrl,
                processing_status: 'pending'
            };
        } catch (error) {
            console.error('Error processing table row data:', error.message);
            return null;
        }
    }

    isFineRelated(title, description = '') {
        const text = (title + ' ' + description).toLowerCase();
        const fineKeywords = [
            'fine', 'fined', 'penalty', 'penalised', 'penalized',
            'enforcement', 'breach', 'violation', 'sanctions',
            'disciplinary', 'misconduct', 'censure', 'action against'
        ];

        return fineKeywords.some(keyword => text.includes(keyword));
    }

    parseAmount(amountText) {
        if (!amountText) return null;

        // Remove commas and convert to number
        const cleanAmount = amountText.replace(/,/g, '');
        const amount = parseFloat(cleanAmount);

        // Handle millions
        if (amountText.toLowerCase().includes('million') || amountText.toLowerCase().includes('m')) {
            return amount * 1000000;
        }

        return amount;
    }

    parseDate(dateText, fallbackYear) {
        if (!dateText) {
            return new Date(fallbackYear, 0, 1); // January 1st of the year
        }

        const date = new Date(dateText);
        if (isNaN(date.getTime())) {
            return new Date(fallbackYear, 0, 1);
        }

        return date;
    }

    extractBreachType(text) {
        const lowerText = text.toLowerCase();

        for (const [keyword, breachCode] of this.breachTypeMap) {
            if (lowerText.includes(keyword)) {
                return breachCode;
            }
        }

        return 'UNKNOWN';
    }

    categorizeFirm(firmName, fullText) {
        if (!firmName && !fullText) return 'Unknown';

        const text = (firmName + ' ' + fullText).toLowerCase();

        if (text.includes('bank') || text.includes('banking')) return 'Banking';
        if (text.includes('insurance') || text.includes('insurer')) return 'Insurance';
        if (text.includes('asset management') || text.includes('fund')) return 'Asset Management';
        if (text.includes('broker') || text.includes('trading')) return 'Brokerage';
        if (text.includes('pension') || text.includes('retirement')) return 'Pensions';
        if (text.includes('mortgage') || text.includes('lending')) return 'Lending';
        if (text.includes('adviser') || text.includes('advisor')) return 'Financial Advisory';
        if (text.includes('payment') || text.includes('fintech')) return 'Fintech';

        return 'Other';
    }

    extractSummary(text, maxLength = 200) {
        if (!text) return '';

        // Find the first paragraph that mentions the fine
        const sentences = text.split(/[.!?]+/);
        const summaryParts = [];

        for (const sentence of sentences) {
            if (sentence.toLowerCase().includes('fine') ||
                sentence.toLowerCase().includes('penalty') ||
                sentence.toLowerCase().includes('breach')) {
                summaryParts.push(sentence.trim());
                if (summaryParts.join('. ').length > maxLength) break;
            }
            if (summaryParts.length >= 2) break;
        }

        let summary = summaryParts.join('. ');
        if (summary.length > maxLength) {
            summary = summary.substring(0, maxLength) + '...';
        }

        return summary || text.substring(0, maxLength) + '...';
    }

    generateFineReference(firmName, date, amount) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const firmCode = firmName ? firmName.substring(0, 3).toUpperCase() : 'UNK';
        const amountCode = amount ? String(Math.floor(amount / 1000)) : '0';

        return `FCA-${year}${month}-${firmCode}-${amountCode}`;
    }

    // Additional helper methods for structured scraping

    parseAmountFromText(amountText) {
        if (!amountText) return null;

        // Handle complex formats like "£900,000 (and disgorgement of €362,950)"
        // Extract the main fine amount before any parentheses or additional text
        let mainAmount = amountText;

        // If there are parentheses, take only the part before them
        const parenIndex = mainAmount.indexOf('(');
        if (parenIndex !== -1) {
            mainAmount = mainAmount.substring(0, parenIndex).trim();
        }

        // Handle "and" clauses - take the first amount
        const andIndex = mainAmount.toLowerCase().indexOf(' and ');
        if (andIndex !== -1) {
            mainAmount = mainAmount.substring(0, andIndex).trim();
        }

        // Extract currency symbol and amount
        const currencyMatch = mainAmount.match(/([£$€])([\d,]+(?:\.\d{2})?)/);
        if (currencyMatch) {
            const amount = currencyMatch[2].replace(/,/g, '');
            return parseFloat(amount);
        }

        // Handle formats with "million" or "thousand"
        const millionMatch = mainAmount.match(/([£$€]?)([\d,.]+)\s*million/i);
        if (millionMatch) {
            const amount = millionMatch[2].replace(/,/g, '');
            return parseFloat(amount) * 1000000;
        }

        const thousandMatch = mainAmount.match(/([£$€]?)([\d,.]+)\s*thousand/i);
        if (thousandMatch) {
            const amount = thousandMatch[2].replace(/,/g, '');
            return parseFloat(amount) * 1000;
        }

        // Fallback: try to extract any number with currency symbol
        const numberMatch = mainAmount.match(/([£$€])([\d,]+(?:\.\d{2})?)/);
        if (numberMatch) {
            const amount = numberMatch[2].replace(/,/g, '');
            return parseFloat(amount);
        }

        // Last resort: extract any number
        const basicNumberMatch = mainAmount.match(/([\d,]+(?:\.\d{2})?)/);
        if (basicNumberMatch) {
            const amount = basicNumberMatch[1].replace(/,/g, '');
            return parseFloat(amount);
        }

        return null;
    }

    parseDateFromText(dateText, fallbackYear) {
        if (!dateText) {
            return new Date(fallbackYear, 5, 15); // Default to mid-year
        }

        // Try different date formats
        const formats = [
            // DD/MM/YYYY or DD-MM-YYYY
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
            // DD Month YYYY
            /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
            // Month DD, YYYY
            /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
            // YYYY-MM-DD
            /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
        ];

        for (const format of formats) {
            const match = dateText.match(format);
            if (match) {
                try {
                    const date = new Date(dateText);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                } catch (e) {
                    // Continue to next format
                }
            }
        }

        // Fallback to parsing with Date constructor
        try {
            const date = new Date(dateText);
            if (!isNaN(date.getTime())) {
                return date;
            }
        } catch (e) {
            // Fallback to mid-year
        }

        return new Date(fallbackYear, 5, 15);
    }

    extractBreachCategories(reasonText) {
        if (!reasonText) return [];

        const text = reasonText.toLowerCase();
        const categories = [];

        // Define breach category keywords
        const categoryKeywords = {
            'Anti-Money Laundering': ['aml', 'anti-money laundering', 'money laundering', 'suspicious transactions', 'customer due diligence'],
            'Market Abuse': ['market abuse', 'insider dealing', 'market manipulation', 'misleading statements'],
            'Customer Treatment': ['treating customers fairly', 'customer treatment', 'mis-selling', 'unfair treatment'],
            'Systems and Controls': ['systems and controls', 'systems failure', 'inadequate controls', 'operational risk'],
            'Prudential Requirements': ['capital requirements', 'liquidity', 'prudential', 'solvency'],
            'Conduct Risk': ['conduct risk', 'conduct failures', 'inappropriate conduct'],
            'Client Money': ['client money', 'client assets', 'segregation'],
            'Governance': ['governance', 'management failure', 'oversight'],
            'Reporting and Disclosure': ['reporting', 'disclosure', 'transaction reporting', 'regulatory reporting'],
            'Financial Crime': ['financial crime', 'sanctions', 'terrorist financing', 'proceeds of crime']
        };

        // Check for each category
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    if (!categories.includes(category)) {
                        categories.push(category);
                    }
                    break;
                }
            }
        }

        // If no specific categories found, return a generic one
        if (categories.length === 0) {
            categories.push('Regulatory Breach');
        }

        return categories;
    }

    async saveFine(fine, forceScrape = false) {
        try {
            // Check if fine already exists
            if (!forceScrape) {
                const existing = await this.db.query(
                    'SELECT id FROM fca_fines WHERE fine_reference = $1 OR (firm_individual = $2 AND date_issued = $3 AND amount = $4)',
                    [fine.fine_reference, fine.firm_individual, fine.date_issued, fine.amount]
                );

                if (existing.rows.length > 0) {
                    return { isNew: false, id: existing.rows[0].id };
                }
            }

            // Insert new fine
            const query = `
                INSERT INTO fca_fines (
                    fine_reference, date_issued, firm_individual, amount, amount_text,
                    summary, breach_type, breach_categories, firm_category, final_notice_url, press_release_url,
                    year_issued, month_issued, quarter_issued, scraped_content, source_url, processing_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING id
            `;

            const result = await this.db.query(query, [
                fine.fine_reference,
                fine.date_issued,
                fine.firm_individual,
                fine.amount,
                fine.amount_text,
                fine.summary,
                fine.breach_type,
                JSON.stringify(fine.breach_categories || []),
                fine.firm_category,
                fine.final_notice_url,
                fine.press_release_url,
                fine.year_issued,
                fine.month_issued,
                fine.quarter_issued,
                fine.scraped_content,
                fine.source_url,
                fine.processing_status
            ]);

            return { isNew: true, id: result.rows[0].id };

        } catch (error) {
            console.error('Error saving fine:', error);
            throw error;
        }
    }

    async startScrapingLog() {
        const result = await this.db.query(
            'INSERT INTO fca_scraping_log (scrape_date, status) VALUES (CURRENT_DATE, $1) RETURNING id',
            ['in_progress']
        );
        return result.rows[0].id;
    }

    async completeScrapingLog(id, updates) {
        await this.db.query(
            `UPDATE fca_scraping_log
             SET status = $2, completed_at = CURRENT_TIMESTAMP, error_message = $3
             WHERE id = $1`,
            [id, updates.status, updates.errors]
        );
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async close() {
        await this.db.end();
    }
}

module.exports = FCAFinesScraper;