function getKanbanModalStyles() {
  return `/* Modals */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 24px;
      }

      .modal-overlay.active {
        display: flex;
      }

      .modal {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 560px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .modal-close {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        transition: all 0.2s;
      }

      .modal-close:hover {
        background: #f1f5f9;
        color: #1e293b;
      }

      .modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }

      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      /* Form Elements */
      .form-group {
        margin-bottom: 20px;
      }

      .form-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
      }

      .form-label.required::after {
        content: '*';
        color: #ef4444;
        margin-left: 4px;
      }

      .form-input,
      .form-select,
      .form-textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        color: #1e293b;
        transition: all 0.2s;
      }

      .form-input:focus,
      .form-select:focus,
      .form-textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .form-textarea {
        resize: vertical;
        min-height: 100px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      /* Detail Modal */
      .detail-modal {
        max-width: 640px;
      }

      .detail-section {
        margin-bottom: 24px;
      }

      .detail-section-title {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
      }

      .detail-description {
        color: #475569;
        font-size: 14px;
        line-height: 1.6;
      }

      .detail-meta-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .detail-meta-item {
        background: #f8fafc;
        padding: 12px;
        border-radius: 8px;
      }

      .detail-meta-label {
        font-size: 11px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .detail-meta-value {
        font-size: 14px;
        font-weight: 500;
        color: #1e293b;
      }

      /* Stage History */
      .stage-history {
        border-left: 2px solid #e2e8f0;
        padding-left: 16px;
        margin-left: 8px;
      }

      .history-item {
        position: relative;
        padding-bottom: 16px;
      }

      .history-item:last-child {
        padding-bottom: 0;
      }

      .history-item::before {
        content: '';
        position: absolute;
        left: -22px;
        top: 4px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        border: 2px solid #3b82f6;
      }

      .history-stage {
        font-weight: 600;
        font-size: 14px;
        color: #1e293b;
      }

      .history-date {
        font-size: 12px;
        color: #64748b;
        margin-top: 2px;
      }

      .history-notes {
        font-size: 13px;
        color: #475569;
        margin-top: 4px;
        font-style: italic;
      }

      /* Action Buttons in Detail Modal */
      .detail-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }

      .stage-advance-dropdown {
        position: relative;
      }

      .stage-dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        min-width: 200px;
        z-index: 10;
        display: none;
        margin-top: 4px;
      }

      .stage-dropdown-menu.active {
        display: block;
      }

      .stage-dropdown-item {
        padding: 10px 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s;
      }

      .stage-dropdown-item:hover {
        background: #f1f5f9;
      }

      .stage-dropdown-item:first-child {
        border-radius: 8px 8px 0 0;
      }

      .stage-dropdown-item:last-child {
        border-radius: 0 0 8px 8px;
      }

      /* No Template State */
      .no-template-state {
        text-align: center;
        padding: 60px 24px;
        background: white;
        border-radius: 12px;
        border: 1px dashed #e2e8f0;
      }

      .no-template-state svg {
        width: 48px;
        height: 48px;
        color: #94a3b8;
        margin-bottom: 16px;
      }

      .no-template-state h3 {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 8px 0;
      }

      .no-template-state p {
        color: #64748b;
        font-size: 14px;
        margin: 0 0 20px 0;
      }

      `
}

module.exports = { getKanbanModalStyles }
