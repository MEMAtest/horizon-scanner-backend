/**
 * Calendar Styles
 * CSS for regulatory calendar page and widget
 */

function getCalendarStyles() {
  return `
    /* Calendar Page Container */
    .calendar-page {
      padding: 24px 32px;
      max-width: 100%;
      min-height: 100vh;
      background: #f5f7fb;
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .calendar-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .calendar-subtitle {
      color: #64748b;
      font-size: 0.9rem;
      margin-top: 4px;
    }

    /* View Toggle */
    .view-toggle {
      display: flex;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 4px;
      gap: 4px;
    }

    .view-toggle-btn {
      padding: 8px 16px;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .view-toggle-btn:hover {
      color: #0f172a;
    }

    .view-toggle-btn.active {
      background: white;
      color: #0f172a;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Filter Bar */
    .calendar-filter-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }

    .calendar-filter {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.85rem;
      background: white;
      color: #334155;
      min-width: 150px;
      cursor: pointer;
    }

    .calendar-filter:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .export-btn {
      padding: 8px 16px;
      background: #0f172a;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }

    .export-btn:hover {
      background: #1e293b;
    }

    /* Month Navigation */
    .month-nav {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .month-nav-btn {
      width: 36px;
      height: 36px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
    }

    .month-nav-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #0f172a;
    }

    .month-display {
      font-size: 1.25rem;
      font-weight: 600;
      color: #0f172a;
      min-width: 200px;
      text-align: center;
    }

    .today-btn {
      padding: 8px 16px;
      background: #f1f5f9;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      transition: background 0.2s;
    }

    .today-btn:hover {
      background: #e2e8f0;
    }

    /* Calendar Grid - Month View */
    .calendar-grid {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .calendar-weekday {
      padding: 12px;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }

    .calendar-day {
      min-height: 120px;
      padding: 8px;
      border-right: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
      position: relative;
      background: white;
      transition: background 0.2s;
    }

    .calendar-day:nth-child(7n) {
      border-right: none;
    }

    .calendar-day:hover {
      background: #f8fafc;
    }

    .calendar-day.other-month {
      background: #fafafa;
    }

    .calendar-day.other-month .day-number {
      color: #cbd5e1;
    }

    .calendar-day.today {
      background: #eff6ff;
    }

    .calendar-day.today .day-number {
      background: #3b82f6;
      color: white;
    }

    .day-number {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 500;
      color: #334155;
      border-radius: 50%;
      margin-bottom: 4px;
    }

    .day-events {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    /* Event Cards */
    .calendar-event {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
      position: relative;
    }

    .calendar-event:hover {
      transform: translateX(2px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 10;
    }

    /* Custom Tooltip for Calendar Events */
    .calendar-event[title]:hover::after {
      content: attr(title);
      position: absolute;
      left: 0;
      bottom: 100%;
      background: #1e293b;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.7rem;
      white-space: pre-line;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      pointer-events: none;
      max-width: 240px;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    /* Event Type Colors */
    .calendar-event.deadline {
      background: #fecaca;
      color: #dc2626;
      border-left: 3px solid #dc2626;
    }

    .calendar-event.consultation {
      background: #dbeafe;
      color: #2563eb;
      border-left: 3px solid #2563eb;
    }

    .calendar-event.implementation {
      background: #d1fae5;
      color: #059669;
      border-left: 3px solid #059669;
    }

    .calendar-event.policy_review {
      background: #ede9fe;
      color: #7c3aed;
      border-left: 3px solid #7c3aed;
    }

    .calendar-event.alert {
      background: #fef3c7;
      color: #d97706;
      border-left: 3px solid #d97706;
    }

    .calendar-event.compliance_event {
      background: #fce7f3;
      color: #be185d;
      border-left: 3px solid #be185d;
    }

    .calendar-event.regulatory_change {
      background: #e0e7ff;
      color: #4f46e5;
      border-left: 3px solid #4f46e5;
    }

    .more-events {
      font-size: 0.7rem;
      color: #64748b;
      padding: 2px 8px;
      cursor: pointer;
    }

    .more-events:hover {
      color: #3b82f6;
    }

    /* Agenda View */
    .calendar-agenda {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .agenda-day {
      border-bottom: 1px solid #f1f5f9;
    }

    .agenda-day:last-child {
      border-bottom: none;
    }

    .agenda-date {
      padding: 12px 16px;
      background: #f8fafc;
      font-weight: 600;
      color: #334155;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .agenda-date-day {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }

    .agenda-date-info {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 400;
    }

    .agenda-events {
      padding: 8px 16px;
    }

    .agenda-event {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
      background: #fafafa;
      cursor: pointer;
      transition: background 0.2s;
      position: relative;
    }

    .agenda-event:hover {
      background: #f1f5f9;
    }

    /* Custom Tooltip for Agenda Events */
    .agenda-event[title]:hover::after {
      content: attr(title);
      position: absolute;
      left: 50%;
      bottom: 100%;
      transform: translateX(-50%);
      background: #1e293b;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      white-space: pre-line;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      pointer-events: none;
      max-width: 280px;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .agenda-event-time {
      font-size: 0.8rem;
      color: #64748b;
      min-width: 60px;
    }

    .agenda-event-type {
      width: 4px;
      height: 40px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .agenda-event-content {
      flex: 1;
    }

    .agenda-event-title {
      font-weight: 600;
      color: #0f172a;
      font-size: 0.9rem;
      margin-bottom: 4px;
    }

    .agenda-event-meta {
      font-size: 0.8rem;
      color: #64748b;
      display: flex;
      gap: 12px;
    }

    /* Event Modal */
    .event-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
    }

    .event-modal-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .event-modal {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      transform: translateY(20px);
      transition: transform 0.2s;
    }

    .event-modal-overlay.active .event-modal {
      transform: translateY(0);
    }

    .event-modal-header {
      padding: 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .event-modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .event-modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .event-modal-close:hover {
      color: #64748b;
    }

    .event-modal-body {
      padding: 20px;
    }

    .event-modal-row {
      display: flex;
      margin-bottom: 16px;
    }

    .event-modal-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      width: 100px;
      flex-shrink: 0;
    }

    .event-modal-value {
      font-size: 0.9rem;
      color: #334155;
    }

    .event-modal-description {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #475569;
      line-height: 1.6;
      margin-top: 16px;
    }

    .event-modal-footer {
      padding: 16px 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .event-modal-btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .event-modal-btn.primary {
      background: #3b82f6;
      color: white;
      border: none;
    }

    .event-modal-btn.primary:hover {
      background: #2563eb;
    }

    .event-modal-btn.secondary {
      background: white;
      color: #334155;
      border: 1px solid #e2e8f0;
    }

    .event-modal-btn.secondary:hover {
      background: #f8fafc;
    }

    /* Summary Stats */
    .calendar-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }

    .summary-card-value {
      font-size: 2rem;
      font-weight: 700;
      color: #0f172a;
    }

    .summary-card-label {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 4px;
    }

    .summary-card.critical .summary-card-value {
      color: #dc2626;
    }

    .summary-card.warning .summary-card-value {
      color: #d97706;
    }

    /* Empty State */
    .calendar-empty {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }

    .calendar-empty-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .calendar-empty-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 8px;
    }

    /* Loading State */
    .calendar-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }

    .calendar-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Priority Badges */
    .priority-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .priority-badge.critical {
      background: #fecaca;
      color: #dc2626;
    }

    .priority-badge.high {
      background: #fed7aa;
      color: #ea580c;
    }

    .priority-badge.medium {
      background: #fef3c7;
      color: #ca8a04;
    }

    .priority-badge.low {
      background: #d1fae5;
      color: #059669;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .calendar-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .calendar-filter-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .calendar-filter {
        width: 100%;
      }

      .calendar-day {
        min-height: 80px;
        padding: 4px;
      }

      .day-number {
        width: 24px;
        height: 24px;
        font-size: 0.75rem;
      }

      .calendar-event {
        font-size: 0.65rem;
        padding: 2px 4px;
      }

      .month-nav {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  `
}

