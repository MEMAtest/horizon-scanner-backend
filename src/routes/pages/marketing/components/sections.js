// Content sections: problem, features, coverage, how-it-works, testimonials, pricing, FAQ, CTA
const { getCtaCanarySvg } = require('./svg-assets.js');

function getProblemSection() {
  return `
    <section class="section problem-section">
      <div class="section-header">
        <div class="section-eyebrow">The Challenge</div>
        <h2>Regulatory change is constant. Staying ahead shouldn't be impossible.</h2>
      </div>
      <div class="problem-grid">
        <div class="problem-card">
          <div class="problem-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3>Scattered Sources</h3>
          <p>Teams waste hours scouring regulator websites, newsletters, and feeds across dozens of authorities.</p>
        </div>
        <div class="problem-card">
          <div class="problem-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h3>Late Discovery</h3>
          <p>Critical regulatory changes surface too late, leaving compliance teams scrambling to respond.</p>
        </div>
        <div class="problem-card">
          <div class="problem-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/></svg>
          </div>
          <h3>Information Overload</h3>
          <p>Without intelligent filtering, every update demands attention—even those irrelevant to your business.</p>
        </div>
        <div class="problem-card">
          <div class="problem-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3>Siloed Teams</h3>
          <p>Insights stay trapped in inboxes instead of flowing to the business units that need to act.</p>
        </div>
      </div>
    </section>
  `;
}

function getFeaturesSection() {
  return `
    <section class="section features-section" id="features">
      <div class="section-header">
        <div class="section-eyebrow">Platform Features</div>
        <h2>Everything you need to master regulatory change</h2>
        <p class="section-subtitle">From detection to action, RegCanary handles the heavy lifting so your team can focus on strategic response.</p>
      </div>

      <div class="features-grid">
        <div class="feature-card featured" data-feature="horizon-scanning" role="button" tabindex="0">
          <div class="feature-badge">Core</div>
          <div class="feature-icon-large">
            <svg viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
              <circle cx="24" cy="24" r="12" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 2"/>
              <circle cx="24" cy="24" r="4" fill="#2563eb"/>
              <line x1="24" y1="24" x2="36" y2="18" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h3>24/7 Horizon Scanning</h3>
          <p>Continuous monitoring of 120+ regulators worldwide. New publications, consultations, enforcement actions, and guidance captured automatically.</p>
          <ul class="feature-bullets">
            <li>Real-time RSS and web scraping</li>
            <li>Automated categorization</li>
            <li>Instant notification triggers</li>
          </ul>
          <span class="feature-cta">Click to explore</span>
        </div>

        <div class="feature-card featured" data-feature="ai-summaries" role="button" tabindex="0">
          <div class="feature-badge">AI-Powered</div>
          <div class="feature-icon-large">
            <svg viewBox="0 0 48 48">
              <rect x="8" y="12" width="32" height="24" rx="3" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
              <path d="M14 20h20M14 26h14M14 32h18" stroke="#d97706" stroke-width="2" stroke-linecap="round"/>
              <circle cx="36" cy="10" r="6" fill="#2563eb"/>
              <text x="36" y="13" text-anchor="middle" fill="white" font-size="8" font-weight="bold">AI</text>
            </svg>
          </div>
          <h3>Intelligent Summaries</h3>
          <p>AI-generated executive summaries extract what matters: business impact, affected sectors, key deadlines, and required actions.</p>
          <ul class="feature-bullets">
            <li>Impact scoring (High/Medium/Low)</li>
            <li>Sector relevance mapping</li>
            <li>Automated deadline extraction</li>
          </ul>
          <span class="feature-cta">Click to explore</span>
        </div>

        <div class="feature-card" data-feature="calendar" role="button" tabindex="0">
          <div class="feature-icon-small">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <h3>Regulatory Calendar</h3>
          <p>Track consultation deadlines, implementation dates, and milestones in a unified compliance calendar.</p>
          <span class="feature-cta">Click to explore</span>
        </div>

        <div class="feature-card" data-feature="watchlists" role="button" tabindex="0">
          <div class="feature-icon-small">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <h3>Fine Directory</h3>
          <p>Track FCA enforcement actions and create fine monitors by authority, topic, or sector. Get notified only about what matters to your firm.</p>
          <span class="feature-cta">Click to explore</span>
        </div>

        <div class="feature-card" data-feature="dossiers" role="button" tabindex="0">
          <div class="feature-icon-small">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <h3>Dossiers</h3>
          <p>Build evidence-based case files for audit trails, board reports, and regulatory submissions.</p>
          <span class="feature-cta">Click to explore</span>
        </div>

        <div class="feature-card" data-feature="kanban" role="button" tabindex="0">
          <div class="feature-icon-small">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>
          </div>
          <h3>Kanban Workflows</h3>
          <p>Track regulatory projects from discovery to implementation with team collaboration built in.</p>
          <span class="feature-cta">Click to explore</span>
        </div>

        <div class="feature-card" data-feature="analytics" role="button" tabindex="0">
          <div class="feature-icon-small">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
          </div>
          <h3>Analytics Dashboard</h3>
          <p>Visualize regulatory trends, enforcement patterns, and sector activity with interactive charts.</p>
          <span class="feature-cta">Click to explore</span>
        </div>

        <div class="feature-card" data-feature="digests" role="button" tabindex="0">
          <div class="feature-icon-small">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h3>Daily Digests</h3>
          <p>Automated email briefings delivered to your inbox with the day's most important updates summarized.</p>
          <span class="feature-cta">Click to explore</span>
        </div>
      </div>
    </section>
  `;
}

