// Dashboard mockup component - interactive preview
function getDashboardMockup() {
  return `
    <div class="dashboard-mockup">
      <!-- Sidebar with tooltips -->
      <div class="mock-sidebar">
        <div class="mock-logo">
          <div class="mock-canary-icon"></div>
        </div>
        <div class="mock-nav-item active" data-tooltip="Dashboard">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </div>
        <div class="mock-nav-item" data-tooltip="Updates">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="mock-nav-item" data-tooltip="Calendar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div class="mock-nav-item" data-tooltip="Analytics">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
        </div>
        <div class="mock-nav-item" data-tooltip="Settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
      </div>

      <!-- Main content area -->
      <div class="mock-main">
        <!-- Header -->
        <div class="mock-header">
          <div class="mock-title"></div>
          <div class="mock-search"></div>
          <div class="mock-avatar"></div>
        </div>

        <!-- Stats row with labels -->
        <div class="mock-stats-row">
          <div class="mock-stat-card">
            <div class="mock-stat-icon blue">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
            </div>
            <div class="mock-stat-content">
              <div class="mock-stat-number">47</div>
              <div class="mock-stat-label">New Updates</div>
            </div>
          </div>
          <div class="mock-stat-card">
            <div class="mock-stat-icon yellow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
            </div>
            <div class="mock-stat-content">
              <div class="mock-stat-number">12</div>
              <div class="mock-stat-label">High Priority</div>
            </div>
          </div>
          <div class="mock-stat-card">
            <div class="mock-stat-icon green">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
            </div>
            <div class="mock-stat-content">
              <div class="mock-stat-number">8</div>
              <div class="mock-stat-label">Deadlines</div>
            </div>
          </div>
        </div>

        <!-- Charts row -->
        <div class="mock-charts-row">
          <!-- Bar chart - Updates by Regulator -->
          <div class="mock-chart bar-chart">
            <div class="chart-title">By Regulator</div>
            <div class="chart-bars">
              <div class="bar-row"><span class="bar-label">FCA</span><div class="bar-track"><div class="bar-fill fca" style="width:80%"></div></div><span class="bar-value">18</span></div>
              <div class="bar-row"><span class="bar-label">PRA</span><div class="bar-track"><div class="bar-fill pra" style="width:55%"></div></div><span class="bar-value">12</span></div>
              <div class="bar-row"><span class="bar-label">EBA</span><div class="bar-track"><div class="bar-fill eba" style="width:40%"></div></div><span class="bar-value">9</span></div>
              <div class="bar-row"><span class="bar-label">Other</span><div class="bar-track"><div class="bar-fill other" style="width:35%"></div></div><span class="bar-value">8</span></div>
            </div>
          </div>
          <!-- Donut chart - Impact Distribution -->
          <div class="mock-chart donut-chart">
            <div class="chart-title">Impact</div>
            <svg class="donut" viewBox="0 0 42 42">
              <circle class="donut-ring" cx="21" cy="21" r="15.9" fill="transparent" stroke="#e2e8f0" stroke-width="4"/>
              <circle class="donut-segment high" cx="21" cy="21" r="15.9" fill="transparent" stroke="#ef4444" stroke-width="4" stroke-dasharray="25 75" stroke-dashoffset="25"/>
              <circle class="donut-segment medium" cx="21" cy="21" r="15.9" fill="transparent" stroke="#f59e0b" stroke-width="4" stroke-dasharray="45 55" stroke-dashoffset="0"/>
              <circle class="donut-segment low" cx="21" cy="21" r="15.9" fill="transparent" stroke="#22c55e" stroke-width="4" stroke-dasharray="30 70" stroke-dashoffset="-45"/>
            </svg>
            <div class="donut-legend">
              <span class="legend-item high-legend">25%</span>
              <span class="legend-item med-legend">45%</span>
              <span class="legend-item low-legend">30%</span>
            </div>
          </div>
        </div>

        <!-- Updates feed -->
        <div class="mock-updates">
          <div class="mock-section-label">Latest Updates</div>
          <div class="mock-updates-track">
            ${getUpdateItems()}
          </div>
        </div>
      </div>

      <!-- Right panel with visible content -->
      <div class="mock-right-panel">
        <div class="mock-panel-title">Upcoming</div>
        <div class="mock-calendar">
          <div class="mock-cal-header">Jan 2025</div>
          <div class="mock-cal-grid">
            <div class="mock-cal-day">6</div>
            <div class="mock-cal-day">7</div>
            <div class="mock-cal-day deadline">8<span class="cal-dot red"></span></div>
            <div class="mock-cal-day">9</div>
            <div class="mock-cal-day deadline">10<span class="cal-dot yellow"></span></div>
            <div class="mock-cal-day">11</div>
            <div class="mock-cal-day deadline">12<span class="cal-dot green"></span></div>
          </div>
        </div>
        <div class="mock-ai-summary">
          <div class="mock-ai-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </div>
          <div class="mock-ai-content">
            <div class="mock-ai-text">3 high-impact updates need attention</div>
            <div class="mock-ai-link">View summary</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getUpdateItems() {
  const updates = [
    { num: 1, badge: 'high', title: 'Consumer Duty: Board reporting', tag: 'FCA', time: '2h' },
    { num: 2, badge: 'medium', title: 'Capital buffer requirements', tag: 'PRA', time: '4h' },
    { num: 3, badge: 'low', title: 'Loan origination guidelines', tag: 'EBA', time: '6h' },
    { num: 4, badge: 'high', title: 'MiFID II reporting updates', tag: 'ESMA', time: '8h' },
    { num: 5, badge: 'medium', title: 'Climate disclosure rules', tag: 'SEC', time: '12h' },
    { num: 6, badge: 'low', title: 'Digital asset framework', tag: 'MAS', time: '1d' }
  ];

  return updates.map(u => `
    <div class="mock-update-item update-${u.num}">
      <div class="mock-update-badge ${u.badge}"></div>
      <div class="mock-update-content">
        <div class="mock-update-title">${u.title}</div>
        <div class="mock-update-meta">
          <span class="mock-tag">${u.tag}</span>
          <span class="mock-time">${u.time}</span>
        </div>
      </div>
      <div class="mock-update-actions">
        <button class="mock-bookmark" title="Bookmark"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
        <button class="mock-share" title="Share"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
      </div>
    </div>
  `).join('');
}

function getFloatingCards() {
  return `
    <div class="floating-card alert-card">
      <div class="card-icon alert-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div class="card-content">
        <strong>High Impact Alert</strong>
        <span>FCA Consumer Duty deadline</span>
      </div>
    </div>

    <div class="floating-card delivery-card">
      <div class="card-icon delivery-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <div class="card-content">
        <strong>Intelligence Delivered</strong>
        <span>15 updates tagged for you</span>
      </div>
    </div>

    <div class="floating-card ai-card">
      <div class="card-icon ai-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
      </div>
      <div class="card-content">
        <strong>AI Analysis Complete</strong>
        <span>Impact: Significant</span>
      </div>
    </div>
  `;
}


module.exports = { getDashboardMockup, getFloatingCards };