/**
 * Get calendar widget styles (for dashboard)
 */
function getCalendarWidgetStyles() {
  return `
    /* Calendar Widget - Compact Version */
    .calendar-widget {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
      display: flex;
      flex-direction: column;
    }

    .calendar-widget-header {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .calendar-widget-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .calendar-widget-title svg {
      width: 14px;
      height: 14px;
      color: #3b82f6;
    }

    .calendar-widget-link {
      font-size: 0.72rem;
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .calendar-widget-link:hover {
      text-decoration: underline;
    }

    .calendar-widget-body {
      padding: 0;
      flex: 1;
      max-height: 200px;
      overflow-y: auto;
    }

    .widget-event {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-bottom: 1px solid #f8fafc;
      transition: background 0.15s;
      cursor: pointer;
    }

    .widget-event:last-child {
      border-bottom: none;
    }

    .widget-event:hover {
      background: #f8fafc;
    }

    .widget-event[title] {
      position: relative;
    }

    .widget-event[title]:hover::after {
      content: attr(title);
      position: absolute;
      left: 50%;
      bottom: 100%;
      transform: translateX(-50%);
      background: #1e293b;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.7rem;
      white-space: pre-line;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: none;
      max-width: 280px;
      line-height: 1.4;
    }

    .widget-event[title]:hover::before {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 100%;
      transform: translateX(-50%) translateY(100%);
      border: 6px solid transparent;
      border-top-color: #1e293b;
      z-index: 100;
    }

    .widget-event-date {
      text-align: center;
      min-width: 32px;
    }

    .widget-event-day {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1;
    }

    .widget-event-month {
      font-size: 0.6rem;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 1px;
    }

    .widget-event-indicator {
      width: 3px;
      height: 24px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .widget-event-indicator.deadline { background: #dc2626; }
    .widget-event-indicator.consultation { background: #2563eb; }
    .widget-event-indicator.implementation { background: #059669; }
    .widget-event-indicator.policy_review { background: #7c3aed; }
    .widget-event-indicator.alert { background: #d97706; }

    .widget-event-content {
      flex: 1;
      min-width: 0;
    }

    .widget-event-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }

    .widget-event-meta {
      font-size: 0.65rem;
      color: #64748b;
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .widget-event-type {
      padding: 2px 6px;
      background: #f1f5f9;
      border-radius: 4px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .widget-event-priority {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .priority-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .priority-dot.critical { background: #dc2626; }
    .priority-dot.high { background: #ea580c; }
    .priority-dot.medium { background: #ca8a04; }
    .priority-dot.low { background: #65a30d; }

    .widget-empty {
      padding: 32px 20px;
      text-align: center;
      color: #64748b;
    }

    .widget-empty-icon {
      font-size: 2rem;
      margin-bottom: 8px;
    }

    .widget-stats {
      display: flex;
      gap: 12px;
      padding: 8px 14px;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
    }

    .widget-stat {
      text-align: center;
      flex: 1;
    }

    .widget-stat-value {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }

    .widget-stat-label {
      font-size: 0.6rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .widget-stat.critical .widget-stat-value {
      color: #dc2626;
    }
  `
}

module.exports = {
  getCalendarStyles,
  getCalendarWidgetStyles
}
