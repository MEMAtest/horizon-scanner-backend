/**
 * Bank News Page Template
 *
 * Renders the Bank News page with filters and update cards
 */

const { getBankNewsStyles } = require('./styles')

function renderBankNewsPage({ sidebar, stats, updates, banks, currentFilters }) {
  const styles = getBankNewsStyles()

  // Group banks by region for filter chips
  const regionGroups = {
    'Americas': banks.filter(b => b.region === 'Americas'),
    'Europe': banks.filter(b => b.region === 'Europe'),
    'Asia': banks.filter(b => b.region === 'Asia-Pacific')
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bank News | RegCanary</title>
      <link rel="icon" href="/images/favicon.ico">
      ${styles}
    </head>
    <body>
      <div class="app-shell">
        ${sidebar}

        <main class="main-content">
          <div class="bank-news-container">
            <!-- Header -->
            <div class="bank-news-header">
              <div class="bank-news-title">
                <div class="icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
                  </svg>
                </div>
                <div>
                  <h1>Bank News</h1>
                  <p class="bank-news-subtitle">Latest news and press releases from major global banks</p>
                </div>
              </div>

              <!-- Search -->
              <div class="bank-search-box">
                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input type="text" placeholder="Search bank news..." id="bankSearchInput" value="${currentFilters.search || ''}">
              </div>
            </div>

            <!-- Stats Row -->
            <div class="bank-stats-row">
              <div class="bank-stat-card highlight">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total Updates</div>
              </div>
              <div class="bank-stat-card">
                <div class="stat-value">${stats.thisWeek}</div>
                <div class="stat-label">This Week</div>
              </div>
              <div class="bank-stat-card">
                <div class="stat-value">${stats.banks}</div>
                <div class="stat-label">Banks Tracked</div>
              </div>
            </div>

            <!-- Region Pills -->
            <div class="region-pills">
              <div class="region-pill ${!currentFilters.region ? 'active' : ''}" data-region="">All Regions</div>
              <div class="region-pill ${currentFilters.region === 'Americas' ? 'active' : ''}" data-region="Americas">Americas</div>
              <div class="region-pill ${currentFilters.region === 'Europe' ? 'active' : ''}" data-region="Europe">Europe</div>
              <div class="region-pill ${currentFilters.region === 'Asia-Pacific' ? 'active' : ''}" data-region="Asia-Pacific">Asia-Pacific</div>
            </div>

            <!-- Bank Filter Chips -->
            <div class="bank-filters">
              <div class="bank-filter-group">
                ${banks.map(bank => `
                  <div class="bank-filter-chip ${currentFilters.bank === bank.id ? 'active' : ''}" data-bank="${bank.id}">
                    ${bank.name}
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Updates Grid -->
            <div class="bank-updates-grid" id="bankUpdatesGrid">
              ${updates.length > 0 ? updates.map(update => renderUpdateCard(update)).join('') : renderEmptyState()}
            </div>
          </div>
        </main>
      </div>

      <script>
        // Region filter
        document.querySelectorAll('.region-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            const region = pill.dataset.region;
            const url = new URL(window.location);
            if (region) {
              url.searchParams.set('region', region);
            } else {
              url.searchParams.delete('region');
            }
            url.searchParams.delete('bank'); // Reset bank filter when changing region
            window.location = url;
          });
        });

        // Bank filter
        document.querySelectorAll('.bank-filter-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const bank = chip.dataset.bank;
            const url = new URL(window.location);
            if (chip.classList.contains('active')) {
              url.searchParams.delete('bank');
            } else {
              url.searchParams.set('bank', bank);
            }
            window.location = url;
          });
        });

        // Search
        let searchTimeout;
        document.getElementById('bankSearchInput').addEventListener('input', (e) => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            const url = new URL(window.location);
            if (e.target.value) {
              url.searchParams.set('search', e.target.value);
            } else {
              url.searchParams.delete('search');
            }
            window.location = url;
          }, 500);
        });
      </script>
    </body>
    </html>
  `
}

function renderUpdateCard(update) {
  const bankName = update.authority || 'Unknown'
  const bankInitials = bankName.substring(0, 2).toUpperCase()
  const date = update.published_date || update.publishedDate || update.fetchedDate
  const formattedDate = date ? new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : ''
  const region = update.region || 'Unknown'
  const summary = update.ai_summary || update.summary || ''

  return `
    <div class="bank-update-card">
      <div class="bank-update-header">
        <div class="bank-logo">${bankInitials}</div>
        <div class="bank-update-meta">
          <span class="bank-name">${bankName}</span>
          <span class="bank-update-date">${formattedDate}</span>
        </div>
      </div>

      <h3 class="bank-update-title">
        <a href="${update.url}" target="_blank" rel="noopener">${update.headline || update.title}</a>
      </h3>

      ${summary ? `<p class="bank-update-excerpt">${summary.substring(0, 150)}${summary.length > 150 ? '...' : ''}</p>` : ''}

      <div class="bank-update-footer">
        <span class="bank-region-tag">${region}</span>
        <a href="${update.url}" target="_blank" rel="noopener" class="bank-update-link">
          Read more
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M17 7H7M17 7v10"/>
          </svg>
        </a>
      </div>
    </div>
  `
}

function renderEmptyState() {
  return `
    <div class="bank-empty-state" style="grid-column: 1 / -1;">
      <div class="empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
        </svg>
      </div>
      <h3>No bank news yet</h3>
      <p>Bank news will appear here once the scrapers are active.</p>
    </div>
  `
}

module.exports = { renderBankNewsPage }
