function getCalendarCardStyles() {
  return `    /* Event Cards */
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

`
}

function getCalendarStatusStyles() {
  return `    /* Summary Stats */
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

    /* Event Hover Preview */
    .event-hover-preview {
      position: fixed;
      z-index: 1000;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08);
      padding: 16px;
      width: 280px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(8px);
      transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
      pointer-events: none;
      border: 1px solid #e2e8f0;
    }

    .event-hover-preview.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: auto;
    }

    .event-hover-preview .preview-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
      margin-bottom: 12px;
    }

    .event-hover-preview .preview-divider {
      height: 1px;
      background: linear-gradient(90deg, #e2e8f0 0%, transparent 100%);
      margin-bottom: 12px;
    }

    .event-hover-preview .preview-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .event-hover-preview .preview-icon {
      font-size: 0.85rem;
      width: 20px;
      text-align: center;
    }

    .event-hover-preview .preview-value {
      font-size: 0.85rem;
      color: #475569;
      font-weight: 500;
    }

    .event-hover-preview .preview-hint {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
      font-size: 0.75rem;
      color: #3b82f6;
      font-weight: 500;
      text-align: center;
    }

`
}

module.exports = { getCalendarCardStyles, getCalendarStatusStyles }
