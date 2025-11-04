function getBaseStyles() {
  return `
        /* Professional Report Design Tokens */
        :root {
            /* Color Palette - Professional Report */
            --report-navy: #0f172a;
            --report-charcoal: #334155;
            --report-slate: #64748b;
            --report-pearl: #f8fafc;
            --report-white: #ffffff;
            --report-border: #e2e8f0;

            /* Accent Colors */
            --accent-blue: #1e40af;
            --accent-blue-light: #3b82f6;
            --accent-green: #10b981;
            --accent-amber: #f59e0b;
            --accent-red: #ef4444;

            /* Spacing Scale (8-point grid system) */
            --space-xs: 8px;
            --space-sm: 16px;
            --space-md: 24px;
            --space-lg: 32px;
            --space-xl: 48px;
            --space-2xl: 64px;
            --space-3xl: 96px;

            /* Typography Scale */
            --font-size-xs: 0.75rem;      /* 12px */
            --font-size-sm: 0.875rem;     /* 14px */
            --font-size-base: 1rem;       /* 16px */
            --font-size-md: 1.0625rem;    /* 17px - optimal reading */
            --font-size-lg: 1.25rem;      /* 20px */
            --font-size-xl: 1.75rem;      /* 28px */
            --font-size-2xl: 2.5rem;      /* 40px */

            /* Line Heights */
            --line-height-tight: 1.25;
            --line-height-normal: 1.5;
            --line-height-relaxed: 1.75;

            /* Border Radius */
            --radius-sm: 8px;
            --radius-md: 12px;
            --radius-lg: 16px;
            --radius-xl: 20px;
            --radius-2xl: 24px;

            /* Shadows */
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-xl: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            --shadow-2xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

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

        /* Sidebar base styling without overriding state states */
        .sidebar {
            background: #ffffff;
            color: #1f2937;
        }

        .sidebar .nav-link,
        .sidebar .nav-text,
        .sidebar .counter-label {
            color: #1f2937;
        }

        .sidebar-header {
            padding: 24px 20px;
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
            color: #ffffff;
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
            opacity: 0.95;
            color: rgba(255, 255, 255, 0.9);
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
  `
}

module.exports = { getBaseStyles }
