// Section styles: general sections, problem, features, coverage, how-it-works, testimonials, pricing, faq, cta
function getSectionStyles() {
  return `
      /* ===== SECTIONS ===== */
      .section {
        padding: 80px 7vw;
      }

      .section-header {
        text-align: center;
        max-width: 720px;
        margin: 0 auto 48px;
      }

      .section-eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.15em;
        font-size: 12px;
        font-weight: 700;
        color: var(--blue-500);
        margin-bottom: 12px;
      }

      .section h2 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: clamp(28px, 3.5vw, 42px);
        margin: 0 0 16px;
        line-height: 1.2;
        color: var(--ink);
      }

      .section-subtitle {
        font-size: 18px;
        color: var(--muted);
        line-height: 1.6;
        margin: 0;
      }

      /* ===== PROBLEM SECTION ===== */
      .problem-section {
        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
      }

      .problem-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 24px;
      }

      .problem-card {
        background: var(--card);
        border-radius: 16px;
        padding: 28px;
        border: 1px solid rgba(239, 68, 68, 0.15);
        box-shadow: var(--shadow-sm);
      }

      .problem-icon {
        margin-bottom: 16px;
      }

      .problem-card h3 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 18px;
        margin: 0 0 12px;
        color: var(--ink);
      }

      .problem-card p {
        font-size: 14px;
        line-height: 1.6;
        color: var(--muted);
        margin: 0;
      }

      /* ===== FEATURES SECTION ===== */
      .features-section {
        background: #ffffff;
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
      }

      .feature-card {
        background: var(--card);
        border-radius: 18px;
        padding: 28px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: relative;
      }

      .feature-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }

      .feature-card.featured {
        grid-column: span 1;
        background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
        border: 2px solid var(--blue-300);
      }

      .feature-badge {
        position: absolute;
        top: 16px;
        right: 16px;
        background: var(--blue-500);
        color: white;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 4px 10px;
        border-radius: 999px;
      }

      .feature-icon-large {
        width: 64px;
        height: 64px;
        margin-bottom: 20px;
      }

      .feature-icon-large svg {
        width: 100%;
        height: 100%;
      }

      .feature-icon-small {
        width: 48px;
        height: 48px;
        background: var(--blue-100);
        border-radius: 12px;
        display: grid;
        place-items: center;
        margin-bottom: 16px;
      }

      .feature-card h3 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 18px;
        margin: 0 0 12px;
        color: var(--ink);
      }

      .feature-card p {
        font-size: 14px;
        line-height: 1.6;
        color: var(--muted);
        margin: 0;
      }

      .feature-bullets {
        list-style: none;
        padding: 0;
        margin: 16px 0 0;
      }

      .feature-bullets li {
        font-size: 13px;
        color: var(--muted);
        padding: 6px 0;
        padding-left: 20px;
        position: relative;
      }

      .feature-bullets li::before {
        content: '';
        position: absolute;
        left: 0;
        top: 12px;
        width: 6px;
        height: 6px;
        background: var(--blue-500);
        border-radius: 50%;
      }

      /* ===== COVERAGE SECTION ===== */
      .coverage-section {
        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
      }

      .coverage-content {
        display: grid;
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .coverage-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      }

      .coverage-stat-card {
        background: var(--card);
        border-radius: 16px;
        padding: 24px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: var(--shadow-sm);
        text-align: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .coverage-stat-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }

      .coverage-stat-card.global-card {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-color: rgba(14, 165, 233, 0.2);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        margin: 0 auto 12px;
      }

      .uk-icon { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #2563eb; }
      .eu-icon { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #d97706; }
      .apac-icon { background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); color: #db2777; }
      .us-icon { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); color: #16a34a; }
      .global-icon { background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); color: #0284c7; }

      .stat-value {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 36px;
        font-weight: 700;
        color: var(--ink);
        line-height: 1;
        margin-bottom: 4px;
      }

      .stat-region {
        font-size: 13px;
        color: var(--muted);
        margin-bottom: 16px;
      }

      .reg-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
      }

      .reg-pill {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 999px;
        transition: transform 0.2s ease;
      }

      .reg-pill:hover {
        transform: scale(1.05);
      }

      .reg-pill.uk { background: #dbeafe; color: #1e40af; }
      .reg-pill.eu { background: #fef3c7; color: #92400e; }
      .reg-pill.apac { background: #fce7f3; color: #9d174d; }
      .reg-pill.us { background: #dcfce7; color: #166534; }
      .reg-pill.global { background: #e0f2fe; color: #075985; }

      .reg-pill.uk-more, .reg-pill.eu-more, .reg-pill.apac-more,
      .reg-pill.us-more, .reg-pill.global-more {
        background: #f1f5f9;
        color: #64748b;
        font-weight: 700;
      }

      .coverage-summary {
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        border-radius: 20px;
        padding: 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 32px;
        flex-wrap: wrap;
      }

      .coverage-total {
        text-align: center;
      }

      .total-number {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 56px;
        font-weight: 700;
        color: white;
        line-height: 1;
      }

      .total-label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 4px;
      }

      .coverage-stats-row {
        display: flex;
        gap: 32px;
        flex-wrap: wrap;
      }

      .mini-stat {
        text-align: center;
      }

      .mini-value {
        display: block;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 28px;
        font-weight: 700;
        color: white;
      }

      .mini-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
      }

      /* ===== HOW IT WORKS ===== */
      .how-section {
        background: #ffffff;
      }

      .steps-grid {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        gap: 24px;
        flex-wrap: wrap;
      }

      .step-card {
        background: var(--card);
        border-radius: 20px;
        padding: 32px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: var(--shadow-sm);
        max-width: 300px;
        text-align: center;
      }

      .step-number {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, var(--blue-500) 0%, var(--blue-700) 100%);
        color: white;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 20px;
        font-weight: 700;
        margin: 0 auto 20px;
      }

      .step-visual {
        width: 120px;
        height: 80px;
        margin: 0 auto 20px;
      }

      .step-visual svg {
        width: 100%;
        height: 100%;
      }

      .step-card h3 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 20px;
        margin: 0 0 12px;
        color: var(--ink);
      }

      .step-card p {
        font-size: 14px;
        line-height: 1.6;
        color: var(--muted);
        margin: 0;
      }

      .step-connector {
        width: 60px;
        height: 20px;
        display: flex;
        align-items: center;
        margin-top: 60px;
      }

      /* ===== TESTIMONIALS ===== */
      .testimonials-section {
        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
      }

      .testimonials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
      }

      .testimonial-card {
        background: var(--card);
        border-radius: 20px;
        padding: 32px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: var(--shadow-sm);
      }

      .testimonial-quote {
        font-size: 16px;
        line-height: 1.7;
        color: var(--ink);
        margin-bottom: 24px;
        font-style: italic;
      }

      .testimonial-quote::before {
        content: '"';
        font-size: 48px;
        font-family: Georgia, serif;
        color: var(--yellow-400);
        line-height: 0;
        display: block;
        margin-bottom: 8px;
      }

      .testimonial-author {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .author-avatar {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, var(--blue-500) 0%, var(--blue-700) 100%);
        color: white;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 14px;
      }

      .author-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .author-info strong {
        font-size: 14px;
        color: var(--ink);
      }

      .author-info span {
        font-size: 12px;
        color: var(--muted);
      }

      /* ===== PRICING ===== */
      .pricing-section {
        background: #ffffff;
      }

      .pricing-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
        max-width: 1000px;
        margin: 0 auto;
      }

      .price-card {
        background: var(--card);
        border-radius: 20px;
        padding: 32px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: var(--shadow-sm);
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .price-card.featured {
        border: 2px solid var(--yellow-400);
        transform: scale(1.02);
        box-shadow: var(--shadow-md);
      }

      .price-badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, var(--yellow-500) 0%, #f9b53d 100%);
        color: var(--blue-900);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 6px 16px;
        border-radius: 999px;
      }

      .price-header {
        margin-bottom: 20px;
      }

      .price-header h4 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 22px;
        margin: 0 0 8px;
        color: var(--ink);
      }

      .price-desc {
        font-size: 14px;
        color: var(--muted);
        margin: 0;
      }

      .price-amount {
        margin-bottom: 24px;
      }

      .price-amount .currency {
        font-size: 18px;
        color: var(--muted);
        vertical-align: top;
      }

      .price-amount .amount {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: var(--ink);
      }

      .price-features {
        list-style: none;
        padding: 0;
        margin: 0 0 24px;
        flex-grow: 1;
      }

      .price-features li {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--muted);
        padding: 8px 0;
        border-bottom: 1px solid rgba(15, 23, 42, 0.06);
      }

      .price-features li:last-child {
        border-bottom: none;
      }

      /* ===== FAQ ===== */
      .faq-section {
        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
      }

      .faq-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
        max-width: 900px;
        margin: 0 auto;
      }

      .faq-item {
        background: var(--card);
        border-radius: 16px;
        padding: 24px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: var(--shadow-sm);
      }

      .faq-item h4 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 16px;
        margin: 0 0 12px;
        color: var(--ink);
      }

      .faq-item p {
        font-size: 14px;
        line-height: 1.6;
        color: var(--muted);
        margin: 0;
      }

      /* ===== CTA BAND ===== */
      .cta-band {
        margin: 60px 7vw 80px;
        padding: 48px;
        border-radius: 32px;
        background: linear-gradient(135deg, #ffdc7d 0%, #fdf1c1 30%, #a9ccff 100%);
        box-shadow: var(--shadow-md);
      }

      .cta-content {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 32px;
        text-align: center;
      }

      .cta-canary {
        width: 100px;
        height: 100px;
      }

      .cta-canary-svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 4px 12px rgba(218, 165, 32, 0.3));
      }

      .cta-text h2 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: clamp(24px, 3vw, 32px);
        margin: 0 0 8px;
        color: var(--ink);
      }

      .cta-text p {
        font-size: 16px;
        color: var(--muted);
        margin: 0;
        max-width: 400px;
      }

      .cta-actions {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      /* ===== FEATURE CARD CTA ===== */
      .feature-cta {
        display: block;
        margin-top: 16px;
        font-size: 12px;
        font-weight: 600;
        color: var(--blue-500);
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .feature-card:hover .feature-cta {
        opacity: 1;
        transform: translateY(0);
      }

      .feature-card[data-feature] {
        cursor: pointer;
      }
  `;
}


module.exports = { getSectionStyles };
