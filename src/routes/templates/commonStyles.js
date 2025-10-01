// Enhanced Common Styles - Phase 1 (Fixed CSS Warning)
// File: src/routes/templates/commonStyles.js

function getCommonStyles() {
  return `
    <!-- Executive Inter Font Import -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Professional Navy/Charcoal Theme Override -->
    <link rel="stylesheet" href="/css/professional-theme.css">

    <style>
        /* Executive-Class Design System - CSS Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            font-size: 16px;
            scroll-behavior: smooth;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #fafbfc;
            color: #334155;
            line-height: 1.6;
            font-size: 0.9rem;
            min-height: 100vh;
            font-weight: 400;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        /* Executive Application Layout */
        .app-container {
            display: flex;
            min-height: 100vh;
            background: #fafbfc;
        }

        .main-content {
            flex: 1;
            padding: 32px;
            margin-left: 280px;
            max-width: calc(100vw - 280px);
            overflow-x: hidden;
            background: #fafbfc;
        }

        /* Executive Sidebar Design */
        .sidebar {
            width: 280px;
            background: #ffffff !important;
            border-right: 1px solid #e1e5e9;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            overflow-y: auto;
            z-index: 1000;
            padding: 0;
        }

        /* Override professional theme sidebar conflicts - FORCE VISIBILITY */
        .sidebar, .sidebar * {
            background: #ffffff !important;
            color: #1f2937 !important;
        }

        .sidebar-header {
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%) !important;
            color: white !important;
        }

        .sidebar-header *, .sidebar-header h2, .sidebar-header .status-indicator {
            color: white !important;
        }

        .nav-text, .nav-link, .counter-label {
            color: #1f2937 !important;
        }

        .sidebar-header {
            padding: 24px 20px;
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%) !important;
            color: white;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-header h2 {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .sidebar-status {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.8rem;
            opacity: 0.9;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
        }
        
        .status-indicator.online {
            background: #10b981;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }
        
        .status-indicator.offline {
            background: #ef4444;
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
        }
        
        /* Live Counters */
        .live-counters {
            padding: 20px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .live-counters h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
        }
        
        .counter-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        .counter-item {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            padding: 16px 12px;
            text-align: center;
            transition: all 0.2s ease;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .counter-item:hover {
            background: #f8fafc;
            border-color: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .counter-item.active {
            background: #2563eb;
            color: white;
            border-color: #2563eb;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        
        .counter-item a {
            color: inherit;
            text-decoration: none;
            display: block;
        }
        
        .counter-number {
            font-size: 1.3rem;
            font-weight: 700;
            display: block;
            margin-bottom: 4px;
        }
        
        .counter-number.high-impact {
            color: #dc2626;
        }
        
        .counter-number.today {
            color: #059669;
        }
        
        .counter-number.this-week {
            color: #7c3aed;
        }
        
        .counter-label {
            font-size: 0.75rem;
            color: #6b7280;
            font-weight: 500;
        }
        
        .counter-updated {
            animation: counterPulse 0.5s ease-in-out;
        }
        
        @keyframes counterPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        /* AI Highlights */
        .ai-highlights {
            padding: 20px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .ai-highlights h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .insights-container {
            margin-bottom: 15px;
        }
        
        .insight-item {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 12px;
            border-left: 3px solid #2563eb;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .insight-item:hover {
            background: #f8fafc;
            border-left-color: #1d4ed8;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .insight-item:last-child {
            margin-bottom: 0;
        }
        
        .insight-item.high {
            border-left-color: #dc2626;
        }
        
        .insight-item.medium {
            border-left-color: #d97706;
        }
        
        .insight-item.low {
            border-left-color: #059669;
        }
        
        .insight-icon {
            font-size: 1.1rem;
            margin-bottom: 6px;
            display: block;
        }
        
        .insight-content {
            font-size: 0.85rem;
        }
        
        .insight-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
            line-height: 1.3;
        }
        
        .insight-summary {
            color: #6b7280;
            line-height: 1.4;
            margin-bottom: 8px;
        }
        
        .insight-meta {
            display: flex;
            gap: 10px;
            font-size: 0.75rem;
        }
        
        .urgency-badge {
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .urgency-badge.critical {
            background: #fef2f2;
            color: #dc2626;
        }
        
        .urgency-badge.high {
            background: #fef2f2;
            color: #dc2626;
        }
        
        .urgency-badge.medium {
            background: #fffbeb;
            color: #d97706;
        }
        
        .urgency-badge.low {
            background: #f0fdf4;
            color: #059669;
        }
        
        .impact-score {
            color: #4b5563;
            font-weight: 500;
        }
        
        .insights-actions {
            display: flex;
            gap: 8px;
            flex-direction: column;
        }
        
        .insight-link {
            color: #2563eb;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 500;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e1e5e9;
            text-align: center;
            transition: all 0.2s ease;
            background: white;
        }

        .insight-link:hover {
            background: #2563eb;
            color: white;
            border-color: #2563eb;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
            transform: translateY(-1px);
        }
        
        /* Navigation Menu */
        .sidebar-nav {
            padding: 20px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .sidebar-nav h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
        }
        
        .nav-list {
            list-style: none;
        }
        
        .nav-item {
            margin-bottom: 6px;
        }
        
        .nav-link {
            display: flex;
            align-items: center;
            padding: 10px 12px;
            color: #4b5563;
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.2s ease;
            font-weight: 500;
        }
        
        .nav-link:hover {
            background: #f3f4f6;
            color: #1f2937;
        }
        
        .nav-item.active .nav-link {
            background: #2563eb;
            color: white;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
        }

        .nav-icon {
            margin-right: 12px;
            font-size: 1.1rem;
            width: 18px;
            text-align: center;
        }

        .nav-text {
            flex: 1;
            color: #4b5563 !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            display: inline-block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }

        .nav-badge {
            background: #dc2626;
            color: white;
            font-size: 0.7rem;
            padding: 3px 7px;
            border-radius: 12px;
            font-weight: 600;
        }

        .nav-badge.new {
            background: #059669;
        }
        
        /* Filter Sections */
        .quick-filters, .authority-filters, .sector-filters {
            padding: 20px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .quick-filters h3, .authority-filters h3, .sector-filters h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
        }
        
        .filter-buttons {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .filter-btn {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
            color: #4b5563;
        }
        
        .filter-btn:hover {
            background: #f8fafc;
            border-color: #2563eb;
            color: #2563eb;
        }

        .filter-btn.active {
            background: #2563eb;
            border-color: #2563eb;
            color: white;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
        }
        
        .authority-list, .sector-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .authority-btn, .sector-btn {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .authority-btn:hover, .sector-btn:hover {
            background: #f8fafc;
            border-color: #2563eb;
        }

        .authority-btn.active, .sector-btn.active {
            background: #2563eb;
            color: white;
            border-color: #2563eb;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
        }
        
        .authority-name, .sector-name {
            font-weight: 500;
            color: #4b5563;
        }
        
        .authority-count, .sector-count {
            background: #f3f4f6;
            color: #6b7280;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .authority-btn.active .authority-count,
        .sector-btn.active .sector-count {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }
        
        /* Saved Items */
        .saved-items {
            padding: 20px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .saved-items h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
        }
        
        .saved-list {
            margin-bottom: 15px;
        }
        
        .saved-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .saved-item:last-child {
            border-bottom: none;
        }
        
        .saved-icon {
            color: #f59e0b;
            margin-right: 8px;
        }
        
        .saved-title {
            flex: 1;
            font-size: 0.85rem;
            color: #4b5563;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .remove-btn {
            color: #9ca3af;
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .remove-btn:hover {
            color: #dc2626;
            background: #fef2f2;
        }
        
        .no-saved-items {
            color: #9ca3af;
            font-size: 0.85rem;
            text-align: center;
            padding: 20px 0;
        }
        
        /* System Status */
        .system-status {
            padding: 20px;
        }
        
        .system-status h4 {
            font-size: 0.9rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
        }
        
        .status-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .status-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.8rem;
        }
        
        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-dot.online {
            background: #10b981;
        }
        
        .status-dot.offline {
            background: #ef4444;
        }
        
        .status-count {
            color: #6b7280;
            font-weight: 500;
        }
        
        /* Sidebar Footer */
        .sidebar-footer {
            padding: 20px;
            background: #f9fafb;
            border-top: 1px solid #f3f4f6;
        }
        
        .version-info {
            text-align: center;
            margin-bottom: 10px;
        }
        
        .version-info small {
            color: #6b7280;
            font-size: 0.75rem;
        }
        
        .last-refresh {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.75rem;
            color: #6b7280;
        }
        
        .refresh-btn {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            padding: 6px 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #64748b;
        }

        .refresh-btn:hover {
            background: #f8fafc;
            border-color: #2563eb;
            color: #2563eb;
        }
        
        /* Main Content Typography */
        h1, h2, h3, h4, h5, h6 {
            font-weight: 600;
            line-height: 1.3;
            margin-bottom: 15px;
            color: #1f2937;
        }
        
        h1 {
            font-size: 2rem;
        }
        
        h2 {
            font-size: 1.5rem;
        }
        
        h3 {
            font-size: 1.25rem;
        }
        
        h4 {
            font-size: 1.1rem;
        }
        
        p {
            margin-bottom: 15px;
            line-height: 1.6;
            color: #4b5563;
        }
        
        /* Executive Links */
        a {
            color: #2563eb;
            text-decoration: none;
            transition: color 0.2s ease;
            font-weight: 500;
        }

        a:hover {
            color: #1d4ed8;
            text-decoration: underline;
        }

        /* Executive Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            border: 1px solid transparent;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            gap: 8px;
            font-family: inherit;
        }

        .btn-primary {
            background: #2563eb;
            color: white;
            border-color: #2563eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .btn-primary:hover {
            background: #1d4ed8;
            border-color: #1d4ed8;
            text-decoration: none;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            transform: translateY(-1px);
        }
        
        .btn-secondary {
            background: white;
            color: #374151;
            border-color: #d1d5db;
        }
        
        .btn-secondary:hover {
            background: #f9fafb;
            color: #1f2937;
            text-decoration: none;
        }
        
        .btn-sm {
            padding: 6px 12px;
            font-size: 0.8rem;
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        /* Executive Cards and Containers */
        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
            border: 1px solid #e1e5e9;
            overflow: hidden;
            transition: all 0.2s ease;
        }

        .card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06);
            border-color: #cbd5e1;
        }

        .card-header {
            padding: 24px;
            border-bottom: 1px solid #e1e5e9;
            background: #f8fafc;
        }

        .card-body {
            padding: 24px;
        }

        .card-footer {
            padding: 20px 24px;
            border-top: 1px solid #e1e5e9;
            background: #f8fafc;
        }
        
        /* Loading States */
        .loading-placeholder {
            text-align: center;
            padding: 40px 20px;
            color: #6b7280;
        }
        
        .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e1e5e9;
            border-top: 3px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Error and Success Messages */
        .error-banner, .success-banner {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
        }
        
        .error-banner {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
        }
        
        .success-banner {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #166534;
        }
        
        .error-content, .success-content {
            display: flex;
            align-items: center;
            padding: 15px;
            gap: 10px;
        }
        
        .error-close, .success-close {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: inherit;
            opacity: 0.7;
            margin-left: auto;
        }
        
        .error-close:hover, .success-close:hover {
            opacity: 1;
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
        
        /* Modal Styles */
        .update-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .modal-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
        }
        
        .modal-content {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            z-index: 1;
        }
        
        .modal-header {
            padding: 25px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .modal-header h2 {
            margin: 0;
            font-size: 1.3rem;
            color: #1f2937;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
            padding: 5px;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .modal-close:hover {
            background: #f3f4f6;
            color: #374151;
        }
        
        .modal-body {
            padding: 25px;
        }
        
        .modal-footer {
            padding: 20px 25px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        /* Detail Grid for Modal */
        .update-detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
        }
        
        .detail-section {
            margin-bottom: 20px;
        }
        
        .detail-section h3 {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .ai-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .ai-tag {
            background: #e0e7ff;
            color: #4338ca;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
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
                grid-template-columns: repeat(4, 1fr);
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

        /* Executive Design Enhancements */

        /* Premium Input Styling */
        input, select, textarea {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            padding: 12px 16px;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            background: white;
        }

        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        /* Executive Table Styling */
        table {
            border-collapse: collapse;
            width: 100%;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        th {
            background: #f8fafc;
            color: #374151;
            font-weight: 600;
            padding: 16px 20px;
            text-align: left;
            border-bottom: 1px solid #e1e5e9;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
        }

        tr:hover {
            background: #f8fafc;
        }

        /* Executive Badge System */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .badge-primary {
            background: #dbeafe;
            color: #1e40af;
        }

        .badge-success {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-warning {
            background: #fef3c7;
            color: #92400e;
        }

        .badge-danger {
            background: #fee2e2;
            color: #991b1b;
        }

        /* Executive Spacing System */
        .space-y-1 > * + * { margin-top: 0.25rem; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .space-y-3 > * + * { margin-top: 0.75rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-6 > * + * { margin-top: 1.5rem; }

        /* Executive Grid System */
        .grid {
            display: grid;
        }

        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

        .gap-2 { gap: 0.5rem; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .gap-8 { gap: 2rem; }

        /* Executive Animation Enhancements */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
        }

        /* Executive Status Indicators */
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }

        .status-online { background: #10b981; }
        .status-warning { background: #f59e0b; }
        .status-error { background: #ef4444; }
        .status-info { background: #2563eb; }

        /* Modal Styles for Firm Profile and Workspace */
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
    z-index: 10000;
}

.modal {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
}

.modal-content {
    padding: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #374151;
}

.form-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 14px;
}

.sectors-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 10px;
}

.sector-checkbox {
    padding: 10px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.sector-checkbox:hover {
    border-color: #3b82f6;
}

.sector-checkbox.selected {
    background: #eff6ff;
    border-color: #3b82f6;
}

.sector-checkbox input {
    margin-right: 8px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
}

.close-btn:hover {
    color: #374151;
}

#messageContainer {
    margin: 15px 0;
}

.saved-searches-list,
.alerts-list {
    max-height: 400px;
    overflow-y: auto;
}

.saved-search-item,
.alert-item {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    margin-bottom: 10px;
}

.btn-small {
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid #d1d5db;
    cursor: pointer;
    background: white;
}

.btn-danger {
    color: #dc2626;
    border-color: #dc2626;
}

.btn-danger:hover {
    background: #fef2f2;
}
        
        /* Utility Classes */
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        
        .mb-0 { margin-bottom: 0; }
        .mb-1 { margin-bottom: 0.5rem; }
        .mb-2 { margin-bottom: 1rem; }
        .mb-3 { margin-bottom: 1.5rem; }
        .mb-4 { margin-bottom: 2rem; }
        
        .mt-0 { margin-top: 0; }
        .mt-1 { margin-top: 0.5rem; }
        .mt-2 { margin-top: 1rem; }
        .mt-3 { margin-top: 1.5rem; }
        .mt-4 { margin-top: 2rem; }
        
        .p-0 { padding: 0; }
        .p-1 { padding: 0.5rem; }
        .p-2 { padding: 1rem; }
        .p-3 { padding: 1.5rem; }
        .p-4 { padding: 2rem; }
        
        .hidden { display: none; }
        .visible { display: block; }
        
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .text-lg { font-size: 1.125rem; }
        .text-xl { font-size: 1.25rem; }
        
        .opacity-50 { opacity: 0.5; }
        .opacity-75 { opacity: 0.75; }
        
        .cursor-pointer { cursor: pointer; }
        .cursor-not-allowed { cursor: not-allowed; }

        /* View Switching Styles */
        .table-view, .timeline-view, .cards-view {
            transition: all 0.3s ease;
        }

        /* Table View Styles */
        .table-wrapper {
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background: white;
        }

        .updates-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }

        .updates-table th {
            background: #f9fafb;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            white-space: nowrap;
        }

        .updates-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
        }

        .updates-table tr:hover {
            background: #f9fafb;
        }

        .headline-cell {
            max-width: 300px;
        }

        .headline-cell .headline {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }

        .headline-cell .summary {
            color: #6b7280;
            font-size: 0.8rem;
            line-height: 1.4;
        }

        .table-btn {
            padding: 4px 8px;
            font-size: 0.75rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s;
        }

        .table-btn:hover {
            background: #2563eb;
        }

        /* Timeline View Styles */
        .timeline-wrapper {
            padding: 20px 0;
        }

        .timeline-date-group {
            margin-bottom: 40px;
        }

        .timeline-date-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }

        .timeline-date-header h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
        }

        .timeline-date-header .update-count {
            background: #e5e7eb;
            color: #6b7280;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .timeline-updates {
            position: relative;
            padding-left: 40px;
        }

        .timeline-updates::before {
            content: '';
            position: absolute;
            left: 12px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #e5e7eb;
        }

        .timeline-item {
            position: relative;
            margin-bottom: 24px;
            display: flex;
            gap: 16px;
        }

        .timeline-marker {
            position: absolute;
            left: -34px;
            top: 8px;
            width: 12px;
            height: 12px;
            background: #3b82f6;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 2px #3b82f6;
        }

        .timeline-content {
            flex: 1;
            background: white;
            border-radius: 8px;
            padding: 16px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .timeline-header {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }

        .timeline-headline {
            font-size: 1rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px 0;
            line-height: 1.4;
        }

        .timeline-summary {
            color: #6b7280;
            font-size: 0.875rem;
            line-height: 1.5;
            margin: 0 0 12px 0;
        }

        .timeline-btn {
            padding: 6px 12px;
            font-size: 0.8rem;
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s;
        }

        .timeline-btn:hover {
            background: #e5e7eb;
            color: #1f2937;
        }

        /* Responsive adjustments for table and timeline */
        @media (max-width: 768px) {
            .table-wrapper {
                font-size: 0.75rem;
            }

            .updates-table th,
            .updates-table td {
                padding: 8px 10px;
            }

            .headline-cell {
                max-width: 200px;
            }

            .timeline-updates {
                padding-left: 20px;
            }

            .timeline-marker {
                left: -14px;
                width: 8px;
                height: 8px;
                border: 2px solid white;
            }

            .timeline-content {
                padding: 12px;
            }
        }

        /* Dark mode support (future enhancement) */
        @media (prefers-color-scheme: dark) {
            /* Dark mode styles will be added in Phase 2 */
        }
    </style>
    
    <!-- Professional Theme Override -->
    <link rel="stylesheet" href="/css/professional-theme.css">
    ` // <-- This backtick closes the template string
}

module.exports = {
  getCommonStyles
}
