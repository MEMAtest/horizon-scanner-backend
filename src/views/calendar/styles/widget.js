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

module.exports = { getCalendarWidgetStyles }
