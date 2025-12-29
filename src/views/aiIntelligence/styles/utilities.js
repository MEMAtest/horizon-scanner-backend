function getUtilitiesStyles() {
  return `      .persona-intelligence {
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
      }`
}

module.exports = { getUtilitiesStyles }
