function getDashboardModalStyles() {
  return `/* Modal styles for dashboard */
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
      }`
}

module.exports = { getDashboardModalStyles }
