function getWorkspaceHubStyles() {
  return `
    <style>
      .workspace-hub-page {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
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

	      .header-actions {
	        display: flex;
	        flex-wrap: wrap;
	        gap: 10px;
	      }

	      .workspace-hub-page .header-actions a.btn {
	        font-weight: 600;
	      }

	      .workspace-hub-page .header-actions a.btn.btn-primary,
	      .workspace-hub-page .header-actions a.btn.btn-primary:visited {
	        color: #ffffff !important;
	        -webkit-text-fill-color: #ffffff !important;
	      }

	      .stats-grid {
	        display: grid;
	        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	        gap: 16px;
	        margin-bottom: 24px;
      }

      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }

      .stat-card .stat-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        font-size: 18px;
      }

      .stat-card .stat-icon.blue { background: #dbeafe; color: #2563eb; }
      .stat-card .stat-icon.green { background: #d1fae5; color: #059669; }
      .stat-card .stat-icon.purple { background: #ede9fe; color: #7c3aed; }
      .stat-card .stat-icon.amber { background: #fef3c7; color: #d97706; }

      .stat-card .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: var(--text-primary, #1a1a2e);
        line-height: 1;
      }

      .stat-card .stat-label {
        color: var(--text-secondary, #6b7280);
        font-size: 13px;
        margin-top: 4px;
      }

      .hub-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 20px;
        align-items: start;
      }

      .hub-panel {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 18px 18px 14px;
        border-bottom: 1px solid #eef2f7;
        background: #fafafa;
        align-items: flex-start;
      }

      .panel-header h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 650;
        color: #111827;
      }

      .panel-subtitle {
        margin: 4px 0 0;
        color: #6b7280;
        font-size: 12px;
      }

      .panel-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .hub-search {
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 13px;
        min-width: 220px;
        background: white;
      }

      .hub-search:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      }

      .collections-list,
      .bookmarks-list {
        padding: 12px;
      }

      .collection-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 10px;
        padding: 10px 12px;
        cursor: pointer;
        margin-bottom: 10px;
      }

      .collection-item:hover {
        border-color: #cbd5e1;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      }

      .collection-item.active {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      }

      .collection-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .collection-name {
        font-weight: 600;
        color: #111827;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .collection-hint {
        font-size: 11px;
        color: #6b7280;
      }

      .collection-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }

      .collection-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 22px;
        border-radius: 999px;
        padding: 0 8px;
        background: #eef2ff;
        color: #4338ca;
        font-size: 12px;
        font-weight: 600;
      }

      .bookmark-card {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 14px;
        background: white;
        margin-bottom: 12px;
      }

      .bookmark-card-header {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: flex-start;
      }

      .bookmark-title {
        font-weight: 650;
        color: #111827;
        font-size: 14px;
        text-decoration: none;
      }

      .bookmark-title:hover {
        text-decoration: underline;
      }

      .bookmark-meta {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 6px;
        font-size: 12px;
        color: #6b7280;
      }

      .bookmark-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
      }

      .bookmark-actions select {
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 6px 8px;
        font-size: 12px;
        background: white;
      }

      .empty-state {
        padding: 24px 16px;
        text-align: center;
        color: #6b7280;
      }

      @media (max-width: 980px) {
        .hub-grid {
          grid-template-columns: 1fr;
        }

        .hub-search {
          min-width: 180px;
        }
      }
    </style>
  `
}

module.exports = { getWorkspaceHubStyles }
