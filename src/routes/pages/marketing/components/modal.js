// Feature modal component and data
function getFeatureModal() {
  return `
    <div class="feature-modal-overlay" id="featureModal">
      <div class="feature-modal">
        <button class="modal-close" aria-label="Close modal">&times;</button>
        <div class="modal-header">
          <div class="modal-icon" id="modalIcon"></div>
          <h3 id="modalTitle">Feature Title</h3>
        </div>
        <div class="modal-demo" id="modalDemo"></div>
        <div class="modal-benefits">
          <h4>Key Benefits</h4>
          <ul id="modalBenefits"></ul>
        </div>
        <a class="btn primary" href="#demo">Book a Demo</a>
      </div>
    </div>
  `;
}

function getFeatureDataScript() {
  return `
    const featureData = {
      'horizon-scanning': {
        title: '24/7 Horizon Scanning',
        icon: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><circle cx="24" cy="24" r="12" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 2"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite"/></circle><circle cx="24" cy="24" r="4" fill="#2563eb"/><line x1="24" y1="24" x2="36" y2="18" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="4s" repeatCount="indefinite"/></line></svg>',
        demo: '<div class="demo-scanning"><div class="scan-radar"><div class="scan-line"></div><div class="scan-dot d1"></div><div class="scan-dot d2"></div><div class="scan-dot d3"></div></div><div class="scan-feed"><div class="scan-item"><span class="scan-reg">FCA</span><span class="scan-text">New guidance detected</span></div><div class="scan-item"><span class="scan-reg">PRA</span><span class="scan-text">Policy statement published</span></div><div class="scan-item"><span class="scan-reg">EBA</span><span class="scan-text">Consultation paper released</span></div></div></div>',
        benefits: [
          'Monitor 120+ regulators across UK, EU, APAC, and Americas',
          'Real-time RSS feeds and intelligent web scraping',
          'Automatic categorization by document type and topic',
          'Instant alerts when critical updates are detected',
          'Never miss a consultation deadline again'
        ]
      },
      'ai-summaries': {
        title: 'Intelligent AI Summaries',
        icon: '<svg viewBox="0 0 48 48"><rect x="8" y="12" width="32" height="24" rx="3" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/><path class="ai-typing" d="M14 20h20M14 26h14M14 32h18" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-dasharray="30" stroke-dashoffset="30"><animate attributeName="stroke-dashoffset" values="30;0" dur="1.5s" repeatCount="indefinite"/></path><circle cx="36" cy="10" r="6" fill="#2563eb"><animate attributeName="r" values="6;7;6" dur="1s" repeatCount="indefinite"/></circle><text x="36" y="13" text-anchor="middle" fill="white" font-size="8" font-weight="bold">AI</text></svg>',
        demo: '<div class="demo-ai"><div class="ai-input"><div class="ai-doc">50-page FCA guidance document</div><div class="ai-arrow">&#8594;</div></div><div class="ai-output"><div class="ai-summary-card"><div class="ai-badge high">High Impact</div><div class="ai-title">Consumer Duty Board Reporting</div><div class="ai-excerpt">Firms must demonstrate value assessments to boards quarterly. Key deadline: Q1 2025 implementation review.</div><div class="ai-sectors"><span>Retail Banking</span><span>Wealth Management</span></div></div></div></div>',
        benefits: [
          'Plain-English executive summaries in seconds',
          'Automatic impact scoring (High / Medium / Low)',
          'Sector relevance mapping to your business',
          'Key deadline extraction and calendar integration',
          'Board-ready briefings without the jargon'
        ]
      },
      'calendar': {
        title: 'Regulatory Calendar',
        icon: '<svg viewBox="0 0 48 48"><rect x="6" y="10" width="36" height="32" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><line x1="14" y1="6" x2="14" y2="14" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/><line x1="34" y1="6" x2="34" y2="14" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/><line x1="6" y1="20" x2="42" y2="20" stroke="#2563eb" stroke-width="2"/><circle cx="16" cy="28" r="3" fill="#ef4444"><animate attributeName="r" values="3;4;3" dur="1s" repeatCount="indefinite"/></circle><circle cx="32" cy="28" r="3" fill="#f59e0b"/><circle cx="24" cy="36" r="3" fill="#22c55e"/></svg>',
        demo: '<div class="demo-calendar"><div class="cal-month">January 2025</div><div class="cal-grid"><div class="cal-day">1</div><div class="cal-day">2</div><div class="cal-day deadline">3<span>FCA</span></div><div class="cal-day">4</div><div class="cal-day">5</div><div class="cal-day impl">6<span>PRA</span></div><div class="cal-day">7</div></div><div class="cal-legend"><span class="legend-item deadline">Consultation Deadline</span><span class="legend-item impl">Implementation Date</span></div></div>',
        benefits: [
          'Unified view of all regulatory deadlines',
          'Consultation close dates auto-populated',
          'Implementation milestones tracked',
          'Export to Outlook, Google, or iCal',
          'Team reminders and escalation alerts'
        ]
      },
      'watchlists': {
        title: 'Custom Watch Lists',
        icon: '<svg viewBox="0 0 48 48"><path d="M24 4L44 14v20L24 44 4 34V14L24 4z" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/><path d="M24 14v20M14 19v10M34 19v10" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="24" r="4" fill="#22c55e"><animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/></circle></svg>',
        demo: '<div class="demo-watchlist"><div class="wl-filter"><span class="wl-tag active">FCA</span><span class="wl-tag active">PRA</span><span class="wl-tag">EBA</span><span class="wl-tag">SEC</span></div><div class="wl-filter"><span class="wl-tag active">Consumer Duty</span><span class="wl-tag active">Capital</span><span class="wl-tag">AML</span></div><div class="wl-result"><div class="wl-count">12</div><div class="wl-label">Matching updates this week</div></div></div>',
        benefits: [
          'Filter by regulator, topic, or sector',
          'Create multiple watch lists for different teams',
          'Get notified only on what matters to you',
          'Reduce noise by 90% or more',
          'Share watch lists across your organization'
        ]
      },
      'dossiers': {
        title: 'Compliance Dossiers',
        icon: '<svg viewBox="0 0 48 48"><rect x="8" y="4" width="28" height="40" rx="3" fill="#e0e7ff" stroke="#6366f1" stroke-width="2"/><rect x="14" y="4" width="28" height="40" rx="3" fill="#eef2ff" stroke="#6366f1" stroke-width="2"/><path d="M20 16h16M20 24h12M20 32h14" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/><circle cx="38" cy="40" r="6" fill="#6366f1"><animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/></circle><path d="M36 40l2 2 4-4" stroke="white" stroke-width="2" fill="none"/></svg>',
        demo: '<div class="demo-dossier"><div class="dossier-card"><div class="dossier-title">Consumer Duty Evidence Pack</div><div class="dossier-items"><div class="dossier-item">FCA PS22/9 Final Rules</div><div class="dossier-item">Internal Gap Analysis</div><div class="dossier-item">Board Presentation Q3</div><div class="dossier-item">Implementation Tracker</div></div><div class="dossier-meta">Last updated: Today</div></div></div>',
        benefits: [
          'Build evidence-based case files',
          'Link related regulatory updates together',
          'Generate audit trails automatically',
          'Export to PDF for board reports',
          'Collaborate with annotations and comments'
        ]
      },
      'kanban': {
        title: 'Kanban Workflows',
        icon: '<svg viewBox="0 0 48 48"><rect x="4" y="8" width="12" height="32" rx="2" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/><rect x="18" y="8" width="12" height="32" rx="2" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/><rect x="32" y="8" width="12" height="32" rx="2" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/><rect x="6" y="14" width="8" height="6" rx="1" fill="#fecaca"><animate attributeName="y" values="14;20;14" dur="3s" repeatCount="indefinite"/></rect><rect x="20" y="16" width="8" height="6" rx="1" fill="#fde68a"/><rect x="34" y="12" width="8" height="6" rx="1" fill="#bbf7d0"/></svg>',
        demo: '<div class="demo-kanban"><div class="kanban-col"><div class="kanban-header red">To Review</div><div class="kanban-card">FCA consultation response</div><div class="kanban-card">PRA buffer assessment</div></div><div class="kanban-col"><div class="kanban-header yellow">In Progress</div><div class="kanban-card">Gap analysis update</div></div><div class="kanban-col"><div class="kanban-header green">Done</div><div class="kanban-card">Board briefing pack</div></div></div>',
        benefits: [
          'Track regulatory projects visually',
          'Assign tasks to team members',
          'Set due dates linked to deadlines',
          'Move items through your workflow',
          'Full audit trail of changes'
        ]
      },
      'analytics': {
        title: 'Analytics Dashboard',
        icon: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" stroke-width="4"/><path d="M24 6a18 18 0 0 1 18 18" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="3s" repeatCount="indefinite"/></path><circle cx="24" cy="24" r="8" fill="#2563eb"/></svg>',
        demo: '<div class="demo-analytics"><div class="analytics-chart"><div class="chart-bar b1" style="height:40%"></div><div class="chart-bar b2" style="height:70%"></div><div class="chart-bar b3" style="height:55%"></div><div class="chart-bar b4" style="height:85%"></div><div class="chart-bar b5" style="height:60%"></div></div><div class="analytics-stats"><div class="stat">+23% regulatory activity</div><div class="stat">15 high-impact updates</div></div></div>',
        benefits: [
          'Visualize regulatory trends over time',
          'Track enforcement action patterns',
          'See sector-specific activity heatmaps',
          'Export charts for presentations',
          'Benchmark against industry averages'
        ]
      },
      'digests': {
        title: 'Daily Digests',
        icon: '<svg viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="32" rx="4" fill="#fce7f3" stroke="#ec4899" stroke-width="2"/><path d="M6 16l18 12 18-12" fill="none" stroke="#ec4899" stroke-width="2"/><circle cx="38" cy="12" r="6" fill="#ef4444"><animate attributeName="r" values="6;7;6" dur="1s" repeatCount="indefinite"/></circle><text x="38" y="15" text-anchor="middle" fill="white" font-size="8" font-weight="bold">3</text></svg>',
        demo: '<div class="demo-digest"><div class="digest-email"><div class="digest-header"><span class="digest-from">RegCanary Daily</span><span class="digest-time">08:00</span></div><div class="digest-subject">Your regulatory briefing for today</div><div class="digest-preview"><div class="digest-item high">FCA: Consumer Duty clarification</div><div class="digest-item medium">PRA: Stress testing guidance</div><div class="digest-item low">EBA: Q&A update</div></div></div></div>',
        benefits: [
          'Morning briefing delivered to your inbox',
          'Prioritized by impact level',
          'Personalized to your watch lists',
          'One-click access to full details',
          'Never start the day unprepared'
        ]
      }
    };
  `;
}


module.exports = { getFeatureModal, getFeatureDataScript };
