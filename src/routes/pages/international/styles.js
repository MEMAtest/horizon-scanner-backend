function getInternationalStyles() {
  return `
    <style>
      /* Page Header - Matching other pages */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .page-header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .page-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary, #0f172a);
        margin: 0 0 4px 0;
      }

      .page-header .subtitle {
        font-size: 0.9rem;
        color: var(--text-secondary, #64748b);
        margin: 0;
        margin-top: 4px;
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      /* Charts Section */
      .charts-section {
        margin-bottom: 1.5rem;
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .charts-grid-2x2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      @media (max-width: 1024px) {
        .charts-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .charts-grid-2x2 {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .charts-grid {
          grid-template-columns: 1fr;
        }
        .charts-grid-2x2 {
          grid-template-columns: 1fr;
        }
      }

      .chart-card {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 10px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
      }

      .chart-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary, #1f2937);
        margin: 0 0 0.75rem 0;
        text-align: center;
      }

      .chart-container {
        position: relative;
        height: 220px;
        width: 100%;
      }

      .stat-card {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 10px;
        padding: 1rem;
        text-align: center;
        transition: box-shadow 0.2s;
      }

      .stat-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }

      .stat-number {
        display: block;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--accent-color, #3b82f6);
      }

      .stat-label {
        font-size: 0.8rem;
        color: var(--text-secondary, #6b7280);
        margin-top: 0.25rem;
      }

      /* Filters Container */
      .filters-container {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 12px;
        padding: 1rem 1.25rem;
        margin-bottom: 1.5rem;
      }

      .quick-filters {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }

      .quick-filter-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: var(--bg-secondary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.875rem;
        transition: all 0.2s ease;
        color: var(--text-primary, #1f2937);
      }

      .quick-filter-btn:hover {
        background: var(--bg-hover, #f3f4f6);
        border-color: var(--accent-color, #3b82f6);
      }

      .quick-filter-btn.active {
        background: var(--accent-color, #3b82f6);
        color: white;
        border-color: var(--accent-color, #3b82f6);
      }

      .quick-filter-btn .region-icon {
        display: inline-flex;
        width: 18px;
        height: 18px;
        align-items: center;
        justify-content: center;
      }

      .quick-filter-btn .region-icon svg {
        width: 18px;
        height: 18px;
      }

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
        align-items: end;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .filter-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .filter-select,
      .filter-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: var(--bg-secondary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 6px;
        font-size: 0.875rem;
        color: var(--text-primary, #1f2937);
      }

      .filter-select:focus,
      .filter-input:focus {
        outline: none;
        border-color: var(--accent-color, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }

      .filter-actions {
        display: flex;
        gap: 0.5rem;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 500;
        font-size: 0.875rem;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .btn-primary {
        background: var(--accent-color, #3b82f6);
        color: white;
      }

      .btn-primary:hover {
        background: var(--accent-hover, #2563eb);
      }

      .btn-secondary {
        background: var(--bg-secondary, #f9fafb);
        color: var(--text-primary, #1f2937);
        border: 1px solid var(--border-color, #e5e7eb);
      }

      .btn-secondary:hover {
        background: var(--bg-tertiary, #f3f4f6);
      }

      /* Jurisdictions Section */
      .jurisdictions-section {
        margin-bottom: 1.5rem;
      }

      /* Collapsible Toggle Button */
      .jurisdictions-toggle {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.875rem 1rem;
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary, #1f2937);
        text-align: left;
      }

      .jurisdictions-toggle:hover {
        background: var(--bg-hover, #f9fafb);
        border-color: var(--accent-color, #3b82f6);
      }

      .toggle-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        transition: transform 0.3s ease;
      }

      .toggle-icon svg {
        color: var(--text-secondary, #6b7280);
      }

      .jurisdictions-toggle[aria-expanded="true"] .toggle-icon {
        transform: rotate(180deg);
      }

      .toggle-text {
        flex: 1;
      }

      .toggle-count {
        font-weight: 400;
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        background: var(--bg-secondary, #f3f4f6);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
      }

      /* Collapsible Content */
      .jurisdictions-content {
        overflow: hidden;
        transition: max-height 0.4s ease, opacity 0.3s ease, padding 0.3s ease;
      }

      .jurisdictions-content.collapsed {
        max-height: 0;
        opacity: 0;
        padding-top: 0;
      }

      .jurisdictions-content.expanded {
        max-height: 2000px;
        opacity: 1;
        padding-top: 1rem;
      }

      .section-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-primary, #1f2937);
      }

      .update-count {
        font-weight: 400;
        color: var(--text-secondary, #6b7280);
        font-size: 0.9rem;
      }

      .country-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.75rem;
      }

      .country-card {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 10px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .country-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        border-color: var(--accent-color, #3b82f6);
      }

      .country-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .country-flag {
        font-size: 1.25rem;
      }

      .country-name {
        font-weight: 600;
        font-size: 0.95rem;
      }

      .country-authorities {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
      }

      .authority-tag {
        background: var(--bg-tertiary, #f3f4f6);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 500;
        color: var(--text-secondary, #4b5563);
      }

      /* Updates Container */
      .updates-container {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 12px;
        padding: 1.25rem;
      }

      /* Update Card - Dashboard Style */
      .update-card {
        background: var(--bg-secondary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 10px;
        padding: 1rem 1.25rem;
        margin-bottom: 1rem;
        transition: all 0.2s;
      }

      .update-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        border-color: var(--accent-light, #93c5fd);
      }

      .update-card:last-child {
        margin-bottom: 0;
      }

      .update-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .update-meta-primary {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
        max-width: 70%;
      }

      .update-meta-secondary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        flex-shrink: 0;
      }

      .authority-badge {
        background: var(--accent-color, #3b82f6);
        color: white;
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .country-badge {
        background: var(--bg-tertiary, #f3f4f6);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary, #4b5563);
      }

      .date-badge {
        color: var(--text-tertiary, #9ca3af);
        font-size: 0.75rem;
      }

      .content-type-badge {
        background: var(--bg-tertiary, #f3f4f6);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--text-secondary, #6b7280);
      }

      .content-type-badge.consultation { background: #dbeafe; color: #1d4ed8; }
      .content-type-badge.enforcement { background: #fee2e2; color: #dc2626; }
      .content-type-badge.guidance { background: #fef3c7; color: #d97706; }
      .content-type-badge.policy { background: #d1fae5; color: #059669; }
      .content-type-badge.warning { background: #fecaca; color: #b91c1c; }

      /* Risk Score Badge */
      .risk-score-badge {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.625rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .risk-score-badge.risk-critical {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .risk-score-badge.risk-elevated {
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        color: #d97706;
        border: 1px solid #fde68a;
      }

      .risk-score-badge.risk-low {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }

      .risk-score-value {
        font-weight: 700;
        font-size: 0.85rem;
      }

      .risk-score-label {
        font-weight: 500;
      }

      /* Update Headline */
      .update-headline {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        line-height: 1.4;
      }

      .update-headline a {
        color: var(--text-primary, #1f2937);
        text-decoration: none;
      }

      .update-headline a:hover {
        color: var(--accent-color, #3b82f6);
      }

      /* Update Summary */
      .update-summary {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        line-height: 1.6;
        margin-bottom: 0.75rem;
      }

      .ai-badge {
        display: inline;
        font-weight: 600;
        color: var(--accent-color, #3b82f6);
        margin-right: 0.25rem;
      }

      /* Update Details Grid - Dashboard Style */
      .update-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.75rem;
        padding: 0.75rem 0;
        margin: 0.75rem 0;
        border-top: 1px solid var(--border-color, #e5e7eb);
        border-bottom: 1px solid var(--border-color, #e5e7eb);
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .detail-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .detail-value {
        font-size: 0.875rem;
        color: var(--text-primary, #1f2937);
        font-weight: 500;
      }

      .score-indicator {
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.8rem;
      }

      .score-indicator.risk-critical {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        color: #dc2626;
      }

      .score-indicator.risk-elevated {
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        color: #d97706;
      }

      .score-indicator.risk-low {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        color: #16a34a;
      }

      /* Action Buttons */
      .update-actions {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 6px;
        background: var(--bg-secondary, #f9fafb);
        color: var(--text-secondary, #6b7280);
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: var(--bg-tertiary, #f3f4f6);
        border-color: var(--accent-color, #3b82f6);
        color: var(--accent-color, #3b82f6);
      }

      .action-btn-bookmark[aria-pressed="true"] {
        background: #fef3c7;
        border-color: #f59e0b;
        color: #f59e0b;
      }

      .action-btn-bookmark[aria-pressed="true"] svg {
        fill: currentColor;
      }

      /* Update Footer */
      .update-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding-top: 0.75rem;
      }

      .sector-tags {
        display: flex;
        gap: 0.375rem;
        flex-wrap: wrap;
      }

      .sector-tag {
        background: var(--bg-tertiary, #f3f4f6);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 500;
        color: var(--text-secondary, #6b7280);
      }

      .ai-features {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .ai-feature {
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
      }

      .ai-feature.high-impact {
        background: #fef2f2;
        color: #dc2626;
      }

      .ai-feature.urgent {
        background: #fff7ed;
        color: #ea580c;
      }

      .ai-feature.high-confidence {
        background: #f0fdf4;
        color: #16a34a;
      }

      /* No Updates State */
      .no-updates {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary, #6b7280);
      }

      .no-updates svg {
        margin-bottom: 1rem;
        opacity: 0.4;
        color: var(--accent-color, #3b82f6);
      }

      .no-updates h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        color: var(--text-primary, #1f2937);
      }

      .no-updates p {
        margin: 0 0 1rem 0;
        font-size: 0.875rem;
      }

      /* Responsive - tablet */
      @media (max-width: 1024px) and (min-width: 769px) {
        .country-grid {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        }

        .update-meta-primary {
          max-width: 60%;
        }
      }

      /* Responsive - mobile */
      @media (max-width: 768px) {
        .filters-grid {
          grid-template-columns: 1fr;
        }

        .filter-actions {
          flex-direction: column;
        }

        .update-header {
          flex-direction: column;
        }

        .update-details {
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        .country-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `
}

module.exports = { getInternationalStyles }
