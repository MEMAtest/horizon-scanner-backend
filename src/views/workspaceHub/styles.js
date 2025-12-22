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
        align-items: center;
      }

      .header-actions .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
      }

      .workspace-hub-page .header-actions a.btn.btn-primary,
      .workspace-hub-page .header-actions a.btn.btn-primary:visited {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      /* Widgets Row */
      .widgets-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 20px;
      }

      .widgets-row.single {
        grid-template-columns: 1fr;
      }

      /* Widget Base Styles */
      .widget {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }

      .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        background: #f8fafc;
        border-bottom: 1px solid #f1f5f9;
      }

      .widget-header h3 {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 650;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .widget-icon {
        font-size: 1rem;
      }

      .widget-link {
        font-size: 0.75rem;
        color: #3b82f6;
        text-decoration: none;
        font-weight: 500;
      }

      .widget-link:hover {
        text-decoration: underline;
      }

      .widget-body {
        padding: 16px 18px;
      }

      /* Upcoming Events Widget - Event Cards */
      .event-cards {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .event-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        background: #f8fafc;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
        border: 1px solid transparent;
      }

      .event-card:hover {
        background: #f1f5f9;
        border-color: #e2e8f0;
      }

      .event-priority {
        font-size: 1rem;
        flex-shrink: 0;
      }

      .event-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .event-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .event-meta {
        font-size: 0.75rem;
        color: #64748b;
      }

      .empty-events {
        padding: 24px;
        text-align: center;
        color: #94a3b8;
        font-size: 0.85rem;
      }

      .widget-stats-row {
        display: flex;
        gap: 16px;
        padding-top: 12px;
        margin-top: 12px;
        border-top: 1px solid #f1f5f9;
      }

      .widget-stat {
        font-size: 0.8rem;
        color: #64748b;
      }

      .widget-stat.critical {
        color: #dc2626;
        font-weight: 500;
      }

      /* Bookmark Themes Widget - Stacked Bar */
      .stacked-bar {
        display: flex;
        height: 48px;
        border-radius: 8px;
        overflow: hidden;
        background: #f1f5f9;
      }

      .bar-segment {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        color: white;
        font-weight: 600;
        transition: filter 0.15s;
        cursor: default;
        padding: 4px;
      }

      .bar-segment:hover {
        filter: brightness(1.1);
      }

      .segment-label {
        font-size: 0.7rem;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }

      .segment-count {
        font-size: 0.65rem;
        opacity: 0.9;
      }

      .empty-themes {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 48px;
        color: #94a3b8;
        font-size: 0.85rem;
        background: #f8fafc;
        border-radius: 8px;
      }

      .widget-footer-stats {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f1f5f9;
        font-size: 0.8rem;
        color: #64748b;
        text-align: center;
      }

      /* Activity Graph Widget */
      .activity-graph-widget .widget-body {
        padding: 16px 18px 12px;
      }

      .activity-chart {
        position: relative;
        height: 100px;
        margin-bottom: 8px;
      }

      .chart-svg {
        width: 100%;
        height: 100%;
      }

      .grid-line {
        stroke: #e2e8f0;
        stroke-width: 1;
        stroke-dasharray: 4 4;
      }

      .chart-area {
        fill: url(#lineGradient);
      }

      .chart-line {
        fill: none;
        stroke: #3b82f6;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .chart-point {
        fill: #3b82f6;
        cursor: pointer;
      }

      .chart-point:hover {
        fill: #2563eb;
        r: 5;
      }

      .chart-labels {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 0.7rem;
        color: #94a3b8;
      }

      .chart-stats {
        display: flex;
        justify-content: center;
        gap: 24px;
        padding-top: 12px;
        border-top: 1px solid #f1f5f9;
      }

      .chart-stat {
        font-size: 0.8rem;
        color: #64748b;
      }

      .chart-stat strong {
        color: #0f172a;
        font-weight: 600;
      }

      /* Saved Searches Section - Bottom */
      .saved-searches-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 18px;
        margin-top: 20px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }

      .section-header h3 {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 650;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .search-cards-row {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding-bottom: 8px;
      }

      .search-card {
        flex: 0 0 180px;
        padding: 14px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        transition: all 0.15s;
      }

      .search-card:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }

      .search-card-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .search-card-meta {
        font-size: 0.7rem;
        color: #64748b;
        margin-bottom: 10px;
      }

      .search-card-actions {
        display: flex;
        gap: 6px;
      }

      .search-btn {
        padding: 6px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: white;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
      }

      .search-btn.run {
        color: #3b82f6;
      }

      .search-btn.run:hover {
        background: #dbeafe;
        border-color: #3b82f6;
      }

      .search-btn.alert {
        color: #d97706;
      }

      .search-btn.alert:hover {
        background: #fef3c7;
        border-color: #f59e0b;
      }

      .empty-searches {
        padding: 20px;
        text-align: center;
        color: #94a3b8;
        font-size: 0.85rem;
      }

      .section-hint {
        margin-top: 10px;
        font-size: 0.7rem;
        color: #94a3b8;
        text-align: center;
      }

      /* Hub Grid (Collections & Bookmarks) */
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
        padding: 16px 18px 14px;
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
        min-width: 200px;
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
        max-height: 400px;
        overflow-y: auto;
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

      .loading-placeholder {
        padding: 20px;
        text-align: center;
        color: #94a3b8;
        font-size: 0.85rem;
      }

      /* Responsive */
      @media (max-width: 1100px) {
        .widgets-row {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 980px) {
        .hub-grid {
          grid-template-columns: 1fr;
        }

        .hub-search {
          min-width: 160px;
        }

        .search-cards-row {
          flex-wrap: wrap;
        }

        .search-card {
          flex: 1 1 calc(50% - 6px);
          min-width: 150px;
        }
      }
    </style>
  `
}

module.exports = { getWorkspaceHubStyles }
