function getCalendarGridStyles() {
  return `    /* Calendar Grid - Month View */
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

`
}

module.exports = { getCalendarGridStyles }
