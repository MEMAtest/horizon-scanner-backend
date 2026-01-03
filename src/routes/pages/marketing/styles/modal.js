// Feature modal styles and demo animations
function getModalStyles() {
  return `
      /* ===== FEATURE MODAL ===== */
      .feature-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .feature-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .feature-modal {
        background: var(--card);
        border-radius: 24px;
        padding: 32px;
        max-width: 560px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 40px 100px rgba(15, 23, 42, 0.3);
        transform: translateY(20px) scale(0.95);
        transition: transform 0.3s ease;
        position: relative;
      }

      .feature-modal-overlay.active .feature-modal {
        transform: translateY(0) scale(1);
      }

      .modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #f1f5f9;
        color: var(--muted);
        font-size: 24px;
        cursor: pointer;
        display: grid;
        place-items: center;
        transition: background 0.2s ease, color 0.2s ease;
      }

      .modal-close:hover {
        background: #e2e8f0;
        color: var(--ink);
      }

      .modal-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .modal-icon {
        width: 64px;
        height: 64px;
        flex-shrink: 0;
      }

      .modal-icon svg {
        width: 100%;
        height: 100%;
      }

      .modal-header h3 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 24px;
        margin: 0;
        color: var(--ink);
      }

      .modal-demo {
        background: #f8fafc;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        min-height: 160px;
        border: 1px solid rgba(15, 23, 42, 0.08);
      }

      .modal-benefits h4 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 16px;
        margin: 0 0 12px;
        color: var(--ink);
      }

      .modal-benefits ul {
        list-style: none;
        padding: 0;
        margin: 0 0 24px;
      }

      .modal-benefits li {
        font-size: 14px;
        color: var(--muted);
        padding: 8px 0;
        padding-left: 24px;
        position: relative;
        border-bottom: 1px solid rgba(15, 23, 42, 0.06);
      }

      .modal-benefits li:last-child {
        border-bottom: none;
      }

      .modal-benefits li::before {
        content: '';
        position: absolute;
        left: 0;
        top: 14px;
        width: 8px;
        height: 8px;
        background: var(--green-500);
        border-radius: 50%;
      }

      /* ===== MODAL DEMO ANIMATIONS ===== */

      /* Horizon Scanning Demo */
      .demo-scanning {
        display: flex;
        gap: 24px;
        align-items: center;
      }

      .scan-radar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        position: relative;
        overflow: hidden;
      }

      .scan-line {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 50%;
        height: 2px;
        background: linear-gradient(90deg, #2563eb, transparent);
        transform-origin: left center;
        animation: radarScan 2s linear infinite;
      }

      @keyframes radarScan {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .scan-dot {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #2563eb;
        border-radius: 50%;
        animation: blip 2s ease-in-out infinite;
      }

      .scan-dot.d1 { top: 20%; left: 60%; animation-delay: 0s; }
      .scan-dot.d2 { top: 50%; left: 30%; animation-delay: 0.7s; }
      .scan-dot.d3 { top: 70%; left: 65%; animation-delay: 1.4s; }

      @keyframes blip {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
      }

      .scan-feed {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .scan-item {
        background: white;
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        animation: slideInRight 0.5s ease-out;
      }

      .scan-item:nth-child(2) { animation-delay: 0.2s; }
      .scan-item:nth-child(3) { animation-delay: 0.4s; }

      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }

      .scan-reg {
        font-size: 10px;
        font-weight: 700;
        color: #2563eb;
        background: #dbeafe;
        padding: 3px 8px;
        border-radius: 4px;
      }

      .scan-text {
        font-size: 12px;
        color: var(--muted);
      }

      /* AI Summaries Demo */
      .demo-ai {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .ai-input {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ai-doc {
        background: #e2e8f0;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 12px;
        color: var(--muted);
      }

      .ai-arrow {
        font-size: 24px;
        color: var(--blue-500);
        animation: arrowPulse 1s ease-in-out infinite;
      }

      @keyframes arrowPulse {
        0%, 100% { transform: translateX(0); opacity: 1; }
        50% { transform: translateX(8px); opacity: 0.5; }
      }

      .ai-summary-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        animation: fadeInUp 0.5s ease-out 0.3s both;
      }

      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .ai-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 999px;
        margin-bottom: 8px;
      }

      .ai-badge.high {
        background: #fee2e2;
        color: #dc2626;
      }

      .ai-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--ink);
        margin-bottom: 6px;
      }

      .ai-excerpt {
        font-size: 12px;
        color: var(--muted);
        line-height: 1.5;
        margin-bottom: 10px;
      }

      .ai-sectors {
        display: flex;
        gap: 6px;
      }

      .ai-sectors span {
        font-size: 10px;
        background: #f1f5f9;
        padding: 3px 8px;
        border-radius: 4px;
        color: var(--muted);
      }

      /* Calendar Demo */
      .demo-calendar {
        text-align: center;
      }

      .cal-month {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 600;
        font-size: 14px;
        color: var(--ink);
        margin-bottom: 12px;
      }

      .cal-grid {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 16px;
      }

      .cal-day {
        width: 48px;
        height: 48px;
        background: white;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: var(--ink);
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }

      .cal-day.deadline {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: #dc2626;
      }

      .cal-day.impl {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        color: #92400e;
      }

      .cal-day span {
        font-size: 8px;
        font-weight: 700;
        margin-top: 2px;
      }

      .cal-legend {
        display: flex;
        justify-content: center;
        gap: 16px;
      }

      .legend-item {
        font-size: 10px;
        color: var(--muted);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .legend-item::before {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 3px;
      }

      .legend-item.deadline::before {
        background: #fee2e2;
      }

      .legend-item.impl::before {
        background: #fef3c7;
      }

      /* Watchlist Demo */
      .demo-watchlist {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .wl-filter {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .wl-tag {
        font-size: 11px;
        padding: 6px 12px;
        border-radius: 999px;
        background: #e2e8f0;
        color: var(--muted);
        transition: all 0.2s ease;
      }

      .wl-tag.active {
        background: #2563eb;
        color: white;
      }

      .wl-result {
        background: white;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      }

      .wl-count {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 36px;
        font-weight: 700;
        color: var(--blue-500);
        animation: countUp 1s ease-out;
      }

      @keyframes countUp {
        from { opacity: 0; transform: scale(0.5); }
        to { opacity: 1; transform: scale(1); }
      }

      .wl-label {
        font-size: 12px;
        color: var(--muted);
      }

      /* Dossier Demo */
      .demo-dossier {
        display: flex;
        justify-content: center;
      }

      .dossier-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        width: 100%;
        max-width: 320px;
      }

      .dossier-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--ink);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #6366f1;
      }

      .dossier-items {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }

      .dossier-item {
        font-size: 12px;
        color: var(--muted);
        padding: 6px 10px;
        background: #f8fafc;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dossier-item::before {
        content: '';
        width: 6px;
        height: 6px;
        background: #6366f1;
        border-radius: 2px;
      }

      .dossier-meta {
        font-size: 10px;
        color: #94a3b8;
      }

      /* Kanban Demo */
      .demo-kanban {
        display: flex;
        gap: 12px;
      }

      .kanban-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .kanban-header {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 6px 10px;
        border-radius: 6px;
        text-align: center;
      }

      .kanban-header.red { background: #fee2e2; color: #dc2626; }
      .kanban-header.yellow { background: #fef3c7; color: #92400e; }
      .kanban-header.green { background: #dcfce7; color: #16a34a; }

      .kanban-card {
        background: white;
        border-radius: 6px;
        padding: 10px;
        font-size: 11px;
        color: var(--ink);
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        animation: cardDrop 0.4s ease-out;
      }

      @keyframes cardDrop {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Analytics Demo */
      .demo-analytics {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .analytics-chart {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 12px;
        height: 80px;
        padding: 0 20px;
      }

      .chart-bar {
        width: 40px;
        background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 4px 4px 0 0;
        animation: barGrow 1s ease-out;
      }

      .chart-bar.b1 { animation-delay: 0s; }
      .chart-bar.b2 { animation-delay: 0.15s; }
      .chart-bar.b3 { animation-delay: 0.3s; }
      .chart-bar.b4 { animation-delay: 0.45s; }
      .chart-bar.b5 { animation-delay: 0.6s; }

      .analytics-stats {
        display: flex;
        justify-content: center;
        gap: 24px;
      }

      .analytics-stats .stat {
        font-size: 12px;
        color: var(--muted);
        padding: 8px 12px;
        background: white;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }

      /* Digest Demo */
      .demo-digest {
        display: flex;
        justify-content: center;
      }

      .digest-email {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        width: 100%;
        max-width: 360px;
      }

      .digest-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .digest-from {
        font-size: 12px;
        font-weight: 600;
        color: var(--ink);
      }

      .digest-time {
        font-size: 10px;
        color: #94a3b8;
      }

      .digest-subject {
        font-size: 14px;
        font-weight: 600;
        color: var(--ink);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
      }

      .digest-preview {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .digest-item {
        font-size: 11px;
        padding: 8px 10px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .digest-item::before {
        content: '';
        width: 4px;
        height: 100%;
        min-height: 16px;
        border-radius: 2px;
      }

      .digest-item.high {
        background: #fef2f2;
      }
      .digest-item.high::before { background: #ef4444; }

      .digest-item.medium {
        background: #fffbeb;
      }
      .digest-item.medium::before { background: #f59e0b; }

      .digest-item.low {
        background: #f0fdf4;
      }
      .digest-item.low::before { background: #22c55e; }
  `;
}


module.exports = { getModalStyles };
