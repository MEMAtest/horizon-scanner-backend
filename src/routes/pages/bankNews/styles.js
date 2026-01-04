/**
 * Bank News Page Styles
 *
 * Gold/amber accent color scheme for bank news
 */

function getBankNewsStyles() {
  return `
    <style>
      .bank-news-container {
        padding: 1.5rem;
        max-width: 1600px;
        margin: 0 auto;
      }

      .bank-news-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .bank-news-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .bank-news-title h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .bank-news-title .icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .bank-news-subtitle {
        color: #64748b;
        font-size: 0.9rem;
        margin-top: 0.25rem;
      }

      /* Stats Row */
      .bank-stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .bank-stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      }

      .bank-stat-card .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #0f172a;
      }

      .bank-stat-card .stat-label {
        font-size: 0.85rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      .bank-stat-card.highlight {
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border-color: #fbbf24;
      }

      .bank-stat-card.highlight .stat-value {
        color: #b45309;
      }

      /* Filters */
      .bank-filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .bank-filter-group {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .bank-filter-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        font-size: 0.85rem;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .bank-filter-chip:hover {
        border-color: #f59e0b;
        background: #fffbeb;
      }

      .bank-filter-chip.active {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-color: transparent;
        color: white;
      }

      .bank-filter-chip .chip-count {
        background: rgba(0,0,0,0.1);
        padding: 0.125rem 0.5rem;
        border-radius: 10px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .bank-filter-chip.active .chip-count {
        background: rgba(255,255,255,0.2);
      }

      /* Region Pills */
      .region-pills {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
        background: #f8fafc;
        border-radius: 12px;
        margin-bottom: 1.5rem;
      }

      .region-pill {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .region-pill:hover {
        background: white;
        color: #0f172a;
      }

      .region-pill.active {
        background: white;
        color: #b45309;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }

      /* Updates Grid */
      .bank-updates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1rem;
      }

      .bank-update-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        padding: 1.25rem;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .bank-update-card:hover {
        border-color: #fbbf24;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
        transform: translateY(-2px);
      }

      .bank-update-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }

      .bank-logo {
        width: 40px;
        height: 40px;
        background: #f8fafc;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 700;
        color: #64748b;
        flex-shrink: 0;
      }

      .bank-update-meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        flex: 1;
        min-width: 0;
      }

      .bank-name {
        font-size: 0.75rem;
        font-weight: 600;
        color: #b45309;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }

      .bank-update-date {
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .bank-update-title {
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
        line-height: 1.4;
        margin-bottom: 0.5rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .bank-update-title a {
        color: inherit;
        text-decoration: none;
      }

      .bank-update-title a:hover {
        color: #b45309;
      }

      .bank-update-excerpt {
        font-size: 0.875rem;
        color: #64748b;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .bank-update-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid #f1f5f9;
      }

      .bank-region-tag {
        font-size: 0.7rem;
        font-weight: 500;
        padding: 0.25rem 0.5rem;
        background: #f8fafc;
        border-radius: 4px;
        color: #64748b;
      }

      .bank-update-link {
        font-size: 0.8rem;
        color: #f59e0b;
        text-decoration: none;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .bank-update-link:hover {
        color: #d97706;
      }

      /* Empty State */
      .bank-empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #64748b;
      }

      .bank-empty-state .empty-icon {
        width: 64px;
        height: 64px;
        background: #fef3c7;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        color: #f59e0b;
      }

      .bank-empty-state h3 {
        color: #0f172a;
        margin-bottom: 0.5rem;
      }

      /* Loading State */
      .bank-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        color: #64748b;
      }

      .bank-loading .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #fef3c7;
        border-top-color: #f59e0b;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 1rem;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Search Box */
      .bank-search-box {
        position: relative;
        max-width: 400px;
      }

      .bank-search-box input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        font-size: 0.9rem;
        background: white;
      }

      .bank-search-box input:focus {
        outline: none;
        border-color: #f59e0b;
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
      }

      .bank-search-box .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .bank-news-container {
          padding: 1rem;
        }

        .bank-news-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .bank-updates-grid {
          grid-template-columns: 1fr;
        }

        .bank-stats-row {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    </style>
  `
}

module.exports = { getBankNewsStyles }
