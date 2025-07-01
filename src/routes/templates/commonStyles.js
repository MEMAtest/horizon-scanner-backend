// src/routes/templates/commonStyles.js
// Shared CSS styles across all pages

const getCommonStyles = () => `
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif; 
            background: #fafbfc; 
            color: #1f2937; 
            line-height: 1.5;
            height: 100vh;
            overflow-x: hidden;
        }
        
        .page-container { 
            display: grid; 
            grid-template-columns: 280px 1fr; 
            height: 100vh; 
        }
        
        /* Enhanced Sidebar */
        .enterprise-sidebar { 
            background: #ffffff; 
            border-right: 1px solid #e5e7eb; 
            padding: 1.5rem; 
            overflow-y: auto;
            box-shadow: 2px 0 4px rgba(0,0,0,0.02);
        }
        
        .logo-section { 
            margin-bottom: 2rem; 
            padding-bottom: 1rem; 
            border-bottom: 1px solid #f3f4f6; 
        }
        
        .logo-title { 
            color: #1f2937; 
            font-size: 1.125rem; 
            font-weight: 700; 
            letter-spacing: -0.025em; 
        }
        
        .logo-subtitle { 
            color: #6b7280; 
            font-size: 0.75rem; 
            margin-top: 0.25rem; 
            letter-spacing: 0.05em;
        }
        
        .sidebar-section { 
            margin-bottom: 1.5rem; 
        }
        
        .section-title { 
            color: #374151; 
            font-size: 0.75rem; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-bottom: 0.75rem; 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
        }

        .info-icon {
            width: 14px;
            height: 14px;
            background: #6b7280;
            color: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            cursor: help;
            position: relative;
        }

        .info-icon:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 120%;
            left: 50%;
            transform: translateX(-50%);
            background: #1f2937;
            color: white;
            padding: 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            white-space: nowrap;
            z-index: 1000;
            max-width: 200px;
            white-space: normal;
            text-align: center;
            text-transform: none;
            line-height: 1.3;
        }

        .info-icon:hover::before {
            content: '';
            position: absolute;
            bottom: 115%;
            left: 50%;
            transform: translateX(-50%);
            border: 4px solid transparent;
            border-top-color: #1f2937;
            z-index: 1000;
        }
        
        .sidebar-item { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            padding: 0.5rem 0.75rem; 
            margin-bottom: 0.25rem; 
            border-radius: 6px; 
            transition: all 0.15s ease; 
            cursor: pointer; 
            font-size: 0.875rem; 
        }
        
        .sidebar-item:hover { 
            background: #f9fafb; 
        }
        
        .sidebar-item.active { 
            background: #eff6ff; 
            color: #2563eb; 
            font-weight: 500; 
        }

        .sidebar-item a {
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
        }
        
        .status-indicator { 
            width: 8px; 
            height: 8px; 
            border-radius: 50%; 
            background: #10b981; 
            position: relative;
        }
        
        .status-indicator.live {
            background: #10b981;
            animation: pulse-live 2s infinite;
        }
        
        .status-indicator.offline { 
            background: #ef4444; 
        }
        
        .status-indicator.warning { 
            background: #f59e0b; 
        }
        
        @keyframes pulse-live {
            0%, 100% { 
                opacity: 1; 
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
            }
            50% { 
                opacity: 0.8; 
                box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
            }
        }
        
        .count-badge { 
            background: #f3f4f6; 
            color: #6b7280; 
            font-size: 0.75rem; 
            font-weight: 500; 
            padding: 0.125rem 0.5rem; 
            border-radius: 12px; 
            min-width: 1.25rem; 
            text-align: center; 
        }
        
        .count-badge.urgent { 
            background: #fef2f2; 
            color: #dc2626; 
        }
        
        .count-badge.moderate { 
            background: #fffbeb; 
            color: #d97706; 
        }

        .count-badge.analytics { 
            background: #eff6ff; 
            color: #2563eb; 
        }

        /* NEW: Content Type Badges */
        .content-type-badge {
            padding: 0.125rem 0.5rem;
            border-radius: 4px;
            font-size: 0.625rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
        }

        .content-type-consultation { background: #fef3c7; color: #92400e; }
        .content-type-guidance { background: #dbeafe; color: #1e40af; }
        .content-type-enforcement { background: #fef2f2; color: #991b1b; }
        .content-type-speech { background: #f3f4f6; color: #374151; }
        .content-type-news { background: #d1fae5; color: #065f46; }
        .content-type-policy { background: #ede9fe; color: #6b21a8; }

        /* Priority Badges */
        .priority-badge {
            padding: 0.125rem 0.5rem;
            border-radius: 12px;
            font-size: 0.625rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .priority-high { background: #fef2f2; color: #dc2626; }
        .priority-medium { background: #fffbeb; color: #d97706; }
        .priority-background { background: #f3f4f6; color: #6b7280; }

        /* Filter Sections */
        .filter-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 1rem;
        }

        .filter-title {
            font-size: 0.75rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .filter-options {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .filter-option {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.375rem 0.5rem;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 0.8125rem;
        }

        .filter-option:hover {
            background: #f1f5f9;
        }

        .filter-option.active {
            background: #eff6ff;
            color: #2563eb;
        }

        .filter-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
            font-size: 0.75rem;
        }

        .filter-action {
            color: #6b7280;
            cursor: pointer;
            text-decoration: none;
            padding: 0.25rem 0;
        }

        .filter-action:hover {
            color: #374151;
            text-decoration: underline;
        }

        /* Main Content Area */
        .main-content { 
            display: flex; 
            flex-direction: column; 
            overflow: hidden; 
        }
        
        /* Status Bar */
        .status-bar { 
            background: #ffffff; 
            border-bottom: 1px solid #e5e7eb; 
            padding: 1rem 1.5rem; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        
        .status-left { 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
        }
        
        .status-item { 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
            font-size: 0.875rem; 
        }
        
        .live-indicator { 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
            color: #059669; 
            font-weight: 500; 
        }
        
        .pulse-dot { 
            width: 8px; 
            height: 8px; 
            background: #10b981; 
            border-radius: 50%; 
            animation: pulse 2s infinite; 
        }
        
        @keyframes pulse { 
            0%, 100% { opacity: 1; } 
            50% { opacity: 0.5; } 
        }
        
        .refresh-btn { 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 0.5rem 1rem; 
            border-radius: 6px; 
            font-size: 0.875rem; 
            font-weight: 500; 
            cursor: pointer; 
            transition: all 0.15s ease; 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
        }
        
        .refresh-btn:hover { 
            background: #2563eb; 
        }
        
        .refresh-btn:disabled { 
            background: #9ca3af; 
            cursor: not-allowed; 
        }

        /* Responsive Design */
        @media (max-width: 1024px) { 
            .page-container { 
                grid-template-columns: 240px 1fr; 
            } 
        }
        
        @media (max-width: 768px) { 
            .page-container { 
                grid-template-columns: 1fr; 
            }
            
            .enterprise-sidebar { 
                display: none; 
            }
        }
    </style>
`;

module.exports = { getCommonStyles };