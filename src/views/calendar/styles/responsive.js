function getCalendarResponsiveStyles() {
  return `    /* Responsive */
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

      /* Hide hover preview on mobile (use click modal instead) */
      .event-hover-preview {
        display: none;
      }
    }
  `
}

module.exports = { getCalendarResponsiveStyles }
