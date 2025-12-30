function getInternationalStyles() {
  return `
    <style>
      .international-header {
        padding: 1.5rem;
        background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
        color: white;
        border-radius: 12px;
        margin-bottom: 1.5rem;
      }

      .international-header h1 {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        font-size: 1.75rem;
      }

      .international-header p {
        opacity: 0.9;
        margin: 0;
      }

      .region-tabs {
        display: flex;
        gap: 0.5rem;
        margin: 1.5rem 0;
        flex-wrap: wrap;
      }

      .region-tab {
        padding: 0.625rem 1.25rem;
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        text-decoration: none;
        color: var(--text-primary, #1f2937);
      }

      .region-tab:hover {
        background: var(--bg-hover, #f3f4f6);
        border-color: var(--accent-color, #3b82f6);
      }

      .region-tab.active {
        background: var(--accent-color, #3b82f6);
        color: white;
        border-color: var(--accent-color, #3b82f6);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
      }

      .stat-card {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 10px;
        padding: 1rem;
        text-align: center;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--accent-color, #3b82f6);
      }

      .stat-label {
        font-size: 0.85rem;
        color: var(--text-secondary, #6b7280);
        margin-top: 0.25rem;
      }

      .country-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        border-color: var(--accent-color, #3b82f6);
      }

      .country-card.active {
        border-color: var(--accent-color, #3b82f6);
        background: var(--bg-highlight, #f0f9ff);
      }

      .country-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .country-flag {
        font-size: 1.5rem;
      }

      .country-name {
        font-weight: 600;
        font-size: 1rem;
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
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary, #4b5563);
      }

      .updates-section {
        background: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 12px;
        padding: 1.25rem;
      }

      .section-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .update-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .update-item {
        padding: 1rem;
        background: var(--bg-secondary, #f9fafb);
        border-radius: 8px;
        border-left: 3px solid var(--accent-color, #3b82f6);
      }

      .update-item:hover {
        background: var(--bg-tertiary, #f3f4f6);
      }

      .update-meta {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
      }

      .update-authority {
        font-weight: 600;
        color: var(--accent-color, #3b82f6);
      }

      .update-country {
        color: var(--text-secondary, #6b7280);
        font-size: 0.875rem;
      }

      .update-date {
        color: var(--text-tertiary, #9ca3af);
        font-size: 0.8rem;
      }

      .update-title {
        font-weight: 500;
        margin-bottom: 0.375rem;
        line-height: 1.4;
      }

      .update-title a {
        color: var(--text-primary, #1f2937);
        text-decoration: none;
      }

      .update-title a:hover {
        color: var(--accent-color, #3b82f6);
      }

      .update-summary {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        line-height: 1.5;
      }

      .impact-badge {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .impact-badge.high {
        background: #fef2f2;
        color: #dc2626;
      }

      .impact-badge.medium {
        background: #fffbeb;
        color: #d97706;
      }

      .impact-badge.low {
        background: #f0fdf4;
        color: #16a34a;
      }

      .no-updates {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary, #6b7280);
      }

      .no-updates svg {
        width: 64px;
        height: 64px;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .back-link {
        display: inline-block;
        color: rgba(255,255,255,0.8);
        text-decoration: none;
        margin-bottom: 1rem;
        font-size: 0.875rem;
      }

      .back-link:hover {
        color: white;
      }

      .new-badge {
        display: inline-block;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        font-size: 0.625rem;
        font-weight: 700;
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    </style>
  `
}

module.exports = { getInternationalStyles }
