function getHeroStyles() {
  return `      .hero-panel {
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

`
}

module.exports = { getHeroStyles }
