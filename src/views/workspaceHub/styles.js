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

      .widget-controls {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .widget-toggle {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px;
        border-radius: 999px;
        background: #e2e8f0;
      }

      .widget-toggle-btn {
        border: none;
        background: transparent;
        color: #64748b;
        font-size: 0.72rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 999px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .widget-toggle-btn.active {
        background: #ffffff;
        color: #0f172a;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.15);
      }

      .widget-toggle-btn:focus-visible {
        outline: 2px solid rgba(59, 130, 246, 0.5);
        outline-offset: 2px;
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

      .widget-stat-tooltip {
        position: relative;
        cursor: help;
      }

      .widget-stat-tooltip::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: calc(100% + 8px);
        left: 0;
        min-width: 180px;
        max-width: 260px;
        max-height: 220px;
        padding: 8px 10px;
        border-radius: 8px;
        background: #0f172a;
        color: #f8fafc;
        font-size: 0.72rem;
        line-height: 1.4;
        white-space: pre-line;
        overflow-y: auto;
        opacity: 0;
        transform: translateY(4px);
        pointer-events: none;
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
        z-index: 5;
        transition: opacity 0.15s ease, transform 0.15s ease;
      }

      .widget-stat-tooltip:hover::after,
      .widget-stat-tooltip:focus::after {
        opacity: 1;
        transform: translateY(0);
      }

      .widget-stat-link {
        margin-left: auto;
        font-size: 0.8rem;
        font-weight: 600;
        color: #2563eb;
        text-decoration: none;
      }

      .widget-stat-link:hover {
        text-decoration: underline;
      }

      .widget-stat-link:focus-visible {
        outline: 2px solid #93c5fd;
        outline-offset: 2px;
        border-radius: 6px;
      }

      /* Chart.js Container Styles */
      .chart-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      }

      .chart-container {
        position: relative;
      }

      .chart-container canvas {
        width: 100% !important;
        height: 100% !important;
      }

      /* Bookmark Themes Widget */
      .bookmark-themes-widget .chart-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
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

      .events-view {
        display: none;
      }

      .events-view.active {
        display: block;
      }

      .events-calendar-wrap {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
      }

      .calendar-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: #0f172a;
      }

      .calendar-subtitle {
        font-size: 0.7rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 6px;
        font-size: 0.65rem;
        text-transform: uppercase;
        color: #94a3b8;
        letter-spacing: 0.08em;
        text-align: center;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 6px;
      }

      .calendar-cell {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 6px;
        min-height: 48px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }

      .calendar-cell.today {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
      }

      .calendar-cell.muted {
        background: #f8fafc;
        color: #94a3b8;
      }

      .calendar-date {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.72rem;
        font-weight: 600;
        color: inherit;
      }

      .calendar-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        border-radius: 999px;
        background: #e2e8f0;
        color: #0f172a;
        font-size: 0.65rem;
        font-weight: 600;
      }

      .calendar-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #cbd5f5;
      }

      .calendar-dot.empty {
        background: #e2e8f0;
      }

      .calendar-dot.priority-critical {
        background: #dc2626;
      }

      .calendar-dot.priority-high {
        background: #ea580c;
      }

      .calendar-dot.priority-medium {
        background: #ca8a04;
      }

      .calendar-dot.priority-low {
        background: #16a34a;
      }

      /* Activity Graph Widget */
      .activity-graph-widget .widget-body {
        padding: 16px 18px 12px;
      }

      .activity-graph-widget .chart-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
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

      /* Intelligence Widgets Row */
      .widgets-row.intelligence-row {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }

      /* Widget SVG Icon Styling */
      .widget-icon-svg {
        flex-shrink: 0;
        color: #3b82f6;
      }

      /* Deadline Runway Widget */
      .deadline-runway-widget .widget-body {
        padding: 14px 16px;
      }

      .runway-chart-container {
        height: 130px;
      }

      .runway-legend {
        display: flex;
        justify-content: center;
        gap: 14px;
        margin-top: 10px;
        flex-wrap: wrap;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.68rem;
        color: #64748b;
      }

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
      }

      .legend-dot.critical { background: #ef4444; }
      .legend-dot.high { background: #f59e0b; }
      .legend-dot.medium { background: #3b82f6; }
      .legend-dot.low { background: #94a3b8; }

      .runway-totals {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #f1f5f9;
        text-align: center;
      }

      .runway-total {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 500;
      }

      /* Authority Tracker Widget */
      .authority-tracker-widget .widget-header {
        position: relative;
      }

      .widget-period {
        font-size: 0.65rem;
        color: #94a3b8;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .authority-tracker-widget .widget-body {
        padding: 14px 16px;
      }

      .authority-chart-container {
        height: 160px;
      }

      .authority-momentum-legend {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #f1f5f9;
      }

      .momentum-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.68rem;
        color: #64748b;
      }

      .momentum-arrow {
        font-size: 0.7rem;
        font-weight: 600;
      }

      .momentum-arrow.up { color: #3b82f6; }
      .momentum-arrow.stable { color: #64748b; }
      .momentum-arrow.down { color: #94a3b8; }

      /* Responsive */
      @media (max-width: 1100px) {
        .widgets-row {
          grid-template-columns: 1fr;
        }

        .widgets-row.intelligence-row {
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

        .themes-chart {
          grid-template-columns: 1fr;
          justify-items: center;
        }
      }
    </style>
  `
}

module.exports = { getWorkspaceHubStyles }
