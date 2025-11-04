const puppeteer = require('puppeteer')

function applyStructuredMethods(ServiceClass) {
  ServiceClass.prototype.scrapeStructuredFinesPage = async function(year, useHeadless = true) {
    let browser
    const fines = []

    try {
      console.log(`   📋 Trying FCA enforcement actions page for ${year}...`)

      browser = await puppeteer.launch({
        headless: useHeadless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

      // The correct URL format for FCA fines data (verified working as of 2024)
      const url = `https://www.fca.org.uk/news/news-stories/${year}-fines`
      console.log(`   🔍 Accessing enforcement actions: ${url}`)

      let response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      if (!response || response.status() !== 200) {
        const alternativeUrls = [
          `https://www.fca.org.uk/publications/corporate-documents/${year}-fines`,
          `https://www.fca.org.uk/publication/fines/${year}`,
          `https://www.fca.org.uk/firms/enforcement/${year}`,
          `https://www.fca.org.uk/publications/fines/${year}`,
          `https://www.fca.org.uk/news/enforcement-actions?year=${year}`,
          `https://www.fca.org.uk/publication/notices/${year}`,
          `https://www.fca.org.uk/news/search?search=enforcement&year=${year}`
        ]

        let found = false
        for (const altUrl of alternativeUrls) {
          try {
            console.log(`   🔍 Trying alternative URL: ${altUrl}`)
            response = await page.goto(altUrl, {
              waitUntil: 'networkidle2',
              timeout: 30000
            })
            if (response && response.status() === 200) {
              found = true
              break
            }
          } catch (error) {
            console.log(`   ⚠️ Alternative URL failed: ${altUrl}`)
          }
        }

        if (!found) {
          console.log(`   ⚠️ No valid enforcement page found for ${year}`)
          return { fines: [] }
        }
      }

      const tableData = await page.evaluate(() => {
        const results = []
        const tables = document.querySelectorAll('table, .table, .enforcement-table, .fines-table')
        console.log(`Found ${tables.length} potential tables`)

        for (const table of tables) {
          const rows = Array.from(table.querySelectorAll('tr, .table-row, .enforcement-row'))
          if (rows.length < 2) continue

          const firstRow = rows[0]
          const headerText = firstRow.textContent.toLowerCase()
          console.log(`Examining table with header: ${headerText.substring(0, 100)}`)

          const hasEnforcementIndicators = (
            headerText.includes('firm') || headerText.includes('company') || headerText.includes('individual') ||
            headerText.includes('amount') || headerText.includes('fine') || headerText.includes('penalty') ||
            headerText.includes('enforcement') || headerText.includes('action') || headerText.includes('date')
          )

          if (hasEnforcementIndicators) {
            console.log('Found potential enforcement table')

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i]
              const cells = Array.from(row.querySelectorAll('td, th, .cell, .table-cell'))

              if (cells.length >= 2) {
                let firm = ''
                let dateText = ''
                let amountText = ''
                let reason = ''
                let url = ''

                // FCA table has consistent structure: Firm (0), Date (1), Amount (2), Reason (3)
                // Try column-based extraction first for FCA standard tables
                if (cells.length >= 4) {
                  firm = cells[0].textContent?.trim() || ''
                  dateText = cells[1].textContent?.trim() || ''
                  amountText = cells[2].textContent?.trim() || ''
                  reason = cells[3].textContent?.trim() || ''

                  // Get URL from any column
                  for (let j = 0; j < cells.length; j++) {
                    const linkEl = cells[j].querySelector('a')
                    if (linkEl && !url) {
                      url = linkEl.href
                    }
                  }
                } else {
                  // Fallback to pattern-based extraction for non-standard tables
                  for (let j = 0; j < cells.length; j++) {
                    const cellText = cells[j].textContent?.trim() || ''
                    const cellLower = cellText.toLowerCase()

                    if (!firm && (
                      j === 0 ||
                      cellText.match(/\b(ltd|limited|plc|bank|group|holdings|services|insurance|asset|management)\b/i) ||
                      cellText.match(/^[A-Z][a-zA-Z\s&.,-]{3,}$/)
                    )) {
                      firm = cellText
                    }

                    // Check for dates FIRST to avoid matching date numbers as amounts
                    if (!dateText && (
                      cellText.match(/\d{1,2}[/-]\d{1,2}[/-]\d{4}/) ||
                      cellText.match(/\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i) ||
                      cellText.match(/\d{4}[/-]\d{1,2}[/-]\d{1,2}/)
                    )) {
                      dateText = cellText
                    }

                    // Only match amounts if not already matched as date
                    if (!amountText && cellText !== dateText && (
                      cellText.includes('£') ||
                      (cellText.match(/\b\d{1,3}(,\d{3})+(\.\d{2})?\b/) && !cellText.match(/\d{1,2}[/-]\d{1,2}/)) || // Large numbers with commas, not dates
                      cellLower.includes('million') || cellLower.includes('thousand')
                    )) {
                      amountText = cellText
                    }

                    if (!reason && cellText.length > 10 && cellText !== dateText && cellText !== amountText && (
                      cellLower.includes('breach') || cellLower.includes('failure') ||
                      cellLower.includes('money laundering') || cellLower.includes('aml') ||
                      cellLower.includes('market') || cellLower.includes('conduct') ||
                      cellLower.includes('customer') || cellLower.includes('reporting')
                    )) {
                      reason = cellText
                    }

                    const linkEl = cells[j].querySelector('a')
                    if (linkEl && !url) {
                      url = linkEl.href
                    }
                  }
                }

                if (!url) {
                  const rowLink = row.querySelector('a')
                  if (rowLink) url = rowLink.href
                }

                if (firm && (amountText || reason)) {
                  console.log(`Found enforcement entry: ${firm} - ${amountText}`)
                  results.push({
                    firm,
                    dateText,
                    amountText,
                    reason,
                    url,
                    source: 'enhanced_table_parsing'
                  })
                }
              }
            }
          }
        }

        const listItems = document.querySelectorAll('li, .enforcement-item, .action-item, .fine-item')
        for (const item of listItems) {
          const text = item.textContent || ''
          const textLower = text.toLowerCase()

          if ((textLower.includes('fine') || textLower.includes('penalty') || textLower.includes('enforcement')) &&
              text.includes('£') && text.length > 20) {
            const firmMatch = text.match(/([A-Z][a-zA-Z\s&.,-]+?)(?:\s+(?:fined|penalised|penalty))/i)
            const amountMatch = text.match(/£([\d,]+(?:\.\d{2})?(?:\s*million)?)/i)
            const dateMatch = text.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{1,2}\s+\w+\s+\d{4})/)

            if (firmMatch && amountMatch) {
              const linkEl = item.querySelector('a')
              results.push({
                firm: firmMatch[1].trim(),
                dateText: dateMatch ? dateMatch[1] : '',
                amountText: '£' + amountMatch[1],
                reason: text.substring(0, 200) + '...',
                url: linkEl ? linkEl.href : '',
                source: 'list_item_parsing'
              })
            }
          }
        }

        console.log(`Total enforcement entries found: ${results.length}`)
        return results
      })

      console.log(`   📊 Extracted ${tableData.length} entries from table`)

      for (const entry of tableData) {
        try {
          const parsedAmount = this.parseAmountFromText(entry.amountText)
          const parsedDate = this.parseDateFromText(entry.dateText, year)
          const breachCategories = this.extractBreachCategories(entry.reason || '')
          const affectedSectors = this.extractSectors(entry.firm || '')

          const fine = {
            fine_reference: `FCA-${year}-${String(fines.length + 1).padStart(3, '0')}`,
            firm_individual: entry.firm || 'Unknown Firm',
            amount: parsedAmount,
            amount_text: entry.amountText || 'Amount not specified',
            date_issued: parsedDate,
            summary: entry.reason || `Enforcement action against ${entry.firm || 'firm'} (${year})`,
            breach_categories: JSON.stringify(breachCategories),
            affected_sectors: JSON.stringify(affectedSectors),
            customer_impact_level: this.assessImpactLevel(parsedAmount, entry.reason),
            risk_score: this.calculateRiskScore(parsedAmount, entry.reason),
            systemic_risk: this.assessSystemicRisk(parsedAmount, entry.reason, entry.firm),
            precedent_setting: this.assessPrecedentSetting(entry.reason, parsedAmount),
            final_notice_url: entry.url || `https://www.fca.org.uk/publication/fines/${year}`,
            source_url: page.url(),
            year_issued: year,
            month_issued: parsedDate ? parsedDate.getMonth() + 1 : 6,
            quarter_issued: parsedDate ? Math.ceil((parsedDate.getMonth() + 1) / 3) : 2,
            processing_status: 'pending',
            processed_by_ai: false,
            scraped_content: JSON.stringify(entry)
          }

          fines.push(fine)
          console.log(`   ✅ Processed: ${entry.firm} - ${entry.amountText}`)
        } catch (error) {
          console.error('   ⚠️ Error processing entry:', error.message)
        }
      }

      if (browser) {
        await browser.close()
        browser = null
      }

      if (fines.length === 0) {
        console.log(`   ⚠️ Structured page returned no fines for ${year}, trying news story tables...`)
        return this.scrapeNewsStoryFinesPage(year, useHeadless)
      }

      return fines
    } catch (error) {
      console.error(`   ❌ Error scraping structured page for ${year}:`, error.message)
      if (browser) {
        await browser.close()
      }
      return this.scrapeNewsStoryFinesPage(year, useHeadless)
    }
  }

  ServiceClass.prototype.scrapeNewsStoryFinesPage = async function(year, useHeadless = true) {
    const url = `https://www.fca.org.uk/news/news-stories/${year}-fines`
    console.log(`   📊 Accessing structured fines page: ${url}`)

    const browser = await puppeteer.launch({
      headless: useHeadless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })

    const page = await browser.newPage()
    const fines = []

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
      await this.delay(2000)

      const tableData = await page.evaluate(() => {
        const tables = document.querySelectorAll('table')
        const results = []

        for (const table of tables) {
          const headers = []
          const headerRow = table.querySelector('thead tr, tr:first-child')

          if (headerRow) {
            const headerCells = headerRow.querySelectorAll('th, td')
            for (const cell of headerCells) {
              headers.push(cell.textContent.trim().toLowerCase())
            }
          }

          const hasFirmColumn = headers.some(h => h.includes('firm') || h.includes('company') || h.includes('individual'))
          const hasAmountColumn = headers.some(h => h.includes('amount') || h.includes('fine') || h.includes('penalty') || h.includes('£'))

          if (hasFirmColumn && hasAmountColumn) {
            const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)')

            for (const row of dataRows) {
              const cells = row.querySelectorAll('td, th')
              if (cells.length >= 2) {
                const rowData = {}

                for (let i = 0; i < cells.length && i < headers.length; i++) {
                  const header = headers[i]
                  const cellText = cells[i].textContent.trim()

                  if (header.includes('firm') || header.includes('company') || header.includes('individual')) {
                    rowData.firm = cellText
                  } else if (header.includes('amount') || header.includes('fine') || header.includes('penalty') || header.includes('£')) {
                    rowData.amount = cellText
                  } else if (header.includes('date')) {
                    rowData.date = cellText
                  } else if (header.includes('reason') || header.includes('breach') || header.includes('type')) {
                    rowData.reason = cellText
                  } else if (header.includes('notice') || header.includes('link') || header.includes('url')) {
                    const link = cells[i].querySelector('a')
                    if (link) {
                      rowData.noticeUrl = link.href
                    }
                  }
                }

                if (rowData.firm && rowData.amount) {
                  results.push(rowData)
                }
              }
            }
          }
        }

        return results
      })

      console.log(`   📊 Found ${tableData.length} fines in structured table`)

      for (const rowData of tableData) {
        try {
          const fine = this.processTableRowData(rowData, year, url)
          if (fine) {
            fines.push(fine)
          }
        } catch (error) {
          console.error('   ⚠️ Error processing table row:', error.message)
        }
      }
    } catch (error) {
      console.error(`   ⚠️ Error scraping structured page ${url}:`, error.message)
    } finally {
      await browser.close()
    }

    return fines
  }

  ServiceClass.prototype.processTableRowData = function(rowData, year, sourceUrl) {
    try {
      const amount = this.parseAmountFromText(rowData.amount)
      const date = rowData.date ? this.parseDateFromText(rowData.date, year) : new Date(year, 5, 15)
      const breachCategories = this.extractBreachCategories(rowData.reason || '')

      return {
        fine_reference: this.generateFineReference(rowData.firm, date, amount),
        date_issued: date,
        firm_individual: rowData.firm,
        amount,
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
      }
    } catch (error) {
      console.error('Error processing table row data:', error.message)
      return null
    }
  }
}

module.exports = applyStructuredMethods
