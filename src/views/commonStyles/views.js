function getViewStyles() {
  return `
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
  `
}

module.exports = { getViewStyles }
