function getTablesStyles() {
  return `      .streams-split {
        display: grid;
        grid-template-columns: minmax(420px, 1.55fr) minmax(320px, 0.65fr);
        gap: 28px;
        align-items: start;
        margin-bottom: 36px;
      }

      .priority-feed {
        background: #fff;
        border-radius: 28px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        padding: 28px;
        box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.35);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }

      .section-header h2 {
        margin: 0;
        font-size: 1.35rem;
        color: var(--intelligence-navy);
      }

      .priority-list {
        display: grid;
        gap: 16px;
        margin-top: 18px;
        max-height: 720px;
        overflow-y: auto;
        padding-right: 6px;
      }

      .priority-list::-webkit-scrollbar {
        width: 6px;
      }

      .priority-list::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.18);
        border-radius: 999px;
      }

      .action-sidebar {
        display: grid;
        gap: 24px;
      }

      .action-sidebar .stream-list {
        max-height: 420px;
        overflow-y: auto;
        padding-right: 6px;
      }

      .action-sidebar .stream-list::-webkit-scrollbar {
        width: 6px;
      }

      .action-sidebar .stream-list::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.15);
        border-radius: 999px;
      }

      .action-sidebar .medium-relevance .stream-list {
        max-height: 520px;
        overflow-y: auto;
        padding-right: 6px;
      }

      .action-sidebar .medium-relevance .stream-list::-webkit-scrollbar {
        width: 6px;
      }

      .action-sidebar .medium-relevance .stream-list::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.16);
        border-radius: 999px;
      }

      .stream-column {
        background: #fff;
        border-radius: 24px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        padding: 24px;
        box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.35);
      }

      .stream-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
      }

      .stream-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: var(--intelligence-navy);
      }

      .stream-count {
        font-size: 0.95rem;
        color: var(--intelligence-muted);
      }

      .stream-list {
        display: grid;
        gap: 16px;
      }

      .stream-card {
        border: 1px solid rgba(226, 232, 240, 0.7);
        border-radius: 18px;
        padding: 20px;
        background: #fff;
        display: grid;
        gap: 12px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stream-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 30px 70px -42px rgba(15, 23, 42, 0.4);
      }

      .stream-card header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.95rem;
      }

      .card-authority {
        font-weight: 600;
        color: var(--intelligence-slate);
      }

      .card-urgency {
        padding: 4px 10px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.035em;
      }

      .urgency-high {
        background: rgba(239, 68, 68, 0.12);
        color: var(--intelligence-danger);
      }

      .urgency-medium {
        background: rgba(245, 158, 11, 0.16);
        color: var(--intelligence-amber);
      }

      .urgency-low {
        background: rgba(16, 185, 129, 0.12);
        color: var(--intelligence-emerald);
      }

      .stream-card h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .stream-card h3 a {
        color: var(--intelligence-navy);
        text-decoration: none;
      }

      .stream-card h3 a:hover {
        text-decoration: underline;
      }

      .card-summary {
        margin: 0;
        color: var(--intelligence-slate);
        line-height: 1.55;
      }

      .card-metadata {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 0.85rem;
        color: var(--intelligence-muted);
      }

      .persona-chip {
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: capitalize;
      }

      .persona-executive {
        background: rgba(251, 191, 36, 0.2);
        color: var(--intelligence-amber);
      }

      .persona-analyst {
        background: rgba(59, 130, 246, 0.18);
        color: var(--intelligence-sky);
      }

      .persona-operations {
        background: rgba(16, 185, 129, 0.18);
        color: var(--intelligence-emerald);
      }

      .sector-tag {
        background: rgba(148, 163, 184, 0.16);
        color: var(--intelligence-slate);
        padding: 2px 8px;
        border-radius: 8px;
        font-size: 0.75rem;
      }

      /* Meta Chip Base Styling */
      .meta-chip {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 500;
        white-space: nowrap;
      }

      .meta-chip.meta-authority {
        background: #1e40af;
        color: white;
        font-weight: 600;
      }

      .meta-chip.meta-date,
      .meta-chip.meta-score {
        background: rgba(148, 163, 184, 0.16);
        color: #64748b;
      }

      .meta-chip.meta-sector {
        background: rgba(99, 102, 241, 0.12);
        color: #4f46e5;
      }

      .meta-chip.meta-deadline {
        background: rgba(239, 68, 68, 0.12);
        color: #dc2626;
        font-weight: 600;
      }

      /* Content Type Badge - Prominent Styling */
      .meta-chip.meta-content-type {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.68rem;
        letter-spacing: 0.03em;
        border: 1.5px solid;
        padding: 3px 8px;
      }

      /* Consultation - Blue (action required) */
      .content-type-consultation {
        background: #dbeafe;
        color: #1d4ed8;
        border-color: #3b82f6;
      }

      /* Guidance - Green (informational) */
      .content-type-guidance {
        background: #d1fae5;
        color: #047857;
        border-color: #10b981;
      }

      /* Final Rule - Purple (enacted) */
      .content-type-final-rule {
        background: #ede9fe;
        color: #6d28d9;
        border-color: #8b5cf6;
      }

      /* Enforcement Action - Red (punitive) */
      .content-type-enforcement-action {
        background: #fee2e2;
        color: #b91c1c;
        border-color: #ef4444;
      }

      /* Speech - Amber */
      .content-type-speech {
        background: #fef3c7;
        color: #b45309;
        border-color: #f59e0b;
      }

      /* Policy Statement - Indigo */
      .content-type-policy-statement {
        background: #e0e7ff;
        color: #4338ca;
        border-color: #6366f1;
      }

      /* Market Notice - Cyan */
      .content-type-market-notice {
        background: #cffafe;
        color: #0e7490;
        border-color: #06b6d4;
      }

      /* Press Release - Gray */
      .content-type-press-release {
        background: #f3f4f6;
        color: #4b5563;
        border-color: #9ca3af;
      }

      /* Statistical Report - Slate */
      .content-type-statistical-report {
        background: #f1f5f9;
        color: #475569;
        border-color: #64748b;
      }

      /* Research Paper - Teal */
      .content-type-research-paper {
        background: #ccfbf1;
        color: #0f766e;
        border-color: #14b8a6;
      }

      /* Event - Pink */
      .content-type-event {
        background: #fce7f3;
        color: #be185d;
        border-color: #ec4899;
      }

      /* Impact Level - Secondary Styling */
      .meta-chip.meta-impact {
        font-weight: 500;
        font-size: 0.65rem;
        opacity: 0.9;
      }

      .impact-significant {
        background: #fef2f2;
        color: #dc2626;
      }

      .impact-moderate {
        background: #fff7ed;
        color: #ea580c;
      }

      .impact-informational,
      .impact-low {
        background: #f8fafc;
        color: #64748b;
      }

      .card-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .card-next-step {
        font-size: 0.9rem;
        color: var(--intelligence-slate);
        font-weight: 500;
      }

      .card-buttons {
        display: inline-flex;
        gap: 8px;
      }

      .icon-btn {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        border: 1px solid var(--intelligence-border);
        background: #fff;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }

      .icon-btn:hover {
        background: rgba(15, 23, 42, 0.05);
        transform: translateY(-1px);
      }

      .icon-btn.pin-toggle {
        font-size: 1.2rem;
        line-height: 1;
        color: var(--intelligence-muted);
      }

      .icon-btn.pin-toggle.is-pinned {
        background: rgba(251, 191, 36, 0.18);
        border-color: rgba(251, 191, 36, 0.35);
        color: var(--intelligence-amber);
      }

`
}

module.exports = { getTablesStyles }
