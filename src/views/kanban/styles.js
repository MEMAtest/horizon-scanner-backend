function getKanbanStyles() {
  return `
    <style>
      /* Kanban Page Layout */
      .kanban-page {
        padding: 24px;
        min-height: 100vh;
        background: #f8fafc;
      }

      .kanban-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 28px;
        flex-wrap: wrap;
        gap: 16px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e2e8f0;
      }

      .kanban-header h1 {
        font-size: 28px;
        font-weight: 800;
        color: #1e293b;
        margin: 0;
        background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .header-subtitle {
        color: #64748b;
        font-size: 15px;
        margin: 8px 0 0 0;
        max-width: 600px;
        line-height: 1.5;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      /* Workflow Selector */
      .workflow-selector {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .workflow-selector label {
        font-size: 14px;
        font-weight: 500;
        color: #64748b;
      }

      .workflow-selector select {
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        color: #1e293b;
        background: white;
        cursor: pointer;
        min-width: 200px;
      }

      .workflow-selector select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      /* Buttons */
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
      }

      .btn-secondary:hover {
        background: #e2e8f0;
      }

      .btn-ghost {
        background: transparent;
        color: #64748b;
      }

      .btn-ghost:hover {
        background: #f1f5f9;
        color: #1e293b;
      }

      .btn-sm {
        padding: 6px 10px;
        font-size: 12px;
      }

      /* Stats Cards - Aligned with Dashboard Style */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 28px;
      }

      .stat-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 16px;
        padding: 24px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      }

      .stat-card:nth-child(1)::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
      .stat-card:nth-child(2)::before { background: linear-gradient(90deg, #ef4444, #f87171); }
      .stat-card:nth-child(3)::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
      .stat-card:nth-child(4)::before { background: linear-gradient(90deg, #10b981, #34d399); }

      .stat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .stat-card-label {
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-card-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
      }

      .stat-card:nth-child(1) .stat-card-icon { background: #dbeafe; color: #2563eb; }
      .stat-card:nth-child(2) .stat-card-icon { background: #fee2e2; color: #dc2626; }
      .stat-card:nth-child(3) .stat-card-icon { background: #fef3c7; color: #d97706; }
      .stat-card:nth-child(4) .stat-card-icon { background: #d1fae5; color: #059669; }

      .stat-card-icon svg {
        width: 20px;
        height: 20px;
      }

      .stat-card-value {
        font-size: 36px;
        font-weight: 800;
        color: #1e293b;
        line-height: 1;
        margin-bottom: 4px;
      }

      .stat-card-change {
        font-size: 13px;
        font-weight: 500;
        margin-top: 6px;
      }

      .stat-card-change.positive { color: #10b981; }
      .stat-card-change.negative { color: #ef4444; }
      .stat-card-change.neutral { color: #64748b; }

      /* Kanban Board */
      .kanban-container {
        overflow-x: auto;
        padding-bottom: 16px;
      }

      .kanban-board {
        display: flex;
        gap: 16px;
        min-width: max-content;
      }

      .kanban-column {
        width: 320px;
        flex-shrink: 0;
        background: #f1f5f9;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 320px);
      }

      .column-header {
        padding: 16px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .column-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .column-color-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .column-title {
        font-weight: 600;
        font-size: 14px;
        color: #1e293b;
      }

      .column-count {
        background: #e2e8f0;
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 10px;
      }

      .column-body {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* Kanban Cards */
      .kanban-card {
        background: white;
        border-radius: 10px;
        padding: 14px;
        border: 1px solid #e2e8f0;
        cursor: grab;
        transition: all 0.2s;
      }

      .kanban-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .kanban-card.dragging {
        opacity: 0.5;
        cursor: grabbing;
      }

      .kanban-card-title {
        font-weight: 600;
        font-size: 14px;
        color: #1e293b;
        margin-bottom: 8px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .kanban-card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 10px;
      }

      .card-badge {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 500;
      }

      .card-badge.priority-high {
        background: #fef2f2;
        color: #dc2626;
      }

      .card-badge.priority-medium {
        background: #fffbeb;
        color: #d97706;
      }

      .card-badge.priority-low {
        background: #f0fdf4;
        color: #16a34a;
      }

      .card-badge.authority {
        background: #eff6ff;
        color: #2563eb;
      }

      .card-badge.sector {
        background: #f5f3ff;
        color: #7c3aed;
      }

      .kanban-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 10px;
        border-top: 1px solid #f1f5f9;
      }

      .card-due-date {
        font-size: 12px;
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .card-due-date.overdue {
        color: #dc2626;
      }

      .card-due-date svg {
        width: 14px;
        height: 14px;
      }

      .card-actions {
        display: flex;
        gap: 4px;
      }

      .card-action-btn {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        transition: all 0.2s;
      }

      .card-action-btn:hover {
        background: #f1f5f9;
        color: #475569;
      }

      .card-action-btn svg {
        width: 14px;
        height: 14px;
      }

      /* Empty State */
      .column-empty {
        text-align: center;
        padding: 24px 16px;
        color: #94a3b8;
        font-size: 13px;
      }

      .column-empty svg {
        width: 32px;
        height: 32px;
        margin-bottom: 8px;
        opacity: 0.5;
      }

      /* Modals */
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

      /* Drag and Drop Styles */
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
    </style>
  `
}

module.exports = { getKanbanStyles }
