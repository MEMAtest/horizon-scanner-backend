function getAiIntelligenceStyles() {
  return `
    <style>
      :root {
        --intelligence-navy: #0f172a;
        --intelligence-ink: #1e293b;
        --intelligence-slate: #334155;
        --intelligence-muted: #64748b;
        --intelligence-border: #e2e8f0;
        --intelligence-sky: #38bdf8;
        --intelligence-amber: #fbbf24;
        --intelligence-emerald: #10b981;
        --intelligence-danger: #ef4444;
      }

      .app-container {
        min-height: 100vh;
        background: #f8fafc;
        padding-left: 260px;
      }

      .main-content {
        padding: 36px 64px 80px;
        background: linear-gradient(180deg, #f8fafc 0%, #eef2f9 100%);
        max-width: 1540px;
        width: calc(100% - 80px);
        margin: 0 auto;
      }

      .hero-panel {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        color: var(--intelligence-slate);
      }

      .hero-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--intelligence-navy);
        letter-spacing: -0.015em;
      }

      .hero-date {
        display: block;
        margin-top: 4px;
        font-size: 0.95rem;
        color: var(--intelligence-muted);
      }

      .hero-insight {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.88));
        color: #f8fafc;
        padding: 32px;
        border-radius: 28px;
        margin-bottom: 28px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 220px;
        gap: 24px;
        position: relative;
        overflow: hidden;
      }

      .hero-insight::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(120% 80% at 20% 20%, rgba(56, 189, 248, 0.25), transparent 55%);
        pointer-events: none;
      }

      .hero-copy {
        position: relative;
        z-index: 1;
      }

      .hero-copy h1 {
        margin: 0 0 12px;
        font-size: 1.8rem;
        letter-spacing: -0.01em;
      }

      .hero-summary {
        margin: 0 0 16px;
        line-height: 1.6;
        color: rgba(248, 250, 252, 0.88);
      }

      .hero-recommendation {
        background: rgba(15, 23, 42, 0.35);
        border-radius: 16px;
        padding: 14px 16px;
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }

      .hero-recommendation strong {
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(248, 250, 252, 0.75);
      }

      .hero-related {
        margin: 18px 0 0;
        padding-left: 20px;
        color: rgba(248, 250, 252, 0.72);
      }

      .hero-meta {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
      }

      .hero-score {
        background: rgba(15, 23, 42, 0.45);
        border-radius: 18px;
        padding: 18px 20px;
        text-align: right;
        min-width: 180px;
      }

      .hero-score-label {
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(248, 250, 252, 0.7);
      }

      .hero-score-value {
        display: block;
        font-size: 2.4rem;
        font-weight: 700;
        margin-top: 6px;
        color: #f8fafc;
      }

      .hero-score-confidence {
        font-size: 0.75rem;
        color: rgba(248, 250, 252, 0.6);
      }

      .hero-transparency {
        background: rgba(248, 250, 252, 0.12);
        border: 1px solid rgba(248, 250, 252, 0.25);
        color: #f8fafc;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 0.75rem;
        cursor: pointer;
      }

      .profile-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        background: #fff;
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 20px;
        padding: 20px 24px;
        margin-bottom: 20px;
        box-shadow: 0 18px 50px -35px rgba(15, 23, 42, 0.3);
      }

      .profile-banner--empty {
        background: linear-gradient(135deg, rgba(14, 116, 144, 0.08), rgba(56, 189, 248, 0.05));
        border-color: rgba(14, 116, 144, 0.2);
      }

      .profile-banner--needs-action {
        border-color: rgba(251, 191, 36, 0.4);
        box-shadow: 0 18px 50px -35px rgba(202, 138, 4, 0.3);
      }

      .profile-banner__copy h2 {
        margin: 0 0 6px;
        font-size: 1.25rem;
        color: var(--intelligence-navy);
      }

      .profile-banner__copy p {
        margin: 0;
        color: var(--intelligence-slate);
        font-size: 0.95rem;
      }

      .profile-banner__status {
        display: inline-block;
        margin-top: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #ca8a04;
        background: rgba(250, 204, 21, 0.18);
        padding: 4px 10px;
        border-radius: 999px;
      }

      .profile-banner__actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .profile-banner-btn {
        border: none;
        background: var(--intelligence-navy);
        color: #f8fafc;
        padding: 10px 18px;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .profile-banner-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 15px 30px -20px rgba(15, 23, 42, 0.5);
      }

      .card-meta-tags {
        display: inline-flex;
        gap: 6px;
        align-items: center;
        margin-left: auto;
      }

      .profile-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .profile-tag-core {
        background: rgba(14, 165, 233, 0.15);
        color: rgb(14, 165, 233);
      }

      .profile-tag-related {
        background: rgba(16, 185, 129, 0.15);
        color: rgb(16, 185, 129);
      }

      .profile-tag-broader {
        background: rgba(148, 163, 184, 0.16);
        color: rgba(71, 85, 105, 0.9);
      }

      .profile-tag-score {
        background: rgba(15, 23, 42, 0.09);
        color: rgba(15, 23, 42, 0.8);
      }

      .workflow-spotlight {
        background: #fff;
        border-radius: 24px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        padding: 22px;
        box-shadow: 0 20px 55px -40px rgba(15, 23, 42, 0.32);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .workflow-list {
        display: grid;
        gap: 16px;
      }

      .workflow-card {
        border: 1px solid rgba(226, 232, 240, 0.7);
        border-radius: 16px;
        padding: 16px;
        background: #fff;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .workflow-card h4 {
        margin: 0;
        font-size: 1rem;
        color: var(--intelligence-navy);
      }

      .workflow-summary {
        margin: 0;
        color: var(--intelligence-slate);
        font-size: 0.92rem;
        line-height: 1.45;
      }

      .workflow-reasons,
      .workflow-actions {
        margin: 0;
        padding-left: 20px;
        color: var(--intelligence-muted);
        font-size: 0.88rem;
      }

      .workflow-footer {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .workflow-btn {
        border: 1px solid rgba(148, 163, 184, 0.55);
        background: #fff;
        color: var(--intelligence-slate);
        padding: 8px 14px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
      }

      .workflow-btn:hover {
        transform: translateY(-1px);
        border-color: var(--intelligence-navy);
      }

      .workflow-btn-start {
        background: rgba(15, 23, 42, 0.9);
        color: #fff;
        border-color: rgba(15, 23, 42, 0.9);
      }

      .workflow-shelf {
        margin-top: 32px;
        background: #fff;
        border-radius: 28px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        padding: 28px;
        box-shadow: 0 25px 70px -45px rgba(15, 23, 42, 0.35);
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .workflow-shelf__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }

      .workflow-shelf__header h2 {
        margin: 0 0 6px;
        color: var(--intelligence-navy);
      }

      .workflow-shelf__header p {
        margin: 0;
        color: var(--intelligence-muted);
      }

      .workflow-shelf__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 18px;
      }

      .saved-workflow-card {
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 18px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #fff;
      }

      .saved-workflow-card header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .saved-workflow-card h3 {
        margin: 0;
        font-size: 1.05rem;
        color: var(--intelligence-navy);
      }

      .saved-workflow-rating .star {
        color: rgba(148, 163, 184, 0.7);
        font-size: 1rem;
        margin-left: 2px;
      }

      .saved-workflow-rating .star.is-active {
        color: #f59e0b;
      }

      .workflow-status {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 3px 10px;
        border-radius: 999px;
      }

      .workflow-status-open {
        background: rgba(14, 165, 233, 0.15);
        color: rgba(14, 165, 233, 0.9);
      }

      .workflow-status-closed {
        background: rgba(34, 197, 94, 0.15);
        color: rgba(34, 197, 94, 0.9);
      }

      .workflow-meta {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.85rem;
        color: var(--intelligence-slate);
      }

      .workflow-meta-line {
        display: flex;
        gap: 4px;
        align-items: baseline;
      }

      .workflow-meta-line.workflow-flag {
        color: #b45309;
      }

      .workflow-source-list {
        margin: 0;
        padding-left: 18px;
        color: var(--intelligence-muted);
      }

      .workflow-builder {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1500;
      }

      .workflow-builder.is-visible {
        display: flex;
      }

      .workflow-builder__overlay {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(3px);
      }

      .workflow-builder__panel {
        position: relative;
        z-index: 1;
        background: #fff;
        border-radius: 24px;
        width: min(780px, 92vw);
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 40px 120px -60px rgba(15, 23, 42, 0.55);
      }

      .workflow-builder__header {
        padding: 24px 28px 12px;
        border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }

      .workflow-builder__header h2 {
        margin: 0 0 6px;
        color: var(--intelligence-navy);
      }

      .workflow-builder__header p {
        margin: 0;
        color: var(--intelligence-muted);
      }

      .workflow-builder__close {
        border: none;
        background: transparent;
        font-size: 1.6rem;
        color: var(--intelligence-muted);
        cursor: pointer;
      }

      .workflow-builder__form {
        padding: 16px 28px 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .workflow-builder__form label > span {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--intelligence-slate);
        margin-bottom: 6px;
      }

      .workflow-builder__form input[type="text"],
      .workflow-builder__form input[type="url"],
      .workflow-builder__form textarea {
        width: 100%;
        border: 1px solid rgba(226, 232, 240, 0.9);
        border-radius: 12px;
        padding: 10px 12px;
        font-size: 0.95rem;
      }

      .workflow-source-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
        margin-bottom: 8px;
      }

      .workflow-source-option {
        display: flex;
        gap: 8px;
        align-items: center;
        border: 1px solid rgba(226, 232, 240, 0.7);
        border-radius: 10px;
        padding: 8px 10px;
        font-size: 0.85rem;
      }

      .workflow-persona-options {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .workflow-persona-options label {
        display: flex;
        gap: 6px;
        align-items: center;
        border: 1px solid rgba(226, 232, 240, 0.7);
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 0.85rem;
      }

      .workflow-toggle {
        display: flex;
        gap: 10px;
        align-items: center;
        font-weight: 600;
        color: var(--intelligence-slate);
      }

      .workflow-builder__footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .workflow-btn-primary {
        background: var(--intelligence-navy);
        color: #fff;
        border-color: var(--intelligence-navy);
      }

      .export-btn {
        background: var(--intelligence-navy);
        color: #fff;
        border: none;
        padding: 12px 20px;
        border-radius: 999px;
        font-weight: 600;
        box-shadow: 0 20px 60px -28px rgba(15, 23, 42, 0.45);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .export-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 28px 70px -32px rgba(15, 23, 42, 0.5);
      }

      body.profile-onboarding-open {
        overflow: hidden;
      }

      body.workflow-builder-open {
        overflow: hidden;
      }

      .profile-onboarding {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1400;
      }

      .profile-onboarding.is-visible {
        display: flex;
      }

      .profile-onboarding__overlay {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(2px);
      }

      .profile-onboarding__panel {
        position: relative;
        z-index: 1;
        background: #fff;
        border-radius: 24px;
        box-shadow: 0 35px 90px -45px rgba(15, 23, 42, 0.55);
        width: min(780px, 92vw);
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .profile-onboarding__header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 24px 28px 16px;
        border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      }

      .profile-onboarding__header h2 {
        margin: 0 0 6px;
        font-size: 1.4rem;
        color: var(--intelligence-navy);
      }

      .profile-onboarding__header p {
        margin: 0;
        color: var(--intelligence-slate);
        font-size: 0.95rem;
      }

      .profile-onboarding__close {
        border: none;
        background: transparent;
        color: var(--intelligence-muted);
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
      }

      .profile-onboarding__steps {
        padding: 24px 28px;
        overflow-y: auto;
        max-height: 58vh;
      }

      .onboarding-step {
        display: none;
        flex-direction: column;
        gap: 18px;
      }

      .onboarding-step.is-active {
        display: flex;
      }

      .onboarding-step h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--intelligence-navy);
      }

      .onboarding-subsection {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .onboarding-subsection__label {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--intelligence-muted);
      }

      .onboarding-option-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
      }

      .onboarding-option-grid--wrap {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      }

      .onboarding-option {
        border: 1px solid rgba(226, 232, 240, 0.9);
        border-radius: 14px;
        padding: 12px 16px;
        background: #fff;
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--intelligence-slate);
        cursor: pointer;
        transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
      }

      .onboarding-option:hover {
        transform: translateY(-1px);
        border-color: rgba(37, 99, 235, 0.35);
        box-shadow: 0 14px 28px -26px rgba(37, 99, 235, 0.65);
      }

      .onboarding-option.is-selected {
        border-color: var(--intelligence-sky);
        background: rgba(56, 189, 248, 0.12);
        color: var(--intelligence-navy);
      }

      .profile-onboarding__summary {
        padding: 0 28px 18px;
        font-size: 0.9rem;
        color: var(--intelligence-slate);
      }

      .profile-onboarding__error {
        display: none;
        margin: 0 28px 10px;
        font-size: 0.85rem;
        color: var(--intelligence-danger);
      }

      .profile-onboarding__error.is-visible {
        display: block;
      }

      .profile-onboarding__footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 18px 28px 24px;
        border-top: 1px solid rgba(226, 232, 240, 0.8);
        background: rgba(248, 250, 252, 0.65);
      }

      .profile-onboarding__nav-btn {
        border: 1px solid rgba(226, 232, 240, 0.85);
        background: #fff;
        color: var(--intelligence-slate);
        padding: 10px 18px;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
      }

      .profile-onboarding__nav-btn:hover {
        transform: translateY(-1px);
      }

      .profile-onboarding__nav-btn--primary {
        background: var(--intelligence-navy);
        color: #fff;
        border-color: var(--intelligence-navy);
      }

      .profile-onboarding__nav-btn[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .profile-onboarding__nav-btn.is-loading::after {
        content: '…';
        margin-left: 6px;
      }

      .risk-pulse {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 24px;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: #f8fafc;
        padding: 28px;
        border-radius: 24px;
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
      }

      .risk-pulse::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(60% 60% at 20% 20%, rgba(59, 130, 246, 0.35), transparent);
        pointer-events: none;
      }

      .pulse-gauge {
        width: 120px;
        height: 120px;
      }

      .pulse-gauge svg {
        width: 100%;
        height: 100%;
      }

      .pulse-track {
        fill: none;
        stroke: rgba(148, 163, 184, 0.3);
        stroke-width: 10;
      }

      .pulse-meter {
        fill: none;
        stroke: url(#pulseGradient);
        stroke-width: 10;
        stroke-linecap: round;
        transform-origin: 60px 60px;
        transform: rotate(-90deg);
      }

      .risk-pulse svg defs linearGradient {
        stop-color: var(--intelligence-sky);
      }

      .pulse-score {
        fill: #fff;
        font-size: 1.8rem;
        font-weight: 700;
        text-anchor: middle;
      }

      .pulse-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: relative;
        z-index: 1;
      }

      .pulse-label {
        font-size: 1.4rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .pulse-delta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.35);
      }

      .pulse-delta-icon::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 999px;
      }

      .pulse-delta.pulse-up .pulse-delta-icon::before {
        background: var(--intelligence-danger);
      }

      .pulse-delta.pulse-down .pulse-delta-icon::before {
        background: var(--intelligence-emerald);
      }

      .pulse-delta.pulse-flat .pulse-delta-icon::before {
        background: var(--intelligence-muted);
      }

      .pulse-focus {
        margin: 0;
        color: rgba(248, 250, 252, 0.82);
        line-height: 1.5;
      }

      .pulse-breakdown {
        margin-top: 12px;
        display: grid;
        gap: 6px;
        background: rgba(15, 23, 42, 0.35);
        border-radius: 12px;
        padding: 10px 12px;
      }

      .pulse-breakdown-title {
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(248, 250, 252, 0.7);
      }

      .pulse-breakdown-item {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        color: rgba(248, 250, 252, 0.78);
      }

      .quick-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin-bottom: 28px;
      }

      .quick-stat-card {
        background: #fff;
        padding: 18px;
        border-radius: 18px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        box-shadow: 0 16px 40px -30px rgba(15, 23, 42, 0.45);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .quick-stat-value {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--intelligence-navy);
      }

      .quick-stat-label {
        color: var(--intelligence-muted);
        font-size: 0.95rem;
      }

      .executive-summary {
        background: #fff;
        border-radius: 24px;
        padding: 28px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        box-shadow: 0 24px 60px -38px rgba(15, 23, 42, 0.4);
        margin-bottom: 28px;
      }

      .executive-summary header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .executive-summary h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--intelligence-navy);
      }

      .summary-refresh {
        background: none;
        border: 1px solid var(--intelligence-border);
        border-radius: 999px;
        padding: 8px 16px;
        color: var(--intelligence-slate);
        cursor: pointer;
        transition: border-color 0.2s ease;
      }

      .summary-refresh:hover {
        border-color: var(--intelligence-navy);
      }

      .executive-summary p {
        margin: 0;
        line-height: 1.6;
        color: var(--intelligence-slate);
        font-size: 1.02rem;
      }

      .streams-split {
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

      .persona-intelligence {
        background: #fff;
        border-radius: 24px;
        padding: 28px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.35);
        margin-bottom: 32px;
      }

      .persona-intelligence header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .persona-intelligence h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--intelligence-navy);
      }

      .persona-tabs {
        display: inline-flex;
        gap: 10px;
        background: rgba(15, 23, 42, 0.03);
        padding: 6px;
        border-radius: 999px;
      }

      .persona-tab {
        border: none;
        background: none;
        padding: 8px 16px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        color: var(--intelligence-muted);
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease;
      }

      .persona-tab.active {
        background: #fff;
        color: var(--intelligence-navy);
        box-shadow: 0 12px 30px -20px rgba(15, 23, 42, 0.35);
      }

      .persona-tab-count {
        font-size: 0.85rem;
        background: rgba(59, 130, 246, 0.14);
        color: var(--intelligence-sky);
        padding: 2px 10px;
        border-radius: 999px;
      }

      .persona-panels {
        position: relative;
      }

      .persona-panel {
        display: none;
        animation: fadeIn 0.24s ease;
      }

      .persona-panel.active {
        display: block;
      }

      .persona-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }

      .persona-metrics .metric-label {
        font-size: 0.85rem;
        color: var(--intelligence-muted);
      }

      .persona-metrics .metric-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--intelligence-navy);
      }

      .persona-briefing {
        background: rgba(15, 23, 42, 0.03);
        border-radius: 18px;
        padding: 18px;
        margin-top: 16px;
        display: grid;
        gap: 12px;
      }

      .persona-briefing p {
        margin: 0;
        color: var(--intelligence-slate);
      }

      .persona-brief-list {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 8px;
        color: var(--intelligence-slate);
      }

      .persona-empty {
        padding: 18px;
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.03);
        color: var(--intelligence-muted);
        text-align: center;
        font-size: 0.95rem;
      }

      .workspace-pulse {
        background: #fff;
        border-radius: 24px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.35);
        padding: 28px;
        margin-bottom: 28px;
      }

      .workspace-pulse header {
        margin-bottom: 16px;
      }

      .workspace-pulse h2 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--intelligence-navy);
      }

      .workspace-pulse p {
        margin: 6px 0 0;
        color: var(--intelligence-muted);
      }

      .workspace-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
      }

      .workspace-card {
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 16px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: #fff;
        cursor: pointer;
        text-align: left;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .workspace-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 30px 70px -40px rgba(15, 23, 42, 0.35);
      }

      .workspace-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--intelligence-navy);
      }

      .workspace-label {
        font-weight: 600;
        color: var(--intelligence-slate);
      }

      .workspace-meta {
        font-size: 0.85rem;
        color: var(--intelligence-muted);
      }

      .intelligence-timeline {
        background: #fff;
        border-radius: 24px;
        border: 1px solid rgba(226, 232, 240, 0.6);
        padding: 28px;
        box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.35);
        margin-bottom: 32px;
      }

      .intelligence-timeline h2 {
        margin: 0 0 16px;
        color: var(--intelligence-navy);
      }

      .timeline-empty {
        color: var(--intelligence-muted);
      }

      .timeline-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 14px;
      }

      .timeline-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 14px 16px;
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.02);
      }

      .timeline-item strong {
        display: block;
        color: var(--intelligence-slate);
        margin-bottom: 4px;
      }

      .timeline-date {
        font-weight: 600;
        color: var(--intelligence-muted);
        min-width: 120px;
      }

      .timeline-high {
        border-left: 4px solid var(--intelligence-danger);
      }

      .timeline-medium {
        border-left: 4px solid var(--intelligence-amber);
      }

      .timeline-low {
        border-left: 4px solid var(--intelligence-emerald);
      }

      .emerging-themes {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.12));
        border-radius: 24px;
        padding: 24px;
        border: 1px solid rgba(59, 130, 246, 0.18);
        box-shadow: 0 24px 60px -40px rgba(59, 130, 246, 0.45);
      }

      .emerging-themes h2 {
        margin: 0 0 12px;
        color: var(--intelligence-navy);
      }

      .theme-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .theme-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.12);
        color: var(--intelligence-slate);
        font-weight: 600;
      }

      .theme-support {
        font-size: 0.75rem;
        font-weight: 500;
        background: rgba(15, 23, 42, 0.08);
        padding: 2px 8px;
        border-radius: 999px;
      }

      .intelligence-toast {
        position: fixed;
        right: 24px;
        bottom: 24px;
        padding: 12px 18px;
        border-radius: 12px;
        color: #fff;
        font-weight: 600;
        box-shadow: 0 18px 40px -28px rgba(15, 23, 42, 0.45);
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 0.18s ease, transform 0.18s ease;
        z-index: 9999;
      }

      .intelligence-toast.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .intelligence-toast-info {
        background: rgba(59, 130, 246, 0.92);
      }

      .intelligence-toast-success {
        background: rgba(16, 185, 129, 0.92);
      }

      .intelligence-toast-error {
        background: rgba(239, 68, 68, 0.92);
      }

      @media (max-width: 1200px) {
        .main-content {
          width: calc(100% - 48px);
        }

        .streams-split {
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }

        .hero-insight {
          grid-template-columns: minmax(0, 1fr);
        }

        .hero-meta {
          align-items: flex-start;
        }
      }

      @media (max-width: 1024px) {
        .app-container {
          padding-left: 0;
        }

        .main-content {
          margin: 0;
          width: 100%;
          padding: 32px 24px 80px;
        }

        .streams-split {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .risk-pulse {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .pulse-details {
          align-items: center;
        }

        .persona-tabs {
          width: 100%;
          flex-direction: column;
        }

        .persona-tab {
          width: 100%;
          justify-content: space-between;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    </style>
  `
}

module.exports = { getAiIntelligenceStyles }
