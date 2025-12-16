function applyHeatmapMixin(klass) {
  Object.assign(klass.prototype, {
    async loadHeatmap(options = {}) {
      try {
        const { years } = options
        const params = new URLSearchParams()

        if (Array.isArray(years) && years.length > 0) {
          params.set('years', years.join(','))
        }

        const url = '/api/enforcement/heatmap' + (params.toString() ? '?' + params.toString() : '')
        const response = await fetch(url)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to load heatmap data')
        }

        this.renderHeatmap(data.heatmap, options)
      } catch (error) {
        console.error('[heatmap] Failed to load heatmap:', error)
        this.renderHeatmapError(error.message)
      }
    },

    renderHeatmap(heatmapData, options = {}) {
      const chartCanvas = document.getElementById('heatmapChart')
      const contextEl = document.getElementById('heatmap-context')
      const legendEl = document.getElementById('heatmap-legend')

      if (!chartCanvas || !contextEl) return

      if (!heatmapData || heatmapData.length === 0) {
        if (this.charts.heatmap) {
          this.charts.heatmap.destroy()
          this.charts.heatmap = null
        }
        contextEl.textContent = 'No heatmap data available.'
        if (legendEl) legendEl.innerHTML = ''
        return
      }

      // Extract unique years and categories
      const years = [...new Set(heatmapData.map(item => parseInt(item.year)))].sort((a, b) => a - b)
      const categories = [...new Set(heatmapData.map(item => item.category))].sort()

      // Transform to matrix format: { x: year, y: category, v: count }
      const matrixData = heatmapData.map(item => ({
        x: parseInt(item.year),
        y: item.category,
        v: parseInt(item.count || 0),
        amount: parseFloat(item.total_amount || 0)
      }))

      // Calculate max count for color scaling
      const maxCount = Math.max(...matrixData.map(d => d.v), 1)

      // Destroy existing chart
      if (this.charts.heatmap) {
        this.charts.heatmap.destroy()
      }

      const self = this

      this.charts.heatmap = new Chart(chartCanvas, {
        type: 'matrix',
        data: {
          datasets: [{
            label: 'Fines by Category & Year',
            data: matrixData,
            backgroundColor(context) {
              const value = context.dataset.data[context.dataIndex].v
              const intensity = value / maxCount
              // Blue-purple gradient
              const r = Math.floor(59 + (124 - 59) * intensity)
              const g = Math.floor(130 + (58 - 130) * intensity)
              const b = Math.floor(246 + (237 - 246) * intensity)
              return `rgba(${r}, ${g}, ${b}, ${0.4 + intensity * 0.6})`
            },
            borderColor: '#e2e8f0',
            borderWidth: 1,
            width: ({ chart }) => (chart.chartArea || {}).width / years.length - 1,
            height: ({ chart }) => (chart.chartArea || {}).height / categories.length - 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: function(event, elements) {
            if (elements.length > 0) {
              const dataPoint = elements[0].element.$context.raw
              self.handleHeatmapClick(dataPoint)
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: function(context) {
                  const dataPoint = context[0].raw
                  return `${dataPoint.y} - ${dataPoint.x}`
                },
                label: function(context) {
                  const dataPoint = context.raw
                  const countText = dataPoint.v + ' fine' + (dataPoint.v !== 1 ? 's' : '')
                  const amountText = self.formatCurrency(dataPoint.amount)
                  return [countText, 'Total: ' + amountText]
                }
              }
            }
          },
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              offset: true,
              ticks: {
                stepSize: 1,
                callback: function(value) {
                  return Number.isInteger(value) ? value : ''
                }
              },
              grid: {
                display: false
              },
              title: {
                display: true,
                text: 'Year'
              }
            },
            y: {
              type: 'category',
              labels: categories,
              offset: true,
              grid: {
                display: false
              },
              title: {
                display: true,
                text: 'Breach Category'
              }
            }
          }
        }
      })

      // Update context
      const prefix = options.filterMode ? 'Filtered | ' : ''
      contextEl.textContent = prefix + `${years.length} years × ${categories.length} categories | Click any cell to filter`

      // Render legend
      if (legendEl) {
        legendEl.innerHTML = `
          <div class="heatmap-legend">
            <span class="legend-label">Low</span>
            <div class="legend-gradient"></div>
            <span class="legend-label">High (${maxCount} fines)</span>
          </div>
        `
      }
    },

    handleHeatmapClick(dataPoint) {
      console.log('[heatmap] Clicked cell:', dataPoint)
      this.setChartFilter({
        type: 'year_category',
        year: dataPoint.x,
        category: dataPoint.y,
        label: `${dataPoint.y} in ${dataPoint.x}`
      })
      this.loadStatsWithFilters(this.getCurrentFilterParams())
    },

    renderHeatmapError(error) {
      const contextEl = document.getElementById('heatmap-context')
      if (contextEl) {
        contextEl.textContent = 'Heatmap unavailable: ' + error
      }
    }
  })
}

export { applyHeatmapMixin }
