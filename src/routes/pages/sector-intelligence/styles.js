function getSectorIntelligenceStyles(canaryStyles) {
  return `            <style>
                ${canaryStyles}
                .intelligence-header {
                    background: #ffffff;
                    color: #0f172a;
                    padding: 32px;
                    border-radius: 18px;
                    margin-bottom: 32px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 24px 48px -28px rgba(15, 23, 42, 0.25);
                }

                .sector-title {
                    font-size: 2.25rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #0f172a;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 30px;
                }

                .stat-card {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 14px;
                    text-align: center;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 6px;
                    color: #0f172a;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: #475569;
                }

                .pressure-overview {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .pressure-gauge {
                    background: #f8fafc;
                    color: #0f172a;
                    padding: 24px;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    justify-content: center;
                    gap: 8px;
                    border: 1px solid #dbeafe;
                    box-shadow: 0 16px 32px rgba(37, 99, 235, 0.14);
                }

                .gauge-score {
                    font-size: 2.6rem;
                    font-weight: 700;
                    color: #1d4ed8;
                }

                .gauge-label {
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #1e3a8a;
                }

                .gauge-trend {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #475569;
                }

                .gauge-trend.rising {
                    color: #047857;
                }

                .gauge-trend.cooling {
                    color: #b91c1c;
                }

                .pressure-breakdown {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 16px;
                }

                .breakdown-item {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
                }

                .breakdown-label {
                    font-size: 0.85rem;
                    color: #1e3a8a;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }

                .breakdown-value {
                    display: block;
                    margin-top: 8px;
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .pressure-keyfindings ul {
                    margin: 0;
                    padding-left: 18px;
                    color: #1f2937;
                }

                .timeline-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                }

                .timeline-card {
                    border-radius: 12px;
                    padding: 18px;
                    border: 1px solid #e5e7eb;
                    background: #f9fafb;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .timeline-card.severity-critical {
                    border-color: #fca5a5;
                    background: #fef2f2;
                }

                .timeline-card.severity-elevate {
                    border-color: #fcd34d;
                    background: #fffbeb;
                }

                .timeline-date {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #047857;
                }

                .timeline-title {
                    font-weight: 600;
                    color: #111827;
                }

                .timeline-meta {
                    font-size: 0.85rem;
                    color: #6b7280;
                }

                .timeline-countdown {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #047857;
                }

                .timeline-link {
                    font-size: 0.85rem;
                    color: #047857;
                    text-decoration: none;
                    font-weight: 600;
                }

                .playbook-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                }

                .playbook-card {
                    border-radius: 12px;
                    padding: 18px;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }

                .playbook-card.level-critical {
                    border-color: #f87171;
                    background: #fef2f2;
                }

                .playbook-card.level-elevate {
                    border-color: #facc15;
                    background: #fffbeb;
                }

                .playbook-card.level-monitor {
                    border-color: #a7f3d0;
                    background: #ecfdf5;
                }

                .playbook-level {
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin-bottom: 8px;
                    color: #047857;
                }

                .playbook-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 6px;
                }

                .playbook-description {
                    font-size: 0.9rem;
                    color: #475569;
                    line-height: 1.45;
                }

                .alert-rule-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                }

                .alert-rule {
                    border-radius: 12px;
                    padding: 18px;
                    border: 1px solid #e5e7eb;
                    background: #f9fafb;
                }

                .alert-rule.severity-high {
                    border-color: #f87171;
                    background: #fef2f2;
                }

                .alert-rule.severity-medium {
                    border-color: #facc15;
                    background: #fffbeb;
                }

                .alert-rule.severity-low {
                    border-color: #bae6fd;
                    background: #f0f9ff;
                }

                .alert-rule-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 6px;
                }

                .alert-rule-detail {
                    font-size: 0.9rem;
                    color: #475569;
                    line-height: 1.4;
                }

                .content-section {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                    margin-bottom: 20px;
                }

                .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .update-item {
                    background: #f0fdf4;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border-left: 4px solid #10b981;
                }

                .update-headline {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 10px;
                    line-height: 1.4;
                }

                .update-meta {
                    display: flex;
                    gap: 15px;
                    font-size: 0.85rem;
                    color: #6b7280;
                    flex-wrap: wrap;
                }

                .impact-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .impact-significant {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .impact-moderate {
                    background: #fffbeb;
                    color: #d97706;
                }

                .impact-informational {
                    background: #f0f9ff;
                    color: #0284c7;
                }

                .back-link {
                    display: inline-block;
                    color: rgba(255,255,255,0.8);
                    text-decoration: none;
                    margin-bottom: 20px;
                    transition: color 0.15s ease;
                }

                .back-link:hover {
                    color: white;
                }

                .sector-selector {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }

                .header-actions {
                    margin-top: 20px;
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .sector-btn {
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    text-decoration: none;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }

                .sector-btn:hover,
                .sector-btn.active {
                    background: white;
                    color: #10b981;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                }

                .risk-indicator {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    margin-top: 15px;
                }

                .risk-high {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .risk-medium {
                    background: #fffbeb;
                    color: #d97706;
                }

                .risk-low {
                    background: #f0fdf4;
                    color: #059669;
                }

                .pressure-analysis {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #10b981;
                    margin-top: 20px;
                }
            </style>`
}

module.exports = { getSectorIntelligenceStyles }
