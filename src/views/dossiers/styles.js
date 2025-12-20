function getDossierStyles() {
  return `
    <style>
      .dossiers-page {
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
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .page-header .subtitle {
        color: #64748b;
        margin: 4px 0 0;
        font-size: 0.9rem;
      }

      .page-header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }

      /* Stats Cards */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
      .stat-card .stat-icon.purple { background: #ede9fe; color: #7c3aed; }
      .stat-card .stat-icon.amber { background: #fef3c7; color: #d97706; }

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

      /* Dossiers Grid */
      .dossiers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
      }

      .dossier-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        overflow: hidden;
        transition: all 0.2s ease;
      }

      .dossier-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }

      .dossier-card-header {
        padding: 16px 20px;
        border-bottom: 1px solid #f3f4f6;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .dossier-card-header .dossier-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #1a1a2e);
        margin: 0 0 4px;
      }

      .dossier-card-header .dossier-topic {
        font-size: 13px;
        color: #6366f1;
        font-weight: 500;
      }

      .dossier-status {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .dossier-status.active {
        background: #d1fae5;
        color: #059669;
      }

      .dossier-status.archived {
        background: #f3f4f6;
        color: #6b7280;
      }

      .dossier-card-body {
        padding: 16px 20px;
      }

      .dossier-description {
        color: var(--text-secondary, #6b7280);
        font-size: 14px;
        line-height: 1.5;
        margin: 0 0 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .dossier-meta {
        display: flex;
        gap: 16px;
        font-size: 13px;
        color: var(--text-secondary, #6b7280);
      }

      /* Connection Badge */
      .connection-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        border: 1px solid #86efac;
        border-radius: 8px;
        margin-top: 12px;
      }

      .connection-badge svg {
        color: #16a34a;
        flex-shrink: 0;
      }

      .connection-badge .connection-count {
        font-weight: 600;
        color: #15803d;
        font-size: 13px;
      }

      .connection-badge .connection-breakdown {
        font-size: 12px;
        color: #166534;
        opacity: 0.8;
      }

      .dossier-meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .dossier-meta-item svg {
        width: 14px;
        height: 14px;
        opacity: 0.7;
      }

      .dossier-card-footer {
        padding: 12px 20px;
        background: #f9fafb;
        border-top: 1px solid #f3f4f6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .dossier-tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .dossier-tag {
        background: #e0e7ff;
        color: #4338ca;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
      }

      .dossier-actions {
        display: flex;
        gap: 8px;
      }

      .dossier-actions button {
        padding: 6px 10px;
        font-size: 12px;
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
        min-height: 100px;
        resize: vertical;
      }

      .form-group .hint {
        font-size: 12px;
        color: var(--text-secondary, #6b7280);
        margin-top: 4px;
      }

      /* Timeline Modal */
      .timeline-modal .modal {
        max-width: 800px;
      }

      .timeline {
        position: relative;
        padding-left: 30px;
      }

      .timeline::before {
        content: '';
        position: absolute;
        left: 10px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #e5e7eb;
      }

      .timeline-item {
        position: relative;
        padding: 16px;
        margin-bottom: 16px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .timeline-item::before {
        content: '';
        position: absolute;
        left: -24px;
        top: 20px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #6366f1;
        border: 2px solid white;
      }

      .timeline-item-date {
        font-size: 12px;
        color: var(--text-secondary, #6b7280);
        margin-bottom: 6px;
      }

      .timeline-item-title {
        font-weight: 600;
        color: var(--text-primary, #1a1a2e);
        margin-bottom: 4px;
      }

      .timeline-item-source {
        font-size: 13px;
        color: #6366f1;
      }

      .timeline-item-notes {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #e5e7eb;
        font-size: 13px;
        color: var(--text-secondary, #6b7280);
        font-style: italic;
      }

      .timeline-item-actions {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
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

      .timeline-empty {
        text-align: center;
        padding: 40px;
        color: var(--text-secondary, #6b7280);
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
        .dossiers-page {
          padding: 16px;
        }

        .page-header {
          flex-direction: column;
          align-items: stretch;
        }

        .header-actions {
          justify-content: flex-start;
        }

        .dossiers-grid {
          grid-template-columns: 1fr;
        }

        .filter-bar {
          flex-direction: column;
        }

        .filter-bar input {
          min-width: 100%;
        }
      }
    </style>
  `
}

module.exports = { getDossierStyles }