function getCoverageSection() {
  return `
    <section class="section coverage-section" id="coverage">
      <div class="section-header">
        <div class="section-eyebrow">Global Coverage</div>
        <h2>One platform. Every regulator that matters.</h2>
        <p class="section-subtitle">From the FCA to FATF, from MAS to SEC—RegCanary speaks the language of global compliance.</p>
      </div>

      <div class="coverage-content">
        <div class="coverage-stats-grid">
          <div class="coverage-stat-card">
            <div class="stat-icon uk-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M12 3l9 7H3l9-7z"/></svg>
            </div>
            <div class="stat-value">5</div>
            <div class="stat-region">UK Regulators</div>
            <div class="reg-pills">
              <span class="reg-pill uk">FCA</span>
              <span class="reg-pill uk">PRA</span>
              <span class="reg-pill uk">BoE</span>
              <span class="reg-pill uk">PSR</span>
              <span class="reg-pill uk">ICO</span>
            </div>
          </div>
          <div class="coverage-stat-card">
            <div class="stat-icon eu-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
            </div>
            <div class="stat-value">12</div>
            <div class="stat-region">European Regulators</div>
            <div class="reg-pills">
              <span class="reg-pill eu">EBA</span>
              <span class="reg-pill eu">ESMA</span>
              <span class="reg-pill eu">BaFin</span>
              <span class="reg-pill eu">AMF</span>
              <span class="reg-pill eu">DNB</span>
              <span class="reg-pill eu-more">+7</span>
            </div>
          </div>
          <div class="coverage-stat-card">
            <div class="stat-icon apac-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <div class="stat-value">10</div>
            <div class="stat-region">Asia Pacific</div>
            <div class="reg-pills">
              <span class="reg-pill apac">MAS</span>
              <span class="reg-pill apac">HKMA</span>
              <span class="reg-pill apac">ASIC</span>
              <span class="reg-pill apac">JFSA</span>
              <span class="reg-pill apac-more">+6</span>
            </div>
          </div>
          <div class="coverage-stat-card">
            <div class="stat-icon us-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            </div>
            <div class="stat-value">8</div>
            <div class="stat-region">Americas</div>
            <div class="reg-pills">
              <span class="reg-pill us">SEC</span>
              <span class="reg-pill us">CFTC</span>
              <span class="reg-pill us">FinCEN</span>
              <span class="reg-pill us">OSFI</span>
              <span class="reg-pill us-more">+4</span>
            </div>
          </div>
          <div class="coverage-stat-card global-card">
            <div class="stat-icon global-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <div class="stat-value">6</div>
            <div class="stat-region">Global Bodies</div>
            <div class="reg-pills">
              <span class="reg-pill global">FATF</span>
              <span class="reg-pill global">BIS</span>
              <span class="reg-pill global">FSB</span>
              <span class="reg-pill global">IOSCO</span>
              <span class="reg-pill global-more">+2</span>
            </div>
          </div>
        </div>

        <div class="coverage-summary">
          <div class="coverage-total">
            <div class="total-number">120+</div>
            <div class="total-label">Regulators Monitored</div>
          </div>
          <div class="coverage-stats-row">
            <div class="mini-stat">
              <span class="mini-value">5</span>
              <span class="mini-label">Regions</span>
            </div>
            <div class="mini-stat">
              <span class="mini-value">24/7</span>
              <span class="mini-label">Monitoring</span>
            </div>
            <div class="mini-stat">
              <span class="mini-value">&lt;1hr</span>
              <span class="mini-label">Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function getHowItWorksSection() {
  return `
    <section class="section how-section" id="how-it-works">
      <div class="section-header">
        <div class="section-eyebrow">How It Works</div>
        <h2>From regulatory noise to actionable intelligence in three steps</h2>
      </div>

      <div class="steps-grid">
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-visual">
            <svg viewBox="0 0 120 80">
              <circle cx="30" cy="40" r="15" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
              <circle cx="60" cy="25" r="12" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/>
              <circle cx="90" cy="45" r="14" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
              <circle cx="55" cy="55" r="10" fill="#fce7f3" stroke="#ec4899" stroke-width="2"/>
              <path d="M30 55 Q45 70 60 60 Q75 50 90 60" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 4"/>
            </svg>
          </div>
          <h3>Collect</h3>
          <p>RegCanary continuously scans 120+ regulatory sources—websites, RSS feeds, press releases, and publications—capturing every update as it's published.</p>
        </div>

        <div class="step-connector">
          <svg viewBox="0 0 60 20">
            <path d="M0 10 L50 10" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 4"/>
            <polygon points="50,5 60,10 50,15" fill="#2563eb"/>
          </svg>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-visual">
            <svg viewBox="0 0 120 80">
              <rect x="20" y="15" width="80" height="50" rx="4" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
              <rect x="28" y="25" width="50" height="6" rx="2" fill="#2563eb"/>
              <rect x="28" y="35" width="35" height="4" rx="1" fill="#94a3b8"/>
              <rect x="28" y="43" width="45" height="4" rx="1" fill="#cbd5e1"/>
              <rect x="28" y="51" width="30" height="4" rx="1" fill="#e2e8f0"/>
              <circle cx="90" cy="30" r="12" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
              <text x="90" y="34" text-anchor="middle" fill="#92400e" font-size="10" font-weight="bold">AI</text>
            </svg>
          </div>
          <h3>Analyze</h3>
          <p>Our AI engine reads each update, generates plain-English summaries, scores business impact, identifies affected sectors, and extracts critical deadlines.</p>
        </div>

        <div class="step-connector">
          <svg viewBox="0 0 60 20">
            <path d="M0 10 L50 10" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 4"/>
            <polygon points="50,5 60,10 50,15" fill="#2563eb"/>
          </svg>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-visual">
            <svg viewBox="0 0 120 80">
              <rect x="10" y="20" width="30" height="40" rx="3" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/>
              <rect x="45" y="15" width="30" height="50" rx="3" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
              <rect x="80" y="25" width="30" height="35" rx="3" fill="#fce7f3" stroke="#ec4899" stroke-width="2"/>
              <path d="M60 0 L60 10 M55 5 L60 10 L65 5" stroke="#64748b" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <h3>Deliver</h3>
          <p>Intelligence flows to the right teams via dashboards, email digests, watch list alerts, and workflow integrations—ready to act upon immediately.</p>
        </div>
      </div>
    </section>
  `;
}

function getTestimonialsSection() {
  return `
    <section class="section testimonials-section" id="testimonials">
      <div class="section-header">
        <div class="section-eyebrow">What Clients Say</div>
        <h2>Trusted by compliance professionals</h2>
      </div>

      <div class="testimonials-grid">
        <div class="testimonial-card">
          <div class="testimonial-quote">
            "RegCanary has transformed how we track regulatory change. What used to take our team hours each morning now arrives in our inbox, summarized and prioritized."
          </div>
          <div class="testimonial-author">
            <div class="author-avatar">SD</div>
            <div class="author-info">
              <strong>Sarah Davies</strong>
              <span>Head of Compliance, UK Asset Manager</span>
            </div>
          </div>
        </div>

        <div class="testimonial-card">
          <div class="testimonial-quote">
            "The AI summaries are genuinely useful—they capture the business impact we need for board reporting, not just regulatory jargon."
          </div>
          <div class="testimonial-author">
            <div class="author-avatar">MK</div>
            <div class="author-info">
              <strong>Michael Kowalski</strong>
              <span>Chief Risk Officer, Payments Firm</span>
            </div>
          </div>
        </div>

        <div class="testimonial-card">
          <div class="testimonial-quote">
            "Finally, a tool that understands fintech. We get the FCA updates we need without drowning in pension fund regulations."
          </div>
          <div class="testimonial-author">
            <div class="author-avatar">JL</div>
            <div class="author-info">
              <strong>Jennifer Liu</strong>
              <span>Regulatory Affairs Lead, Digital Bank</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function getPricingSection() {
  return `
    <section class="section pricing-section" id="pricing">
      <div class="section-header">
        <div class="section-eyebrow">Pricing</div>
        <h2>Plans that scale with your needs</h2>
        <p class="section-subtitle">Every plan includes full AI analysis, daily digests, and unlimited users.</p>
      </div>

      <div class="pricing-grid">
        <div class="price-card">
          <div class="price-header">
            <h4>Foundation</h4>
            <p class="price-desc">For focused UK compliance teams</p>
          </div>
          <div class="price-amount">
            <span class="currency">&pound;</span>
            <span class="amount">Contact Us</span>
          </div>
          <ul class="price-features">
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>UK regulators (FCA, PRA, PSR, BoE)</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>AI-powered summaries</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Daily email digests</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Watch lists & alerts</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Regulatory calendar</li>
          </ul>
          <a class="btn ghost full-width" href="#demo">Request Pricing</a>
        </div>

        <div class="price-card featured">
          <div class="price-badge">Most Popular</div>
          <div class="price-header">
            <h4>Momentum</h4>
            <p class="price-desc">For international compliance teams</p>
          </div>
          <div class="price-amount">
            <span class="currency">&pound;</span>
            <span class="amount">Contact Us</span>
          </div>
          <ul class="price-features">
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Everything in Foundation</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>European & APAC regulators</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Global bodies (FATF, BIS, IOSCO)</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Enforcement analytics</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Team workflows (Kanban)</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Priority support</li>
          </ul>
          <a class="btn primary full-width" href="#demo">Get a Proposal</a>
        </div>

        <div class="price-card">
          <div class="price-header">
            <h4>Enterprise</h4>
            <p class="price-desc">For global institutions</p>
          </div>
          <div class="price-amount">
            <span class="currency">&pound;</span>
            <span class="amount">Contact Us</span>
          </div>
          <ul class="price-features">
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Everything in Momentum</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Full global coverage (120+ regulators)</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Custom regulator feeds</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>API access</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>SSO / SAML integration</li>
            <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Dedicated success manager</li>
          </ul>
          <a class="btn ghost full-width" href="#demo">Talk to Sales</a>
        </div>
      </div>
    </section>
  `;
}

function getFaqSection() {
  return `
    <section class="section faq-section" id="faq">
      <div class="section-header">
        <div class="section-eyebrow">FAQ</div>
        <h2>Common questions</h2>
      </div>

      <div class="faq-grid">
        <div class="faq-item">
          <h4>How does RegCanary source its data?</h4>
          <p>We monitor official regulator websites, RSS feeds, press release pages, and publication portals using a combination of automated scrapers and RSS integrations. Data is refreshed multiple times per day.</p>
        </div>
        <div class="faq-item">
          <h4>How accurate is the AI analysis?</h4>
          <p>Our AI summaries are designed to support, not replace, human judgment. Every summary links to the original source so your team can verify and dive deeper as needed.</p>
        </div>
        <div class="faq-item">
          <h4>Can I add custom regulators?</h4>
          <p>Enterprise plans include custom regulator feeds. Contact our team to discuss specific regulatory sources you need monitored.</p>
        </div>
        <div class="faq-item">
          <h4>How many users can access the platform?</h4>
          <p>All plans include unlimited users. We believe compliance intelligence should flow freely within your organization.</p>
        </div>
        <div class="faq-item">
          <h4>Is there an API?</h4>
          <p>Yes, Enterprise plans include full API access to integrate RegCanary data into your existing compliance systems and workflows.</p>
        </div>
        <div class="faq-item">
          <h4>What security certifications do you have?</h4>
          <p>We take security seriously. Contact us to discuss our security practices, data handling, and compliance with your firm's vendor requirements.</p>
        </div>
      </div>
    </section>
  `;
}

function getCtaSection() {
  return `
    <section class="cta-band">
      <div class="cta-content">
        <div class="cta-canary">
          ${getCtaCanarySvg()}
        </div>
        <div class="cta-text">
          <h2>Ready to fly ahead of regulatory change?</h2>
          <p>Book a 20-minute demo and see how RegCanary delivers intelligence your team can act on—starting day one.</p>
        </div>
        <div class="cta-actions">
          <a class="btn primary large" href="#demo">Book Your Demo</a>
          <a class="btn ghost large" href="/publications">Browse Latest Briefings</a>
        </div>
      </div>
    </section>
  `;
}


module.exports = {
  getProblemSection,
  getFeaturesSection,
  getCoverageSection,
  getHowItWorksSection,
  getTestimonialsSection,
  getPricingSection,
  getFaqSection,
  getCtaSection
};
