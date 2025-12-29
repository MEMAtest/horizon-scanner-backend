function getKanbanInteractionStyles() {
  return `/* Drag and Drop Styles */
      .kanban-column.drag-over .column-body {
        background: rgba(59, 130, 246, 0.05);
      }

      .drop-placeholder {
        height: 60px;
        border: 2px dashed #3b82f6;
        border-radius: 8px;
        background: rgba(59, 130, 246, 0.05);
      }

      /* Toast Notifications */
      .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .toast {
        background: #1e293b;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease;
      }

      .toast.success {
        background: #059669;
      }

      .toast.error {
        background: #dc2626;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      /* Policy Linking Styles */
      .linked-policies-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .linked-policy-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .linked-policy-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .linked-policy-name {
        font-weight: 500;
        font-size: 14px;
        color: #1e293b;
      }

      .linked-policy-version {
        font-size: 12px;
        color: #64748b;
        background: #e2e8f0;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .linked-policy-meta {
        font-size: 12px;
        color: #64748b;
      }

      .no-policies {
        color: #94a3b8;
        font-size: 14px;
        text-align: center;
        padding: 16px;
        margin: 0;
      }

      /* Policy Selector Modal */
      .modal-content {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .policy-selector-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
      }

      .policy-selector-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        cursor: pointer;
        transition: all 0.2s;
      }

      .policy-selector-item:hover {
        background: #eff6ff;
        border-color: #3b82f6;
      }

      .policy-selector-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .policy-selector-name {
        font-weight: 500;
        font-size: 14px;
        color: #1e293b;
      }

      .policy-selector-category {
        font-size: 12px;
        color: #64748b;
      }

      .policy-selector-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .policy-version-badge {
        font-size: 11px;
        color: #64748b;
        background: #e2e8f0;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .policy-status-badge {
        font-size: 11px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 4px;
        text-transform: capitalize;
      }

      .policy-status-badge.draft {
        background: #fef3c7;
        color: #d97706;
      }

      .policy-status-badge.pending_review {
        background: #dbeafe;
        color: #2563eb;
      }

      .policy-status-badge.approved {
        background: #dcfce7;
        color: #16a34a;
      }

      .policy-status-badge.published {
        background: #d1fae5;
        color: #059669;
      }

      .policy-status-badge.archived {
        background: #f1f5f9;
        color: #64748b;
      }

      /* Dossier Selector Modal */
      .dossier-selector-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
      }

      .dossier-selector-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        cursor: pointer;
        transition: all 0.2s;
      }

      .dossier-selector-item:hover {
        background: #ecfdf5;
        border-color: #10b981;
      }

      .dossier-selector-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .dossier-selector-name {
        font-weight: 500;
        font-size: 14px;
        color: #1e293b;
      }

      .dossier-selector-topic {
        font-size: 12px;
        color: #64748b;
      }

      .dossier-selector-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dossier-item-count {
        font-size: 11px;
        color: #64748b;
        background: #e2e8f0;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .dossier-status-badge {
        font-size: 11px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 4px;
        text-transform: capitalize;
      }

      .dossier-status-badge.active {
        background: #dcfce7;
        color: #16a34a;
      }

      .dossier-status-badge.draft {
        background: #fef3c7;
        color: #d97706;
      }

      .dossier-status-badge.archived {
        background: #f1f5f9;
        color: #64748b;
      }

      .empty-state {
        text-align: center;
        padding: 24px;
        color: #64748b;
      }

      .loading-spinner {
        text-align: center;
        padding: 24px;
        color: #64748b;
      }

      .error-text {
        color: #dc2626;
        text-align: center;
        padding: 16px;
      }`
}

module.exports = { getKanbanInteractionStyles }
