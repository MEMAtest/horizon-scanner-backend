function getKanbanLayoutStyles() {
  return `
      /* Kanban Page Layout */
      .kanban-page {
        padding: 24px;
        min-height: 100vh;
        background: #f8fafc;
      }

      /* Guidance Panel */
      .kanban-guidance {
        background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
        border: 1px solid #bfdbfe;
        border-radius: 12px;
        margin-bottom: 24px;
        overflow: hidden;
      }

      .guidance-header {
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: background 0.2s;
      }

      .guidance-header:hover {
        background: rgba(59, 130, 246, 0.05);
      }

      .guidance-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #1e40af;
        font-weight: 600;
        font-size: 15px;
      }

      .guidance-header-left svg {
        color: #3b82f6;
      }

      .guidance-chevron {
        color: #3b82f6;
        transition: transform 0.3s ease;
      }

      .kanban-guidance.collapsed .guidance-chevron {
        transform: rotate(-90deg);
      }

      .guidance-content {
        padding: 0 20px 20px 20px;
        display: block;
      }

      .kanban-guidance.collapsed .guidance-content {
        display: none;
      }

      .guidance-steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }

      .guidance-step {
        display: flex;
        gap: 14px;
        background: white;
        padding: 16px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }

      .step-number {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }

      .step-content h4 {
        margin: 0 0 6px 0;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }

      .step-content p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.5;
      }

      .guidance-tips {
        background: white;
        padding: 16px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }

      .guidance-tips strong {
        color: #1e40af;
        font-size: 13px;
        display: block;
        margin-bottom: 10px;
      }

      .guidance-tips ul {
        margin: 0;
        padding-left: 20px;
        color: #475569;
        font-size: 13px;
        line-height: 1.7;
      }

      .guidance-tips li {
        margin-bottom: 4px;
      }

      .text-danger {
        color: #dc2626;
        font-weight: 500;
      }

      .text-warning {
        color: #d97706;
        font-weight: 500;
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

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .kanban-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .header-subtitle {
        color: #64748b;
        font-size: 0.9rem;
        margin: 4px 0 0 0;
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

      .kanban-card.kanban-card-highlight {
        outline: 3px solid rgba(59, 130, 246, 0.9);
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.18), 0 8px 20px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
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

      /* Connection Badge */
      .connection-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 1px solid #fcd34d;
        border-radius: 6px;
        margin-bottom: 10px;
      }

      .connection-badge svg {
        color: #d97706;
        flex-shrink: 0;
      }

      .connection-badge .connection-count {
        font-weight: 600;
        color: #b45309;
        font-size: 12px;
      }

      .connection-badge .connection-breakdown {
        font-size: 11px;
        color: #92400e;
        opacity: 0.85;
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

      `
}

module.exports = { getKanbanLayoutStyles }
