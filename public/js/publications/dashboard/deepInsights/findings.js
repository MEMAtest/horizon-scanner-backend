export function renderCommonFindings() {
  const container = document.getElementById('common-findings-list')
  if (!container) return

  if (!this.commonFindings || this.commonFindings.length === 0) {
    container.innerHTML = '<div class="empty-deep">No findings data available</div>'
    return
  }

  const maxFreq = this.commonFindings[0]?.frequency || 1

  container.innerHTML = this.commonFindings.slice(0, 8).map((item, i) => {
    const widthPercent = (item.frequency / maxFreq * 100).toFixed(0)
    return `
          <div class="finding-item">
            <div class="finding-rank">${i + 1}</div>
            <div class="finding-content">
              <div class="finding-text">${this.escapeHtml(item.finding)}</div>
              <div class="finding-bar-wrap">
                <div class="finding-bar" style="width: ${widthPercent}%"></div>
              </div>
            </div>
            <div class="finding-count">${item.frequency}</div>
          </div>
        `
  }).join('')
}
