function getSettingsStyles() {
  return `
    <style>
      /* Settings Page Styles */
      .settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem 2rem;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 0;
      }

      .settings-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .settings-title h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }

      .settings-title-icon {
        width: 28px;
        height: 28px;
        color: #6b7280;
      }

      /* Tab Navigation */
      .settings-tabs {
        display: flex;
        gap: 0;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 0 2rem;
      }

      .settings-tab {
        padding: 1rem 1.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .settings-tab:hover {
        color: #374151;
        background: #f9fafb;
      }

      .settings-tab.active {
        color: #2563eb;
        border-bottom-color: #2563eb;
        font-weight: 600;
      }

      .settings-tab .tab-badge {
        background: #ef4444;
        color: white;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
      }

      /* Tab Content */
      .settings-content {
        padding: 2rem;
        background: #f9fafb;
        min-height: calc(100vh - 180px);
      }

      .tab-panel {
        display: none;
      }

      .tab-panel.active {
        display: block;
      }

      /* Notifications Tab */
      .notifications-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .notifications-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .notifications-title h2 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .notifications-count {
        background: #dbeafe;
        color: #1e40af;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 12px;
      }

      .notifications-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .notifications-action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        background: white;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .notifications-action-btn:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
      }

      .notifications-action-btn.primary {
        background: #2563eb;
        border-color: #2563eb;
        color: white;
      }

      .notifications-action-btn.primary:hover {
        background: #1d4ed8;
      }

      .notifications-action-btn.danger {
        color: #dc2626;
        border-color: #fecaca;
      }

      .notifications-action-btn.danger:hover {
        background: #fef2f2;
      }

      .notifications-action-btn svg {
        width: 16px;
        height: 16px;
      }

      /* Filter Tabs */
      .notifications-filters {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .filter-tab {
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
        font-weight: 500;
        color: #6b7280;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .filter-tab:hover {
        border-color: #2563eb;
        color: #2563eb;
      }

      .filter-tab.active {
        background: #2563eb;
        border-color: #2563eb;
        color: white;
      }

      /* Notification List */
      .notifications-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .notification-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.25rem;
        transition: all 0.2s ease;
      }

      .notification-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .notification-card.unread {
        border-left: 4px solid #2563eb;
        background: #f8faff;
      }

      .notification-card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }

      .notification-card-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
        line-height: 1.4;
      }

      .notification-card-time {
        font-size: 0.75rem;
        color: #9ca3af;
        white-space: nowrap;
      }

      .notification-card-message {
        font-size: 0.875rem;
        color: #4b5563;
        line-height: 1.5;
        margin-bottom: 1rem;
      }

      .notification-card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .notification-card-type {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: #6b7280;
      }

      .notification-type-badge {
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 500;
        text-transform: capitalize;
      }

      .notification-type-badge.enforcement {
        background: #fef2f2;
        color: #dc2626;
      }

      .notification-type-badge.watch_list_match {
        background: #f0fdf4;
        color: #16a34a;
      }

      .notification-type-badge.system {
        background: #f3f4f6;
        color: #6b7280;
      }

      .notification-card-actions {
        display: flex;
        gap: 0.5rem;
      }

      .notification-card-btn {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
        background: white;
        color: #374151;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .notification-card-btn:hover {
        background: #f3f4f6;
      }

      .notification-card-btn.primary {
        background: #2563eb;
        border-color: #2563eb;
        color: white;
      }

      .notification-card-btn.primary:hover {
        background: #1d4ed8;
      }

      .notification-card-btn.danger {
        color: #dc2626;
        border-color: #fecaca;
      }

      .notification-card-btn.danger:hover {
        background: #fef2f2;
      }

      /* Empty State */
      .notifications-empty {
        text-align: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }

      .notifications-empty-icon {
        width: 64px;
        height: 64px;
        color: #d1d5db;
        margin: 0 auto 1rem;
      }

      .notifications-empty h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.5rem;
      }

      .notifications-empty p {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
      }

      /* Preferences Tab */
      .preferences-section {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .preferences-section-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #f3f4f6;
      }

      .preference-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f9fafb;
      }

      .preference-row:last-child {
        border-bottom: none;
      }

      .preference-label {
        font-size: 0.875rem;
        color: #374151;
      }

      .preference-label small {
        display: block;
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 2px;
      }

      /* Account Tab */
      .account-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
      }

      .account-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #f3f4f6;
      }

      .account-avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .account-details h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 0.25rem;
      }

      .account-details p {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
      }

      /* Loading state */
      .settings-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        color: #6b7280;
      }

      .settings-loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid #e5e7eb;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 0.75rem;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .settings-header {
          padding: 1rem 1.5rem;
        }

        .settings-tabs {
          padding: 0 1rem;
          overflow-x: auto;
        }

        .settings-content {
          padding: 1.5rem;
        }

        .notifications-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .notification-card-footer {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    </style>
  `
}

module.exports = { getSettingsStyles }
