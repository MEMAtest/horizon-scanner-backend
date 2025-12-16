function applyDistributionMixin(klass) {
  Object.assign(klass.prototype, {
    async loadDistribution(options = {}) {
      try {
        const { years } = options
        const params = new URLSearchParams()

        if (Array.isArray(years) && years.length > 0) {
          params.set('years', years.join(','))
        }

        const url = '/api/enforcement/distribution' + (params.toString() ? '?' + params.toString() : '')
        const response = await fetch(url)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to load distribution data')
        }

        this.renderDistribution(data.distribution, options)
      } catch (error) {
        console.error('[distribution] Failed to load distribution:', error)
        this.renderDistributionError(error.message)
      }
    },

    renderDistribution(distribution, options = {}) {
      const chartCanvas = document.getElementById('distributionChart')
      const contextEl = document.getElementById('distribution-context')

      if (!chartCanvas || !contextEl) return

      if (!distribution || distribution.length === 0) {
        if (this.charts.distribution) {
          this.charts.distribution.destroy()
          this.charts.distribution = null
        }
        contextEl.textContent = 'No distribution data available.'
        return
      }

      // Sort by bucket_order to ensure correct display
      const sorted = [...distribution].sort((a, b) => (a.bucket_order || 0) - (b.bucket_order || 0))

      const labels = sorted.map(item => item.bucket)
      const counts = sorted.map(item => Number(item.count || 0))
      const amounts = sorted.map(item => Number(item.total_amount || 0))

      // Destroy existing chart if present
      if (this.charts.distribution) {
        this.charts.distribution.destroy()
      }

      const self = this

      this.charts.distribution = new Chart(chartCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Number of fines',
              data: counts,
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: '#3b82f6',
              borderWidth: 1,
              borderRadius: 6,
              yAxisID: 'y'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: function(event, elements) {
            if (elements.length > 0) {
              const index = elements[0].index
              const bucket = sorted[index]
              self.handleDistributionClick(bucket)
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Fines'
              },
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const index = context.dataIndex
                  const count = counts[index]
                  const amount = amounts[index]
                  const bucket = sorted[index]

                  const countText = count + ' fine' + (count !== 1 ? 's' : '')
                  const amountText = self.formatCurrency(amount)
                  const rangeText = 'Range: ' + self.formatCurrency(bucket.min_amount) + ' - ' + self.formatCurrency(bucket.max_amount)

                  return [countText, amountText, rangeText]
                }
              }
            }
          }
        }
      })

      // Update context text
      const totalFines = counts.reduce((sum, count) => sum + count, 0)
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0)

      const prefix = options.filterMode ? 'Filtered | ' : ''
      contextEl.textContent = prefix + totalFines + ' fines distributed | ' + this.formatCurrency(totalAmount) + ' total'
    },

    handleDistributionClick(bucket) {
      console.log('[distribution] Clicked bucket:', bucket)
      this.setChartFilter({
        type: 'amount_range',
        min: bucket.min_amount,
        max: bucket.max_amount,
        label: `Amount: ${bucket.bucket}`
      })
      this.loadStatsWithFilters(this.getCurrentFilterParams())
    },

    renderDistributionError(error) {
      const contextEl = document.getElementById('distribution-context')
      if (contextEl) {
        contextEl.textContent = 'Distribution unavailable: ' + error
      }
    }
  })
}

export { applyDistributionMixin }
