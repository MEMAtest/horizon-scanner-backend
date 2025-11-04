function getTypographyStyles() {
  return `
        /* Professional Report Typography System */
        h1, h2, h3, h4, h5, h6 {
            font-weight: 600;
            line-height: var(--line-height-tight);
            margin-bottom: var(--space-md);
            color: var(--report-navy);
            letter-spacing: -0.01em;
        }

        /* Report Title - Large, commanding */
        h1 {
            font-size: var(--font-size-2xl);  /* 40px */
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: var(--space-lg);
        }

        /* Section Headings - Clear hierarchy */
        h2 {
            font-size: var(--font-size-xl);  /* 28px */
            font-weight: 600;
            margin-bottom: var(--space-md);
        }

        /* Subsection Headings */
        h3 {
            font-size: var(--font-size-lg);  /* 20px */
            font-weight: 600;
            margin-bottom: var(--space-sm);
        }

        /* Minor Headings */
        h4 {
            font-size: var(--font-size-base);  /* 16px */
            font-weight: 600;
            margin-bottom: var(--space-sm);
        }

        /* Body Text - Optimal readability */
        p {
            margin-bottom: var(--space-md);
            line-height: var(--line-height-relaxed);  /* 1.75 */
            color: var(--report-charcoal);
            font-size: var(--font-size-md);  /* 17px for better readability */
        }
        
        /* Professional Report Links */
        a {
            color: var(--accent-blue);
            text-decoration: none;
            transition: color 0.2s ease;
            font-weight: 500;
        }

        a:hover {
            color: var(--accent-blue-light);
            text-decoration: underline;
        }

        /* Professional Report Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: var(--space-sm) var(--space-md);
            border: 1px solid transparent;
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            gap: var(--space-xs);
            font-family: inherit;
        }

        .btn-primary {
            background: var(--accent-blue);
            color: var(--report-white);
            border-color: var(--accent-blue);
            box-shadow: var(--shadow-sm);
        }

        .btn-primary:hover {
            background: var(--accent-blue-light);
            border-color: var(--accent-blue-light);
            text-decoration: none;
            box-shadow: var(--shadow-lg);
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: var(--report-white);
            color: var(--report-charcoal);
            border-color: var(--report-border);
        }

        .btn-secondary:hover {
            background: var(--report-pearl);
            color: var(--report-navy);
            text-decoration: none;
        }

        .btn-sm {
            padding: var(--space-xs) var(--space-sm);
            font-size: var(--font-size-xs);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
  `
}

module.exports = { getTypographyStyles }
