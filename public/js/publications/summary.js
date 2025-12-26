/**
 * Annual Summary Page JavaScript
 * Handles regeneration of AI summaries
 */

class SummaryPageController {
  constructor() {
    this.year = window.SUMMARY_YEAR
    this.hasSummary = window.HAS_SUMMARY
    this.regenerateBtn = document.getElementById('regenerate-btn')
    this.regenerateText = document.getElementById('regenerate-text')
    this.summaryContent = document.getElementById('summary-content')
    this.isLoading = false

    this.init()
  }

  init() {
    if (this.regenerateBtn) {
      this.regenerateBtn.addEventListener('click', () => this.regenerateSummary())
    }
  }

  async regenerateSummary() {
    if (this.isLoading) return

    this.setLoading(true)
    this.showLoadingState()

    try {
      // First, fetch the data for this year
      const dataResponse = await fetch(`/api/publications/summary/${this.year}/data`)
      if (!dataResponse.ok) {
        throw new Error('Failed to fetch year data')
      }
      const yearData = await dataResponse.json()

      if (!yearData.success || !yearData.data) {
        throw new Error('No data available for this year')
      }

      // Generate the summary using the API
      const generateResponse = await fetch(`/api/publications/summary/${this.year}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          yearData: yearData.data
        })
      })

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json()
        throw new Error(errorData.error || 'Failed to generate summary')
      }

      const result = await generateResponse.json()

      if (result.success && result.data && result.data.summary_html) {
        // Update the content
        this.summaryContent.innerHTML = result.data.summary_html
        this.hasSummary = true
        this.regenerateText.textContent = 'Regenerate Summary'
      } else {
        throw new Error('Invalid response from server')
      }

    } catch (error) {
      console.error('Error generating summary:', error)
      this.showErrorState(error.message)
    } finally {
      this.setLoading(false)
    }
  }

  setLoading(loading) {
    this.isLoading = loading
    if (loading) {
      this.regenerateBtn.classList.add('loading')
      this.regenerateBtn.disabled = true
      this.regenerateText.textContent = 'Generating...'
    } else {
      this.regenerateBtn.classList.remove('loading')
      this.regenerateBtn.disabled = false
      this.regenerateText.textContent = this.hasSummary ? 'Regenerate Summary' : 'Generate Summary'
    }
  }

  showLoadingState() {
    this.summaryContent.innerHTML = `
      <div class="summary-loading">
        <div class="loading-spinner-large"></div>
        <p class="loading-text">Generating Summary...</p>
        <p class="loading-subtext">
          Analyzing ${this.year} enforcement activity with AI. This may take a moment.
        </p>
      </div>
    `
  }

  showErrorState(message) {
    this.summaryContent.innerHTML = `
      <div class="summary-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
        <h3>Generation Failed</h3>
        <p>${message || 'An error occurred while generating the summary. Please try again.'}</p>
        <button class="retry-btn" onclick="summaryController.regenerateSummary()">
          Try Again
        </button>
      </div>
    `
  }
}

// Initialize when DOM is ready
let summaryController
document.addEventListener('DOMContentLoaded', () => {
  summaryController = new SummaryPageController()
})
