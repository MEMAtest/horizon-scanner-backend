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

      /* Business Line Profile Selector */
      .profile-selector {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        justify-content: center;
        max-width: 400px;
      }

      .profile-select-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
      }

      .profile-color-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .profile-select {
        padding: 8px 32px 8px 12px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        color: #1f2937;
        background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;
        appearance: none;
        cursor: pointer;
        min-width: 180px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .profile-select:hover {
        border-color: #d1d5db;
      }

      .profile-select:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
      }

      .profile-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .profile-sectors {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 500;
      }

      .profile-manage-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: #f3f4f6;
        color: #6b7280;
        text-decoration: none;
        transition: all 0.2s ease;
      }

      .profile-manage-link:hover {
        background: #e5e7eb;
        color: #4f46e5;
      }

      .profile-manage-link svg {
        flex-shrink: 0;
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
        background: #e0e7ff;
        color: #4338ca;
        border: 1px solid #a5b4fc;
      }

      .content-type-badge.enforcement-action {
        background: #fecaca;
        color: #dc2626;
        border: 1px solid #f87171;
      }
      .content-type-badge.final-rule {
        background: #d1fae5;
        color: #059669;
        border: 1px solid #6ee7b7;
      }
      .content-type-badge.statistical-report {
        background: #e0f2fe;
        color: #0369a1;
        border: 1px solid #7dd3fc;
      }
      .content-type-badge.policy-paper {
        background: #ddd6fe;
        color: #7c3aed;
        border: 1px solid #a78bfa;
      }
      .content-type-badge.letter {
        background: #ccfbf1;
        color: #0d9488;
        border: 1px solid #5eead4;
      }
      .content-type-badge.event {
        background: #ffedd5;
        color: #ea580c;
        border: 1px solid #fdba74;
      }
      .content-type-badge.speech {
        background: #fae8ff;
        color: #a21caf;
        border: 1px solid #e879f9;
      }
      .content-type-badge.announcement {
        background: #cffafe;
        color: #0891b2;
        border: 1px solid #67e8f9;
      }
      .content-type-badge.notice {
        background: #fef9c3;
        color: #ca8a04;
        border: 1px solid #fde047;
      }
      .content-type-badge.statement {
        background: #e0e7ff;
        color: #4f46e5;
        border: 1px solid #a5b4fc;
      }
      .content-type-badge.press-release {
        background: #ccfbf1;
        color: #0d9488;
        border: 1px solid #5eead4;
      }
      .content-type-badge.market-notice {
        background: #fef3c7;
        color: #d97706;
        border: 1px solid #fcd34d;
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

      .action-btn svg {
        display: block;
      }

      .action-btn-dossier:hover {
        background: #eef2ff;
        border-color: #6366f1;
        color: #6366f1;
      }

      .action-btn-policy:hover {
        background: #ecfdf5;
        border-color: #059669;
        color: #059669;
      }

      /* Modal styles for dashboard */
      .modal-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .modal-overlay.active {
        display: flex;
      }

      .modal {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
      }

      .modal-header h2 {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }

      .modal-close {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        border-radius: 8px;
        color: #6b7280;
        font-size: 24px;
        line-height: 1;
      }

      .modal-close:hover {
        background: #f3f4f6;
        color: #374151;
      }

      .modal-body {
        padding: 24px;
        overflow-y: auto;
        max-height: calc(90vh - 140px);
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 500;
        border-radius: 8px;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }

      .btn-secondary {
        background: white;
        color: #374151;
        border: 1px solid #e5e7eb;
      }

      .btn-secondary:hover {
        background: #f9fafb;
        border-color: #d1d5db;
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

      /* Profile Modal Styles */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }

      .modal-container {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #6b7280;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
      }

      .modal-close:hover {
        color: #111827;
      }

      .modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }

      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
      }

      /* Profile List */
      .profile-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .profile-item {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
      }

      .profile-item-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }

      .profile-color {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .profile-name {
        font-weight: 600;
        color: #111827;
        flex: 1;
      }

      .default-badge {
        background: #dbeafe;
        color: #1d4ed8;
        font-size: 0.75rem;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .profile-item-details {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 12px;
      }

      .profile-item-actions {
        display: flex;
        gap: 8px;
      }

      .no-profiles, .error {
        text-align: center;
        color: #6b7280;
        padding: 40px 20px;
      }

      .loading {
        text-align: center;
        color: #6b7280;
        padding: 40px 20px;
      }

      /* Profile Form */
      .profile-form {
        background: #f9fafb;
        border-radius: 8px;
        padding: 20px;
      }

      .profile-form h3 {
        margin: 0 0 20px 0;
        font-size: 1.1rem;
        color: #111827;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #374151;
        font-size: 0.875rem;
      }

      .form-group input[type="text"],
      .form-group input[type="color"],
      .form-group textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
      }

      .form-group input[type="color"] {
        height: 40px;
        padding: 4px;
        cursor: pointer;
      }

      .form-group textarea {
        min-height: 80px;
        resize: vertical;
      }

      .form-group input:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 20px;
      }

      .btn-sm {
        padding: 6px 12px;
        font-size: 0.8rem;
      }

      .btn-danger {
        background: #fee2e2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .btn-danger:hover {
        background: #fecaca;
      }
    </style>
  `
}

module.exports = { getDashboardStyles }
