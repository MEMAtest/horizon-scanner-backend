function getRegulatoryAnalyticsStyles(canaryStyles) {
  return `
        ${canaryStyles}
        .analytics-page {
          padding: 24px;
          min-height: 100vh;
          background: #f8fafc;
        }

        .analytics-header {
          margin-bottom: 24px;
        }

        .analytics-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .header-subtitle {
          color: #64748b;
          font-size: 0.9rem;
          margin: 4px 0 0 0;
        }

        /* Summary Cards */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .summary-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .summary-card-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }

        .summary-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-card-icon svg {
          width: 18px;
          height: 18px;
        }

        .summary-card-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .summary-card-change {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          margin-top: 8px;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .summary-card-change.positive {
          background: #f0fdf4;
          color: #16a34a;
        }

        .summary-card-change.negative {
          background: #fef2f2;
          color: #dc2626;
        }

        .summary-card-change.neutral {
          background: #f8fafc;
          color: #64748b;
        }

        /* Charts Grid */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        @media (max-width: 1200px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .chart-card.full-width {
          grid-column: 1 / -1;
        }

        .chart-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .chart-card-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .chart-card-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .chart-container {
          min-height: 300px;
        }

        /* Top Items Lists */
        .top-items-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 1200px) {
          .top-items-grid {
            grid-template-columns: 1fr;
          }
        }

        .top-items-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .top-items-header {
          margin-bottom: 16px;
        }

        .top-items-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .top-items-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .top-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .top-item:last-child {
          border-bottom: none;
        }

        .top-item-rank {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }

        .top-item-rank.gold {
          background: #fef3c7;
          color: #d97706;
        }

        .top-item-rank.silver {
          background: #f1f5f9;
          color: #64748b;
        }

        .top-item-rank.bronze {
          background: #ffedd5;
          color: #ea580c;
        }

        .top-item-name {
          flex: 1;
          font-weight: 500;
          color: #1e293b;
          font-size: 14px;
        }

        .top-item-stats {
          display: flex;
          gap: 16px;
        }

        .top-item-stat {
          text-align: right;
        }

        .top-item-stat-value {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .top-item-stat-label {
          font-size: 11px;
          color: #94a3b8;
        }

        .top-item-bar {
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        }

        .top-item-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        }

        /* Insights Panel */
        .insights-panel {
          background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
          border-radius: 12px;
          padding: 24px;
          margin-top: 24px;
          color: white;
        }

        .insights-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .insight-item {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
        }

        .insight-item-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .insight-item-icon svg {
          width: 16px;
          height: 16px;
        }

        .insight-item-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .insight-item-text {
          font-size: 13px;
          opacity: 0.9;
          line-height: 1.5;
        }

        /* Export buttons */
        .export-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .export-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .export-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .export-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          border-color: transparent;
        }

        .export-btn-primary:hover {
          opacity: 0.9;
          border-color: transparent;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
        }

        .export-btn svg {
          flex-shrink: 0;
        }

        /* Drill-down modal */
        .drilldown-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          justify-content: center;
          align-items: center;
        }

        .drilldown-modal.active {
          display: flex;
        }

        .drilldown-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .drilldown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .drilldown-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .drilldown-close {
          width: 32px;
          height: 32px;
          border: none;
          background: #f1f5f9;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .drilldown-close:hover {
          background: #e2e8f0;
          color: #374151;
        }

        .drilldown-body {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(80vh - 80px);
        }

        .drilldown-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .drilldown-item {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          transition: all 0.15s ease;
        }

        .drilldown-item:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .drilldown-item-title {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .drilldown-item-meta {
          font-size: 12px;
          color: #64748b;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .drilldown-item a {
          color: #3b82f6;
          text-decoration: none;
        }

        .drilldown-item a:hover {
          text-decoration: underline;
        }

        .drilldown-empty {
          text-align: center;
          color: #64748b;
          padding: 32px;
        }

        /* Clickable chart cursor */
        .chart-container canvas {
          cursor: pointer;
        }

        /* NEW: Hover highlight for interactive elements */
        .hover-highlight {
          transition: all 0.2s ease;
        }

        .hover-highlight:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #6366f1 !important;
        }
`
}

module.exports = { getRegulatoryAnalyticsStyles }
