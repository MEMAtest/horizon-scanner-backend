function getHandbookStyles() {
  return `
    <style>
      .handbook-page {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .page-header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .page-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .page-header .subtitle {
        color: #64748b;
        margin: 4px 0 0;
        font-size: 0.9rem;
      }

      .ingest-status {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 999px;
        padding: 6px 14px;
        font-size: 12px;
        color: #334155;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .handbook-controls {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        align-items: flex-end;
        margin-bottom: 16px;
      }

      .control-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 220px;
      }

      .control-group label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
        font-weight: 600;
      }

      .control-group select,
      .control-group input {
        padding: 9px 12px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        font-size: 14px;
        background: white;
      }

      .control-group select:focus,
      .control-group input:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      }

      .search-group {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        min-width: 260px;
      }

      .handbook-layout {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 16px;
        align-items: stretch;
      }

      .handbook-panel {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        display: flex;
        flex-direction: column;
        min-height: 520px;
      }

      .panel-header {
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        font-weight: 600;
        color: #0f172a;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .panel-header .meta {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 500;
      }

      .panel-body {
        padding: 16px;
        overflow: auto;
        flex: 1;
      }

      .outline-chapter {
        margin-bottom: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        overflow: hidden;
      }

      .chapter-toggle {
        width: 100%;
        text-align: left;
        background: #f8fafc;
        border: none;
        padding: 10px 12px;
        font-weight: 600;
        color: #0f172a;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        cursor: pointer;
      }

      .chapter-toggle span {
        font-size: 13px;
      }

      .chapter-toggle .chapter-title {
        color: #64748b;
        font-weight: 500;
      }

      .section-list {
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .section-list.is-collapsed {
        display: none;
      }

      .section-item {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 8px 10px;
        font-size: 13px;
        text-align: left;
        color: #1f2937;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .section-item .section-title {
        font-size: 12px;
        color: #64748b;
      }

      .section-item:hover {
        border-color: #c7d2fe;
        background: #eef2ff;
      }

      .section-item.active {
        border-color: #6366f1;
        background: #eef2ff;
        color: #1e1b4b;
      }

      .content-placeholder {
        color: #64748b;
        font-size: 14px;
      }

      .content-header-title {
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
      }

      .content-subtitle {
        font-size: 12px;
        color: #94a3b8;
      }

      .provision {
        padding: 12px 0;
        border-bottom: 1px solid #e5e7eb;
      }

      .provision:last-child {
        border-bottom: none;
      }

      .provision-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .provision-ref {
        font-weight: 600;
        font-size: 13px;
        color: #1e293b;
      }

      .provision-body {
        color: #334155;
        font-size: 14px;
        line-height: 1.6;
      }

      .provision-body p {
        margin: 0 0 10px;
      }

      .provision-body a {
        color: #4f46e5;
        text-decoration: none;
      }

      .provision-body a:hover {
        text-decoration: underline;
      }

      .handbook-search-results {
        margin-bottom: 16px;
        display: none;
      }

      .handbook-search-results.active {
        display: block;
      }

      .search-result {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 10px 12px;
        margin-bottom: 8px;
        cursor: pointer;
        background: white;
        text-align: left;
      }

      .search-result:hover {
        border-color: #c7d2fe;
        background: #eef2ff;
      }

      .search-result-title {
        font-weight: 600;
        font-size: 13px;
        color: #0f172a;
      }

      .search-result-meta {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 2px;
      }

      .status-pill {
        background: #e2e8f0;
        color: #334155;
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .status-pill.ok {
        background: #dcfce7;
        color: #166534;
      }

      .loading-state {
        color: #64748b;
        font-size: 14px;
      }

      @media (max-width: 1100px) {
        .handbook-layout {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `
}

module.exports = { getHandbookStyles }
