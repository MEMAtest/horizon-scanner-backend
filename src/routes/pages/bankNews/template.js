/**
 * Bank News Page Template
 *
 * Renders the Bank News page with charts, filters, and update cards
 * Aligned with site-wide CSS standards
 */

const { getCommonStyles } = require('../../templates/commonStyles')
const { getWorkspaceBootstrapScripts } = require('../../templates/clientScripts')
const { getBankNewsStyles } = require('./styles')
const { getBankNewsIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../../views/icons')
const { selectSummary, isFallbackSummary, cleanSummaryText } = require('../../../utils/summaryUtils')

function renderBankNewsPage({ sidebar, stats, updates, banks, currentFilters, chartData, categories }) {
  const styles = getBankNewsStyles()
  const activeCategory = currentFilters.category || 'all'
  const categoryLabelMap = new Map(
    (categories || [])
      .filter(category => category.id && category.id !== 'all')
      .map(category => [category.id, category.label])
  )
  const clientUpdates = buildClientUpdates(updates, banks, categoryLabelMap)
  const serializedUpdates = serializeForScript(clientUpdates)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bank News | RegCanary</title>
      <link rel="icon" href="/images/favicon.ico">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      ${getCommonStyles()}
      ${styles}
      <style>${getCanaryAnimationStyles()}</style>
    </head>
    <body>
      <div class="app-container">
        ${sidebar}

        <main class="main-content">
          <!-- Page Header -->
          <header class="page-header">
            <div class="page-header-left">
              <div class="header-title">
                ${wrapIconInContainer(getBankNewsIcon())}
                <h1>Bank News</h1>
              </div>
              <p class="bank-news-subtitle">Latest news and press releases from major global banks</p>
            </div>
            <div class="page-header-right">
              <div class="search-box">
                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input type="text" placeholder="Search bank news..." id="bankSearchInput" value="${currentFilters.search || ''}">
              </div>
            </div>
          </header>

          <!-- Stats Grid -->
          <section class="stats-grid">
            <article class="stat-card">
              <span class="stat-number">${stats.total}</span>
              <span class="stat-label">Total Updates</span>
            </article>
            <article class="stat-card">
              <span class="stat-number">${stats.thisWeek}</span>
              <span class="stat-label">This Week</span>
            </article>
            <article class="stat-card">
              <span class="stat-number">${stats.banks}</span>
              <span class="stat-label">Banks Tracked</span>
            </article>
            <article class="stat-card">
              <span class="stat-number">${stats.aiAnalyzed}</span>
              <span class="stat-label">AI Analyzed</span>
            </article>
          </section>

          <!-- Charts Section -->
          <section class="charts-section">
            <div class="charts-grid">
              <!-- News Trend Chart -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3 class="chart-title">News Trend (14 Days)</h3>
                </div>
                <div class="chart-container">
                  <canvas id="trendChart"></canvas>
                </div>
              </div>

              <!-- Bank Distribution Chart -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3 class="chart-title">Category</h3>
                </div>
                <div class="chart-container">
                  <canvas id="bankChart"></canvas>
                </div>
              </div>

              <!-- Region Distribution Chart -->
              <div class="chart-card chart-card-small">
                <div class="chart-header">
                  <h3 class="chart-title">By Region</h3>
                </div>
                <div class="chart-container-small">
                  <canvas id="regionChart"></canvas>
                </div>
              </div>
            </div>
          </section>

          <!-- Filters Container -->
          <section class="filters-container">
            <!-- Region Pills -->
            <div class="quick-filters">
              <button type="button" class="quick-filter-btn ${!currentFilters.region ? 'active' : ''}" data-region="">All Regions</button>
              <button type="button" class="quick-filter-btn ${currentFilters.region === 'Americas' ? 'active' : ''}" data-region="Americas">Americas</button>
              <button type="button" class="quick-filter-btn ${currentFilters.region === 'Europe' ? 'active' : ''}" data-region="Europe">Europe</button>
              <button type="button" class="quick-filter-btn ${currentFilters.region === 'Asia-Pacific' ? 'active' : ''}" data-region="Asia-Pacific">Asia-Pacific</button>
            </div>

            <!-- Bank Filter Chips -->
            <div class="bank-chips">
              ${banks.map(bank => `
                <button type="button" class="bank-chip ${currentFilters.bank === bank.id ? 'active' : ''}" data-bank="${bank.id}">
                  ${bank.name}
                </button>
              `).join('')}
            </div>

            <!-- Category Filters -->
            <div class="category-filters">
              ${(categories || []).map(category => `
                <button type="button" class="category-chip ${activeCategory === category.id ? 'active' : ''}" data-category="${escapeHtml(category.id)}">
                  <span>${escapeHtml(category.label)}</span>
                  <span class="category-count">${category.count || 0}</span>
                </button>
              `).join('')}
            </div>
          </section>

          <!-- Updates Container -->
          <section class="updates-container">
            <h2 class="section-title">
              🏦 Latest Updates
              <span class="update-count">(${updates.length})</span>
            </h2>
            <div class="updates-grid" id="bankUpdatesGrid">
              ${updates.length > 0 ? updates.map(update => renderUpdateCard(update, banks, categoryLabelMap)).join('') : renderEmptyState()}
            </div>
          </section>
        </main>
      </div>

      ${getWorkspaceBootstrapScripts()}
      <script>
        // Chart data from server
        const chartData = ${JSON.stringify(chartData)};
        const bankNewsUpdates = ${serializedUpdates};
        const bankNewsUpdateMap = new Map();

        bankNewsUpdates.forEach(update => {
          if (update.id != null && update.id !== '') {
            bankNewsUpdateMap.set(String(update.id), update);
          }
          if (update.url) {
            bankNewsUpdateMap.set(String(update.url), update);
          }
        });

        // Chart colors - standard blue theme (matching site)
        const chartColors = {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          light: 'rgba(59, 130, 246, 0.15)',
          gradient: ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#6366f1']
        };

        // Initialize Trend Chart
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: chartData.trend.map(d => d.label),
            datasets: [{
              label: 'News Items',
              data: chartData.trend.map(d => d.count),
              borderColor: chartColors.primary,
              backgroundColor: chartColors.light,
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: chartColors.primary,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                borderColor: chartColors.primary,
                borderWidth: 1
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#64748b', maxRotation: 45, minRotation: 45 }
              },
              y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { color: '#64748b', stepSize: 1 }
              }
            }
          }
        });

        // Initialize Bank Distribution Chart
        const bankCtx = document.getElementById('bankChart').getContext('2d');
        new Chart(bankCtx, {
          type: 'bar',
          data: {
            labels: chartData.bankDistribution.map(b => b.name),
            datasets: [{
              label: 'News Items',
              data: chartData.bankDistribution.map(b => b.count),
              backgroundColor: chartData.bankDistribution.map((_, i) =>
                chartColors.gradient[i % chartColors.gradient.length] + 'cc'
              ),
              borderColor: chartData.bankDistribution.map((_, i) =>
                chartColors.gradient[i % chartColors.gradient.length]
              ),
              borderWidth: 1,
              borderRadius: 6
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { color: '#64748b' }
              },
              y: {
                grid: { display: false },
                ticks: { color: '#1e293b' }
              }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const bank = chartData.bankDistribution[index];
                filterByBank(bank.id);
              }
            }
          }
        });

        // Initialize Region Distribution Chart
        const regionCtx = document.getElementById('regionChart').getContext('2d');
        const regionLabels = Object.keys(chartData.regionDistribution);
        const regionValues = Object.values(chartData.regionDistribution);
        const regionTotal = regionValues.reduce((a, b) => a + b, 0);

        new Chart(regionCtx, {
          type: 'doughnut',
          data: {
            labels: regionLabels,
            datasets: [{
              data: regionValues,
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(6, 182, 212, 0.8)'
              ],
              borderColor: ['#3b82f6', '#8b5cf6', '#06b6d4'],
              borderWidth: 2,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
              legend: {
                position: 'right',
                labels: { usePointStyle: true, padding: 10, font: { size: 10 }, boxWidth: 8 }
              },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                borderColor: chartColors.primary,
                borderWidth: 1,
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const percentage = regionTotal > 0 ? ((value / regionTotal) * 100).toFixed(1) : 0;
                    return context.label + ': ' + value + ' (' + percentage + '%)';
                  }
                }
              }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const region = regionLabels[index];
                filterByRegion(region);
              }
            }
          }
        });

        // Filter functions
        function filterByRegion(region) {
          const url = new URL(window.location);
          if (region) {
            url.searchParams.set('region', region);
          } else {
            url.searchParams.delete('region');
          }
          url.searchParams.delete('bank');
          window.location = url;
        }

        function filterByBank(bank) {
          const url = new URL(window.location);
          if (bank) {
            url.searchParams.set('bank', bank);
          } else {
            url.searchParams.delete('bank');
          }
          window.location = url;
        }

        function filterByCategory(category) {
          const url = new URL(window.location);
          if (category && category !== 'all') {
            url.searchParams.set('category', category);
          } else {
            url.searchParams.delete('category');
          }
          window.location = url;
        }

        function getUpdateFromKey(updateKey) {
          if (!updateKey) return null;
          return bankNewsUpdateMap.get(String(updateKey)) || null;
        }

        async function bookmarkUpdate(updateKey) {
          const update = getUpdateFromKey(updateKey);
          if (!update || !window.WorkspaceModule || typeof WorkspaceModule.togglePin !== 'function') {
            return;
          }

          try {
            await WorkspaceModule.ready();
            await WorkspaceModule.togglePin(update.url, update.headline || 'Bank update', update.authority, {
              summary: update.summary || '',
              published: update.published_date || '',
              updateId: update.id || '',
              metadata: {
                category: update.bankCategory || '',
                categoryLabel: update.categoryLabel || '',
                page: 'bank-news'
              }
            });
            syncBookmarkButtons();
          } catch (error) {
            console.error('Bookmark failed:', error);
          }
        }

        function syncBookmarkButtons() {
          if (!window.WorkspaceModule || typeof WorkspaceModule.getPinnedUrls !== 'function') {
            return;
          }
          const pinnedUrls = new Set(WorkspaceModule.getPinnedUrls().map(value => String(value)));
          const pinnedIds = new Set(WorkspaceModule.getPinnedUpdateIds().map(value => String(value)));

          document.querySelectorAll('.action-btn-bookmark').forEach(button => {
            const card = button.closest('.update-card');
            const updateUrl = card?.dataset?.url || '';
            const updateId = card?.dataset?.id || '';
            const updateKey = button.dataset.updateKey || '';
            const isPinned = (updateId && pinnedIds.has(String(updateId))) ||
              (updateUrl && pinnedUrls.has(String(updateUrl))) ||
              (updateKey && (pinnedIds.has(String(updateKey)) || pinnedUrls.has(String(updateKey))));
            button.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
          });
        }

        // Region filter buttons
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            filterByRegion(btn.dataset.region);
          });
        });

        // Bank filter chips
        document.querySelectorAll('.bank-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const bank = chip.dataset.bank;
            if (chip.classList.contains('active')) {
              filterByBank('');
            } else {
              filterByBank(bank);
            }
          });
        });

        // Category filter chips
        document.querySelectorAll('.category-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            filterByCategory(chip.dataset.category);
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

        // Bookmark buttons
        document.querySelectorAll('.action-btn-bookmark').forEach(button => {
          button.addEventListener('click', () => {
            bookmarkUpdate(button.dataset.updateKey);
          });
        });

        if (window.WorkspaceModule && typeof WorkspaceModule.ready === 'function') {
          WorkspaceModule.ready()
            .then(syncBookmarkButtons)
            .catch(() => {});
        }
      </script>
    </body>
    </html>
  `
}

function buildClientUpdates(updates, banks, categoryLabelMap) {
  return (updates || []).map(update => {
    const bankName = update.authority || 'Unknown'
    const bank = banks.find(b => b.id === bankName)
    const displayName = bank ? bank.name : bankName
    const { summary } = buildSummaryData(update)
    const date = update.published_date || update.publishedDate || update.fetchedDate || ''
    const categoryId = update.bankCategory || ''

    return {
      id: update.id || '',
      url: update.url || '',
      authority: displayName,
      headline: update.headline || update.title || 'Untitled update',
      summary: summary || '',
      published_date: date || '',
      bankCategory: categoryId,
      categoryLabel: categoryLabelMap.get(categoryId) || ''
    }
  })
}

function buildSummaryData(update) {
  const rawSummary = update.raw_data?.summary || update.raw_data?.content
  const summarySource = rawSummary ? { ...update, description: rawSummary } : update
  const summary = selectSummary(summarySource)
  const aiSummaryClean = update.ai_summary ? cleanSummaryText(update.ai_summary) : ''
  const hasAiSummary = aiSummaryClean && !isFallbackSummary(aiSummaryClean, update.headline || update.title)
  const isAiSummary = hasAiSummary && summary && summary === aiSummaryClean

  return { summary, isAiSummary }
}

function truncateText(text, maxLength) {
  if (!text) return ''
  const normalized = String(text)
  if (normalized.length <= maxLength) return normalized
  return normalized.slice(0, maxLength).trim() + '...'
}

function serializeForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function renderUpdateCard(update, banks, categoryLabelMap) {
  const bankName = update.authority || 'Unknown'
  const bank = banks.find(b => b.id === bankName)
  const displayName = bank ? bank.name : bankName
  const region = update.region || (bank ? bank.region : 'Unknown')
  const updateId = update.id != null ? String(update.id) : ''
  const updateUrl = update.url || ''
  const updateKey = updateId || updateUrl
  const categoryId = update.bankCategory || ''
  const categoryLabel = categoryLabelMap.get(categoryId) || ''

  const date = update.published_date || update.publishedDate || update.fetchedDate
  const formattedDate = date ? new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : ''

  const { summary } = buildSummaryData(update)
  const summaryText = summary
  const summaryClass = summaryText ? '' : 'is-empty'
  const summaryContent = summaryText || 'Summary pending.'

  return `
    <div class="update-card" data-id="${escapeHtml(updateId)}" data-url="${escapeHtml(updateUrl)}" data-authority="${escapeHtml(displayName)}" data-category="${escapeHtml(categoryId)}">
      <div class="update-header">
        <div class="update-meta-primary">
          <span class="authority-badge">${escapeHtml(displayName)}</span>
          <span class="date-badge">${formattedDate}</span>
          ${categoryLabel ? `<span class="category-badge">${escapeHtml(categoryLabel)}</span>` : ''}
        </div>
        <div class="update-meta-secondary">
          <span class="region-tag">${escapeHtml(region)}</span>
          <div class="update-actions">
            <button type="button" class="action-btn action-btn-bookmark" data-update-key="${escapeHtml(updateKey)}" title="Bookmark" aria-pressed="false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <h3 class="update-headline">
        <a href="${escapeHtml(updateUrl)}" target="_blank" rel="noopener">
          ${escapeHtml(update.headline || update.title || 'Untitled update')}
        </a>
      </h3>

      <div class="update-summary ${summaryClass}">
        ${escapeHtml(summaryContent)}
      </div>

      <div class="update-footer">
        <a href="${escapeHtml(updateUrl)}" target="_blank" rel="noopener" class="read-more-link">
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
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
        </svg>
      </div>
      <h3>No bank news yet</h3>
      <p>Bank news will appear here once the scrapers have collected data.</p>
      <p class="empty-hint">Run <code>npm run scrape:banks</code> to fetch the latest bank news.</p>
    </div>
  `
}

function escapeHtml(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

module.exports = { renderBankNewsPage }
