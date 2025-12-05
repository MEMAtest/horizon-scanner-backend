function getPolicyStyles() {
  return `
    <style>
      .policies-page {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .page-header h1 {
        font-size: 28px;
        font-weight: 600;
        color: var(--text-primary, #1a1a2e);
        margin: 0;
      }

      .page-header .subtitle {
        color: var(--text-secondary, #6b7280);
        margin: 4px 0 0;
        font-size: 14px;
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }

      /* Stats Cards */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }

      .stat-card .stat-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }

      .stat-card .stat-icon.blue { background: #dbeafe; color: #2563eb; }
      .stat-card .stat-icon.green { background: #d1fae5; color: #059669; }
      .stat-card .stat-icon.amber { background: #fef3c7; color: #d97706; }
      .stat-card .stat-icon.red { background: #fee2e2; color: #dc2626; }
      .stat-card .stat-icon.purple { background: #ede9fe; color: #7c3aed; }

      .stat-card .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: var(--text-primary, #1a1a2e);
        line-height: 1;
      }

      .stat-card .stat-label {
        color: var(--text-secondary, #6b7280);
        font-size: 13px;
        margin-top: 4px;
      }

      /* Filter Bar */
      .filter-bar {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .filter-bar input,
      .filter-bar select {
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        background: white;
      }

      .filter-bar input {
        min-width: 250px;
      }

      .filter-bar input:focus,
      .filter-bar select:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      /* Policies List */
      .policies-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .policy-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        overflow: hidden;
        transition: all 0.2s ease;
      }

      .policy-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .policy-card-main {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 20px;
        padding: 20px;
      }

      .policy-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .policy-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .policy-title {
        font-size: 17px;
        font-weight: 600;
        color: var(--text-primary, #1a1a2e);
        margin: 0;
      }

      .policy-status {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .policy-status.draft { background: #fef3c7; color: #d97706; }
      .policy-status.active { background: #d1fae5; color: #059669; }
      .policy-status.under_review { background: #dbeafe; color: #2563eb; }
      .policy-status.archived { background: #f3f4f6; color: #6b7280; }

      .policy-category {
        font-size: 13px;
        color: #6366f1;
        font-weight: 500;
      }

      .policy-description {
        color: var(--text-secondary, #6b7280);
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .policy-meta {
        display: flex;
        gap: 24px;
        font-size: 13px;
        color: var(--text-secondary, #6b7280);
        margin-top: 4px;
      }

      .policy-meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .policy-meta-item svg {
        width: 14px;
        height: 14px;
        opacity: 0.7;
      }

      .policy-meta-item.warning {
        color: #d97706;
      }

      .policy-meta-item.danger {
        color: #dc2626;
      }

      /* Connection Badge */
      .connection-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        border: 1px solid #93c5fd;
        border-radius: 8px;
        margin-top: 12px;
      }

      .connection-badge svg {
        color: #2563eb;
        flex-shrink: 0;
      }

      .connection-badge .connection-count {
        font-weight: 600;
        color: #1e40af;
        font-size: 13px;
      }

      .connection-badge .connection-breakdown {
        font-size: 12px;
        color: #1e3a8a;
        opacity: 0.8;
      }

      .policy-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
      }

      .policy-version-badge {
        background: #f3f4f6;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        color: #374151;
      }

      .policy-actions-row {
        display: flex;
        gap: 8px;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }

      .empty-state svg {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.4;
      }

      .empty-state h3 {
        font-size: 18px;
        color: var(--text-primary, #1a1a2e);
        margin: 0 0 8px;
      }

      .empty-state p {
        color: var(--text-secondary, #6b7280);
        margin: 0 0 20px;
      }

      /* Buttons */
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

      .btn-primary {
        background: #6366f1;
        color: white;
      }

      .btn-primary:hover {
        background: #4f46e5;
      }

      .btn-secondary {
        background: white;
        color: var(--text-primary, #1a1a2e);
        border: 1px solid #e5e7eb;
      }

      .btn-secondary:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      .btn-success {
        background: #059669;
        color: white;
      }

      .btn-success:hover {
        background: #047857;
      }

      .btn-sm {
        padding: 6px 12px;
        font-size: 13px;
      }

      /* Modal Styles */
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
        max-width: 700px;
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

      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        background: #f9fafb;
      }

      /* Form Styles */
      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        font-weight: 500;
        margin-bottom: 6px;
        color: var(--text-primary, #1a1a2e);
        font-size: 14px;
      }

      .form-group input,
      .form-group textarea,
      .form-group select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.2s ease;
      }

      .form-group input:focus,
      .form-group textarea:focus,
      .form-group select:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      .form-group textarea {
        min-height: 150px;
        resize: vertical;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 13px;
      }

      .form-group .hint {
        font-size: 12px;
        color: var(--text-secondary, #6b7280);
        margin-top: 4px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      /* Version History */
      .version-history {
        margin-top: 20px;
      }

      .version-history h4 {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 600;
      }

      .version-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .version-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .version-item.current {
        border-color: #6366f1;
        background: #eef2ff;
      }

      .version-number {
        font-weight: 600;
        font-size: 14px;
      }

      .version-meta {
        font-size: 12px;
        color: var(--text-secondary, #6b7280);
      }

      .version-status {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .version-status.approved { background: #d1fae5; color: #059669; }
      .version-status.pending { background: #fef3c7; color: #d97706; }
      .version-status.draft { background: #f3f4f6; color: #6b7280; }

      /* Citations */
      .citations-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }

      .citations-section h4 {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 600;
      }

      .citation-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 8px;
      }

      .citation-icon {
        width: 32px;
        height: 32px;
        background: #dbeafe;
        color: #2563eb;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .citation-info {
        flex: 1;
      }

      .citation-title {
        font-weight: 500;
        font-size: 14px;
        margin-bottom: 2px;
      }

      .citation-source {
        font-size: 12px;
        color: var(--text-secondary, #6b7280);
      }

      .citation-actions {
        margin-left: auto;
        flex-shrink: 0;
      }

      /* Link Dropdown */
      .link-dropdown {
        position: relative;
        display: inline-block;
      }

      .link-dropdown .link-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        font-size: 12px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        color: #374151;
      }

      .link-dropdown .link-btn:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      .link-dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 180px;
        z-index: 100;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-8px);
        transition: all 0.2s;
      }

      .link-dropdown.active .link-dropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(4px);
      }

      .link-dropdown-menu button {
        display: block;
        width: 100%;
        padding: 10px 14px;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 13px;
        color: #374151;
        transition: background 0.15s;
      }

      .link-dropdown-menu button:first-child {
        border-radius: 7px 7px 0 0;
      }

      .link-dropdown-menu button:last-child {
        border-radius: 0 0 7px 7px;
      }

      .link-dropdown-menu button:hover {
        background: #f3f4f6;
      }

      /* Link Option Styles */
      .link-option {
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
      }

      .link-option:hover {
        border-color: #6366f1;
        background: #f5f3ff;
      }

      .link-option-title {
        font-weight: 500;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .link-option-subtitle {
        font-size: 12px;
        color: #6b7280;
      }

      /* Toast Notifications */
      .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1100;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .toast {
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
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
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .policies-page {
          padding: 16px;
        }

        .page-header {
          flex-direction: column;
          align-items: stretch;
        }

        .header-actions {
          justify-content: flex-start;
        }

        .policy-card-main {
          grid-template-columns: 1fr;
        }

        .policy-actions {
          flex-direction: row;
          align-items: center;
        }

        .filter-bar {
          flex-direction: column;
        }

        .filter-bar input {
          min-width: 100%;
        }

        .form-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `
}

module.exports = { getPolicyStyles }
