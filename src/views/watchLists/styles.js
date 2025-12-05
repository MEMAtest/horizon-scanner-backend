const { getDropdownStyles } = require('../../constants/dropdownOptions')

function getWatchListStyles() {
  return `
    <style>
      ${getDropdownStyles()}
      /* Watch Lists Page Styles */
      .watch-lists-page {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .page-header h1 {
        font-size: 24px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 4px 0;
      }

      .page-header .subtitle {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }

      /* Stats Cards */
      .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .stat-card .stat-label {
        font-size: 13px;
        color: #6b7280;
        margin-bottom: 8px;
      }

      .stat-card .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #1a1a1a;
      }

      .stat-card .stat-value.highlight {
        color: #f59e0b;
      }

      .stat-card .stat-value.success {
        color: #10b981;
      }

      /* Watch Lists Grid */
      .watch-lists-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 20px;
      }

      .watch-list-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: box-shadow 0.2s, transform 0.2s;
      }

      .watch-list-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }

      .watch-list-header {
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
      }

      .watch-list-header h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #1a1a1a;
      }

      .watch-list-header p {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
      }

      .watch-list-body {
        padding: 20px;
      }

      .watch-list-criteria {
        margin-bottom: 16px;
      }

      .criteria-label {
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      }

      .criteria-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .criteria-tag {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        background: #f3f4f6;
        border-radius: 16px;
        font-size: 12px;
        color: #374151;
      }

      .criteria-tag.keyword {
        background: #dbeafe;
        color: #1e40af;
      }

      .criteria-tag.authority {
        background: #dcfce7;
        color: #166534;
      }

      .criteria-tag.sector {
        background: #fef3c7;
        color: #92400e;
      }

      /* Connection Badge */
      .connection-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
        border: 1px solid #d8b4fe;
        border-radius: 8px;
        margin-top: 12px;
      }

      .connection-badge svg {
        color: #9333ea;
        flex-shrink: 0;
      }

      .connection-badge .connection-count {
        font-weight: 600;
        color: #7c3aed;
        font-size: 13px;
      }

      .connection-badge .connection-breakdown {
        font-size: 12px;
        color: #6b21a8;
        opacity: 0.8;
      }

      .watch-list-stats {
        display: flex;
        gap: 24px;
        padding: 16px 0;
        border-top: 1px solid #e5e7eb;
        margin-top: 16px;
      }

      .watch-list-stat {
        text-align: center;
      }

      .watch-list-stat .value {
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .watch-list-stat .label {
        font-size: 12px;
        color: #6b7280;
      }

      .watch-list-stat .value.unreviewed {
        color: #f59e0b;
      }

      .watch-list-footer {
        padding: 16px 20px;
        background: #f9fafb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .watch-list-footer .actions {
        display: flex;
        gap: 8px;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .empty-state svg {
        width: 64px;
        height: 64px;
        color: #9ca3af;
        margin-bottom: 16px;
      }

      .empty-state h3 {
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 8px 0;
      }

      .empty-state p {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 20px 0;
      }

      /* Modal Styles */
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
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
      }

      .modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .modal {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transform: scale(0.9);
        transition: transform 0.2s;
      }

      .modal-overlay.active .modal {
        transform: scale(1);
      }

      .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h2 {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
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
        gap: 12px;
        background: #f9fafb;
      }

      /* Form Styles */
      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
      }

      .form-group input,
      .form-group textarea,
      .form-group select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .form-group input:focus,
      .form-group textarea:focus,
      .form-group select:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .form-group textarea {
        resize: vertical;
        min-height: 80px;
      }

      .form-group .help-text {
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
      }

      .tag-input-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        min-height: 42px;
        cursor: text;
      }

      .tag-input-container:focus-within {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .tag-input-container .tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: #dbeafe;
        color: #1e40af;
        border-radius: 16px;
        font-size: 13px;
      }

      .tag-input-container .tag .remove {
        cursor: pointer;
        opacity: 0.7;
      }

      .tag-input-container .tag .remove:hover {
        opacity: 1;
      }

      .tag-input-container input {
        flex: 1;
        min-width: 120px;
        border: none;
        padding: 4px;
        outline: none;
      }

      /* Toggle Switch */
      .toggle-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .toggle-switch {
        position: relative;
        width: 44px;
        height: 24px;
      }

      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #d1d5db;
        transition: 0.3s;
        border-radius: 24px;
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }

      .toggle-switch input:checked + .toggle-slider {
        background-color: #2563eb;
      }

      .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(20px);
      }

      /* Matches Panel */
      .matches-list {
        margin-top: 24px;
      }

      .matches-list h4 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .matches-list h4 .count {
        background: #f59e0b;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
      }

      .match-item {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
      }

      .match-item:hover {
        border-color: #2563eb;
      }

      .match-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .match-title {
        font-weight: 500;
        color: #1a1a1a;
        font-size: 14px;
      }

      .match-score {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .match-score.high {
        background: #dcfce7;
        color: #166534;
      }

      .match-score.medium {
        background: #fef3c7;
        color: #92400e;
      }

      .match-meta {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 12px;
      }

      .match-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      /* Link Dropdown */
      .link-dropdown {
        position: relative;
        display: inline-block;
      }

      .link-dropdown .link-btn {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .link-dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
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
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 14px;
        border: none;
        background: none;
        text-align: left;
        font-size: 13px;
        color: #374151;
        cursor: pointer;
        transition: background 0.15s;
      }

      .link-dropdown-menu button:hover {
        background: #f3f4f6;
      }

      .link-dropdown-menu button:first-child {
        border-radius: 8px 8px 0 0;
      }

      .link-dropdown-menu button:last-child {
        border-radius: 0 0 8px 8px;
      }

      .link-dropdown-menu button svg {
        flex-shrink: 0;
      }

      /* Toast Notifications */
      .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
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
        background: #10b981;
      }

      .toast.error {
        background: #ef4444;
      }

      .toast.info {
        background: #2563eb;
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

      /* Responsive */
      @media (max-width: 768px) {
        .stats-row {
          grid-template-columns: repeat(2, 1fr);
        }

        .watch-lists-grid {
          grid-template-columns: 1fr;
        }

        .page-header {
          flex-direction: column;
          gap: 16px;
        }
      }
    </style>
  `
}

module.exports = { getWatchListStyles }
