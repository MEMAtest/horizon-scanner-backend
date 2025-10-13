// FCA Enforcement Dashboard Page
// Enhanced Horizon Scanner - Enforcement Intelligence

const { getCommonStyles } = require('../templates/commonStyles')
const { getSidebar } = require('../templates/sidebar')
const { getCommonClientScripts } = require('../templates/clientScripts')

const enforcementPage = async (req, res) => {
  try {
    console.log('[enforcement] dashboard page requested')

    const sidebar = await getSidebar('enforcement')

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FCA Enforcement Dashboard - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .enforcement-header {
                    background: #ffffff;
                    color: #0f172a;
                    padding: 28px;
                    border-radius: 16px;
                    margin-bottom: 28px;
                    position: relative;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 16px 40px -32px rgba(15, 23, 42, 0.6);
                }

                .enforcement-header h1 {
                    margin: 0 0 8px 0;
                    font-size: 1.85rem;
                    font-weight: 700;
                    letter-spacing: -0.01em;
                }

                .enforcement-subtitle {
                    font-size: 1rem;
                    color: #475569;
                    margin-bottom: 18px;
                }

                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .title-icon {
                    width: 46px;
                    height: 46px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 64, 175, 0.08));
                    color: #1d4ed8;
                }

                .title-icon svg {
                    width: 26px;
                    height: 26px;
                    stroke: currentColor;
                    stroke-width: 1.6;
                    fill: none;
                }

                .header-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 10px;
                }

                .meta-item {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 10px 14px;
                    min-width: 140px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .meta-item.status .meta-value {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .meta-label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    font-weight: 600;
                }

                .meta-value {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #1f2937;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #22c55e;
                    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .pattern-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 18px;
                    margin-bottom: 32px;
                }

                .section-context {
                    font-size: 0.85rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .chart-wrapper {
                    position: relative;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 16px;
                    min-height: 260px;
                }

                .chart-wrapper canvas {
                    width: 100% !important;
                    height: 320px !important;
                }

                .chart-empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 220px;
                    color: #64748b;
                    font-style: italic;
                }

                .table-wrapper {
                    margin-top: 20px;
                }

                .compact-table .data-table th,
                .compact-table .data-table td {
                    padding: 10px 12px;
                }

                .category-summary {
                    margin-top: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    font-size: 0.9rem;
                    color: #475569;
                }

                .category-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #eef2ff;
                    color: #4338ca;
                    border-radius: 14px;
                    padding: 4px 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .playbook-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 18px;
                }

                .playbook-card {
                    background: linear-gradient(160deg, #ffffff 0%, #f4f8ff 100%);
                    border: 1px solid #e0e7ff;
                    border-radius: 16px;
                    padding: 20px 22px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    box-shadow: 0 18px 36px -28px rgba(59, 130, 246, 0.7);
                }

                .playbook-header {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .playbook-category {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #6366f1;
                    font-weight: 700;
                }

                .playbook-headline {
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: #1e293b;
                    line-height: 1.4;
                }

                .playbook-meta {
                    font-size: 0.85rem;
                    color: #475569;
                }

                .playbook-bullets {
                    margin: 0;
                    padding-left: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    color: #1f2937;
                }

                .playbook-footnote {
                    font-size: 0.8rem;
                    color: #64748b;
                    border-top: 1px dashed rgba(99, 102, 241, 0.35);
                    padding-top: 10px;
                }

                .empty-state {
                    font-size: 0.9rem;
                    color: #64748b;
                    font-style: italic;
                }

                .stat-card {
                    background: #ffffff;
                    padding: 25px;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                }

                .stat-card:hover {
                    border-color: #d1d5db;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .pattern-card {
                    background: linear-gradient(140deg, #ffffff 0%, #f8fafc 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 20px 22px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    box-shadow: 0 10px 24px -22px rgba(15, 23, 42, 0.5);
                }

                .pattern-label {
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                    color: #64748b;
                }

                .pattern-highlight {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #1d4ed8;
                }

                .pattern-footnote {
                    font-size: 0.85rem;
                    color: #475569;
                    line-height: 1.4;
                }

                .stat-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                }

                .stat-icon svg {
                    width: 26px;
                    height: 26px;
                    stroke-width: 1.6;
                    stroke: currentColor;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .icon-blue {
                    background: rgba(59, 130, 246, 0.12);
                    color: #1d4ed8;
                }

                .icon-amber {
                    background: rgba(251, 191, 36, 0.16);
                    color: #b45309;
                }

                .icon-plum {
                    background: rgba(99, 102, 241, 0.14);
                    color: #4c1d95;
                }

                .icon-crimson {
                    background: rgba(248, 113, 113, 0.16);
                    color: #b91c1c;
                }

                .stat-value {
                    font-size: 2.2rem;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 5px;
                }

                .stat-label {
                    color: #6b7280;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .stat-change {
                    font-size: 0.875rem;
                    margin-top: 8px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .change-positive {
                    color: #10b981;
                }

                .change-negative {
                    color: #ef4444;
                }

                .dashboard-section {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 25px;
                    margin-bottom: 20px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f3f4f6;
                }

                .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1f2937;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .section-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 1.6rem;
                    height: 1.6rem;
                    color: #4338ca;
                    background: #eef2ff;
                    border-radius: 10px;
                    padding: 6px;
                }

                .section-icon svg {
                    width: 100%;
                    height: 100%;
                    stroke: currentColor;
                    stroke-width: 1.6;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: none;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    display: inline-block;
                }

                .btn-primary {
                    background: #3b82f6;
                    color: white;
                }

                .btn-primary:hover {
                    background: #2563eb;
                }

                .btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #e5e7eb;
                }

                .btn-secondary:hover {
                    background: #e5e7eb;
                }

                .section-header .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .button-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 1.1rem;
                    height: 1.1rem;
                }

                .button-icon svg {
                    width: 100%;
                    height: 100%;
                    stroke: currentColor;
                    stroke-width: 1.6;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .btn-primary .button-icon svg {
                    stroke: #ffffff;
                }

                .search-filters {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                    align-items: end;
                    background: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .filter-label {
                    font-weight: 500;
                    color: #374151;
                    font-size: 0.875rem;
                }

                .filter-input {
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 0.875rem;
                }

                .filter-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .filter-input[multiple] {
                    min-height: 120px;
                    resize: vertical;
                }

                .chip-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-top: 8px;
                    flex-wrap: wrap;
                }

                .chip-list {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #e0e7ff;
                    color: #312e81;
                    border: none;
                    border-radius: 999px;
                    padding: 4px 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s ease, color 0.2s ease;
                }

                .chip:hover {
                    background: #c7d2fe;
                    color: #1e1b4b;
                }

                .chip-remove {
                    font-size: 0.9rem;
                    line-height: 1;
                    display: inline-block;
                }

                .chip-clear {
                    background: none;
                    border: none;
                    color: #6b7280;
                    font-size: 0.78rem;
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    cursor: pointer;
                    transition: color 0.2s ease;
                }

                .chip-clear:hover {
                    color: #1f2937;
                }

                .chip-clear:disabled,
                .chip-clear.disabled {
                    color: #cbd5f5;
                    cursor: not-allowed;
                }

                .link-button {
                    background: none;
                    border: none;
                    color: #2563eb;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    margin-left: 6px;
                    padding: 0;
                }

                .link-button:hover {
                    text-decoration: underline;
                }

                .filter-hint {
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin-top: 4px;
                    font-style: italic;
                }

                /* Enhanced Trends Styling */
                .trends-toolbar {
                    display: flex;
                    justify-content: flex-end;
                    align-items: flex-end;
                    gap: 16px;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                }

                .top-firms-toolbar {
                    display: flex;
                    justify-content: flex-end;
                    align-items: flex-end;
                    gap: 16px;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                }

                .trend-search-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    align-items: flex-start;
                }

                .trend-search-label {
                    font-size: 0.72rem;
                    font-weight: 600;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #64748b;
                }

                .trend-search-input {
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    min-width: 220px;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .trend-search-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
                }

                .trends-summary {
                    margin-top: 0;
                    margin-bottom: 24px;
                }

                .trends-filter-info {
                    margin-bottom: 15px;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .filter-badge {
                    background: #3b82f6;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .trends-metrics {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                }

                .metric-card {
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .metric-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .metric-icon {
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #eef2ff;
                    color: #4338ca;
                    border-radius: 12px;
                }

                .metric-icon svg {
                    width: 22px;
                    height: 22px;
                    stroke: currentColor;
                    stroke-width: 1.6;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .metric-content {
                    flex: 1;
                }

                .metric-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 2px;
                }

                .metric-label {
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                /* Enhanced table styling */
                .enhanced-trends-table {
                    margin-top: 20px;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }

                .trends-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                }

                .trends-table th {
                    background: #f8fafc;
                    color: #374151;
                    padding: 15px 12px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 0.875rem;
                    border-bottom: 2px solid #e5e7eb;
                }

                .trends-table td {
                    padding: 12px;
                    border-bottom: 1px solid #f1f5f9;
                    vertical-align: middle;
                }

                .trends-table tr:hover {
                    background: #f8fafc;
                }

                .fine-count-cell {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .count-number {
                    font-weight: 600;
                    color: #1e293b;
                }

                .trend-up {
                    color: #10b981;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .trend-down {
                    color: #ef4444;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .trend-stable,
                .trend-flat {
                    color: #6b7280;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .risk-score-bar {
                    position: relative;
                    background: #f1f5f9;
                    border-radius: 8px;
                    height: 24px;
                    min-width: 80px;
                    overflow: hidden;
                }

                .risk-score-fill {
                    background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%);
                    height: 100%;
                    transition: width 0.3s ease;
                    border-radius: 8px;
                }

                .risk-score-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #1e293b;
                    text-shadow: 0 1px 2px rgba(255,255,255,0.8);
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }

                .data-table th {
                    background: #f8fafc;
                    padding: 12px 15px;
                    text-align: left;
                    font-weight: 600;
                    color: #374151;
                    border-bottom: 2px solid #e5e7eb;
                }

                .data-table td {
                    padding: 15px;
                    border-bottom: 1px solid #f3f4f6;
                    vertical-align: top;
                }

                .data-table tr:hover {
                    background: #f9fafb;
                }

                .fine-amount {
                    font-weight: 700;
                    color: #059669;
                }

                .fine-reference {
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 0.875rem;
                    background: #f3f4f6;
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .breach-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                }

                .breach-tag {
                    background: #fef3c7;
                    color: #92400e;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .risk-badge {
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .risk-high {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .risk-medium {
                    background: #fef3c7;
                    color: #d97706;
                }

                .risk-low {
                    background: #d1fae5;
                    color: #065f46;
                }

                .loading-state {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top: 4px solid #dc2626;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }

                .error-state {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #991b1b;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }

                .trends-chart {
                    background: #f9fafb;
                    border-radius: 8px;
                    padding: 20px;
                    color: #374151;
                }

                .trend-summary {
                    margin-bottom: 25px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }

                .trend-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-top: 15px;
                }

                .trend-stat {
                    text-align: center;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }

                .trend-value {
                    display: block;
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #1e40af;
                    margin-bottom: 5px;
                }

                .trend-label {
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .trend-breakdown h5 {
                    margin-bottom: 15px;
                    color: #374151;
                    font-weight: 600;
                }

                .trend-periods {
                    display: grid;
                    gap: 10px;
                }

                .trend-period {
                    display: grid;
                    grid-template-columns: 1fr auto auto;
                    gap: 15px;
                    padding: 12px 15px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                    align-items: center;
                }

                .period-name {
                    font-weight: 600;
                    color: #374151;
                }

                .period-count {
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .period-amount {
                    font-weight: 600;
                    color: #059669;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .header-title {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .search-filters {
                        grid-template-columns: 1fr;
                    }

                    .chart-wrapper canvas {
                        height: 240px !important;
                    }

                    .playbook-grid {
                        grid-template-columns: 1fr;
                    }

                    .data-table {
                        font-size: 0.875rem;
                    }

                    .data-table th,
                    .data-table td {
                        padding: 10px 8px;
                    }
                }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body>
            <div class="app-container">
                ${sidebar}

                <main class="main-content">
                    <header class="enforcement-header">
                        <div class="header-title">
                            <span class="title-icon">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 3v16"></path>
                                    <path d="M5 7h14"></path>
                                    <path d="M7 7 4 13h6l-3-6z"></path>
                                    <path d="M17 7 14 13h6l-3-6z"></path>
                                </svg>
                            </span>
                            <div>
                                <h1>FCA Enforcement Dashboard</h1>
                                <p class="enforcement-subtitle">Comprehensive analysis of Financial Conduct Authority enforcement actions, fines, and regulatory penalties</p>
                            </div>
                        </div>
                        <div class="header-meta">
                            <div class="meta-item status">
                                <span class="meta-label">Status</span>
                                <span class="meta-value"><span class="status-dot"></span><span id="status-value">Active</span></span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Updated</span>
                                <span class="meta-value" id="last-update">Loading...</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Coverage</span>
                                <span class="meta-value" id="data-coverage">Full dataset</span>
                            </div>
                        </div>
                    </header>

                    <!-- Statistics Overview -->
                    <div class="stats-grid" id="stats-container">
                        <div class="loading-state">
                            <div class="loading-spinner"></div>
                            <p>Loading enforcement statistics...</p>
                        </div>
                    </div>

                    <div class="pattern-grid" id="pattern-container"></div>

                    <!-- Year-over-Year Overview -->
                    <div class="dashboard-section" id="yearly-overview-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <span class="section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"></rect><path d="M8 3.5v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M16 3.5v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M4 10h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></span> Year-over-Year Trend
                            </h2>
                            <div class="section-context" id="yearly-context">Preparing yearly analysis...</div>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="yearlyTrendChart"></canvas>
                        </div>
                        <div id="yearly-table-container" class="table-wrapper compact-table"></div>
                    </div>

                    <!-- Category Mix -->
                    <div class="dashboard-section" id="category-mix-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <span class="section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M4 7h12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M4 15h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><circle cx="18" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="1.6"></circle><circle cx="16" cy="15" r="2" fill="none" stroke="currentColor" stroke-width="1.6"></circle><circle cx="20" cy="11" r="2" fill="none" stroke="currentColor" stroke-width="1.6"></circle></svg></span> Category Mix Focus
                            </h2>
                            <div class="section-context" id="category-context">Highlighting the busiest breach themes.</div>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="categoryTrendChart"></canvas>
                        </div>
                        <div id="category-trend-summary" class="category-summary"></div>
                    </div>

                    <!-- Control Playbook -->
                    <div class="dashboard-section" id="control-playbook-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <span class="section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 5 7v6c0 4.5 3.4 8.3 7 9 3.6-.7 7-4.5 7-9V7l-7-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="m9.5 12 1.8 1.8 3.2-3.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span> Control Playbook
                            </h2>
                            <div class="section-context" id="control-context">Linking recurring enforcement themes to practical remediation steps.</div>
                        </div>
                        <div id="control-playbook" class="playbook-grid">
                            <div class="loading-state">
                                <div class="loading-spinner"></div>
                                <p>Building control recommendations...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Fines Section -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <span class="section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4.5" width="14" height="15.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"></rect><path d="M9 2.5h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M12 2.5v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M9 9.5h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M9 13.5h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></span> Recent Enforcement Actions
                            </h2>
                            <div>
                                <button class="btn btn-secondary" onclick="refreshData()"><span class="button-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5v6h-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 19v-6h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 9a7 7 0 0 1 11.5-2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M18.5 15a7 7 0 0 1-11.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg></span> Refresh</button>
                                <button class="btn btn-primary" onclick="exportData()"><span class="button-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M7 10.5 12 16l5-5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><rect x="5" y="17" width="14" height="3.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></rect></svg></span> Export CSV</button>
                            </div>
                        </div>

                        <div class="search-filters">
                            <div class="filter-group">
                                <label class="filter-label">Search</label>
                                <input type="text" class="filter-input" id="search-input" placeholder="Search firms, breach types, or descriptions...">
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Year (Multi-select)</label>
                                <select class="filter-input" id="year-filter" multiple size="6">
                                    <option value="2025">2025</option>
                                    <option value="2024">2024</option>
                                    <option value="2023">2023</option>
                                    <option value="2022">2022</option>
                                    <option value="2021">2021</option>
                                    <option value="2020">2020</option>
                                    <option value="2019">2019</option>
                                    <option value="2018">2018</option>
                                    <option value="2017">2017</option>
                                    <option value="2016">2016</option>
                                    <option value="2015">2015</option>
                                    <option value="2014">2014</option>
                                    <option value="2013">2013</option>
                                </select>
                                <div class="chip-toolbar">
                                    <div class="chip-list" id="year-chip-list"></div>
                                    <button type="button" class="chip-clear" id="year-clear-btn">Clear years</button>
                                </div>
                                <small class="filter-hint">Click chips to remove a year or use Ctrl/Cmd for multi-select</small>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Breach Category</label>
                                <select class="filter-input" id="breach-category">
                                    <option value="">All Categories</option>
                                    <option value="Anti-Money Laundering">Anti-Money Laundering</option>
                                    <option value="Market Abuse">Market Abuse</option>
                                    <option value="Customer Treatment">Customer Treatment</option>
                                    <option value="Systems and Controls">Systems and Controls</option>
                                    <option value="Prudential Requirements">Prudential Requirements</option>
                                    <option value="Conduct Risk">Conduct Risk</option>
                                    <option value="Client Money">Client Money</option>
                                    <option value="Governance">Governance</option>
                                    <option value="Reporting and Disclosure">Reporting and Disclosure</option>
                                    <option value="Financial Crime">Financial Crime</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Minimum Amount</label>
                                <input type="number" class="filter-input" id="min-amount" placeholder="&pound;0">
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Risk Level</label>
                                <select class="filter-input" id="risk-level">
                                    <option value="">All</option>
                                    <option value="high">High Risk</option>
                                    <option value="medium">Medium Risk</option>
                                    <option value="low">Low Risk</option>
                                </select>
                            </div>
                        </div>

                        <div id="fines-container">
                            <div class="loading-state">
                                <div class="loading-spinner"></div>
                                <p>Loading recent enforcement actions...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Enforcement Trends -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <span class="section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M5 14l4-5 4 4 6-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span> Enforcement Trends
                            </h2>
                            <div>
                                <select class="filter-input" id="trends-period">
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>

                        <div class="trends-toolbar">
                            <div class="trend-search-group">
                                <label for="trend-search" class="trend-search-label">Search trends</label>
                                <input type="search" id="trend-search" class="trend-search-input" placeholder="e.g. 2024 or &pound;50m" autocomplete="off" />
                            </div>
                        </div>

                        <div id="trends-container">
                            <div class="trends-chart">
                                <p>Trends chart will load here</p>
                            </div>
                        </div>
                    </div>

                    <!-- Top Firms -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <span class="section-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M6 20V8l6-4 6 4v12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span> Top Fined Firms
                            </h2>
                        </div>

                        <div class="top-firms-toolbar">
                            <div class="trend-search-group">
                                <label for="top-firm-search" class="trend-search-label">Search firms</label>
                                <input type="search" id="top-firm-search" class="trend-search-input" placeholder="e.g. HSBC or &pound;200m" autocomplete="off" />
                            </div>
                        </div>

                        <div id="top-firms-container">
                            <div class="loading-state">
                                <div class="loading-spinner"></div>
                                <p>Loading top fined firms...</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <script>
                // Enforcement Dashboard JavaScript
                class EnforcementDashboard {
                    constructor() {
                        this.charts = {};
                        this.baseStats = null;
                        this.baseYearlyOverview = [];
                        this.baseControlRecommendations = [];
                        this.baseCategoryTrends = [];
                        this.allFines = [];
                        this.latestFilteredFines = [];
                        this.latestFilteredTotal = 0;
                        this.trendCache = {};
                        this.latestTrendsData = [];
                        this.trendSearchTerm = '';
                        this.latestTopFirms = [];
                        this.topFirmSearchTerm = '';
                        this.currentTrendPeriod = 'monthly';
                        this.filteredSummary = null;
                        this.defaultTableRowLimit = 50;
                        this.tableRowLimit = this.defaultTableRowLimit;
                        this.showAllFines = false;
                        this.isFilterActive = false;
                        this.currentFilterParams = {};
                        this.init();
                    }

                    async init() {
                        console.log('[init] Initializing enforcement dashboard...');

                        // Load initial data
                        await this.loadStats();
                        await this.loadRecentFines();
                        await this.loadTrends();
                        await this.loadTopFirms();

                        // Set up event listeners
                        this.setupEventListeners();

                        console.log('[ready] Enforcement dashboard initialized');
                    }

                    async loadStats() {
                        await this.loadStatsWithFilters();
                    }

                    async loadStatsWithFilters(filterParams = {}) {
                        try {
                            this.currentFilterParams = filterParams || {};
                            const hasFilters = this.hasActiveFilters(filterParams);

                            if (!hasFilters) {
                                const response = await fetch('/api/enforcement/stats');
                                const data = await response.json();

                                if (!data.success) {
                                    throw new Error(data.error || 'Failed to load stats');
                                }

                                this.isFilterActive = false;
                                this.currentFilterParams = {};
                                this.baseStats = data.stats;
                                this.baseYearlyOverview = data.stats.yearlyOverview || [];
                                this.baseControlRecommendations = data.stats.controlRecommendations || [];
                                this.baseCategoryTrends = data.stats.topCategoryTrends || [];
                                this.latestFilteredFines = [];
                                this.latestFilteredTotal = 0;

                                this.populateFilters(data.stats);
                                this.renderStats(data.stats);
                                this.filteredSummary = null;
                                if (Array.isArray(this.allFines) && this.allFines.length) {
                                    this.renderFines(this.allFines);
                                }
                                await this.loadTrends(true, {});
                                await this.loadTopFirms();
                                return;
                            }

                            const { fines: filteredFines, total: totalMatches } = await this.fetchFilteredFines(filterParams);
                            this.isFilterActive = true;
                            this.latestFilteredFines = filteredFines;
                            this.latestFilteredTotal = totalMatches;

                            this.renderFilteredStats(filteredFines, filterParams);
                            this.renderFines(filteredFines);

                            const topFirmSnapshot = this.buildTopFirmsFromFines(filteredFines);
                            this.renderTopFirms(topFirmSnapshot, {
                                filterMode: true,
                                scopeLabel: this.filteredSummary ? this.filteredSummary.scopeLabel : null
                            });

                            await this.loadTrends(true, filterParams);
                        } catch (error) {
                            console.error('[error] Error loading stats:', error);
                            this.renderStatsError(error.message);
                        }
                    }

                    renderStats(stats) {
                        if (!stats) return;
                        this.isFilterActive = false;
                        this.showAllFines = false;
                        this.tableRowLimit = this.defaultTableRowLimit;
                        this.latestFilteredTotal = Array.isArray(this.allFines) ? this.allFines.length : 0;
                        this.updateYearChips([]);

                        const container = document.getElementById('stats-container');
                        const overview = stats.overview || {};
                        const totalFines = overview.total_fines || 0;
                        const finesThisYear = overview.fines_this_year || 0;
                        const totalAmount = overview.total_amount || 0;
                        const amountThisYear = overview.amount_this_year || 0;
                        const last30Count = overview.fines_last_30_days || 0;
                        const last30Amount = overview.amount_last_30_days || 0;
                        const distinctFirms = overview.distinct_firms || 0;
                        const repeatOffenders = overview.repeat_offenders || 0;

                        container.innerHTML = [
                            '<div class="stat-card">',
                                this.getStatIcon('total'),
                                '<div class="stat-value">' + totalFines + '</div>',
                                '<div class="stat-label">Total Enforcement Actions</div>',
                                '<div class="stat-change change-positive">Year-to-date: ' + finesThisYear + '</div>',
                            '</div>',
                            '<div class="stat-card">',
                                this.getStatIcon('fines'),
                                '<div class="stat-value">' + this.formatCurrency(totalAmount) + '</div>',
                                '<div class="stat-label">Total Fines Issued</div>',
                                '<div class="stat-change">YTD amount: ' + this.formatCurrency(amountThisYear) + '</div>',
                            '</div>',
                            '<div class="stat-card">',
                                this.getStatIcon('recent'),
                                '<div class="stat-value">' + last30Count + '</div>',
                                '<div class="stat-label">Last 30 Days</div>',
                                '<div class="stat-change">Amount recovered: ' + this.formatCurrency(last30Amount) + '</div>',
                            '</div>',
                            '<div class="stat-card">',
                                this.getStatIcon('risk'),
                                '<div class="stat-value">' + this.formatNumber(distinctFirms) + '</div>',
                                '<div class="stat-label">Distinct Firms Fined</div>',
                                '<div class="stat-change">Repeat offenders: ' + this.formatNumber(repeatOffenders) + '</div>',
                            '</div>'
                        ].join('');

                        this.updateHeaderMeta('Full dataset');

                        this.renderPatternCards({
                            topBreachTypes: stats.topBreachTypes || [],
                            topSectors: stats.topSectors || [],
                            overview,
                            yearlyOverview: stats.yearlyOverview || []
                        });

                        this.renderYearlyOverview(stats.yearlyOverview || []);
                        this.renderCategoryTrends(stats.topCategoryTrends || []);
                        this.renderControlPlaybook(stats.controlRecommendations || []);
                    }

                    renderFilteredStats(fines = [], filterContext = {}) {
                        const container = document.getElementById('stats-container');
                        this.showAllFines = false;
                        this.tableRowLimit = this.defaultTableRowLimit;

                        const totalFines = fines.length;
                        const totalAmount = fines.reduce((sum, fine) => sum + (Number(fine.amount) || 0), 0);
                        const averageAmount = totalFines > 0 ? totalAmount / totalFines : 0;

                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        let recentCount = 0;
                        let recentAmount = 0;

                        const firmCounts = new Map();
                        let amountThisYear = 0;
                        const selectedYears = Array.isArray(filterContext.yearsArray) && filterContext.yearsArray.length
                            ? new Set(filterContext.yearsArray.map(year => Number(year)))
                            : null;
                        const currentYear = new Date().getFullYear();

                        fines.forEach(fine => {
                            const issueDate = fine.date_issued ? new Date(fine.date_issued) : null;
                            const amount = Number(fine.amount) || 0;

                            if (issueDate && issueDate >= thirtyDaysAgo) {
                                recentCount += 1;
                                recentAmount += amount;
                            }

                            const fineYear = issueDate ? issueDate.getFullYear() : null;
                            if (selectedYears && fineYear !== null) {
                                if (selectedYears.has(fineYear)) {
                                    amountThisYear += amount;
                                }
                            } else if (fineYear === currentYear) {
                                amountThisYear += amount;
                            }

                            const firm = (fine.firm_individual || 'Unknown').trim() || 'Unknown';
                            firmCounts.set(firm, (firmCounts.get(firm) || 0) + 1);
                        });

                        const repeatOffenders = Array.from(firmCounts.values()).filter(count => count > 1).length;

                        const scopeLabel = filterContext.years && filterContext.years.length
                            ? 'Scope: ' + filterContext.years.replace(/,/g, ', ')
                            : 'Matches filters';
                        const coverageText = scopeLabel.startsWith('Scope: ')
                            ? 'Filtered | ' + scopeLabel.replace('Scope: ', '')
                            : 'Filtered view';

                        container.innerHTML = [
                            '<div class="stat-card">',
                                this.getStatIcon('total'),
                                '<div class="stat-value">' + totalFines + '</div>',
                                '<div class="stat-label">Filtered Enforcement Actions</div>',
                                '<div class="stat-change change-positive">' + scopeLabel + '</div>',
                            '</div>',
                            '<div class="stat-card">',
                                this.getStatIcon('fines'),
                                '<div class="stat-value">' + this.formatCurrency(totalAmount) + '</div>',
                                '<div class="stat-label">Total Filtered Fines</div>',
                                '<div class="stat-change">Average fine: ' + this.formatCurrency(averageAmount) + '</div>',
                            '</div>',
                            '<div class="stat-card">',
                                this.getStatIcon('recent'),
                                '<div class="stat-value">' + recentCount + '</div>',
                                '<div class="stat-label">Last 30 Days (Filtered)</div>',
                                '<div class="stat-change">Amount collected: ' + this.formatCurrency(recentAmount) + '</div>',
                            '</div>',
                            '<div class="stat-card">',
                                this.getStatIcon('risk'),
                                '<div class="stat-value">' + this.formatNumber(firmCounts.size) + '</div>',
                                '<div class="stat-label">Distinct Firms (Filtered)</div>',
                                '<div class="stat-change">Repeat offenders: ' + this.formatNumber(repeatOffenders) + '</div>',
                            '</div>'
                        ].join('');

                        this.updateHeaderMeta(coverageText);

                        const patterns = this.derivePatternsFromFines(fines);
                        if (patterns.overview) {
                            patterns.overview.amount_this_year = amountThisYear;
                            patterns.overview.total_amount = totalAmount;
                            patterns.overview.distinct_firms = firmCounts.size;
                            patterns.overview.repeat_offenders = repeatOffenders;
                        }

                        const yearlySeries = Array.isArray(patterns.yearlyOverview) && patterns.yearlyOverview.length
                            ? patterns.yearlyOverview
                            : this.baseYearlyOverview;

                        const categorySeries = Array.isArray(patterns.categoryTrendSeries) && patterns.categoryTrendSeries.length
                            ? patterns.categoryTrendSeries
                            : this.baseCategoryTrends;

                        patterns.yearlyOverview = yearlySeries;
                        this.renderPatternCards(patterns);

                        this.renderYearlyOverview(yearlySeries, {
                            filterMode: true,
                            selectedYears: filterContext.yearsArray
                        });

                        this.renderCategoryTrends(categorySeries, {
                            filterMode: true,
                            selectedYears: filterContext.yearsArray
                        });

                        this.renderControlPlaybook(this.baseControlRecommendations, {
                            filterMode: true,
                            fallbackCategories: patterns.topBreachTypes || []
                        });

                        // Store amount for export or additional insights
                        this.filteredSummary = {
                            totalAmount,
                            amountThisYear,
                            recentAmount,
                            scopeLabel,
                            distinctFirms: firmCounts.size,
                            repeatOffenders,
                            totalMatches: typeof this.latestFilteredTotal === 'number' ? this.latestFilteredTotal : totalFines
                        };

                        if (Array.isArray(filterContext.yearsArray)) {
                            this.updateYearChips(filterContext.yearsArray);
                        }
                    }

                    renderStatsError(error) {
                        const container = document.getElementById('stats-container');
                        container.innerHTML = [
                            '<div class="error-state">',
                                '<strong>Failed to load statistics</strong><br>',
                                error,
                            '</div>'
                        ].join('');

                        this.updateHeaderMeta('Unavailable');
                    }

                    async loadRecentFines(options = {}) {
                        try {
                            console.log('[fines] Loading recent fines...');

                            const limit = options.limit || 500;
                            const response = await fetch('/api/enforcement/recent?limit=' + limit);
                            const data = await response.json();

                            if (data.success) {
                                this.allFines = Array.isArray(data.fines) ? data.fines : [];
                                this.allFines.sort((a, b) => {
                                    const dateA = a.date_issued ? new Date(a.date_issued).getTime() : 0;
                                    const dateB = b.date_issued ? new Date(b.date_issued).getTime() : 0;
                                    return dateB - dateA;
                                });
                                if (!options.skipRender) {
                                    this.renderFines(this.allFines);
                                }
                            } else {
                                throw new Error(data.error || 'Failed to load fines');
                            }
                        } catch (error) {
                            console.error('[error] Error loading fines:', error);
                            this.renderFinesError(error.message);
                        }
                    }

                    renderFines(fines) {
                        const container = document.getElementById('fines-container');

                        if (!fines || fines.length === 0) {
                            container.innerHTML = '<p class="loading-state">No enforcement actions found.</p>';
                            return;
                        }

                        this.latestFilteredFines = fines;

                        const hasLimit = this.tableRowLimit && !this.showAllFines;
                        const effectiveLimit = hasLimit ? this.tableRowLimit : null;
                        const displayFines = effectiveLimit && fines.length > effectiveLimit
                            ? fines.slice(0, effectiveLimit)
                            : fines;

                        const tableRows = displayFines.map(fine => {
                            const breachTagsHtml = (fine.breach_categories || []).map(category =>
                                '<span class="breach-tag">' + category + '</span>'
                            ).join('');

                            const aiSummaryHtml = fine.ai_summary ?
                                '<br><small style="color: #6b7280;">' + fine.ai_summary.substring(0, 100) + '...</small>' : '';

                            const noticeActionHtml = fine.final_notice_url ?
                                '<a href="' + fine.final_notice_url + '" target="_blank" class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.75rem;">View Notice</a>' :
                                'N/A';

                            return '<tr>' +
                                '<td>' +
                                    '<span class="fine-reference">' + (fine.fine_reference || 'N/A') + '</span>' +
                                '</td>' +
                                '<td>' + this.formatDate(fine.date_issued) + '</td>' +
                                '<td>' +
                                    '<strong>' + (fine.firm_individual || 'Unknown') + '</strong>' +
                                    aiSummaryHtml +
                                '</td>' +
                                '<td>' +
                                    '<span class="fine-amount">' + this.formatCurrency(fine.amount) + '</span>' +
                                '</td>' +
                                '<td>' +
                                    '<div class="breach-tags">' +
                                        breachTagsHtml +
                                    '</div>' +
                                '</td>' +
                                '<td>' +
                                    this.renderRiskBadge(fine.risk_score) +
                                '</td>' +
                                '<td>' +
                                    noticeActionHtml +
                                '</td>' +
                            '</tr>';
                        }).join('');

                        const tableHTML =
                            '<table class="data-table">' +
                                '<thead>' +
                                    '<tr>' +
                                        '<th>Reference</th>' +
                                        '<th>Date</th>' +
                                        '<th>Firm/Individual</th>' +
                                        '<th>Amount</th>' +
                                        '<th>Breach Categories</th>' +
                                        '<th>Risk</th>' +
                                        '<th>Actions</th>' +
                                    '</tr>' +
                                '</thead>' +
                                '<tbody>' +
                                    tableRows +
                                '</tbody>' +
                            '</table>';

                        let totalAvailable = fines.length;
                        if (this.isFilterActive && typeof this.latestFilteredTotal === 'number' && this.latestFilteredTotal > 0) {
                            totalAvailable = this.latestFilteredTotal;
                        }

                        let footnote = '';
                        if (!this.showAllFines && effectiveLimit && totalAvailable > displayFines.length) {
                            footnote = '<p class="pattern-footnote" style="margin-top: 12px;">Showing first ' + displayFines.length + ' of ' + totalAvailable + ' results. <button type="button" class="link-button" data-action="expand-fines">Show all ' + totalAvailable + '</button></p>';
                        } else if (this.showAllFines && totalAvailable > this.defaultTableRowLimit) {
                            footnote = '<p class="pattern-footnote" style="margin-top: 12px;">Showing all ' + totalAvailable + ' results. <button type="button" class="link-button" data-action="collapse-fines">Show fewer</button></p>';
                        }

                        container.innerHTML = tableHTML + footnote;
                    }

                    renderFinesError(error) {
                        const container = document.getElementById('fines-container');
                        this.latestFilteredFines = [];
                        this.filteredSummary = null;
                        container.innerHTML = [
                            '<div class="error-state">',
                                '<strong>Failed to load enforcement actions</strong><br>',
                                error,
                            '</div>'
                        ].join('');
                    }

                    async loadTrends(force = false, filterParams = this.currentFilterParams || {}) {
                        try {
                            const periodSelect = document.getElementById('trends-period');
                            const period = periodSelect ? (periodSelect.value || 'monthly') : 'monthly';
                            this.currentTrendPeriod = period;

                            const cacheKey = this.getTrendCacheKey(period, filterParams);
                            const cached = this.trendCache[cacheKey];

                            if (!force && Array.isArray(cached)) {
                                const cachedFilter = Object.assign({}, filterParams);
                                if (!cachedFilter.years && Array.isArray(filterParams.yearsArray) && filterParams.yearsArray.length) {
                                    cachedFilter.years = filterParams.yearsArray.join(',');
                                }
                                this.renderEnhancedTrends(cached, cachedFilter);
                                return;
                            }

                            const params = new URLSearchParams();
                            params.set('period', period);
                            params.set('limit', '24');
                            if (Array.isArray(filterParams.yearsArray) && filterParams.yearsArray.length) {
                                const yearsValue = filterParams.yearsArray.map(year => parseInt(year, 10)).filter(year => !isNaN(year)).join(',');
                                if (yearsValue) params.set('years', yearsValue);
                            }

                            const response = await fetch('/api/enforcement/trends?' + params.toString());
                            const data = await response.json();

                            if (!data.success) {
                                throw new Error(data.error || 'Failed to load trends');
                            }

                            const trends = data.trends || [];
                            this.trendCache[cacheKey] = trends;

                            const enrichedFilter = Object.assign({}, filterParams);
                            if (!enrichedFilter.years && params.has('years')) {
                                enrichedFilter.years = params.get('years');
                                enrichedFilter.yearsArray = enrichedFilter.years.split(',').map(year => parseInt(year, 10)).filter(year => !isNaN(year));
                            }

                            this.renderEnhancedTrends(trends, enrichedFilter);
                        } catch (error) {
                            console.error('[error] Error loading trends:', error);
                            this.renderTrendsError(error.message);
                        }
                    }

                    renderTrends(trends) {
                        const container = document.getElementById('trends-container');

                        if (!trends || trends.length === 0) {
                            container.innerHTML = '<div class="trends-chart"><p>No trend data available</p></div>';
                            return;
                        }

                        // Simple table view for trends (could be enhanced with charts later)
                        const tableRows = trends.map(trend => {
                            return '<tr>' +
                                '<td><strong>' + trend.period + '</strong></td>' +
                                '<td>' + (trend.fine_count || 0) + '</td>' +
                                '<td class="fine-amount">' + this.formatCurrency(trend.total_amount) + '</td>' +
                                '<td>' + this.formatCurrency(trend.average_amount) + '</td>' +
                                '<td>' + Math.round(trend.average_risk_score || 0) + '/100</td>' +
                            '</tr>';
                        }).join('');

                        const tableHTML =
                            '<table class="data-table">' +
                                '<thead>' +
                                    '<tr>' +
                                        '<th>Period</th>' +
                                        '<th>Fine Count</th>' +
                                        '<th>Total Amount</th>' +
                                        '<th>Average Amount</th>' +
                                        '<th>Average Risk Score</th>' +
                                    '</tr>' +
                                '</thead>' +
                                '<tbody>' +
                                    tableRows +
                                '</tbody>' +
                            '</table>';

                        container.innerHTML = tableHTML;
                    }

                    renderEnhancedTrends(trends, filterParams = {}) {
                        const container = document.getElementById('trends-container');

                        const allTrends = Array.isArray(trends) ? [...trends] : [];
                        this.latestTrendsData = allTrends;

                        if (!allTrends.length) {
                            const filterMessage = Object.keys(filterParams).length > 0 ? ' for selected filters' : '';
                            container.innerHTML = '<div class="trends-chart"><p>No trend data available' + filterMessage + '</p></div>';
                            return;
                        }

                        const searchTerm = (this.trendSearchTerm || '').trim().toLowerCase();
                        const workingTrends = searchTerm
                            ? allTrends.filter(trend => this.matchesTrendSearch(trend, searchTerm))
                            : allTrends;

                        if (!workingTrends.length) {
                            container.innerHTML = '<div class="trends-chart"><p>No trend data matches "' + this.escapeHtml(this.trendSearchTerm.trim()) + '"</p></div>';
                            return;
                        }

                        const totalFines = workingTrends.reduce((sum, trend) => sum + (parseInt(trend.fine_count) || 0), 0);
                        const totalAmount = workingTrends.reduce((sum, trend) => sum + (parseFloat(trend.total_amount) || 0), 0);
                        const averageAmount = totalFines > 0 ? totalAmount / totalFines : 0;
                        const highestPeriod = workingTrends.reduce((max, trend) =>
                            (parseInt(trend.fine_count) || 0) > (parseInt(max.fine_count) || 0) ? trend : max, workingTrends[0]);

                        const badges = [];
                        if (Object.keys(filterParams).length > 0) {
                            badges.push('<span class="filter-badge">Filtered View</span>');
                            if (filterParams.years) {
                            const yearsLabel = this.escapeHtml(filterParams.years.replace(/,/g, ', '));
                            badges.push('<span class="filter-badge">Years: ' + yearsLabel + '</span>');
                            }
                        }
                        if (searchTerm) {
                            badges.push('<span class="filter-badge">Search: ' + this.escapeHtml(this.trendSearchTerm.trim()) + '</span>');
                        }

                        const filterInfo = badges.length
                            ? '<div class="trends-filter-info">' + badges.join('') + '</div>'
                            : '';

                        const summaryCards =
                            '<div class="trends-summary">' +
                                filterInfo +
                                '<div class="trends-metrics">' +
                                    '<div class="metric-card">' +
                                        '<div class="metric-icon">' + this.getTrendMetricIcon('count') + '</div>' +
                                        '<div class="metric-content">' +
                                            '<div class="metric-value">' + totalFines + '</div>' +
                                            '<div class="metric-label">Total Fines</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="metric-card">' +
                                        '<div class="metric-icon">' + this.getTrendMetricIcon('amount') + '</div>' +
                                        '<div class="metric-content">' +
                                            '<div class="metric-value">' + this.formatCurrency(totalAmount) + '</div>' +
                                            '<div class="metric-label">Total Amount</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="metric-card">' +
                                        '<div class="metric-icon">' + this.getTrendMetricIcon('average') + '</div>' +
                                        '<div class="metric-content">' +
                                            '<div class="metric-value">' + this.formatCurrency(averageAmount) + '</div>' +
                                            '<div class="metric-label">Average Fine</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="metric-card">' +
                                        '<div class="metric-icon">' + this.getTrendMetricIcon('peak') + '</div>' +
                                        '<div class="metric-content">' +
                                            '<div class="metric-value">' + this.escapeHtml(highestPeriod.period || '-') + '</div>' +
                                            '<div class="metric-label">Peak Period (' + (highestPeriod.fine_count || 0) + ' fines)</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>';

                        const tableRows = workingTrends.map((trend, index) => {
                            const prevTrend = index > 0 ? workingTrends[index - 1] : null;
                            const currentCount = parseInt(trend.fine_count) || 0;
                            const prevCount = prevTrend ? parseInt(prevTrend.fine_count) || 0 : 0;
                            const currentAmount = Number(trend.total_amount || 0);
                            const shareOfTotal = totalAmount > 0 ? (currentAmount / totalAmount) * 100 : 0;

                            let trendIndicator = '';
                            if (prevTrend) {
                                if (currentCount > prevCount) {
                                    trendIndicator = '<span class="trend-up">&#9650; +' + (currentCount - prevCount) + '</span>';
                                } else if (currentCount < prevCount) {
                                    trendIndicator = '<span class="trend-down">&#9660; -' + (prevCount - currentCount) + '</span>';
                                } else {
                                    trendIndicator = '<span class="trend-flat">&#8596; Flat +/-0</span>';
                                }
                            }

                            return '<tr>' +
                                '<td><strong>' + trend.period + '</strong></td>' +
                                '<td>' + (trend.fine_count || 0) + ' ' + trendIndicator + '</td>' +
                                '<td class="fine-amount">' + this.formatCurrency(trend.total_amount) + '</td>' +
                                '<td>' + this.formatCurrency(trend.average_amount) + '</td>' +
                                '<td>' + shareOfTotal.toFixed(1) + '%</td>' +
                            '</tr>';
                        }).join('');

                        const tableHTML =
                            '<table class="data-table">' +
                                '<thead>' +
                                    '<tr>' +
                                        '<th>Period</th>' +
                                        '<th>Fine Count</th>' +
                                        '<th>Total Amount</th>' +
                                        '<th>Average Amount</th>' +
                                        '<th>Share of Total</th>' +
                                    '</tr>' +
                                '</thead>' +
                                '<tbody>' +
                                    tableRows +
                                '</tbody>' +
                            '</table>';

                        container.innerHTML = summaryCards + tableHTML;
                    }

                    renderTrendsError(error) {
                        const container = document.getElementById('trends-container');
                        container.innerHTML = [
                            '<div class="error-state">',
                                '<strong>Failed to load trends</strong><br>',
                                error,
                            '</div>'
                        ].join('');
                    }

                    async loadTopFirms() {
                        try {
                            console.log('[firms] Loading top firms...');

                            const response = await fetch('/api/enforcement/top-firms?limit=10');
                            const data = await response.json();

                            if (data.success) {
                                this.renderTopFirms(data.firms, { filterMode: this.isFilterActive });
                            } else {
                                throw new Error(data.error || 'Failed to load top firms');
                            }
                        } catch (error) {
                            console.error('[error] Error loading top firms:', error);
                            this.renderTopFirmsError(error.message);
                        }
                    }

                    renderTopFirms(firms, options = {}) {
                        const container = document.getElementById('top-firms-container');
                        if (!container) return;

                        this.latestTopFirms = Array.isArray(firms) ? firms : [];
                        const searchTerm = (this.topFirmSearchTerm || '').trim().toLowerCase();
                        const workingFirms = searchTerm
                            ? this.latestTopFirms.filter(firm => this.matchesTopFirmSearch(firm, searchTerm))
                            : this.latestTopFirms;

                        if (!workingFirms.length) {
                            const message = searchTerm
                                ? 'No firms match "' + this.escapeHtml(this.topFirmSearchTerm.trim()) + '"'
                                : options.filterMode
                                    ? 'No firm data captured for the current filters.'
                                    : 'No firm data available.';
                            container.innerHTML = '<p class="loading-state">' + message + '</p>';
                            return;
                        }

                        const totalFines = workingFirms.reduce((sum, firm) => sum + Number(firm.total_fines || 0), 0);
                        const badges = [];
                        if (options.filterMode) {
                            badges.push('<span class="filter-badge">Filtered Firms</span>');
                            if (options.scopeLabel) {
                                badges.push('<span class="filter-badge">' + this.escapeHtml(options.scopeLabel) + '</span>');
                            }
                        }
                        if (searchTerm) {
                            badges.push('<span class="filter-badge">Search: ' + this.escapeHtml(this.topFirmSearchTerm.trim()) + '</span>');
                        }

                        const filterInfo = badges.length
                            ? '<div class="trends-filter-info">' + badges.join('') + '</div>'
                            : '';

                        const tableRows = workingFirms.map((firm, index) => {
                            const averageFine = firm.average_fine || (firm.fine_count ? firm.total_fines / firm.fine_count : 0);
                            const shareOfTotal = totalFines > 0 ? (Number(firm.total_fines || 0) / totalFines) * 100 : 0;
                            const shareDisplay = totalFines > 0 ? shareOfTotal.toFixed(1) : '0.0';
                            const firstFine = this.formatDate(firm.first_fine_date);
                            const latestFine = this.formatDate(firm.latest_fine_date);
                            return '<tr>' +
                                '<td><strong>' + (index + 1) + '</strong></td>' +
                                '<td>' + this.escapeHtml(firm.firm_name || 'Unknown') + '</td>' +
                                '<td class="fine-amount">' + this.formatCurrency(firm.total_fines) + '</td>' +
                                '<td>' + this.formatCurrency(averageFine) + '</td>' +
                                '<td>' + (firm.fine_count || 0) + '</td>' +
                                '<td>' + firstFine + '</td>' +
                                '<td>' + latestFine + '</td>' +
                                '<td>' + shareDisplay + '%</td>' +
                                '<td>' + (firm.is_repeat_offender ? '&#9888; Yes' : '&#9989; No') + '</td>' +
                            '</tr>';
                        }).join('');

                        const tableHTML =
                            filterInfo +
                            '<table class="data-table">' +
                                '<thead>' +
                                    '<tr>' +
                                        '<th>Rank</th>' +
                                        '<th>Firm Name</th>' +
                                        '<th>Total Fines</th>' +
                                        '<th>Average Fine</th>' +
                                        '<th>Fine Count</th>' +
                                        '<th>First Fine</th>' +
                                        '<th>Latest Fine</th>' +
                                        '<th>Share of Total</th>' +
                                        '<th>Repeat Offender</th>' +
                                    '</tr>' +
                                '</thead>' +
                                '<tbody>' +
                                    tableRows +
                                '</tbody>' +
                            '</table>';

                        container.innerHTML = tableHTML;
                    }

                    renderTopFirmsError(error) {
                        const container = document.getElementById('top-firms-container');
                        container.innerHTML = [
                            '<div class="error-state">',
                                '<strong>Failed to load top firms</strong><br>',
                                error,
                            '</div>'
                        ].join('');
                    }

                    populateFilters(stats) {
                        if (!stats) return;
                        const years = Array.isArray(stats.availableYears) ? stats.availableYears : [];
                        const categories = Array.isArray(stats.availableCategories) ? stats.availableCategories : [];

                        const yearSelect = document.getElementById('year-filter');
                        if (yearSelect && years.length) {
                            const previousSelection = Array.from(yearSelect.selectedOptions).map(option => option.value);
                            yearSelect.innerHTML = years.map(year => '<option value="' + year + '">' + year + '</option>').join('');
                            previousSelection.forEach(year => {
                                const option = Array.from(yearSelect.options).find(opt => opt.value === year);
                                if (option) option.selected = true;
                            });
                        }

                        const categorySelect = document.getElementById('breach-category');
                        if (categorySelect && categories.length) {
                            const currentValue = categorySelect.value;
                            categorySelect.innerHTML = ['<option value="">All Categories</option>']
                                .concat(categories.map(category => {
                                    const label = this.escapeHtml(category || 'Unknown')
                                    return '<option value="' + label + '">' + label + '</option>'
                                }))
                                .join('');
                            if (currentValue) {
                                categorySelect.value = currentValue;
                            }
                        }

                        const selectedYears = yearSelect
                            ? Array.from(yearSelect.selectedOptions)
                                .map(option => parseInt(option.value, 10))
                                .filter(year => !isNaN(year))
                            : [];
                        this.updateYearChips(selectedYears);
                    }

                    renderPatternCards(patterns) {
                        const container = document.getElementById('pattern-container');
                        if (!container) return;

                        const cards = [];
                        const toNumber = value => Number(value || 0);
                        const overview = patterns.overview || {};

                        const yearlyPool = Array.isArray(patterns.yearlyOverview) && patterns.yearlyOverview.length
                            ? patterns.yearlyOverview
                            : this.baseYearlyOverview || [];

                        const sortedYears = Array.isArray(yearlyPool)
                            ? [...yearlyPool].sort((a, b) => (b.year || 0) - (a.year || 0))
                            : [];

                        const currentYearData = sortedYears[0];
                        const previousYearData = sortedYears[1];

                        const dominantCategorySource = (currentYearData && currentYearData.dominant_category) || (patterns.topBreachTypes && patterns.topBreachTypes[0]);
                        if (dominantCategorySource && (dominantCategorySource.category || dominantCategorySource.category === '')) {
                            const rawCategory = dominantCategorySource.category || 'Not captured';
                            const categoryName = this.escapeHtml(rawCategory === 'Uncategorised' ? 'Not captured' : rawCategory);
                            const categoryActions = this.formatNumber(toNumber(dominantCategorySource.count || dominantCategorySource.fine_count));
                            const categoryAmount = this.formatCurrency(toNumber(dominantCategorySource.total_amount));
                            cards.push(
                                '<article class="pattern-card">' +
                                    '<span class="pattern-label">Dominant breach theme</span>' +
                                    '<span class="pattern-highlight">' + categoryName + '</span>' +
                                    '<span class="pattern-footnote">' + categoryActions + ' actions  |  ' + categoryAmount + '</span>' +
                                '</article>'
                            );
                        }

                        if (currentYearData) {
                            const currentYear = currentYearData.year;
                            const currentCount = this.formatNumber(toNumber(currentYearData.fine_count));
                            const currentTotal = this.formatCurrency(toNumber(currentYearData.total_amount));
                            let yoyNarrative = 'Baseline year in focus';
                            if (previousYearData) {
                                const prevTotal = toNumber(previousYearData.total_amount);
                                const delta = toNumber(currentYearData.total_amount) - prevTotal;
                                if (prevTotal > 0) {
                                    const pctChange = (delta / prevTotal) * 100;
                                    yoyNarrative = (pctChange >= 0 ? 'Increase ' : 'Decrease ') + Math.abs(pctChange).toFixed(1) + '% vs ' + previousYearData.year;
                                } else {
                                    yoyNarrative = 'Change vs ' + previousYearData.year + ' unavailable';
                                }
                            }

                            cards.push(
                                '<article class="pattern-card">' +
                                    '<span class="pattern-label">Annual enforcement run-rate</span>' +
                                    '<span class="pattern-highlight">' + currentYear + ': ' + currentCount + ' fines</span>' +
                                    '<span class="pattern-footnote">Total ' + currentTotal + '  |  ' + yoyNarrative + '</span>' +
                                '</article>'
                            );
                        }

                        const dominantSectorSource = (currentYearData && currentYearData.dominant_sector) || (patterns.topSectors && patterns.topSectors[0]);
                        if (dominantSectorSource && dominantSectorSource.sector) {
                            const rawSector = dominantSectorSource.sector;
                            const sectorName = this.escapeHtml(!rawSector || rawSector === 'Unspecified' ? 'Not captured' : rawSector);
                            const sectorActions = this.formatNumber(toNumber(dominantSectorSource.count || dominantSectorSource.fine_count));
                            const sectorAmount = this.formatCurrency(toNumber(dominantSectorSource.total_amount));
                            cards.push(
                                '<article class="pattern-card">' +
                                    '<span class="pattern-label">Most exposed sector</span>' +
                                    '<span class="pattern-highlight">' + sectorName + '</span>' +
                                    '<span class="pattern-footnote">' + sectorActions + ' actions  |  ' + sectorAmount + '</span>' +
                                '</article>'
                            );
                        }

                        if (overview) {
                            const distinctFirms = this.formatNumber(overview.distinct_firms || 0);
                            const repeatOffenders = this.formatNumber(overview.repeat_offenders || 0);
                            const averageRisk = Math.round(overview.average_risk_score || 0);
                            const amountThisYear = overview.amount_this_year ? this.formatCurrency(overview.amount_this_year) : 'N/A';
                            const hasExposure = (overview.distinct_firms || overview.repeat_offenders || overview.amount_this_year);

                            if (hasExposure) {
                                cards.push(
                                    '<article class="pattern-card">' +
                                        '<span class="pattern-label">Firm exposure</span>' +
                                        '<span class="pattern-highlight">' + distinctFirms + ' firms fined</span>' +
                                        '<span class="pattern-footnote">Repeat offenders ' + repeatOffenders + '  |  YTD fines ' + amountThisYear + '  |  Avg risk ' + averageRisk + '/100</span>' +
                                    '</article>'
                                );
                            } else {
                                cards.push(
                                    '<article class="pattern-card">' +
                                        '<span class="pattern-label">Firm exposure</span>' +
                                        '<span class="pattern-highlight">No firm data captured</span>' +
                                        '<span class="pattern-footnote">Adjust filters or refresh to view firm-level metrics.</span>' +
                                    '</article>'
                                );
                            }
                        }

                        if (!cards.length) {
                            container.innerHTML = '';
                            return;
                        }

                        container.innerHTML = cards.join('');
                    }

                    renderYearlyOverview(yearlyData = [], options = {}) {
                        const chartCanvas = document.getElementById('yearlyTrendChart');
                        const contextEl = document.getElementById('yearly-context');
                        const tableContainer = document.getElementById('yearly-table-container');
                        if (!chartCanvas || !contextEl || !tableContainer) return;

                        const selectedYearsSet = Array.isArray(options.selectedYears) && options.selectedYears.length
                            ? new Set(options.selectedYears.map(year => parseInt(year, 10)).filter(year => !isNaN(year)))
                            : null;

                        const workingData = selectedYearsSet
                            ? yearlyData.filter(item => selectedYearsSet.has(item.year))
                            : yearlyData;

                        if (!workingData || workingData.length === 0) {
                            if (this.charts.yearly) {
                                this.charts.yearly.destroy();
                                this.charts.yearly = null;
                            }
                            contextEl.textContent = options.filterMode
                                ? 'No yearly enforcement data available for selected filters.'
                                : 'No yearly enforcement data available yet.';
                            tableContainer.innerHTML = '<p class="empty-state">No yearly enforcement data available.</p>';
                            return;
                        }

                        const sorted = [...workingData].sort((a, b) => (a.year || 0) - (b.year || 0));
                        const labels = sorted.map(item => item.year);
                        const fineCounts = sorted.map(item => Number(item.fine_count || 0));
                        const totalAmounts = sorted.map(item => {
                            const millions = Number(item.total_amount || 0) / 1000000;
                            return Number.isFinite(millions) ? Number(millions.toFixed(2)) : 0;
                        });

                        if (this.charts.yearly) {
                            this.charts.yearly.destroy();
                        }

                        this.charts.yearly = new Chart(chartCanvas, {
                            type: 'bar',
                            data: {
                                labels,
                                datasets: [
                                    {
                                        type: 'bar',
                                        label: 'Fine count',
                                        data: fineCounts,
                                        backgroundColor: 'rgba(59, 130, 246, 0.4)',
                                        borderColor: '#3b82f6',
                                        borderWidth: 1,
                                        borderRadius: 6,
                                        yAxisID: 'y'
                                    },
                                    {
                                        type: 'line',
                                        label: 'Total fines (&pound;m)',
                                        data: totalAmounts,
                                        borderColor: '#7c3aed',
                                        backgroundColor: 'rgba(124, 58, 237, 0.2)',
                                        tension: 0.35,
                                        borderWidth: 2,
                                        fill: false,
                                        yAxisID: 'y1'
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                interaction: { intersect: false, mode: 'nearest' },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        title: {
                                            display: true,
                                            text: 'Fine count'
                                        }
                                    },
                                    y1: {
                                        beginAtZero: true,
                                        position: 'right',
                                        grid: { drawOnChartArea: false },
                                        title: {
                                            display: true,
                                            text: 'Total fines (&pound;m)'
                                        }
                                    }
                                },
                                plugins: {
                                    legend: { position: 'bottom' }
                                }
                            }
                        });

                        const latest = sorted[sorted.length - 1];
                        const latestTotal = this.formatCurrency(Number(latest.total_amount || 0));
                        const latestCount = this.formatNumber(Number(latest.fine_count || 0));
                        const prefix = options.filterMode ? 'Filtered  |  ' : '';
                        contextEl.textContent = prefix + latest.year + ': ' + latestCount + ' fines  |  ' + latestTotal;

                        const normalise = highlight => {
                            if (!highlight) return {};
                            if (typeof highlight === 'object') return highlight;
                            try {
                                return JSON.parse(highlight);
                            } catch (error) {
                                return { category: highlight };
                            }
                        };

                        const rows = [...sorted].reverse().map(item => {
                            const categoryInfo = normalise(item.dominant_category);
                            const sectorInfo = normalise(item.dominant_sector);
                            return '<tr>' +
                                '<td><strong>' + item.year + '</strong></td>' +
                                '<td>' + this.formatNumber(Number(item.fine_count || 0)) + '</td>' +
                                '<td class="fine-amount">' + this.formatCurrency(Number(item.total_amount || 0)) + '</td>' +
                                '<td>' + this.escapeHtml(categoryInfo.category || 'Not captured') + '</td>' +
                                '<td>' + this.escapeHtml(sectorInfo.sector || 'Not captured') + '</td>' +
                            '</tr>';
                        }).join('');

                        tableContainer.innerHTML = '<table class="data-table">' +
                            '<thead>' +
                                '<tr>' +
                                    '<th>Year</th>' +
                                    '<th>Count</th>' +
                                    '<th>Total Amount</th>' +
                                    '<th>Lead Breach</th>' +
                                    '<th>Lead Sector</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>' + rows + '</tbody>' +
                        '</table>';
                    }

                    renderCategoryTrends(trendData = [], options = {}) {
                        const chartCanvas = document.getElementById('categoryTrendChart');
                        const summaryEl = document.getElementById('category-trend-summary');
                        const contextEl = document.getElementById('category-context');
                        if (!chartCanvas || !summaryEl || !contextEl) return;

                        if (!trendData || trendData.length === 0) {
                            if (this.charts.category) {
                                this.charts.category.destroy();
                                this.charts.category = null;
                            }
                            summaryEl.innerHTML = '<p class="empty-state">No breach-category trend data available.</p>';
                            contextEl.textContent = options.filterMode
                                ? 'Category signals reference the full dataset while filters are active.'
                                : 'No category data captured yet.';
                            return;
                        }

                        const filteredTrendData = (() => {
                            const meaningful = trendData.filter(item => item.category && item.category !== 'Uncategorised');
                            return meaningful.length ? meaningful : trendData;
                        })();

                        const trendLookup = new Map();
                        filteredTrendData.forEach(item => {
                            const category = item.category || 'Uncategorised';
                            const year = Number(item.year);
                            if (!Number.isFinite(year)) return;
                            const categoryBucket = trendLookup.get(category) || { totals: { count: 0, amount: 0 }, years: new Map() };
                            const yearData = categoryBucket.years.get(year) || { fine_count: 0, total_amount: 0 };
                            const count = Number(item.fine_count || 0);
                            const amount = Number(item.total_amount || 0);
                            yearData.fine_count += count;
                            yearData.total_amount += amount;
                            categoryBucket.totals.count += count;
                            categoryBucket.totals.amount += amount;
                            categoryBucket.years.set(year, yearData);
                            trendLookup.set(category, categoryBucket);
                        });

                        const years = Array.from(new Set(filteredTrendData.map(item => Number(item.year)).filter(Number.isFinite))).sort((a, b) => a - b);

                        if (!years.length) {
                            if (this.charts.category) {
                                this.charts.category.destroy();
                                this.charts.category = null;
                            }
                            summaryEl.innerHTML = '<p class="empty-state">No category timeline available for the selected filters.</p>';
                            contextEl.textContent = options.filterMode
                                ? 'Category signals reference the full dataset while filters are active.'
                                : 'No category data captured yet.';
                            return;
                        }

                        const rankedCategories = Array.from(trendLookup.entries()).map(([category, payload]) => ({
                            category,
                            totals: payload.totals,
                            years: payload.years
                        })).sort((a, b) => b.totals.count - a.totals.count);

                        const categories = rankedCategories.map(entry => entry.category);

                        const palette = ['#4338ca', '#2563eb', '#0ea5e9', '#f97316', '#f43f5e', '#22c55e'];
                        const datasets = rankedCategories.map((entry, index) => {
                            const metaByYear = {};
                            const dataPoints = years.map(year => {
                                const yearData = entry.years.get(year) || { fine_count: 0, total_amount: 0 };
                                metaByYear[year] = yearData;
                                return yearData.fine_count;
                            });

                            return {
                                type: 'line',
                                label: entry.category,
                                data: dataPoints,
                                borderColor: palette[index % palette.length],
                                backgroundColor: palette[index % palette.length],
                                tension: 0.35,
                                fill: false,
                                yAxisID: 'y',
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                metaByYear
                            };
                        });

                        if (this.charts.category) {
                            this.charts.category.destroy();
                        }

                        const formatCurrency = value => this.formatCurrency(value);

                        this.charts.category = new Chart(chartCanvas, {
                            type: 'line',
                            data: {
                                labels: years,
                                datasets
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { usePointStyle: true }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: context => {
                                                const dataset = context.dataset;
                                                const year = years[context.dataIndex];
                                                const meta = dataset.metaByYear ? dataset.metaByYear[year] : null;
                                                const countText = context.formattedValue + ' fines';
                                                if (meta) {
                                                    const amountText = formatCurrency(meta.total_amount || 0);
                                                    return dataset.label + ': ' + countText + ' (' + amountText + ')';
                                                }
                                                return dataset.label + ': ' + countText;
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        title: {
                                            display: true,
                                            text: 'Fines'
                                        }
                                    }
                                },
                                interaction: { mode: 'nearest', intersect: false },
                                elements: {
                                    line: { borderWidth: 2 },
                                    point: { radius: 4, hoverRadius: 6 }
                                }
                            }
                        });

                        const contextPrefix = options.filterMode ? 'Filtered  |  ' : '';
                        const firstYear = years[0];
                        const lastYear = years[years.length - 1];
                        const yearRange = firstYear === lastYear ? firstYear : firstYear + '-' + lastYear;
                        const rangeLabel = firstYear === lastYear ? 'in ' + yearRange : 'across ' + yearRange;
                        const yearsLabel = options.filterMode && Array.isArray(options.selectedYears) && options.selectedYears.length
                            ? options.selectedYears.join(', ')
                            : rangeLabel;
                        contextEl.textContent = contextPrefix + 'Category momentum for ' + yearsLabel;

                        const summaryItems = rankedCategories.map(entry => {
                            const label = entry.category === 'Uncategorised' ? 'Not captured' : entry.category;
                            const recentYears = years
                                .map(year => ({ year, data: entry.years.get(year) }))
                                .filter(item => item.data && item.data.fine_count)
                                .slice(-3)
                                .reverse()
                                .map(item => item.year + ' (' + item.data.fine_count + ')')
                                .join('  |  ');
                            return '<div><span class="category-chip">' + this.escapeHtml(label) + '</span> ' +
                                this.formatNumber(entry.totals.count) + ' fines  |  ' + this.formatCurrency(entry.totals.amount) +
                                (recentYears ? ' | ' + recentYears : '') + '</div>';
                        });

                        summaryEl.innerHTML = summaryItems.join('');
                    }

                    renderControlPlaybook(recommendations = [], options = {}) {
                        const container = document.getElementById('control-playbook');
                        const contextEl = document.getElementById('control-context');
                        if (!container) return;

                        if (!recommendations || recommendations.length === 0) {
                            container.innerHTML = '<p class="empty-state">No control guidance available yet.</p>';
                            if (contextEl) {
                                contextEl.textContent = options.filterMode
                                    ? 'Control guidance will update once sufficient filtered data is available.'
                                    : 'Control guidance will appear once analytics load.';
                            }
                            return;
                        }

                        if (contextEl) {
                            contextEl.textContent = options.filterMode
                                ? 'Filters applied - showing baseline control guidance for context.'
                                : 'Linking recurring enforcement themes to practical remediation steps.';
                        }

                        const highlightCategories = Array.isArray(options.fallbackCategories)
                            ? options.fallbackCategories.map(item => item.category).filter(Boolean)
                            : [];

                        const recommendationMap = new Map();
                        recommendations.forEach(rec => {
                            if (rec && rec.category) recommendationMap.set(rec.category, rec);
                        });

                        const prioritized = highlightCategories
                            .map(name => recommendationMap.get(name))
                            .filter(Boolean);

                        const baseList = recommendations.filter(rec => !highlightCategories.includes(rec.category));
                        const combined = [...prioritized, ...baseList].slice(0, 4);

                        const cards = combined.map(rec => {
                            const categoryLabel = (!rec.category || rec.category === 'Uncategorised') ? 'General Compliance' : rec.category;
                            const totalAmount = this.formatCurrency(Number(rec.recentActivity?.totalAmount || 0));
                            const totalFines = this.formatNumber(Number(rec.recentActivity?.totalFines || rec.recentActivity?.total_fines || 0));
                            const narrative = this.escapeHtml(rec.recentActivity?.narrative || 'Recurring focus for the FCA.');
                            const yearsList = Array.isArray(rec.dominantYears) && rec.dominantYears.length
                                ? 'Seen in ' + rec.dominantYears.join(', ')
                                : '';
                            const controlsList = (rec.recommendedControls || []).map(item => '<li>' + this.escapeHtml(item) + '</li>').join('');
                            const monitoringList = (rec.monitoringChecks || []).map(item => '<li>' + this.escapeHtml(item) + '</li>').join('');

                            return '<article class="playbook-card">' +
                                '<div class="playbook-header">' +
                                    '<span class="playbook-category">' + this.escapeHtml(categoryLabel) + '</span>' +
                                    '<div class="playbook-headline">' + this.escapeHtml(rec.headline || '') + '</div>' +
                                    '<div class="playbook-meta">' + narrative + '</div>' +
                                    '<div class="playbook-meta">' + totalFines + ' fines  |  ' + totalAmount + (yearsList ? '  |  ' + yearsList : '') + '</div>' +
                                '</div>' +
                                '<div>' +
                                    '<strong>Controls to prioritise</strong>' +
                                    '<ul class="playbook-bullets">' + (controlsList || '<li>Documented control actions pending.</li>') + '</ul>' +
                                '</div>' +
                                '<div>' +
                                    '<strong>Monitoring triggers</strong>' +
                                    '<ul class="playbook-bullets">' + (monitoringList || '<li>Define MI and assurance coverage.</li>') + '</ul>' +
                                '</div>' +
                                '<div class="playbook-footnote">' + this.escapeHtml(rec.riskIfIgnored || 'Reinforce governance to stay ahead of enforcement expectations.') + '</div>' +
                            '</article>';
                        });

                        container.innerHTML = cards.join('');
                    }

                    hasActiveFilters(filterParams = {}) {
                        return Boolean(
                            (filterParams.q && filterParams.q.trim()) ||
                            (Array.isArray(filterParams.yearsArray) && filterParams.yearsArray.length) ||
                            (Array.isArray(filterParams.yearsRaw) && filterParams.yearsRaw.length) ||
                            filterParams.breach_type ||
                            filterParams.min_amount ||
                            filterParams.risk_level
                        );
                    }

                    buildFilterQuery(filterParams = {}) {
                        const params = new URLSearchParams();

                        if (filterParams.q) params.set('q', filterParams.q.trim());
                        if (Array.isArray(filterParams.yearsArray) && filterParams.yearsArray.length) {
                            params.set('years', filterParams.yearsArray.map(year => parseInt(year, 10)).filter(year => !isNaN(year)).join(','));
                        }
                        if (filterParams.breach_type) params.set('breach_type', filterParams.breach_type);
                        if (filterParams.min_amount) params.set('min_amount', filterParams.min_amount);
                        if (filterParams.risk_level) params.set('risk_level', filterParams.risk_level);
                        if (filterParams.search_scope) params.set('search_scope', filterParams.search_scope);
                        if (filterParams.sector) params.set('sector', filterParams.sector);

                        return params;
                    }

                    async fetchFilteredFines(filterParams = {}) {
                        const params = this.buildFilterQuery(filterParams);
                        params.set('limit', filterParams.limit || 1000);
                        params.set('offset', '0');

                        const url = '/api/enforcement/search?' + params.toString();
                        const response = await fetch(url);
                        const data = await response.json();

                        if (!data.success) {
                            throw new Error(data.error || 'Failed to fetch filtered fines');
                        }

                        const results = data.results || {};
                        const fines = Array.isArray(results.fines) ? results.fines : [];
                        const total = Number.isFinite(results.total) ? Number(results.total) : (Array.isArray(results.fines) ? results.fines.length : 0);

                        return { fines, total };
                    }

                    async ensureFinesLoaded() {
                        if (Array.isArray(this.allFines) && this.allFines.length > 0) return;
                        await this.loadRecentFines({ skipRender: true, limit: 500 });
                    }

                    getTrendCacheKey(period, filterParams = {}) {
                        const yearsKey = Array.isArray(filterParams.yearsArray) && filterParams.yearsArray.length
                            ? filterParams.yearsArray.slice().sort().join('-')
                            : 'all';
                        return period + '::' + yearsKey;
                    }

                    filterFines(filterParams = {}) {
                        if (!Array.isArray(this.allFines) || this.allFines.length === 0) return [];

                        const query = (filterParams.q || '').toLowerCase();
                        const yearsArray = Array.isArray(filterParams.yearsArray) ? filterParams.yearsArray : [];
                        const yearsSet = yearsArray.length ? new Set(yearsArray) : null;
                        const breachType = filterParams.breach_type;
                        const minAmount = filterParams.min_amount ? Number(filterParams.min_amount) : null;
                        const riskLevel = filterParams.risk_level || '';

                        const filtered = this.allFines.filter(fine => {
                            const issueDate = fine.date_issued ? new Date(fine.date_issued) : null;
                            const issueYear = issueDate ? issueDate.getFullYear() : null;

                            if (yearsSet && (issueYear === null || !yearsSet.has(issueYear))) return false;

                            if (breachType) {
                                const categories = Array.isArray(fine.breach_categories) ? fine.breach_categories : [];
                                if (!categories.includes(breachType)) return false;
                            }

                            if (minAmount !== null && Number(fine.amount || 0) < minAmount) return false;

                            if (riskLevel) {
                                const riskScore = Number(fine.risk_score || 0);
                                if (riskLevel === 'high' && riskScore < 70) return false;
                                if (riskLevel === 'medium' && (riskScore < 40 || riskScore >= 70)) return false;
                                if (riskLevel === 'low' && riskScore >= 40) return false;
                            }

                            if (query) {
                                const haystack = [
                                    fine.firm_individual,
                                    fine.ai_summary,
                                    fine.summary,
                                    fine.fine_reference,
                                    ...(fine.breach_categories || [])
                                ].join(' ').toLowerCase();

                                if (!haystack.includes(query)) return false;
                            }

                            return true;
                        });

                        return filtered.sort((a, b) => {
                            const dateA = a.date_issued ? new Date(a.date_issued).getTime() : 0;
                            const dateB = b.date_issued ? new Date(b.date_issued).getTime() : 0;
                            return dateB - dateA;
                        });
                    }

                    getYearFromPeriod(period) {
                        if (!period) return null;
                        const match = String(period).match(/^(\\d{4})/);
                        return match ? parseInt(match[1], 10) : null;
                    }

                    filterTrendData(trends = [], filterParams = {}) {
                        if (!Array.isArray(trends)) return [];
                        const yearsArray = Array.isArray(filterParams.yearsArray) ? filterParams.yearsArray : [];
                        if (!yearsArray.length) return trends;
                        const yearsSet = new Set(yearsArray.map(year => parseInt(year, 10)).filter(year => !isNaN(year)));

                        return trends.filter(trend => {
                            const year = this.getYearFromPeriod(trend.period);
                            return year !== null ? yearsSet.has(year) : true;
                        });
                    }

                    matchesTrendSearch(trend, searchTerm) {
                        if (!searchTerm) return true;
                        const haystack = [
                            trend.period,
                            trend.fine_count,
                            trend.total_amount,
                            trend.average_amount
                        ].map(value => String(value || '')).join(' ').toLowerCase();
                        return haystack.includes(searchTerm);
                    }

                    refreshTrends(filterParams = this.currentFilterParams || {}) {
                        this.loadTrends(false, filterParams);
                    }

                    buildFinesCsv(fines = []) {
                        const headers = [
                            'Reference',
                            'Date',
                            'Firm/Individual',
                            'Amount (&pound;)',
                            'Breach Categories',
                            'Affected Sectors',
                            'Impact Level',
                            'Risk Score',
                            'Systemic Risk',
                            'Precedent Setting',
                            'Summary',
                            'Notice URL'
                        ];

                        const rows = fines.map(fine => [
                            this.escapeCsv(fine.fine_reference),
                            fine.date_issued || '',
                            this.escapeCsv(fine.firm_individual),
                            fine.amount || '',
                            this.escapeCsv(Array.isArray(fine.breach_categories) ? fine.breach_categories.join('; ') : ''),
                            this.escapeCsv(Array.isArray(fine.affected_sectors) ? fine.affected_sectors.join('; ') : ''),
                            fine.customer_impact_level || '',
                            fine.risk_score || '',
                            fine.systemic_risk ? 'Yes' : 'No',
                            fine.precedent_setting ? 'Yes' : 'No',
                            this.escapeCsv(fine.ai_summary || ''),
                            fine.final_notice_url || ''
                        ].join(','));

                        const csvRows = [headers.join(',')];
                        rows.forEach(row => csvRows.push(row));
                        return csvRows.join('\\n');
                    }

                    buildTopFirmsFromFines(fines = [], limit = 10) {
                        if (!Array.isArray(fines) || fines.length === 0) return [];

                        const firmMap = new Map();

                        fines.forEach(fine => {
                            const firmName = (fine.firm_individual || 'Unknown').trim() || 'Unknown';
                            const amount = Number(fine.amount || 0);
                            const issuedDate = fine.date_issued ? new Date(fine.date_issued) : null;

                            const record = firmMap.get(firmName) || {
                                firm_name: firmName,
                                total_fines: 0,
                                fine_count: 0,
                                first_fine_date: null,
                                latest_fine_date: null,
                                is_repeat_offender: false
                            };

                            record.total_fines += amount;
                            record.fine_count += 1;
                            record.is_repeat_offender = record.is_repeat_offender || record.fine_count > 1;

                            if (issuedDate instanceof Date && !isNaN(issuedDate)) {
                                if (!record.first_fine_date || issuedDate < record.first_fine_date) {
                                    record.first_fine_date = issuedDate;
                                }
                                if (!record.latest_fine_date || issuedDate > record.latest_fine_date) {
                                    record.latest_fine_date = issuedDate;
                                }
                            }

                            firmMap.set(firmName, record);
                        });

                        const ranked = Array.from(firmMap.values()).map(record => {
                            const average = record.fine_count > 0 ? record.total_fines / record.fine_count : 0;
                            return {
                                ...record,
                                average_fine: average,
                                first_fine_date: record.first_fine_date ? record.first_fine_date.toISOString() : null,
                                latest_fine_date: record.latest_fine_date ? record.latest_fine_date.toISOString() : null
                            };
                        }).sort((a, b) => b.total_fines - a.total_fines);

                        return ranked.slice(0, limit);
                    }

                    matchesTopFirmSearch(firm, term) {
                        if (!term) return true;
                        const haystack = [
                            firm.firm_name,
                            this.formatCurrency(firm.total_fines || 0),
                            this.formatCurrency(firm.average_fine || 0),
                            firm.fine_count,
                            firm.first_fine_date,
                            firm.latest_fine_date
                        ].map(value => String(value || '')).join(' ').toLowerCase();
                        return haystack.includes(term);
                    }

                    updateYearChips(selectedYears = []) {
                        const chipList = document.getElementById('year-chip-list');
                        const clearButton = document.getElementById('year-clear-btn');
                        if (!chipList || !clearButton) return;

                        chipList.innerHTML = '';
                        if (!Array.isArray(selectedYears) || selectedYears.length === 0) {
                            clearButton.disabled = true;
                            clearButton.classList.add('disabled');
                            return;
                        }

                        clearButton.disabled = false;
                        clearButton.classList.remove('disabled');

                        selectedYears.forEach(year => {
                            const chip = document.createElement('button');
                            chip.type = 'button';
                            chip.className = 'chip';
                            chip.dataset.year = year;
                            chip.innerHTML = this.escapeHtml(String(year)) + '<span class="chip-remove">&times;</span>';
                            chipList.appendChild(chip);
                        });
                    }

                    escapeCsv(value) {
                        if (value === null || value === undefined) return '';
                        const stringValue = String(value);
                        if (/[",\\r\\n]/.test(stringValue)) {
                            return '"' + stringValue.replace(/"/g, '""') + '"';
                        }
                        return stringValue;
                    }

                    updateHeaderMeta(coverageLabel = 'Full dataset') {
                        const statusEl = document.getElementById('status-value');
                        const statusDot = document.querySelector('.status-dot');
                        const isFullDataset = coverageLabel === 'Full dataset';
                        const isUnavailable = coverageLabel === 'Unavailable';

                        if (statusEl) {
                            statusEl.textContent = isUnavailable ? 'Unavailable' : isFullDataset ? 'Active' : 'Filtered';
                        }

                        if (statusDot) {
                            if (isUnavailable) {
                                statusDot.style.background = '#f87171';
                                statusDot.style.boxShadow = '0 0 0 4px rgba(248, 113, 113, 0.25)';
                            } else if (isFullDataset) {
                                statusDot.style.background = '#22c55e';
                                statusDot.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.18)';
                            } else {
                                statusDot.style.background = '#facc15';
                                statusDot.style.boxShadow = '0 0 0 4px rgba(250, 204, 21, 0.25)';
                            }
                        }

                        const updateEl = document.getElementById('last-update');
                        if (updateEl) {
                            updateEl.textContent = new Date().toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            });
                        }

                        const coverageEl = document.getElementById('data-coverage');
                        if (coverageEl) coverageEl.textContent = coverageLabel;
                    }

                    getStatIcon(type) {
                        const palette = {
                            total: 'icon-blue',
                            fines: 'icon-amber',
                            recent: 'icon-plum',
                            risk: 'icon-crimson'
                        };

                        const icons = {
                            total: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                                '<path d="M12 3v16"></path>' +
                                '<path d="M5 7h14"></path>' +
                                '<path d="M7 7 4 13h6l-3-6z"></path>' +
                                '<path d="M17 7 14 13h6l-3-6z"></path>' +
                            '</svg>',
                            fines: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                                '<ellipse cx="12" cy="6" rx="6" ry="2.5"></ellipse>' +
                                '<path d="M6 6v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6"></path>' +
                                '<path d="M6 12v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-6"></path>' +
                            '</svg>',
                            recent: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                                '<rect x="3.5" y="5" width="17" height="15" rx="2"></rect>' +
                                '<path d="M16 4v3"></path>' +
                                '<path d="M8 4v3"></path>' +
                                '<path d="M3.5 9h17"></path>' +
                                '<path d="M9 13h4"></path>' +
                            '</svg>',
                            risk: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                                '<path d="M12 3 5 6v5c0 4.6 3.4 8.3 7 9 3.6-.7 7-4.4 7-9V6l-7-3z"></path>' +
                                '<path d="M9.5 11.5 12 14l3-3.5"></path>' +
                            '</svg>'
                        };

                        const iconHtml = icons[type] || icons.total;
                        const paletteClass = palette[type] || palette.total;
                        return '<div class="stat-icon ' + paletteClass + '">' + iconHtml + '</div>';
                    }

                    getTrendMetricIcon(kind) {
                        const icons = {
                            count: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M7 18v-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M12 18v-11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M17 18v-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
                            amount: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"></circle><path d="M12 8.5v7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M9.5 11.5c0-1.71 1.2-3 2.7-3H14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M14.5 12.5c0 1.71-1.2 3-2.7 3H10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
                            average: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 16.5h15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M6.5 16.5 12 7.5l5.5 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 7.5v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
                            peak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 8 12h4l-2 9 6-10h-4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path></svg>'
                        };

                        return icons[kind] || icons.count;
                    }

                    escapeHtml(value) {
                        if (value === null || value === undefined) return '';
                        return String(value)
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#39;');
                    }

                    derivePatternsFromFines(fines) {
                        if (!fines || !fines.length) {
                            return { topBreachTypes: [], topSectors: [], overview: {}, yearlyOverview: [], categoryTrendSeries: [] };
                        }

                        const categoryMap = new Map();
                        const sectorMap = new Map();
                        const yearlyMap = new Map();
                        const categoryYearMap = new Map();
                        let riskSum = 0;
                        let totalAmount = 0;
                        let amountThisYear = 0;
                        const firmCounts = new Map();
                        const currentYear = new Date().getFullYear();

                        fines.forEach(fine => {
                            const amount = Number(fine.amount || 0);
                            const issuedDate = fine.date_issued ? new Date(fine.date_issued) : null;
                            const issuedYear = issuedDate && Number.isFinite(issuedDate.getFullYear()) ? issuedDate.getFullYear() : null;

                            if (typeof fine.risk_score === 'number') riskSum += fine.risk_score;
                            totalAmount += amount;
                            if (issuedYear === currentYear) amountThisYear += amount;

                            const firm = (fine.firm_individual || 'Unknown').trim() || 'Unknown';
                            firmCounts.set(firm, (firmCounts.get(firm) || 0) + 1);

                            const categories = (fine.breach_categories || []).filter(Boolean);
                            const sectors = (fine.affected_sectors || []).filter(Boolean);

                            categories.forEach(category => {
                                const record = categoryMap.get(category) || { category, count: 0, total_amount: 0 };
                                record.count += 1;
                                record.total_amount += amount;
                                categoryMap.set(category, record);

                                if (issuedYear !== null) {
                                    const key = category + '::' + issuedYear;
                                    const bucket = categoryYearMap.get(key) || { category, year: issuedYear, fine_count: 0, total_amount: 0 };
                                    bucket.fine_count += 1;
                                    bucket.total_amount += amount;
                                    categoryYearMap.set(key, bucket);
                                }
                            });

                            sectors.forEach(sector => {
                                const record = sectorMap.get(sector) || { sector, count: 0, total_amount: 0 };
                                record.count += 1;
                                record.total_amount += amount;
                                sectorMap.set(sector, record);
                            });

                            if (issuedYear !== null) {
                                const yearBucket = yearlyMap.get(issuedYear) || {
                                    year: issuedYear,
                                    fine_count: 0,
                                    total_amount: 0,
                                    categoryCounts: new Map(),
                                    sectorCounts: new Map()
                                };

                                yearBucket.fine_count += 1;
                                yearBucket.total_amount += amount;

                                categories.forEach(category => {
                                    const count = yearBucket.categoryCounts.get(category) || 0;
                                    yearBucket.categoryCounts.set(category, count + 1);
                                });

                                sectors.forEach(sector => {
                                    const count = yearBucket.sectorCounts.get(sector) || 0;
                                    yearBucket.sectorCounts.set(sector, count + 1);
                                });

                                yearlyMap.set(issuedYear, yearBucket);
                            }
                        });

                        const topBreachTypes = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count).slice(0, 3);
                        const topSectors = Array.from(sectorMap.values()).sort((a, b) => b.count - a.count).slice(0, 3);

                        const yearlyOverview = Array.from(yearlyMap.values()).map(entry => {
                            const topCategory = Array.from(entry.categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0];
                            const topSector = Array.from(entry.sectorCounts.entries()).sort((a, b) => b[1] - a[1])[0];

                            return {
                                year: entry.year,
                                fine_count: entry.fine_count,
                                total_amount: entry.total_amount,
                                dominant_category: topCategory ? { category: topCategory[0], count: topCategory[1] } : null,
                                dominant_sector: topSector ? { sector: topSector[0], count: topSector[1] } : null
                            };
                        }).sort((a, b) => a.year - b.year);

                        const categoryTrendSeries = Array.from(categoryYearMap.values()).sort((a, b) => {
                            if (a.year === b.year) return a.category.localeCompare(b.category);
                            return a.year - b.year;
                        });

                        const distinctFirms = firmCounts.size;
                        const repeatOffenders = Array.from(firmCounts.values()).filter(count => count > 1).length;
                        const averageRiskScore = fines.length ? riskSum / fines.length : 0;

                        return {
                            topBreachTypes,
                            topSectors,
                            yearlyOverview,
                            categoryTrendSeries,
                            overview: {
                                distinct_firms: distinctFirms,
                                repeat_offenders: repeatOffenders,
                                total_amount: totalAmount,
                                amount_this_year: amountThisYear,
                                average_risk_score: averageRiskScore
                            }
                        };
                    }

                    renderRiskBadge(riskScore) {
                        if (!riskScore) return '<span class="risk-badge">N/A</span>';

                        if (riskScore >= 70) {
                            return '<span class="risk-badge risk-high">High (' + riskScore + ')</span>';
                        } else if (riskScore >= 40) {
                            return '<span class="risk-badge risk-medium">Medium (' + riskScore + ')</span>';
                        } else {
                            return '<span class="risk-badge risk-low">Low (' + riskScore + ')</span>';
                        }
                    }

                    formatNumber(value) {
                        const number = Number(value || 0);
                        return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(number);
                    }

                    formatCurrency(amount) {
                        if (amount === undefined || amount === null) return 'N/A';
                        return new Intl.NumberFormat('en-GB', {
                            style: 'currency',
                            currency: 'GBP',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(amount);
                    }

                    formatDate(dateString) {
                        if (!dateString) return 'N/A';
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        });
                    }

                    setupEventListeners() {
                        // Search functionality
                        const searchInput = document.getElementById('search-input');
                        const yearFilter = document.getElementById('year-filter');
                        const breachCategory = document.getElementById('breach-category');
                        const minAmountInput = document.getElementById('min-amount');
                        const riskLevelSelect = document.getElementById('risk-level');
                        const trendsSelect = document.getElementById('trends-period');
                        const trendSearchInput = document.getElementById('trend-search');
                        const topFirmSearchInput = document.getElementById('top-firm-search');

                        // Debounced search
                        let searchTimeout;
                        [searchInput, yearFilter, breachCategory, minAmountInput, riskLevelSelect].filter(Boolean).forEach(input => {
                            input.addEventListener('input', () => {
                                clearTimeout(searchTimeout);
                                if (input === yearFilter) {
                                    const years = Array.from(yearFilter.selectedOptions)
                                        .map(option => parseInt(option.value, 10))
                                        .filter(year => !isNaN(year));
                                    this.updateYearChips(years);
                                }
                                searchTimeout = setTimeout(() => this.performSearch(), 500);
                            });
                            input.addEventListener('change', () => {
                                clearTimeout(searchTimeout);
                                if (input === yearFilter) {
                                    const years = Array.from(yearFilter.selectedOptions)
                                        .map(option => parseInt(option.value, 10))
                                        .filter(year => !isNaN(year));
                                    this.updateYearChips(years);
                                }
                                searchTimeout = setTimeout(() => this.performSearch(), 500);
                            });
                        });

                        // Trends period change
                        trendsSelect.addEventListener('change', () => this.loadTrends(true));

                        if (trendSearchInput) {
                            trendSearchInput.addEventListener('input', event => {
                                this.trendSearchTerm = event.target.value || '';
                                if (Array.isArray(this.latestTrendsData)) {
                                    this.renderEnhancedTrends(this.latestTrendsData, this.currentFilterParams || {});
                                }
                            });
                        }

                        if (topFirmSearchInput) {
                            topFirmSearchInput.addEventListener('input', event => {
                                this.topFirmSearchTerm = event.target.value || '';
                                if (Array.isArray(this.latestTopFirms)) {
                                    this.renderTopFirms(this.latestTopFirms, {
                                        filterMode: this.isFilterActive,
                                        scopeLabel: this.filteredSummary ? this.filteredSummary.scopeLabel : null
                                    });
                                }
                            });
                        }

                        const yearChipList = document.getElementById('year-chip-list');
                        if (yearChipList && yearFilter) {
                            yearChipList.addEventListener('click', event => {
                                const chip = event.target.closest('.chip');
                                if (!chip) return;
                                event.preventDefault();
                                const yearValue = chip.dataset.year;
                                if (!yearValue) return;
                                Array.from(yearFilter.options).forEach(option => {
                                    if (option.value === yearValue) option.selected = false;
                                });
                                this.updateYearChips(Array.from(yearFilter.selectedOptions).map(option => parseInt(option.value, 10)).filter(year => !isNaN(year)));
                                this.performSearch();
                            });
                        }

                        const yearClearBtn = document.getElementById('year-clear-btn');
                        if (yearClearBtn && yearFilter) {
                            yearClearBtn.addEventListener('click', event => {
                                if (yearClearBtn.disabled) return;
                                event.preventDefault();
                                Array.from(yearFilter.options).forEach(option => {
                                    option.selected = false;
                                });
                                this.updateYearChips([]);
                                this.performSearch();
                            });
                        }

                        const finesContainer = document.getElementById('fines-container');
                        if (finesContainer) {
                            finesContainer.addEventListener('click', event => {
                                const actionTarget = event.target.closest('[data-action]');
                                if (!actionTarget) return;
                                event.preventDefault();
                                const action = actionTarget.getAttribute('data-action');
                                const sourceFines = this.latestFilteredFines.length ? this.latestFilteredFines : this.allFines;

                                if (action === 'expand-fines') {
                                    this.showAllFines = true;
                                    this.tableRowLimit = null;
                                    this.renderFines(sourceFines);
                                } else if (action === 'collapse-fines') {
                                    this.showAllFines = false;
                                    this.tableRowLimit = this.defaultTableRowLimit;
                                    this.renderFines(sourceFines);
                                }
                            });
                        }
                    }

                    getCurrentFilterParams() {
                        const yearSelect = document.getElementById('year-filter');
                        const selectedYears = Array.from(yearSelect.selectedOptions).map(option => option.value);
                        const query = document.getElementById('search-input').value;
                        const breachCategory = document.getElementById('breach-category').value;
                        const minAmount = document.getElementById('min-amount').value;
                        const riskLevel = document.getElementById('risk-level').value;

                        const filterParams = {};
                        if (query) filterParams.q = query.trim();
                        if (selectedYears.length > 0) {
                            filterParams.years = selectedYears.join(',');
                            filterParams.yearsArray = selectedYears
                                .map(year => parseInt(year, 10))
                                .filter(year => !isNaN(year));
                            filterParams.yearsRaw = selectedYears;
                        } else {
                            filterParams.yearsArray = [];
                            filterParams.yearsRaw = [];
                        }
                        if (breachCategory) filterParams.breach_type = breachCategory;
                        if (minAmount) filterParams.min_amount = minAmount;
                        if (riskLevel) filterParams.risk_level = riskLevel;

                        this.updateYearChips(filterParams.yearsArray);

                        return filterParams;
                    }

                    async performSearch() {
                        const filterParams = this.getCurrentFilterParams();
                        await this.loadStatsWithFilters(filterParams);
                    }
                }

                // Global functions for buttons
                window.refreshData = async function() {
                    console.log('[refresh] Refreshing enforcement data...');

                    try {
                        const response = await fetch('/api/enforcement/update', { method: 'POST' });
                        const data = await response.json();

                        if (data.success) {
                            showMessage('&#9989; Data refreshed successfully', 'success');
                            // Reload the dashboard
                            window.location.reload();
                        } else {
                            throw new Error(data.error || 'Refresh failed');
                        }
                    } catch (error) {
                        console.error('[error] Refresh error:', error);
                        showMessage('Refresh failed: ' + error.message, 'error');
                    }
                };

                window.exportData = function() {
                    const dashboard = window.enforcementDashboard;
                    if (!dashboard) return;

                    const fines = (Array.isArray(dashboard.latestFilteredFines) && dashboard.latestFilteredFines.length)
                        ? dashboard.latestFilteredFines
                        : dashboard.allFines;

                    if (!Array.isArray(fines) || fines.length === 0) {
                        showMessage('No data available to export', 'error');
                        return;
                    }

                    const csv = dashboard.buildFinesCsv(fines);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'enforcement_export_' + new Date().toISOString().slice(0, 10) + '.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                };

                function showMessage(message, type) {
                    const messageEl = document.createElement('div');
                    messageEl.style.cssText =
                        'position: fixed;' +
                        'top: 20px;' +
                        'right: 20px;' +
                        'background: ' + (type === 'success' ? '#10b981' : '#ef4444') + ';' +
                        'color: white;' +
                        'padding: 15px 20px;' +
                        'border-radius: 8px;' +
                        'z-index: 10001;' +
                        'animation: slideIn 0.3s ease;';
                    messageEl.textContent = message;
                    document.body.appendChild(messageEl);

                    setTimeout(() => messageEl.remove(), 3000);
                }

                // Initialize dashboard when page loads
                document.addEventListener('DOMContentLoaded', () => {
                    window.enforcementDashboard = new EnforcementDashboard();
                });
            </script>

            ${getCommonClientScripts()}
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('[error] Error rendering enforcement page:', error)
    res.status(500).send(`
            <html>
                <head>
                    <title>Error - Enforcement Dashboard</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: #f8fafc;
                        }
                        .error-container {
                            text-align: center;
                            padding: 40px;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                            max-width: 500px;
                        }
                        h1 { color: #dc2626; }
                        a {
                            color: #4f46e5;
                            text-decoration: none;
                            padding: 10px 20px;
                            border: 1px solid #4f46e5;
                            border-radius: 6px;
                            display: inline-block;
                            margin-top: 20px;
                        }
                        a:hover {
                            background: #4f46e5;
                            color: white;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>&#10060; Error Loading Enforcement Dashboard</h1>
                        <p>${error.message}</p>
                        <a href="/">&larr; Back to Home</a>
                    </div>
                </body>
            </html>
        `)
  }
}

module.exports = enforcementPage
