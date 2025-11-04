function getAiIntelligenceStyles() {
  return `
    <style>
      :root {
        --intelligence-navy: #0f172a;
        --intelligence-ink: #1e293b;
        --intelligence-slate: #334155;
        --intelligence-muted: #64748b;
        --intelligence-border: #e2e8f0;
        --intelligence-sky: #38bdf8;
        --intelligence-amber: #fbbf24;
        --intelligence-emerald: #10b981;
        --intelligence-danger: #ef4444;
      }

      .app-container {
        min-height: 100vh;
        background: #f8fafc;
        padding-left: 260px;
      }

      .main-content {
        padding: 36px 64px 80px;
        background: linear-gradient(180deg, #f8fafc 0%, #eef2f9 100%);
        max-width: 1540px;
        width: calc(100% - 80px);
        margin: 0 auto;
      }

      .hero-panel {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        color: var(--intelligence-slate);
      }

      .hero-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--intelligence-navy);
        letter-spacing: -0.015em;
      }

      .hero-date {
        display: block;
        margin-top: 4px;
        font-size: 0.95rem;
        color: var(--intelligence-muted);
      }

      .hero-insight {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.88));
        color: #f8fafc;
        padding: 32px;
        border-radius: 28px;
        margin-bottom: 28px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 220px;
        gap: 24px;
        position: relative;
        overflow: hidden;
      }

      .hero-insight::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(120% 80% at 20% 20%, rgba(56, 189, 248, 0.25), transparent 55%);
        pointer-events: none;
      }

      .hero-copy {
        position: relative;
        z-index: 1;
      }

      .hero-copy h1 {
        margin: 0 0 12px;
        font-size: 1.8rem;
        letter-spacing: -0.01em;
      }

      .hero-summary {
        margin: 0 0 16px;
        line-height: 1.6;
        color: rgba(248, 250, 252, 0.88);
      }

      .hero-recommendation {
        background: rgba(15, 23, 42, 0.35);
        border-radius: 16px;
        padding: 14px 16px;
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }

      .hero-recommendation strong {
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(248, 250, 252, 0.75);
      }

      .hero-related {
        margin: 18px 0 0;
        padding-left: 20px;
        color: rgba(248, 250, 252, 0.72);
      }

      .hero-meta {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
      }

      .hero-score {
        background: rgba(15, 23, 42, 0.45);
        border-radius: 18px;
        padding: 18px 20px;
        text-align: right;
        min-width: 180px;
      }

      .hero-score-label {
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(248, 250, 252, 0.7);
      }

      .hero-score-value {
        display: block;
        font-size: 2.4rem;
        font-weight: 700;
        margin-top: 6px;
        color: #f8fafc;
      }

      .hero-score-confidence {
        font-size: 0.75rem;
        color: rgba(248, 250, 252, 0.6);
      }

      .hero-transparency {
        background: rgba(248, 250, 252, 0.12);
        border: 1px solid rgba(248, 250, 252, 0.25);
        color: #f8fafc;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 0.75rem;
        cursor: pointer;
      }

      .export-btn {
        background: var(--intelligence-navy);
        color: #fff;
        border: none;
        padding: 12px 20px;
        border-radius: 999px;
        font-weight: 600;
        box-shadow: 0 20px 60px -28px rgba(15, 23, 42, 0.45);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .export-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 28px 70px -32px rgba(15, 23, 42, 0.5);
      }

      .risk-pulse {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 24px;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: #f8fafc;
        padding: 28px;
        border-radius: 24px;
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
      }

      .risk-pulse::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(60% 60% at 20% 20%, rgba(59, 130, 246, 0.35), transparent);
        pointer-events: none;
      }

      .pulse-gauge {
        width: 120px;
        height: 120px;
      }

      .pulse-gauge svg {
        width: 100%;
        height: 100%;
      }

      .pulse-track {
        fill: none;
        stroke: rgba(148, 163, 184, 0.3);
        stroke-width: 10;
      }

      .pulse-meter {
        fill: none;
        stroke: url(#pulseGradient);
        stroke-width: 10;
        stroke-linecap: round;
        transform-origin: 60px 60px;
        transform: rotate(-90deg);
      }

      .risk-pulse svg defs linearGradient {
        stop-color: var(--intelligence-sky);
      }

      .pulse-score {
        fill: #fff;
        font-size: 1.8rem;
        font-weight: 700;
        text-anchor: middle;
      }

      .pulse-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: relative;
        z-index: 1;
      }

      .pulse-label {
        font-size: 1.4rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .pulse-delta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.35);
      }

      .pulse-delta-icon::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 999px;
      }

      .pulse-delta.pulse-up .pulse-delta-icon::before {
        background: var(--intelligence-danger);
      }

      .pulse-delta.pulse-down .pulse-delta-icon::before {
        background: var(--intelligence-emerald);
      }

      .pulse-delta.pulse-flat .pulse-delta-icon::before {
        background: var(--intelligence-muted);
      }

      .pulse-focus {
        margin: 0;
        color: rgba(248, 250, 252, 0.82);
        line-height: 1.5;
      }

      .pulse-breakdown {
        margin-top: 12px;
        display: grid;
        gap: 6px;
        background: rgba(15, 23, 42, 0.35);
        border-radius: 12px;
        padding: 10px 12px;
      }

      .pulse-breakdown-title {
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(248, 250, 252, 0.7);
      }

      .pulse-breakdown-item {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        color: rgba(248, 250, 252, 0.78);
      }

      .quick-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin-bottom: 28px;
      }

      .quick-stat-card {
        background: #fff;
        padding: 18px;
        border-radius: 18px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        box-shadow: 0 16px 40px -30px rgba(15, 23, 42, 0.45);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .quick-stat-value {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--intelligence-navy);
      }

      .quick-stat-label {
        color: var(--intelligence-muted);
        font-size: 0.95rem;
      }

      .executive-summary {
        background: #fff;
        border-radius: 24px;
        padding: 28px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        box-shadow: 0 24px 60px -38px rgba(15, 23, 42, 0.4);
        margin-bottom: 28px;
      }

      .executive-summary header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .executive-summary h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--intelligence-navy);
      }

      .summary-refresh {
        background: none;
        border: 1px solid var(--intelligence-border);
        border-radius: 999px;
        padding: 8px 16px;
        color: var(--intelligence-slate);
        cursor: pointer;
        transition: border-color 0.2s ease;
      }

      .summary-refresh:hover {
        border-color: var(--intelligence-navy);
      }

      .executive-summary p {
        margin: 0;
        line-height: 1.6;
        color: var(--intelligence-slate);
        font-size: 1.02rem;
      }

      .streams-split {
        display: grid;
        grid-template-columns: minmax(360px, 1.35fr) minmax(300px, 0.75fr);
        gap: 28px;
        align-items: start;
        margin-bottom: 36px;
      }

      .priority-feed {
        background: #fff;
        border-radius: 28px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        padding: 28px;
        box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.35);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }

      .section-header h2 {
        margin: 0;
        font-size: 1.35rem;
        color: var(--intelligence-navy);
      }

      .priority-list {
        display: grid;
        gap: 16px;
        margin-top: 18px;
        max-height: 720px;
        overflow-y: auto;
        padding-right: 6px;
      }

      .priority-list::-webkit-scrollbar {
        width: 6px;
      }

      .priority-list::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.18);
        border-radius: 999px;
      }

      .action-sidebar {
        display: grid;
        gap: 24px;
      }

      .action-sidebar .stream-list {
        max-height: 420px;
        overflow-y: auto;
        padding-right: 6px;
      }

      .action-sidebar .stream-list::-webkit-scrollbar {
        width: 6px;
      }

      .action-sidebar .stream-list::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.15);
        border-radius: 999px;
      }

      .stream-column {
        background: #fff;
        border-radius: 24px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        padding: 24px;
        box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.35);
      }

      .stream-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
      }

      .stream-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: var(--intelligence-navy);
      }

      .stream-count {
        font-size: 0.95rem;
        color: var(--intelligence-muted);
      }

      .stream-list {
        display: grid;
        gap: 16px;
      }

      .stream-card {
        border: 1px solid rgba(226, 232, 240, 0.7);
        border-radius: 18px;
        padding: 20px;
        background: #fff;
        display: grid;
        gap: 12px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stream-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 30px 70px -42px rgba(15, 23, 42, 0.4);
      }

      .stream-card header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.95rem;
      }

      .card-authority {
        font-weight: 600;
        color: var(--intelligence-slate);
      }

      .card-urgency {
        padding: 4px 10px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.035em;
      }

      .urgency-high {
        background: rgba(239, 68, 68, 0.12);
        color: var(--intelligence-danger);
      }

      .urgency-medium {
        background: rgba(245, 158, 11, 0.16);
        color: var(--intelligence-amber);
      }

      .urgency-low {
        background: rgba(16, 185, 129, 0.12);
        color: var(--intelligence-emerald);
      }

      .stream-card h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .stream-card h3 a {
        color: var(--intelligence-navy);
        text-decoration: none;
      }

      .stream-card h3 a:hover {
        text-decoration: underline;
      }

      .card-summary {
        margin: 0;
        color: var(--intelligence-slate);
        line-height: 1.55;
      }

      .card-metadata {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 0.85rem;
        color: var(--intelligence-muted);
      }

      .persona-chip {
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
      }

      .persona-executive {
        background: rgba(251, 191, 36, 0.2);
        color: var(--intelligence-amber);
      }

      .persona-analyst {
        background: rgba(59, 130, 246, 0.18);
        color: var(--intelligence-sky);
      }

      .persona-operations {
        background: rgba(16, 185, 129, 0.18);
        color: var(--intelligence-emerald);
      }

      .sector-tag {
        background: rgba(148, 163, 184, 0.16);
        color: var(--intelligence-slate);
        padding: 2px 8px;
        border-radius: 8px;
        font-size: 0.75rem;
      }

      .card-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .card-next-step {
        font-size: 0.9rem;
        color: var(--intelligence-slate);
        font-weight: 500;
      }

      .card-buttons {
        display: inline-flex;
        gap: 8px;
      }

      .icon-btn {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        border: 1px solid var(--intelligence-border);
        background: #fff;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }

      .icon-btn:hover {
        background: rgba(15, 23, 42, 0.05);
        transform: translateY(-1px);
      }

      .icon-btn.pin-toggle {
        font-size: 1.2rem;
        line-height: 1;
        color: var(--intelligence-muted);
      }

      .icon-btn.pin-toggle.is-pinned {
        background: rgba(251, 191, 36, 0.18);
        border-color: rgba(251, 191, 36, 0.35);
        color: var(--intelligence-amber);
      }

      .persona-intelligence {
        background: #fff;
        border-radius: 24px;
        padding: 28px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.35);
        margin-bottom: 32px;
      }

      .persona-intelligence header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .persona-intelligence h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--intelligence-navy);
      }

      .persona-tabs {
        display: inline-flex;
        gap: 10px;
        background: rgba(15, 23, 42, 0.03);
        padding: 6px;
        border-radius: 999px;
      }

      .persona-tab {
        border: none;
        background: none;
        padding: 8px 16px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        color: var(--intelligence-muted);
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease;
      }

      .persona-tab.active {
        background: #fff;
        color: var(--intelligence-navy);
        box-shadow: 0 12px 30px -20px rgba(15, 23, 42, 0.35);
      }

      .persona-tab-count {
        font-size: 0.85rem;
        background: rgba(59, 130, 246, 0.14);
        color: var(--intelligence-sky);
        padding: 2px 10px;
        border-radius: 999px;
      }

      .persona-panels {
        position: relative;
      }

      .persona-panel {
        display: none;
        animation: fadeIn 0.24s ease;
      }

      .persona-panel.active {
        display: block;
      }

      .persona-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }

      .persona-metrics .metric-label {
        font-size: 0.85rem;
        color: var(--intelligence-muted);
      }

      .persona-metrics .metric-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--intelligence-navy);
      }

      .persona-briefing {
        background: rgba(15, 23, 42, 0.03);
        border-radius: 18px;
        padding: 18px;
        margin-top: 16px;
        display: grid;
        gap: 12px;
      }

      .persona-briefing p {
        margin: 0;
        color: var(--intelligence-slate);
      }

      .persona-brief-list {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 8px;
        color: var(--intelligence-slate);
      }

      .persona-empty {
        padding: 18px;
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.03);
        color: var(--intelligence-muted);
        text-align: center;
        font-size: 0.95rem;
      }

      .workspace-pulse {
        background: #fff;
        border-radius: 24px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.35);
        padding: 28px;
        margin-bottom: 28px;
      }

      .workspace-pulse header {
        margin-bottom: 16px;
      }

      .workspace-pulse h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--intelligence-navy);
      }

      .workspace-pulse p {
        margin: 6px 0 0;
        color: var(--intelligence-muted);
      }

      .workspace-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
      }

      .workspace-card {
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 16px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: #fff;
        cursor: pointer;
        text-align: left;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .workspace-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 30px 70px -40px rgba(15, 23, 42, 0.35);
      }

      .workspace-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--intelligence-navy);
      }

      .workspace-label {
        font-weight: 600;
        color: var(--intelligence-slate);
      }

      .workspace-meta {
        font-size: 0.85rem;
        color: var(--intelligence-muted);
      }

      .intelligence-timeline {
        background: #fff;
        border-radius: 24px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        padding: 28px;
        box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.35);
        margin-bottom: 32px;
      }

      .intelligence-timeline h2 {
        margin: 0 0 16px;
        color: var(--intelligence-navy);
      }

      .timeline-empty {
        color: var(--intelligence-muted);
      }

      .timeline-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 14px;
      }

      .timeline-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 14px 16px;
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.02);
      }

      .timeline-item strong {
        display: block;
        color: var(--intelligence-slate);
        margin-bottom: 4px;
      }

      .timeline-date {
        font-weight: 600;
        color: var(--intelligence-muted);
        min-width: 120px;
      }

      .timeline-high {
        border-left: 4px solid var(--intelligence-danger);
      }

      .timeline-medium {
        border-left: 4px solid var(--intelligence-amber);
      }

      .timeline-low {
        border-left: 4px solid var(--intelligence-emerald);
      }

      .emerging-themes {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.12));
        border-radius: 24px;
        padding: 24px;
        border: 1px solid rgba(59, 130, 246, 0.18);
        box-shadow: 0 24px 60px -40px rgba(59, 130, 246, 0.45);
      }

      .emerging-themes h2 {
        margin: 0 0 12px;
        color: var(--intelligence-navy);
      }

      .theme-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .theme-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.12);
        color: var(--intelligence-slate);
        font-weight: 600;
      }

      .theme-support {
        font-size: 0.75rem;
        font-weight: 500;
        background: rgba(15, 23, 42, 0.08);
        padding: 2px 8px;
        border-radius: 999px;
      }

      .intelligence-toast {
        position: fixed;
        right: 24px;
        bottom: 24px;
        padding: 12px 18px;
        border-radius: 12px;
        color: #fff;
        font-weight: 600;
        box-shadow: 0 18px 40px -28px rgba(15, 23, 42, 0.45);
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 0.18s ease, transform 0.18s ease;
        z-index: 9999;
      }

      .intelligence-toast.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .intelligence-toast-info {
        background: rgba(59, 130, 246, 0.92);
      }

      .intelligence-toast-success {
        background: rgba(16, 185, 129, 0.92);
      }

      .intelligence-toast-error {
        background: rgba(239, 68, 68, 0.92);
      }

      @media (max-width: 1200px) {
        .main-content {
          width: calc(100% - 48px);
        }

        .streams-split {
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }

        .hero-insight {
          grid-template-columns: minmax(0, 1fr);
        }

        .hero-meta {
          align-items: flex-start;
        }
      }

      @media (max-width: 1024px) {
        .app-container {
          padding-left: 0;
        }

        .main-content {
          margin: 0;
          width: 100%;
          padding: 32px 24px 80px;
        }

        .streams-split {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .risk-pulse {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .pulse-details {
          align-items: center;
        }

        .persona-tabs {
          width: 100%;
          flex-direction: column;
        }

        .persona-tab {
          width: 100%;
          justify-content: space-between;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    </style>
  `
}

module.exports = { getAiIntelligenceStyles }
