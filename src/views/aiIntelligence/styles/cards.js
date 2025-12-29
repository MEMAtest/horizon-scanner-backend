function getCardsStyles() {
  return `      .profile-banner {
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

`
}

module.exports = { getCardsStyles }
