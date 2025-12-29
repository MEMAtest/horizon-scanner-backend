function getCalendarModalStyles() {
  return `    /* Event Modal */
    .event-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
    }

    .event-modal-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .event-modal {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      transform: translateY(20px);
      transition: transform 0.2s;
    }

    .event-modal-overlay.active .event-modal {
      transform: translateY(0);
    }

    .event-modal-header {
      padding: 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .event-modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .event-modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .event-modal-close:hover {
      color: #64748b;
    }

    .event-modal-body {
      padding: 20px;
    }

    .event-modal-row {
      display: flex;
      margin-bottom: 16px;
    }

    .event-modal-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      width: 100px;
      flex-shrink: 0;
    }

    .event-modal-value {
      font-size: 0.9rem;
      color: #334155;
    }

    .event-modal-description {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #475569;
      line-height: 1.6;
      margin-top: 16px;
    }

    .event-modal-footer {
      padding: 16px 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .event-modal-btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .event-modal-btn.primary {
      background: #3b82f6;
      color: white;
      border: none;
    }

    .event-modal-btn.primary:hover {
      background: #2563eb;
    }

    .event-modal-btn.secondary {
      background: white;
      color: #334155;
      border: 1px solid #e2e8f0;
    }

    .event-modal-btn.secondary:hover {
      background: #f8fafc;
    }

`
}

module.exports = { getCalendarModalStyles }
