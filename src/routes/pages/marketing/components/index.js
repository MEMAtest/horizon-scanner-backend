// Marketing page template - modular components
const { getMarketingStyles } = require('../styles/index.js');
const { getFlyingCanarySvg, getPostboxSvg, getPerchedCanarySvg, getBrandCanarySvg, getCtaCanarySvg } = require('./svg-assets.js');
const { getDashboardMockup, getFloatingCards } = require('./dashboard-mockup.js');
const {
  getProblemSection,
  getFeaturesSection,
  getCoverageSection,
  getHowItWorksSection,
  getTestimonialsSection,
  getPricingSection,
  getFaqSection,
  getCtaSection
} = require('./sections.js');
const { getFooter } = require('./footer.js');
const { getFeatureModal } = require('./modal.js');
const { getMarketingScripts } = require('./scripts.js');

function renderMarketingPage() {
  const styles = getMarketingStyles();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>RegCanary | Regulatory Intelligence Platform for Financial Services</title>
      <meta name="description" content="RegCanary delivers AI-powered regulatory intelligence to compliance teams worldwide. Monitor 120+ regulators, get instant impact analysis, and streamline regulatory change management." />
      ${styles}
    </head>
    <body>
      <div class="marketing-shell">

        <!-- Premium Flying Canary with Landing Animation -->
        ${getFlyingCanarySvg()}

        <!-- Hero Section -->
        ${getHeroSection()}

        <!-- Problem/Solution Section -->
        ${getProblemSection()}

        <!-- Features Section -->
        ${getFeaturesSection()}

        <!-- Coverage Section -->
        ${getCoverageSection()}

        <!-- How It Works -->
        ${getHowItWorksSection()}

        <!-- Testimonials Section -->
        ${getTestimonialsSection()}

        <!-- Pricing Section -->
        ${getPricingSection()}

        <!-- FAQ Section -->
        ${getFaqSection()}

        <!-- Final CTA -->
        ${getCtaSection()}

        <!-- Feature Modal -->
        ${getFeatureModal()}

        ${getFooter()}
      </div>

      ${getMarketingScripts()}
    </body>
    </html>
  `;
}

function getHeroSection() {
  return `
    <header class="hero" id="top">
      <div class="hero-bg-elements">
        <div class="hero-gradient-orb orb-1"></div>
        <div class="hero-gradient-orb orb-2"></div>
        <div class="hero-gradient-orb orb-3"></div>
        <svg class="flight-path" viewBox="0 0 1400 400" aria-hidden="true">
          <path class="flight-line" d="M-50,320 C150,200 350,280 550,150 C750,20 950,180 1150,80 C1350,10 1450,100 1500,60" fill="none" stroke="url(#pathGradient)" stroke-width="3" stroke-dasharray="12 8" opacity="0.4"/>
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#f5c542"/>
              <stop offset="50%" style="stop-color:#2563eb"/>
              <stop offset="100%" style="stop-color:#f5c542"/>
            </linearGradient>
          </defs>
          <circle cx="550" cy="150" r="6" fill="#f5c542" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="1150" cy="80" r="8" fill="#2563eb" opacity="0.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>

      <nav class="nav">
        <div class="brand">
          <div class="brand-badge">
            ${getBrandCanarySvg()}
          </div>
          <span>RegCanary</span>
        </div>
        <div class="nav-links">
          <a href="#features">Features</a>
          <a href="#coverage">Coverage</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div class="nav-cta">
          <a class="btn ghost" href="/login">Sign in</a>
          <a class="btn primary" href="#demo">Book Demo</a>
        </div>
      </nav>

      <div class="hero-grid">
        <div class="hero-copy">
          <div class="eyebrow">
            <span class="pulse-dot"></span>
            Regulatory Intelligence Platform
          </div>
          <h1>Your early warning system for regulatory change</h1>
          <p class="lead">RegCanary monitors 120+ global regulators 24/7, translates complex updates into actionable intelligence, and delivers them to your team before they become risks.</p>

          <div class="hero-actions">
            <a class="btn primary large" href="#demo" id="demo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/></svg>
              Book a Demo
            </a>
            <a class="btn ghost large" href="/ai-intelligence">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              See Live Dashboard
            </a>
          </div>

          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">120+</span>
              <span class="stat-label">Global Regulators</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">24/7</span>
              <span class="stat-label">Continuous Monitoring</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">&lt;1hr</span>
              <span class="stat-label">Update Delivery</span>
            </div>
          </div>
        </div>

        <div class="hero-media">
          <!-- Gold British Pillar Box (RegCanary Postbox) -->
          ${getPostboxSvg()}

          <!-- Perched Canary on Pillar Box -->
          ${getPerchedCanarySvg()}

          <div class="dashboard-preview">
            <div class="preview-header">
              <div class="preview-dots">
                <span></span><span></span><span></span>
              </div>
              <span class="preview-title">RegCanary Intelligence Dashboard</span>
            </div>
            <div class="preview-content">
              <!-- Realistic Dashboard Mockup -->
              ${getDashboardMockup()}
            </div>
          </div>

          <!-- Floating notification cards around dashboard -->
          ${getFloatingCards()}

        </div>
      </div>

      <div class="hero-logos">
        <span class="logos-label">Trusted by compliance teams at</span>
        <div class="logos-row">
          <div class="logo-item">Asset Managers</div>
          <div class="logo-item">Payments Firms</div>
          <div class="logo-item">Banks</div>
          <div class="logo-item">Fintechs</div>
          <div class="logo-item">Wealth Managers</div>
        </div>
      </div>
    </header>
  `;
}

module.exports = {
  renderMarketingPage,
  getFlyingCanarySvg,
  getPostboxSvg,
  getPerchedCanarySvg,
  getBrandCanarySvg,
  getCtaCanarySvg,
  getDashboardMockup,
  getFloatingCards,
  getProblemSection,
  getFeaturesSection,
  getCoverageSection,
  getHowItWorksSection,
  getTestimonialsSection,
  getPricingSection,
  getFaqSection,
  getCtaSection,
  getFooter,
  getFeatureModal,
  getMarketingScripts
};
