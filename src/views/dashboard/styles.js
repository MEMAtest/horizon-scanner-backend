function getDashboardStyles() {
  return `
    <style>
      .dashboard-header {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin-bottom: 30px;
        border: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .dashboard-header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .dashboard-logo {
        max-width: 280px;
        height: auto;
        margin-bottom: 8px;
      }

      .dashboard-date {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        color: #64748b;
        font-size: 14px;
      }

      .dashboard-date .date-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        margin-bottom: 2px;
      }

      .dashboard-date .date-value {
        font-weight: 600;
        color: #1e293b;
        font-size: 16px;
      }

      .dashboard-title {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .dashboard-subtitle {
        color: #6b7280;
        font-size: 1rem;
        margin-bottom: 8px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 10px;
      }

      .stat-card {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid #e5e7eb;
        text-align: center;
        transition: transform 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-2px);
      }

      .stat-number {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1f2937;
        display: block;
        margin-bottom: 6px;
      }

      .stat-label {
        color: #6b7280;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .stat-change {
        font-size: 0.85rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 6px 12px;
        margin-top: 8px;
      }

      .stat-change.positive {
        background: #dcfce7;
        color: #166534;
      }

      .stat-change.negative {
        background: #fee2e2;
        color: #b91c1c;
      }

      .stat-change.neutral {
        background: #f3f4f6;
        color: #4b5563;
      }

      .filters-container {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border: 1px solid #e5e7eb;
        margin-bottom: 30px;
      }

      .quick-filters {
        margin-bottom: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .quick-filter-btn {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 999px;
        padding: 8px 16px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #1f2937;
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
      }

      .quick-filter-btn:hover:not(.active) {
        border-color: #9ca3af;
        transform: translateY(-1px);
      }

      .quick-filter-btn.active {
        background: #1f2937;
        color: #ffffff;
        border-color: #1f2937;
        box-shadow: 0 4px 12px rgba(31, 41, 55, 0.18);
      }

      .quick-filter-btn:focus-visible {
        outline: 2px solid #4f46e5;
        outline-offset: 2px;
      }

      .filters-tags {
        margin-top: 15px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .filter-tag {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #4b5563;
      }

      .filter-tag strong {
        font-weight: 600;
        color: #1f2937;
      }

      .filter-tag button {
        background: transparent;
        border: none;
        cursor: pointer;
        color: #9ca3af;
        font-size: 0.9rem;
      }

      .filter-tag button:hover {
        color: #ef4444;
      }

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        align-items: end;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .filter-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #4b5563;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .filter-select,
      .filter-input {
        padding: 10px 12px;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        font-size: 0.95rem;
        color: #1f2937;
        background: white;
        transition: border-color 0.2s ease;
      }

      .filter-select:focus,
      .filter-input:focus {
        outline: none;
        border-color: #4f46e5;
      }

      .filter-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .btn {
        padding: 10px 16px;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .btn-primary {
        background: #4f46e5;
        color: white;
      }

      .btn-primary:hover {
        background: #4338ca;
      }

      .btn-secondary {
        background: #f3f4f6;
        color: #1f2937;
        border: 1px solid #e5e7eb;
      }

      .btn-secondary:hover {
        background: #e5e7eb;
      }

      .updates-container {
        background: transparent;
        border-radius: 0;
        box-shadow: none;
        border: none;
        overflow: visible;
        margin-bottom: 40px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .update-card {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border: 1px solid #e5e7eb;
        transition: all 0.2s;
        cursor: pointer;
      }

      .update-card:hover {
        background-color: #f9fafb;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        transform: translateY(-2px);
      }

      .update-card:last-child {
        margin-bottom: 0;
      }

      .update-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
        gap: 15px;
        flex-wrap: wrap;
      }

      .update-meta-primary {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .update-meta-secondary {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .authority-badge {
        background: #4f46e5;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
      }

      .date-badge {
        background: #f3f4f6;
        color: #6b7280;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .content-type-badge {
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .content-type-badge.consultation {
        background: #e0e7ff;
        color: #4338ca;
        border: 1px solid #a5b4fc;
      }

      .content-type-badge.enforcement {
        background: #fecaca;
        color: #dc2626;
        border: 1px solid #f87171;
      }

      .content-type-badge.guidance {
        background: #d1fae5;
        color: #059669;
        border: 1px solid #6ee7b7;
      }

      .content-type-badge.policy {
        background: #ddd6fe;
        color: #7c3aed;
        border: 1px solid #a78bfa;
      }

      .content-type-badge.regulation {
        background: #fde68a;
        color: #d97706;
        border: 1px solid #fbbf24;
      }

      .content-type-badge.report {
        background: #f3e8ff;
        color: #8b5cf6;
        border: 1px solid #c4b5fd;
      }

      .content-type-badge.news {
        background: #dbeafe;
        color: #3b82f6;
        border: 1px solid #93c5fd;
      }

      .content-type-badge.other {
        background: #f3f4f6;
        color: #6b7280;
        border: 1px solid #d1d5db;
      }

      .risk-score-badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 0.9rem;
        font-weight: 700;
        border: 1px solid transparent;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .risk-score-badge:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
      }

      .risk-score-value {
        font-size: 1.2rem;
        line-height: 1;
      }

      .risk-score-label {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.85;
      }

      .risk-score-badge.risk-critical {
        background: #fee2e2;
        color: #b91c1c;
        border-color: #fca5a5;
      }

      .risk-score-badge.risk-elevated {
        background: #fef3c7;
        color: #b45309;
        border-color: #fcd34d;
      }

      .risk-score-badge.risk-low {
        background: #e0f2fe;
        color: #0369a1;
        border-color: #7dd3fc;
      }

      .impact-badge {
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .impact-badge.significant {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .impact-badge.moderate {
        background: #fffbeb;
        color: #d97706;
        border: 1px solid #fed7aa;
      }

      .impact-badge.informational {
        background: #f0f9ff;
        color: #0284c7;
        border: 1px solid #bae6fd;
      }

      .impact-badge.critical {
        box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.25);
      }

      .update-actions {
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .update-card:hover .update-actions {
        opacity: 1;
      }

      .action-btn {
        padding: 6px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
        color: #6b7280;
      }

      .action-btn:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
      }

      .update-headline {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 12px;
        line-height: 1.4;
      }

      .update-headline a {
        color: inherit;
        text-decoration: none;
        transition: color 0.2s;
      }

      .update-headline a:hover {
        color: #4f46e5;
      }

      .update-summary {
        color: #4b5563;
        line-height: 1.6;
        margin-bottom: 15px;
        font-size: 0.95rem;
      }

      .ai-badge {
        display: inline-block;
        background: #f0f9ff;
        color: #0369a1;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-right: 6px;
        border: 1px solid #bae6fd;
      }

      .update-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 15px;
        padding: 15px;
        background: #f9fafb;
        border-radius: 8px;
      }

      .detail-item {
        font-size: 0.85rem;
      }

      .detail-label {
        font-weight: 600;
        color: #374151;
        margin-bottom: 3px;
      }

      .detail-value {
        color: #6b7280;
      }

      .score-indicator {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 0.95rem;
        margin-right: 8px;
      }

      .score-indicator.risk-critical {
        background: #fee2e2;
        color: #b91c1c;
        border: 1px solid #fca5a5;
      }

      .score-indicator.risk-elevated {
        background: #fef3c7;
        color: #b45309;
        border: 1px solid #fcd34d;
      }

      .score-indicator.risk-low {
        background: #e0f2fe;
        color: #0369a1;
        border: 1px solid #7dd3fc;
      }

      .score-label {
        color: #6b7280;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .update-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
        flex-wrap: wrap;
      }

      .sector-tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .sector-tag {
        background: #e0e7ff;
        color: #4338ca;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .sector-tag:hover {
        background: #c7d2fe;
        color: #3730a3;
      }

      .ai-features {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .ai-feature {
        background: #f0f9ff;
        color: #0c4a6e;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        border: 1px solid #0ea5e9;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .ai-feature.high-impact {
        background: #fef2f2;
        color: #991b1b;
        border-color: #ef4444;
      }

      .ai-feature.deadline {
        background: #fffbeb;
        color: #92400e;
        border-color: #f59e0b;
      }

      .ai-feature.enforcement {
        background: #fdf2f8;
        color: #be185d;
        border-color: #ec4899;
      }

      .ai-feature.high-confidence {
        background: #f3e8ff;
        color: #6d28d9;
        border-color: #c4b5fd;
      }

      .ai-feature.urgent {
        background: #fee2e2;
        color: #b91c1c;
        border-color: #f87171;
      }

      .no-updates {
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
      }

      .no-updates-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        opacity: 0.5;
      }

      @media (max-width: 1024px) {
        .dashboard-header {
          padding: 20px;
        }

        .update-details {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        }

        .dashboard-header-top {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .dashboard-date {
          align-items: flex-start;
        }

        .update-details {
          grid-template-columns: 1fr;
        }

        .update-actions {
          opacity: 1;
          justify-content: center;
        }

        .update-footer {
          flex-direction: column;
          align-items: stretch;
        }
      }
    </style>
  `
}

module.exports = { getDashboardStyles }
