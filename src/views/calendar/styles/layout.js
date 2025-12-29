function getCalendarLayoutStyles() {
  return `    /* Calendar Page Container */
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

`
}

module.exports = { getCalendarLayoutStyles }
