function getSidebarStyles() {
  return `        <!-- Clean Styles -->
        <style>
            /* Clean Sidebar Styles */
            .sidebar {
                width: 280px;
                background: #ffffff;
                border-right: 1px solid #e5e7eb;
                height: 100vh;
                overflow-y: auto;
                padding: 0;
                position: fixed;
                left: 0;
                top: 0;
                z-index: 100;
                display: flex;
                flex-direction: column;
            }
            
            /* Clean Header - Light Background */
            .sidebar-header-clean {
                padding: 1.5rem;
                background: #f8f9fa;
                border-bottom: 1px solid #e5e7eb;
            }

            .sidebar-header-top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.75rem;
            }

            /* Notification Bell */
            .notification-bell {
                position: relative;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 8px;
                transition: background-color 0.2s;
                color: #6b7280;
            }

            .notification-bell:hover {
                background: #e5e7eb;
                color: #1f2937;
            }

            .notification-badge {
                position: absolute;
                top: 2px;
                right: 2px;
                background: #ef4444;
                color: white;
                font-size: 10px;
                font-weight: 600;
                min-width: 16px;
                height: 16px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
            }

            /* Notification Dropdown */
            .notification-dropdown {
                position: absolute;
                top: 100%;
                left: 1rem;
                right: 1rem;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                z-index: 200;
                max-height: 400px;
                overflow: hidden;
            }

            .notification-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid #e5e7eb;
                background: #f8f9fa;
            }

            .notification-title {
                font-weight: 600;
                color: #1f2937;
            }

            .mark-all-read {
                background: none;
                border: none;
                color: #3b82f6;
                cursor: pointer;
                font-size: 0.8rem;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
            }

            .mark-all-read:hover {
                background: #eff6ff;
            }

            .notification-list {
                max-height: 280px;
                overflow-y: auto;
            }

            .notification-item {
                padding: 0.875rem 1rem;
                border-bottom: 1px solid #f3f4f6;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .notification-item:hover {
                background: #f9fafb;
            }

            .notification-item.unread {
                background: #eff6ff;
                border-left: 3px solid #3b82f6;
            }

            .notification-item.high-priority {
                border-left: 3px solid #ef4444;
            }

            .notification-item-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.25rem;
            }

            .notification-item-title {
                font-weight: 500;
                color: #1f2937;
                font-size: 0.875rem;
            }

            .notification-item-time {
                font-size: 0.75rem;
                color: #9ca3af;
                white-space: nowrap;
            }

            .notification-item-message {
                font-size: 0.8rem;
                color: #6b7280;
                line-height: 1.4;
            }

            .notification-item-type {
                display: inline-block;
                font-size: 0.65rem;
                padding: 0.125rem 0.375rem;
                border-radius: 4px;
                background: #e5e7eb;
                color: #4b5563;
                margin-top: 0.375rem;
            }

            .notification-item-type.enforcement {
                background: #fef2f2;
                color: #dc2626;
            }

            .notification-item-type.watch-match {
                background: #fef3c7;
                color: #d97706;
            }

            .notification-empty {
                padding: 2rem;
                text-align: center;
                color: #9ca3af;
            }

            .notification-footer {
                padding: 0.75rem 1rem;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                background: #f8f9fa;
            }

            .view-all-link {
                color: #3b82f6;
                text-decoration: none;
                font-size: 0.875rem;
                font-weight: 500;
            }

            .view-all-link:hover {
                text-decoration: underline;
            }

            .sidebar-logo-link {
                display: block;
                margin-bottom: 0.75rem;
                transition: opacity 0.2s ease;
            }

            .sidebar-logo-link:hover {
                opacity: 0.8;
            }

            .sidebar-logo {
                width: 100%;
                height: auto;
                display: block;
            }

            .sidebar-header-clean h2 {
                font-size: 1.1rem;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 0.5rem 0;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .sidebar-status {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.75rem;
                color: #6b7280;
            }

            /* User/Persona Section */
            .sidebar-user-section {
                padding: 1rem 1.5rem;
                background: #f0f9ff;
                border-bottom: 1px solid #e0e7ff;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 0.75rem;
            }

            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.875rem;
            }

            .user-details {
                display: flex;
                flex-direction: column;
                gap: 2px;
                flex: 1;
                min-width: 0;
            }

            .user-email {
                font-size: 0.8rem;
                color: #374151;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .user-persona {
                font-size: 0.7rem;
                font-weight: 600;
            }

            .persona-selector {
                margin-top: 0.5rem;
            }

            .persona-label {
                display: block;
                font-size: 0.7rem;
                color: #6b7280;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .persona-dropdown {
                width: 100%;
                padding: 8px 10px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                font-size: 0.85rem;
                color: #374151;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
            }

            .persona-dropdown:hover {
                border-color: #3b82f6;
            }

            .persona-dropdown:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
            }

            /* Login Prompt */
            .sidebar-login-prompt {
                padding: 1rem 1.5rem;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
                border-bottom: 1px solid #e0e7ff;
            }

            .login-prompt-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 10px 12px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                color: #3b82f6;
                font-size: 0.8rem;
                font-weight: 500;
                text-decoration: none;
                transition: all 0.2s;
            }

            .login-prompt-btn:hover {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }

            .login-icon {
                display: flex;
                align-items: center;
            }
            
            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10b981;
            }
            
            .status-indicator.online {
                animation: pulse 2s infinite;
            }
            
            .status-indicator.offline {
                background: #ef4444;
                animation: none;
            }
            
            /* Pulse animation */
            .status-indicator.online {
                animation: pulse 2s infinite;
            }
            
            /* Navigation Styles */
            .sidebar-nav-clean {
                padding: 1.5rem 0;
            }
            
            .nav-section-title {
                font-size: 0.7rem;
                font-weight: 600;
                color: #9ca3af;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                padding: 0 1.5rem;
                margin-bottom: 0.75rem;
            }
            
            .nav-list {
                list-style: none;
                margin: 0;
                padding: 0;
            }
            
            .nav-item {
                margin: 0.25rem 0;
            }
            
            .nav-link {
                display: flex;
                align-items: center;
                gap: 0.9rem;
                padding: 0.75rem 1.3rem;
                text-decoration: none;
                color: #475569;
                transition: all 0.2s ease;
                position: relative;
                font-size: 0.92rem;
                font-weight: 500;
                border-radius: 12px;
                border-left: 4px solid transparent;
            }
            
            .nav-link:hover {
                background: #edf2ff;
                color: #1d4ed8;
                border-left: 4px solid #93c5fd;
            }
            
            .nav-item.active .nav-link {
                background: #e0e7ff;
                color: #1d4ed8;
                border-radius: 12px;
                font-weight: 600;
                border-left: 4px solid #1d4ed8;
            }

            .nav-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 1.6rem;
                height: 1.6rem;
                color: inherit;
                opacity: 0.8;
                transition: opacity 0.2s ease, color 0.2s ease;
            }

            .nav-icon svg {
                width: 100%;
                height: 100%;
                stroke: currentColor;
                stroke-width: 1.6;
                fill: none;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            .nav-link:hover .nav-icon {
                opacity: 1;
            }

            .nav-item.active .nav-icon {
                opacity: 1;
                color: #1e3a8a;
            }

            .nav-text {
                flex: 1;
            }
            
            .nav-badge {
                background: #ef4444;
                color: white;
                border-radius: 10px;
                padding: 2px 8px;
                font-size: 0.7rem;
                font-weight: 600;
                min-width: 18px;
                text-align: center;
                margin-left: 0.5rem;
            }
            
            .nav-badge.new {
                background: #10b981;
            }

            /* Manual Refresh Button Styles */
            .refresh-section {
                margin: 1rem 1.5rem;
                border-top: 1px solid #f3f4f6;
                padding-top: 1rem;
            }

            .manual-refresh-btn {
                width: 100%;
                padding: 0.75rem 1rem;
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 0.875rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
            }

            .manual-refresh-btn:hover {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
            }

            .manual-refresh-btn:active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
            }

            .manual-refresh-btn:disabled {
                background: #9ca3af;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .manual-refresh-btn .refresh-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 1.2rem;
                height: 1.2rem;
                transition: transform 0.5s ease;
            }

            .manual-refresh-btn .refresh-icon svg {
                width: 100%;
                height: 100%;
            }

            .manual-refresh-btn.refreshing .refresh-icon {
                animation: spin 1s linear infinite;
            }

            /* Live Feed Styles */
            .live-feed-clean {
                flex: 1;
                padding: 1.5rem 0;
                border-top: 1px solid #f3f4f6;
            }
            
            .feed-stats {
                padding: 0 1.5rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .feed-stat-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                position: relative;
            }
            
            .feed-stat-label {
                color: #6b7280;
                font-size: 0.875rem;
            }
            
            .feed-stat-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: #1f2937;
            }
            
            .feed-stat-value.critical {
                color: #dc2626;
            }
            
            .feed-stat-value.today {
                color: #059669;
            }
            
            .feed-change {
                position: absolute;
                right: -20px;
                top: 0;
                font-size: 0.7rem;
                color: #10b981;
            }
            
            /* Refresh Stats Box */
            .refresh-stats-box {
                margin: 1rem 1.5rem;
                padding: 1rem;
                background: #f8f9fa;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            }
            
            .refresh-stats-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 0.75rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .refresh-title {
                font-size: 0.75rem;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .refresh-status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10b981;
                animation: pulse 2s infinite;
            }
            
            .refresh-status-dot.offline {
                background: #ef4444;
                animation: none;
            }
            
            .refresh-stats-content {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin-bottom: 0.75rem;
            }
            
            .refresh-stat-line {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.8rem;
            }
            
            .refresh-label {
                color: #6b7280;
            }
            
            .refresh-value {
                color: #1f2937;
                font-weight: 500;
            }
            
            .refresh-btn-clean {
                width: 100%;
                padding: 0.5rem;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                color: #4b5563;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                font-weight: 500;
            }
            
            .refresh-btn-clean:hover {
                background: #e5e7eb;
                color: #1f2937;
            }
            
            .refresh-icon {
                font-size: 1rem;
            }
            
            /* Footer Styles */
            .sidebar-footer-clean {
                padding: 1rem 1.5rem;
                border-top: 1px solid #f3f4f6;
                background: #fafafa;
            }
            
            .footer-links {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                font-size: 0.875rem;
            }
            
            .footer-link {
                color: #6b7280;
                text-decoration: none;
                transition: color 0.2s;
            }
            
            .footer-link:hover {
                color: #3b82f6;
            }
            
            .separator {
                color: #d1d5db;
            }
            
            /* Scrollbar Styling */
            .sidebar::-webkit-scrollbar {
                width: 6px;
            }
            
            .sidebar::-webkit-scrollbar-track {
                background: #f9fafb;
            }
            
            .sidebar::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 3px;
            }
            
            .sidebar::-webkit-scrollbar-thumb:hover {
                background: #9ca3af;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .sidebar {
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                    width: 280px;
                }

                .sidebar.mobile-open {
                    transform: translateX(0);
                }
            }
        </style>`
}

module.exports = { getSidebarStyles }
