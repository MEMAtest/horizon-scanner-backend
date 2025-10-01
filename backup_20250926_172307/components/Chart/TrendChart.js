// src/components/Chart/TrendChart.js
function render({ chartId, title }) {
  return `
    <div class="chart-card">
        <h3>${title}</h3>
        <canvas id="${chartId}"></canvas>
    </div>`
}

module.exports = { render }
