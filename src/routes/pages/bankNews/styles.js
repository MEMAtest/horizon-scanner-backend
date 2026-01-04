/**
 * Bank News Page Styles
 *
 * Aligned with site-wide CSS standards (International page as reference)
 * Uses CSS variables for consistency and dark mode support
 */

function getBankNewsStyles() {
  return `
    <style>
      /* Page Header */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .page-header-left {
        display: flex;
        flex-direction: column;
      }

      .page-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary, #0f172a);
        margin: 0;
      }

      /* Header title - icon and text on same line */
      .header-title {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .bank-news-subtitle {
        font-size: 0.9rem;
        color: var(--text-secondary, #64748b);
        margin: 6px 0 0 0;
      }

      /* Page icon - using standard icon container pattern */
      .page-icon.bank-icon {
        width: 48px;
        height: 48px;
        background: var(--accent-color, #3b82f6);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
      }

      /* Search box in header */
      .page-header-right .search-box {
        position: relative;
        width: 280px;
      }

      .page-header-right .search-box input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        font-size: 0.875rem;
        background: var(--bg-card, #ffffff);
        color: var(--text-primary, #1f2937);
        transition: all 0.2s ease;
      }

      .page-header-right .search-box input:focus {
        outline: none;
        border-color: var(--accent-color, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .page-header-right .search-box .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-tertiary, #9ca3af);
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .stat-card {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 12px;
        padding: 1.25rem 1rem;
        text-align: center;
        transition: box-shadow 0.2s;
      }

      .stat-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .stat-number {
        display: block;
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary, #0f172a);
        line-height: 1.2;
      }

      .stat-label {
        display: block;
        font-size: 0.8rem;
        color: var(--text-secondary, #6b7280);
        margin-top: 0.5rem;
      }

      /* Charts Section - with proper container */
      .charts-section {
        margin-bottom: 1.5rem;
      }

      .charts-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 380px;
        gap: 1.25rem;
      }

      .chart-card {
        background: #f8fafc;
        border-radius: 14px;
        border: 1px solid #e2e8f0;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      }

      .chart-card-small {
        grid-column: span 1;
      }

      .chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
      }

      .chart-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary, #1f2937);
        margin: 0;
      }

      .chart-container {
        height: 200px;
        position: relative;
      }

      .chart-container-small {
        height: 180px;
        position: relative;
      }

      /* Filters Container - matching International standard */
      .filters-container {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 10px;
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
        padding: 0.5rem 1rem;
        background: var(--bg-secondary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-primary, #1f2937);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .quick-filter-btn:hover {
        background: var(--bg-card, #ffffff);
        border-color: var(--accent-color, #3b82f6);
      }

      .quick-filter-btn.active {
        background: var(--accent-color, #3b82f6);
        color: white;
        border-color: var(--accent-color, #3b82f6);
      }

      /* Bank filter chips - using standard button pattern */
      .bank-chips {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .bank-chip {
        display: inline-flex;
        align-items: center;
        padding: 0.375rem 0.75rem;
        background: var(--bg-secondary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 6px;
        font-size: 0.8125rem;
        color: var(--text-secondary, #4b5563);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .bank-chip:hover {
        border-color: var(--accent-color, #3b82f6);
        background: var(--bg-card, #ffffff);
      }

      .bank-chip.active {
        background: var(--accent-color, #3b82f6);
        border-color: var(--accent-color, #3b82f6);
        color: white;
      }

      /* Category filters */
      .category-filters {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 0.75rem;
      }

      .category-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        background: var(--bg-secondary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 999px;
        font-size: 0.8125rem;
        color: var(--text-secondary, #4b5563);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .category-chip:hover {
        border-color: var(--accent-color, #3b82f6);
        background: var(--bg-card, #ffffff);
      }

      .category-chip.active {
        background: var(--accent-color, #3b82f6);
        border-color: var(--accent-color, #3b82f6);
        color: white;
      }

      .category-chip .category-count {
        font-size: 0.75rem;
        font-weight: 600;
        opacity: 0.8;
      }

      /* Updates Container - matching International standard */
      .updates-container {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 10px;
        padding: 1.25rem;
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

      .section-title .update-count {
        font-size: 0.875rem;
        font-weight: 400;
        color: var(--text-tertiary, #9ca3af);
      }

      .updates-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      /* Update card - matching International standard */
      .update-card {
        background: var(--bg-secondary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 10px;
        padding: 1rem 1.25rem;
        transition: all 0.2s;
      }

      .update-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        border-color: var(--accent-color, #3b82f6);
      }

      .update-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .update-meta-primary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .update-meta-secondary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      /* Authority badge - standard styling */
      .authority-badge {
        background: var(--accent-color, #3b82f6);
        color: white;
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .date-badge {
        color: var(--text-tertiary, #9ca3af);
        font-size: 0.75rem;
      }

      .region-tag {
        font-size: 0.6875rem;
        font-weight: 500;
        padding: 0.25rem 0.5rem;
        background: var(--bg-secondary, #f9fafb);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 4px;
        color: var(--text-tertiary, #9ca3af);
      }

      .category-badge {
        font-size: 0.6875rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.1);
        color: var(--accent-color, #3b82f6);
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }

      .update-headline {
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.4;
        margin: 0.5rem 0;
        color: var(--text-primary, #1f2937);
      }

      .update-headline a {
        color: inherit;
        text-decoration: none;
        transition: color 0.15s ease;
      }

      .update-headline a:hover {
        color: var(--accent-color, #3b82f6);
      }

      .update-summary {
        font-size: 0.875rem;
        color: var(--text-secondary, #4b5563);
        line-height: 1.5;
        margin-bottom: 0.75rem;
      }

      .update-summary.is-empty {
        color: var(--text-tertiary, #9ca3af);
        font-style: italic;
      }

      .ai-badge {
        display: inline-block;
        background: var(--accent-color, #3b82f6);
        color: white;
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        font-size: 0.6875rem;
        font-weight: 600;
        margin-right: 0.25rem;
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

      .update-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-color, #e5e7eb);
      }

      .read-more-link {
        font-size: 0.8125rem;
        color: var(--accent-color, #3b82f6);
        text-decoration: none;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        transition: color 0.15s ease;
      }

      .read-more-link:hover {
        color: var(--accent-color-hover, #2563eb);
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 3rem 2rem;
        color: var(--text-tertiary, #9ca3af);
      }

      .empty-state .empty-icon {
        width: 64px;
        height: 64px;
        background: var(--bg-secondary, #f9fafb);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        color: var(--text-tertiary, #9ca3af);
      }

      .empty-state h3 {
        color: var(--text-primary, #1f2937);
        font-size: 1.125rem;
        margin-bottom: 0.5rem;
      }

      .empty-state p {
        margin: 0.5rem 0;
        font-size: 0.875rem;
      }

      .empty-state .empty-hint {
        margin-top: 1rem;
        font-size: 0.8125rem;
      }

      .empty-state code {
        background: var(--bg-secondary, #f9fafb);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: ui-monospace, monospace;
        font-size: 0.75rem;
      }

      /* Responsive - matching International breakpoints */
      @media (max-width: 1024px) {
        .charts-grid {
          grid-template-columns: 1fr 1fr;
        }

        .chart-card-small {
          grid-column: span 2;
        }

        .chart-container-small {
          height: 160px;
        }
      }

      @media (max-width: 768px) {
        .charts-grid {
          grid-template-columns: 1fr;
        }

        .chart-card-small {
          grid-column: span 1;
        }

        .page-header-right .search-box {
          width: 100%;
        }

        .quick-filters {
          justify-content: flex-start;
        }
      }
    </style>
  `
}

module.exports = { getBankNewsStyles }
