function getSidebarStyles() {
  return `
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
            color: #475569;
        }
        
        .insight-label {
            font-weight: 600;
            color: #1f2937;
            display: block;
            margin-bottom: 6px;
        }
        
        .insight-footer {
            font-size: 0.75rem;
            color: #64748b;
            margin-top: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        /* Navigation Menu */
        .nav-sections {
            padding: 20px;
        }
        
        .nav-section {
            margin-bottom: 20px;
        }
        
        .nav-section h4 {
            font-size: 0.9rem;
            font-weight: 600;
            color: #334155;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        
        .nav-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .nav-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 8px;
            color: #1f2937;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .nav-link:hover {
            background: #f3f4f6;
            color: #1d4ed8;
            transform: translateX(4px);
        }
        
        .nav-link.active {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(79, 70, 229, 0.12));
            color: #1d4ed8;
            font-weight: 600;
            box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.2);
        }
        
        .nav-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            color: #6366f1;
        }
        
        .nav-text {
            flex: 1;
        }
        
        .nav-meta {
            font-size: 0.75rem;
            background: #e0f2fe;
            color: #0369a1;
            padding: 2px 8px;
            border-radius: 999px;
            font-weight: 600;
        }
        
        .nav-meta.urgent {
            background: #fee2e2;
            color: #b91c1c;
        }
        
        .nav-meta.beta {
            background: #ede9fe;
            color: #6d28d9;
        }
        
        /* Filter Sections */
        .filter-section {
            background: white;
            border-radius: 12px;
            padding: 18px;
            border: 1px solid #e2e8f0;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
        }
        
        .filter-section h5 {
            font-size: 0.85rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        
        .filter-options {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .filter-option {
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .filter-option:hover {
            background: #eff6ff;
            border-color: #3b82f6;
            color: #1d4ed8;
        }
        
        .filter-option.active {
            background: #1d4ed8;
            color: white;
            border-color: #1d4ed8;
            box-shadow: 0 4px 10px rgba(29, 78, 216, 0.2);
        }
        
        /* Saved Items */
        .saved-items {
            padding: 20px;
            border-top: 1px solid #f3f4f6;
        }
        
        .saved-item {
            border-bottom: 1px solid #f1f5f9;
            padding: 12px 0;
        }
        
        .saved-item:last-child {
            border-bottom: none;
        }
        
        .saved-item-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 6px;
        }
        
        .saved-item-meta {
            font-size: 0.75rem;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .saved-item-tag {
            background: #ede9fe;
            color: #6d28d9;
            padding: 2px 6px;
            border-radius: 999px;
            font-weight: 500;
        }
        
        .saved-item a {
            color: inherit;
            text-decoration: none;
        }
        
        .saved-item a:hover {
            color: #1d4ed8;
        }
        
        .saved-item-actions {
            margin-top: 8px;
            display: flex;
            gap: 10px;
        }
        
        .action-link {
            font-size: 0.75rem;
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
        }
        
        .action-link:hover {
            text-decoration: underline;
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
  `
}

module.exports = { getSidebarStyles }
