// Dashboard mockup styles: sidebar, stats, charts, updates, right panel
function getDashboardStyles() {
  return `
      /* ===== DASHBOARD MOCKUP ===== */
      .dashboard-mockup {
        display: grid;
        grid-template-columns: 50px 1fr 140px;
        height: 380px;
        background: #f8fafc;
        border-radius: 0 0 20px 20px;
        overflow: hidden;
      }

      .mock-sidebar {
        background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
      }

      .mock-logo {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        border-radius: 8px;
        margin-bottom: 8px;
        display: grid;
        place-items: center;
      }

      .mock-canary-icon {
        width: 18px;
        height: 18px;
        background: #fbbf24;
        border-radius: 50% 50% 40% 40%;
        position: relative;
      }

      .mock-canary-icon::before {
        content: '';
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 12px;
        height: 12px;
        background: #fbbf24;
        border-radius: 50%;
      }

      .mock-nav-item {
        width: 32px;
        height: 32px;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        transition: all 0.2s;
        display: grid;
        place-items: center;
        color: rgba(255,255,255,0.6);
        position: relative;
        cursor: pointer;
      }

      .mock-nav-item:hover {
        background: rgba(255,255,255,0.2);
        color: white;
      }

      .mock-nav-item.active {
        background: rgba(255,255,255,0.25);
        box-shadow: inset 0 0 0 2px rgba(251, 191, 36, 0.5);
        color: white;
      }

      /* Sidebar tooltips */
      .mock-nav-item::after {
        content: attr(data-tooltip);
        position: absolute;
        left: calc(100% + 8px);
        top: 50%;
        transform: translateY(-50%) translateX(-8px);
        background: #1e293b;
        color: white;
        font-size: 10px;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s ease;
        z-index: 100;
      }

      .mock-nav-item:hover::after {
        opacity: 1;
        transform: translateY(-50%) translateX(0);
      }

      .mock-main {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #ffffff;
      }

      .mock-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mock-title {
        width: 120px;
        height: 20px;
        background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 100%);
        border-radius: 4px;
      }

      .mock-search {
        flex: 1;
        height: 32px;
        background: #f1f5f9;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .mock-avatar {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 50%;
      }

      .mock-stats-row {
        display: flex;
        gap: 10px;
      }

      .mock-stat-card {
        flex: 1;
        background: #f8fafc;
        border-radius: 10px;
        padding: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #e2e8f0;
      }

      .mock-stat-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: grid;
        place-items: center;
      }

      .mock-stat-icon.blue {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        color: #2563eb;
      }
      .mock-stat-icon.yellow {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        color: #d97706;
      }
      .mock-stat-icon.green {
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        color: #16a34a;
      }

      .mock-stat-content {
        flex: 1;
      }

      .mock-stat-number {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 16px;
        font-weight: 700;
        color: var(--ink);
        line-height: 1;
      }

      .mock-stat-label {
        font-size: 8px;
        color: #64748b;
        margin-top: 2px;
        font-weight: 500;
      }

      /* ===== CHARTS ROW ===== */
      .mock-charts-row {
        display: flex;
        gap: 10px;
        margin-bottom: 8px;
      }

      .mock-chart {
        flex: 1;
        background: #f8fafc;
        border-radius: 8px;
        padding: 8px;
        border: 1px solid #e2e8f0;
      }

      .chart-title {
        font-size: 8px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
      }

      /* Bar chart */
      .chart-bars {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .bar-row {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .bar-label {
        font-size: 7px;
        color: #64748b;
        width: 24px;
        text-align: right;
      }

      .bar-track {
        flex: 1;
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        border-radius: 3px;
        animation: barGrow 1.5s ease-out;
      }

      .bar-fill.fca { background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%); }
      .bar-fill.pra { background: linear-gradient(90deg, #7c3aed 0%, #8b5cf6 100%); }
      .bar-fill.eba { background: linear-gradient(90deg, #059669 0%, #10b981 100%); }
      .bar-fill.other { background: linear-gradient(90deg, #64748b 0%, #94a3b8 100%); }

      .bar-value {
        font-size: 7px;
        font-weight: 600;
        color: #475569;
        width: 14px;
      }

      @keyframes barGrow {
        from { width: 0; }
      }

      /* Donut chart */
      .donut-chart {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .donut {
        width: 50px;
        height: 50px;
        transform: rotate(-90deg);
      }

      .donut-segment {
        animation: donutFill 1.5s ease-out;
      }

      @keyframes donutFill {
        from { stroke-dasharray: 0 100; }
      }

      .donut-legend {
        display: flex;
        gap: 6px;
        margin-top: 4px;
      }

      .legend-item {
        font-size: 7px;
        font-weight: 600;
        padding: 2px 4px;
        border-radius: 2px;
      }

      .high-legend { background: #fee2e2; color: #dc2626; }
      .med-legend { background: #fef3c7; color: #d97706; }
      .low-legend { background: #dcfce7; color: #16a34a; }

      /* ===== UPDATES FEED ===== */
      .mock-updates {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow: hidden;
        position: relative;
      }

      .mock-section-label {
        font-size: 10px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
      }

      .mock-updates-track {
        display: flex;
        flex-direction: column;
        gap: 4px;
        height: 120px;
        overflow: hidden;
        position: relative;
      }

      .mock-update-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        background: #ffffff;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        animation: slideCard 30s ease-in-out infinite;
        opacity: 0;
        transform: translateY(-100%);
        position: absolute;
        width: calc(100% - 4px);
        left: 2px;
        transition: background 0.2s;
      }

      .mock-update-item:hover {
        background: #f8fafc;
      }

      /* 6 cards, 3 visible at a time */
      .mock-update-item.update-1 { animation-delay: 0s; top: 0; }
      .mock-update-item.update-2 { animation-delay: 0s; top: 40px; }
      .mock-update-item.update-3 { animation-delay: 0s; top: 80px; }
      .mock-update-item.update-4 { animation-delay: 15s; top: 0; }
      .mock-update-item.update-5 { animation-delay: 15s; top: 40px; }
      .mock-update-item.update-6 { animation-delay: 15s; top: 80px; }

      @keyframes slideCard {
        0% { opacity: 1; transform: translateY(0); }
        48% { opacity: 1; transform: translateY(0); }
        50% { opacity: 0; transform: translateY(-10px); }
        98% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      .mock-update-badge {
        width: 4px;
        height: 32px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .mock-update-badge.high { background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%); }
      .mock-update-badge.medium { background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%); }
      .mock-update-badge.low { background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%); }

      .mock-update-content {
        flex: 1;
        min-width: 0;
      }

      .mock-update-title {
        font-size: 10px;
        font-weight: 500;
        color: #1e293b;
        line-height: 1.3;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mock-update-meta {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .mock-tag {
        font-size: 8px;
        font-weight: 700;
        color: #2563eb;
        background: #dbeafe;
        padding: 2px 5px;
        border-radius: 3px;
      }

      .mock-time {
        font-size: 8px;
        color: #94a3b8;
      }

      /* Update card action buttons */
      .mock-update-actions {
        display: flex;
        gap: 4px;
        opacity: 0.4;
        transition: opacity 0.2s;
      }

      .mock-update-item:hover .mock-update-actions {
        opacity: 1;
      }

      .mock-bookmark,
      .mock-share {
        width: 18px;
        height: 18px;
        border: none;
        background: transparent;
        color: #94a3b8;
        cursor: pointer;
        display: grid;
        place-items: center;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .mock-bookmark:hover,
      .mock-share:hover {
        background: #e2e8f0;
        color: #475569;
      }

      /* ===== RIGHT PANEL ===== */
      .mock-right-panel {
        background: #f8fafc;
        padding: 12px;
        border-left: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .mock-panel-title {
        font-size: 10px;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .mock-calendar {
        background: white;
        border-radius: 8px;
        padding: 8px;
        border: 1px solid #e2e8f0;
      }

      .mock-cal-header {
        font-size: 9px;
        font-weight: 600;
        color: #64748b;
        margin-bottom: 6px;
      }

      .mock-cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 3px;
      }

      .mock-cal-day {
        width: 14px;
        height: 14px;
        background: #f8fafc;
        border-radius: 4px;
        font-size: 7px;
        font-weight: 500;
        color: #64748b;
        display: grid;
        place-items: center;
        position: relative;
      }

      .mock-cal-day.deadline {
        background: #fef3c7;
        color: #92400e;
        font-weight: 600;
      }

      .cal-dot {
        position: absolute;
        bottom: 1px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        animation: calPulse 2s ease-in-out infinite;
      }

      .cal-dot.red { background: #ef4444; }
      .cal-dot.yellow { background: #f59e0b; }
      .cal-dot.green { background: #22c55e; animation-delay: 0.5s; }

      @keyframes calPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
      }

      .mock-ai-summary {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-radius: 8px;
        padding: 8px;
        border: 1px solid #bfdbfe;
        display: flex;
        gap: 8px;
        align-items: flex-start;
      }

      .mock-ai-icon {
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 6px;
        flex-shrink: 0;
        display: grid;
        place-items: center;
        color: white;
      }

      .mock-ai-content {
        flex: 1;
      }

      .mock-ai-text {
        font-size: 9px;
        color: #1e40af;
        line-height: 1.3;
        margin-bottom: 4px;
      }

      .mock-ai-link {
        font-size: 8px;
        color: #2563eb;
        font-weight: 600;
        cursor: pointer;
      }

      .mock-ai-link:hover {
        text-decoration: underline;
      }

      /* Animated shimmer effect */
      .dashboard-mockup::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: shimmer 3s ease-in-out infinite;
        pointer-events: none;
      }

      @keyframes shimmer {
        0% { left: -100%; }
        50%, 100% { left: 200%; }
      }

      /* ===== FLOATING NOTIFICATION CARDS ===== */
      .floating-card {
        position: absolute;
        background: var(--card);
        border-radius: 12px;
        padding: 10px 12px;
        box-shadow: var(--shadow-md);
        border: 1px solid rgba(15, 23, 42, 0.08);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: float 4s ease-in-out infinite;
        z-index: 5;
        max-width: 180px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .floating-card:hover {
        transform: scale(1.05);
        box-shadow: var(--shadow-lg);
      }

      .floating-card .card-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .alert-card {
        left: -8%;
        top: -5%;
        animation-delay: 0s;
      }

      .alert-card .card-icon {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: var(--red-500);
      }

      .delivery-card {
        right: -8%;
        top: 15%;
        animation-delay: 1.3s;
      }

      .delivery-card .card-icon {
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        color: var(--green-500);
      }

      .ai-card {
        left: -8%;
        bottom: 15%;
        animation-delay: 2.6s;
      }

      .ai-card .card-icon {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        color: var(--blue-500);
      }

      .card-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .card-content strong {
        font-size: 11px;
        color: var(--ink);
        font-weight: 600;
      }

      .card-content span {
        font-size: 9px;
        color: var(--muted);
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
  `;
}


module.exports = { getDashboardStyles };
