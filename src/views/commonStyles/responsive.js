function getResponsiveStyles() {
  return `
        /* Responsive Design */
        @media (max-width: 1024px) {
            .main-content {
                margin-left: 280px;
                max-width: calc(100vw - 280px);
            }
            
            .sidebar {
                width: 280px;
            }
        }
        
        @media (max-width: 768px) {
            .app-container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                height: auto;
                position: relative;
                order: 2;
            }
            
            .main-content {
                margin-left: 0;
                max-width: 100%;
                padding: 20px;
                order: 1;
            }
            
            .counter-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .sidebar-header {
                padding: 20px;
            }
            
            .live-counters, .ai-highlights, .sidebar-nav,
            .quick-filters, .authority-filters, .sector-filters,
            .saved-items, .system-status {
                padding: 15px;
            }
            
            .modal-content {
                margin: 10px;
                max-height: 95vh;
            }
            
            .modal-header, .modal-body, .modal-footer {
                padding: 20px;
            }
        }
        
        @media (max-width: 480px) {
            .counter-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
            
            .counter-item {
                padding: 10px;
            }
            
            .counter-number {
                font-size: 1.1rem;
            }
            
            .main-content {
                padding: 15px;
            }
            
            .btn {
                padding: 8px 16px;
                font-size: 0.85rem;
            }
            
            .insight-item {
                padding: 10px;
            }
            
            .modal-content {
                margin: 5px;
            }
        }
        
        /* Print Styles */
        @media print {
            .sidebar {
                display: none;
            }
            
            .main-content {
                margin-left: 0;
                max-width: 100%;
            }
            
            .update-actions, .action-btn {
                display: none;
            }
            
            body {
                background: white;
            }
            
            .card, .update-card {
                box-shadow: none;
                border: 1px solid #d1d5db;
                page-break-inside: avoid;
            }
        }
        
        /* High Contrast Mode Support */
        @media (prefers-contrast: high) {
            .sidebar {
                border-right-width: 2px;
            }
            
            .counter-item, .insight-item, .filter-btn,
            .authority-btn, .sector-btn {
                border-width: 2px;
            }
            
            .btn {
                border-width: 2px;
            }
        }
        
        /* Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
            
            .spinner {
                animation: none;
                border-top-color: transparent;
            }
        }
        
        /* Executive Focus Styles for Accessibility */
        button:focus, .btn:focus, .filter-btn:focus,
        .authority-btn:focus, .sector-btn:focus, .nav-link:focus {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
        }
  `
}

module.exports = { getResponsiveStyles }
