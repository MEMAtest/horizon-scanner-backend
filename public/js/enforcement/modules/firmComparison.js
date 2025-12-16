/**
 * Firm Comparison Module
 * Handles firm autocomplete, selection chips, comparison table, and chart
 */

function applyFirmComparisonMixin(klass) {
  Object.assign(klass.prototype, {

    // State management
    selectedFirmsForComparison: [],
    firmSearchResults: [],
    comparisonData: null,
    comparisonChart: null,

    /**
     * Initialize firm comparison section
     */
    initFirmComparison() {
      const searchInput = document.getElementById('firm-comparison-search')
      const resultsContainer = document.getElementById('firm-search-results')
      const selectedChipsContainer = document.getElementById('selected-firms-chips')
      const compareBtn = document.getElementById('compare-firms-btn')
      const clearBtn = document.getElementById('clear-comparison-btn')

      if (!searchInput || !resultsContainer || !selectedChipsContainer || !compareBtn) {
        console.warn('[firm-comparison] Required elements not found')
        return
      }

      // Debounced search
      let searchTimeout
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout)
        const query = e.target.value.trim()

        if (query.length < 2) {
          resultsContainer.innerHTML = ''
          resultsContainer.style.display = 'none'
          return
        }

        searchTimeout = setTimeout(() => {
          this.searchFirms(query)
        }, 300)
      })

      // Click outside to close results
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
          resultsContainer.style.display = 'none'
        }
      })

      // Compare button
      compareBtn.addEventListener('click', () => {
        this.performFirmComparison()
      })

      // Clear button
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearFirmComparison()
        })
      }

      console.log('[firm-comparison] Firm comparison initialized')
    },

    /**
     * Search firms with autocomplete
     */
    async searchFirms(query) {
      try {
        const response = await fetch(`/api/enforcement/distinct-firms?q=${encodeURIComponent(query)}&limit=10`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to search firms')
        }

        this.firmSearchResults = data.firms
        this.renderSearchResults()

      } catch (error) {
        console.error('[firm-comparison] Search error:', error)
        const resultsContainer = document.getElementById('firm-search-results')
        if (resultsContainer) {
          resultsContainer.innerHTML = '<div class="firm-search-error">Search failed. Please try again.</div>'
          resultsContainer.style.display = 'block'
        }
      }
    },

    /**
     * Render autocomplete search results
     */
    renderSearchResults() {
      const resultsContainer = document.getElementById('firm-search-results')
      if (!resultsContainer) return

      if (this.firmSearchResults.length === 0) {
        resultsContainer.innerHTML = '<div class="firm-search-no-results">No firms found</div>'
        resultsContainer.style.display = 'block'
        return
      }

      const html = this.firmSearchResults.map(firm => {
        const isSelected = this.selectedFirmsForComparison.includes(firm.firm_name)
        const isDisabled = !isSelected && this.selectedFirmsForComparison.length >= 3

        return `
          <div class="firm-search-result ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
               data-firm="${this.escapeHtml(firm.firm_name)}"
               ${isDisabled ? '' : 'onclick="dashboard.selectFirmForComparison(this)"'}>
            <div class="firm-search-result-name">${this.escapeHtml(firm.firm_name)}</div>
            <div class="firm-search-result-meta">
              ${firm.fine_count} fine${firm.fine_count === 1 ? '' : 's'} • £${this.formatCurrency(firm.total_amount || 0)}
            </div>
            ${isSelected ? '<div class="firm-search-result-badge">Selected</div>' : ''}
            ${isDisabled ? '<div class="firm-search-result-badge-disabled">Max 3 firms</div>' : ''}
          </div>
        `
      }).join('')

      resultsContainer.innerHTML = html
      resultsContainer.style.display = 'block'
    },

    /**
     * Select a firm for comparison (called from onclick)
     */
    selectFirmForComparison(element) {
      const firmName = element.dataset.firm

      if (!firmName) return

      // Check if already selected
      if (this.selectedFirmsForComparison.includes(firmName)) {
        // Deselect
        this.selectedFirmsForComparison = this.selectedFirmsForComparison.filter(f => f !== firmName)
      } else {
        // Select (max 3)
        if (this.selectedFirmsForComparison.length >= 3) {
          return
        }
        this.selectedFirmsForComparison.push(firmName)
      }

      this.renderSelectedChips()
      this.renderSearchResults() // Re-render to update selected state
      this.updateCompareButton()
    },

    /**
     * Render selected firm chips
     */
    renderSelectedChips() {
      const container = document.getElementById('selected-firms-chips')
      if (!container) return

      if (this.selectedFirmsForComparison.length === 0) {
        container.innerHTML = '<div class="no-firms-selected">Select up to 3 firms to compare</div>'
        return
      }

      const html = this.selectedFirmsForComparison.map(firm => `
        <div class="firm-chip">
          <span class="firm-chip-name">${this.escapeHtml(firm)}</span>
          <button class="firm-chip-remove" onclick="dashboard.removeFirmFromComparison('${this.escapeHtml(firm)}')" title="Remove">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
      `).join('')

      container.innerHTML = html
    },

    /**
     * Remove a firm from comparison
     */
    removeFirmFromComparison(firmName) {
      this.selectedFirmsForComparison = this.selectedFirmsForComparison.filter(f => f !== firmName)
      this.renderSelectedChips()
      this.renderSearchResults()
      this.updateCompareButton()
    },

    /**
     * Update compare button state
     */
    updateCompareButton() {
      const compareBtn = document.getElementById('compare-firms-btn')
      if (!compareBtn) return

      if (this.selectedFirmsForComparison.length >= 2) {
        compareBtn.disabled = false
      } else {
        compareBtn.disabled = true
      }
    },

    /**
     * Perform firm comparison
     */
    async performFirmComparison() {
      if (this.selectedFirmsForComparison.length < 2) {
        alert('Please select at least 2 firms to compare')
        return
      }

      try {
        const firmsParam = this.selectedFirmsForComparison.join(',')
        const response = await fetch(`/api/enforcement/compare-firms?firms=${encodeURIComponent(firmsParam)}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to compare firms')
        }

        this.comparisonData = data.firms
        this.renderComparisonResults()

      } catch (error) {
        console.error('[firm-comparison] Comparison error:', error)
        alert('Failed to compare firms. Please try again.')
      }
    },

    /**
     * Render comparison results (table + chart)
     */
    renderComparisonResults() {
      const resultsContainer = document.getElementById('comparison-results')
      if (!resultsContainer) return

      resultsContainer.innerHTML = `
        <div class="comparison-table-wrapper">
          ${this.renderComparisonTable()}
        </div>
        <div class="comparison-chart-wrapper">
          <canvas id="firm-comparison-chart"></canvas>
        </div>
      `

      resultsContainer.style.display = 'block'
      this.renderComparisonChart()
    },

    /**
     * Render comparison table
     */
    renderComparisonTable() {
      if (!this.comparisonData || this.comparisonData.length === 0) {
        return '<div class="no-comparison-data">No comparison data available</div>'
      }

      const headers = ['Metric', ...this.comparisonData.map(f => this.escapeHtml(f.firm_name))]

      const rows = [
        {
          label: 'Total Fines',
          values: this.comparisonData.map(f => f.fine_count || 0)
        },
        {
          label: 'Total Amount',
          values: this.comparisonData.map(f => `£${this.formatCurrency(f.total_amount || 0)}`)
        },
        {
          label: 'Average Fine',
          values: this.comparisonData.map(f => `£${this.formatCurrency(f.avg_amount || 0)}`)
        },
        {
          label: 'Average Risk Score',
          values: this.comparisonData.map(f => f.average_risk ? f.average_risk.toFixed(1) : 'N/A')
        },
        {
          label: 'First Fine',
          values: this.comparisonData.map(f => f.first_fine_date ? new Date(f.first_fine_date).getFullYear() : 'N/A')
        },
        {
          label: 'Latest Fine',
          values: this.comparisonData.map(f => f.latest_fine_date ? new Date(f.latest_fine_date).getFullYear() : 'N/A')
        }
      ]

      return `
        <table class="comparison-table">
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td class="metric-label">${row.label}</td>
                ${row.values.map(v => `<td>${v}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    },

    /**
     * Render comparison chart (grouped bar chart by year)
     */
    renderComparisonChart() {
      const canvas = document.getElementById('firm-comparison-chart')
      if (!canvas) return

      // Destroy existing chart
      if (this.comparisonChart) {
        this.comparisonChart.destroy()
      }

      // Gather all years across all firms
      const yearsSet = new Set()
      this.comparisonData.forEach(firm => {
        if (firm.yearly_breakdown) {
          firm.yearly_breakdown.forEach(y => yearsSet.add(y.year))
        }
      })

      const years = Array.from(yearsSet).sort()

      // Build datasets for each firm
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      const datasets = this.comparisonData.map((firm, index) => {
        const yearlyMap = {}
        if (firm.yearly_breakdown) {
          firm.yearly_breakdown.forEach(y => {
            yearlyMap[y.year] = y.total_amount || 0
          })
        }

        return {
          label: firm.firm_name,
          data: years.map(year => yearlyMap[year] || 0),
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length],
          borderWidth: 1
        }
      })

      const ctx = canvas.getContext('2d')
      this.comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: years,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2.5,
          plugins: {
            title: {
              display: true,
              text: 'Yearly Fine Amounts by Firm',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.parsed.y || 0
                  return `${context.dataset.label}: £${this.formatCurrency(value)}`
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Year'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Fine Amount (£)'
              },
              ticks: {
                callback: (value) => '£' + this.formatCurrency(value)
              }
            }
          }
        }
      })
    },

    /**
     * Clear comparison results
     */
    clearFirmComparison() {
      this.selectedFirmsForComparison = []
      this.comparisonData = null

      // Clear UI
      this.renderSelectedChips()
      this.updateCompareButton()

      const resultsContainer = document.getElementById('comparison-results')
      if (resultsContainer) {
        resultsContainer.innerHTML = ''
        resultsContainer.style.display = 'none'
      }

      const searchInput = document.getElementById('firm-comparison-search')
      if (searchInput) {
        searchInput.value = ''
      }

      const searchResults = document.getElementById('firm-search-results')
      if (searchResults) {
        searchResults.innerHTML = ''
        searchResults.style.display = 'none'
      }

      if (this.comparisonChart) {
        this.comparisonChart.destroy()
        this.comparisonChart = null
      }
    },

    /**
     * Helper: Escape HTML
     */
    escapeHtml(text) {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }

  })
}

export { applyFirmComparisonMixin }
