const { getMarketingStyles } = require('./styles')

function renderMarketingPage() {
  const styles = getMarketingStyles()

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
        <div class="flying-canary-container" aria-hidden="true">
          <svg class="flying-canary" viewBox="0 0 100 80">
            <defs>
              <linearGradient id="canaryBodyGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FFF176"/>
                <stop offset="30%" style="stop-color:#FFE066"/>
                <stop offset="70%" style="stop-color:#FFD93D"/>
                <stop offset="100%" style="stop-color:#F4C430"/>
              </linearGradient>
              <linearGradient id="canaryWingOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FFCC80"/>
                <stop offset="50%" style="stop-color:#FFB347"/>
                <stop offset="100%" style="stop-color:#FF9800"/>
              </linearGradient>
              <linearGradient id="canaryBelly" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#FFFDE7"/>
                <stop offset="100%" style="stop-color:#FFF9C4"/>
              </linearGradient>
              <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
              <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>
              </filter>
            </defs>

            <!-- Sparkle trail -->
            <g class="sparkle-trail">
              <circle class="sparkle s1" cx="5" cy="40" r="2" fill="#FFE066"/>
              <circle class="sparkle s2" cx="15" cy="38" r="1.5" fill="#FFF176"/>
              <circle class="sparkle s3" cx="10" cy="44" r="1" fill="#FFCC80"/>
              <circle class="sparkle s4" cx="20" cy="42" r="1.8" fill="#FFD93D"/>
            </g>

            <!-- Main canary group -->
            <g class="canary-body-group" filter="url(#dropShadow)">
              <!-- Tail feathers - detailed -->
              <g class="tail-feathers">
                <ellipse cx="35" cy="52" rx="4" ry="12" fill="url(#canaryWingOrange)" transform="rotate(-15 35 52)"/>
                <ellipse cx="40" cy="54" rx="3" ry="14" fill="url(#canaryWingOrange)" transform="rotate(-5 40 54)"/>
                <ellipse cx="45" cy="52" rx="4" ry="12" fill="url(#canaryWingOrange)" transform="rotate(15 45 52)"/>
              </g>

              <!-- Body -->
              <ellipse cx="50" cy="42" rx="16" ry="12" fill="url(#canaryBodyGold)"/>
              <!-- Belly highlight -->
              <ellipse cx="50" cy="45" rx="10" ry="7" fill="url(#canaryBelly)" opacity="0.7"/>

              <!-- Left Wing -->
              <g class="wing wing-left">
                <ellipse cx="36" cy="36" rx="14" ry="8" fill="url(#canaryWingOrange)" transform="rotate(-25 36 36)"/>
                <ellipse cx="34" cy="32" rx="10" ry="5" fill="#FFE082" opacity="0.5" transform="rotate(-30 34 32)"/>
                <!-- Wing feather details -->
                <path d="M28 30 Q24 26 22 32" stroke="#E6A500" stroke-width="0.8" fill="none" opacity="0.6"/>
                <path d="M30 34 Q26 30 24 36" stroke="#E6A500" stroke-width="0.8" fill="none" opacity="0.6"/>
              </g>

              <!-- Right Wing -->
              <g class="wing wing-right">
                <ellipse cx="64" cy="36" rx="14" ry="8" fill="url(#canaryWingOrange)" transform="rotate(25 64 36)"/>
                <ellipse cx="66" cy="32" rx="10" ry="5" fill="#FFE082" opacity="0.5" transform="rotate(30 66 32)"/>
                <!-- Wing feather details -->
                <path d="M72 30 Q76 26 78 32" stroke="#E6A500" stroke-width="0.8" fill="none" opacity="0.6"/>
                <path d="M70 34 Q74 30 76 36" stroke="#E6A500" stroke-width="0.8" fill="none" opacity="0.6"/>
              </g>

              <!-- Head -->
              <circle cx="50" cy="24" r="12" fill="url(#canaryBodyGold)"/>
              <!-- Cheek blush -->
              <circle cx="42" cy="26" r="3" fill="#FFAB91" opacity="0.3"/>
              <circle cx="58" cy="26" r="3" fill="#FFAB91" opacity="0.3"/>

              <!-- Eyes - more expressive -->
              <g class="eyes">
                <ellipse cx="45" cy="22" rx="3.5" ry="4" fill="white"/>
                <ellipse cx="45" cy="22" rx="2.2" ry="2.5" fill="#1a1a2e"/>
                <circle cx="44" cy="21" r="1" fill="white"/>
                <ellipse cx="55" cy="22" rx="3.5" ry="4" fill="white"/>
                <ellipse cx="55" cy="22" rx="2.2" ry="2.5" fill="#1a1a2e"/>
                <circle cx="54" cy="21" r="1" fill="white"/>
              </g>

              <!-- Beak - more detailed -->
              <g class="beak">
                <path d="M50 28 L60 32 L50 36 L50 32 Z" fill="#FF8F00"/>
                <path d="M50 28 L60 32 L50 32 Z" fill="#FFB300"/>
                <path d="M50 32 L58 32 L50 34 Z" fill="#E65100"/>
              </g>

              <!-- Crest/Crown feathers -->
              <g class="crest">
                <path d="M42 12 Q38 4 44 8" fill="url(#canaryWingOrange)"/>
                <path d="M46 10 Q44 2 50 6" fill="url(#canaryWingOrange)"/>
                <path d="M50 9 Q50 0 54 5" fill="url(#canaryWingOrange)"/>
                <path d="M54 10 Q56 2 58 8" fill="url(#canaryWingOrange)"/>
              </g>

              <!-- Feet (visible when landing) -->
              <g class="feet">
                <path d="M45 54 L45 60 M43 60 L47 60 M44 58 L43 62 M46 58 L47 62" stroke="#FF8F00" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                <path d="M55 54 L55 60 M53 60 L57 60 M54 58 L53 62 M56 58 L57 62" stroke="#FF8F00" stroke-width="1.5" stroke-linecap="round" fill="none"/>
              </g>

              <!-- Letter/envelope carried in feet -->
              <g class="carried-letter">
                <rect x="42" y="62" width="16" height="11" rx="1" fill="#fff" stroke="#2563eb" stroke-width="1"/>
                <path d="M42 62 L50 68 L58 62" fill="none" stroke="#2563eb" stroke-width="1"/>
                <rect x="44" y="64" width="5" height="2" rx="0.5" fill="#dbeafe"/>
                <rect x="44" y="67" width="8" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="44" y="69" width="6" height="1" rx="0.5" fill="#e2e8f0"/>
              </g>
            </g>
          </svg>
        </div>

        <!-- Hero Section -->
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
                <svg viewBox="0 0 40 40" class="brand-canary">
                  <ellipse cx="20" cy="24" rx="8" ry="6" fill="#FFD93D"/>
                  <circle cx="20" cy="14" r="7" fill="#FFD93D"/>
                  <polygon points="20,16 25,18 20,20" fill="#FF6B00"/>
                  <circle cx="17" cy="12" r="1.5" fill="#1a1a2e"/>
                  <circle cx="23" cy="12" r="1.5" fill="#1a1a2e"/>
                  <path d="M16 7 Q14 3 17 5 Q18 2 20 4 Q22 2 23 5 Q26 3 24 7" fill="#FFB347"/>
                </svg>
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
              <div class="reg-postbox-container">
                <svg class="reg-pillar-box" viewBox="0 0 60 100">
                  <defs>
                    <linearGradient id="pillarGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#FFE066"/>
                      <stop offset="30%" style="stop-color:#F4C430"/>
                      <stop offset="70%" style="stop-color:#E6A500"/>
                      <stop offset="100%" style="stop-color:#D4940A"/>
                    </linearGradient>
                    <linearGradient id="pillarHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#FFE066;stop-opacity:0.8"/>
                      <stop offset="50%" style="stop-color:#FFF9C4;stop-opacity:0.9"/>
                      <stop offset="100%" style="stop-color:#FFE066;stop-opacity:0.8"/>
                    </linearGradient>
                  </defs>

                  <!-- Domed top (for canary to perch on) -->
                  <ellipse cx="30" cy="14" rx="22" ry="8" fill="url(#pillarGold)"/>
                  <ellipse cx="30" cy="12" rx="18" ry="5" fill="url(#pillarHighlight)" opacity="0.6"/>

                  <!-- Main cylindrical body -->
                  <rect x="8" y="14" width="44" height="65" rx="3" fill="url(#pillarGold)"/>

                  <!-- Body highlight (3D effect) -->
                  <rect x="12" y="16" width="8" height="60" rx="2" fill="url(#pillarHighlight)" opacity="0.4"/>

                  <!-- Letter slot -->
                  <rect x="14" y="28" width="32" height="8" rx="2" fill="#1a1a2e"/>
                  <rect x="16" y="30" width="28" height="4" rx="1" fill="#0f172a"/>

                  <!-- Royal-style emblem area -->
                  <circle cx="30" cy="52" r="14" fill="#FFE066" stroke="#D4940A" stroke-width="1.5"/>
                  <circle cx="30" cy="52" r="11" fill="none" stroke="#E6A500" stroke-width="1"/>
                  <text x="30" y="49" text-anchor="middle" font-size="6" font-weight="bold" fill="#1a1a2e" font-family="sans-serif">REG</text>
                  <text x="30" y="57" text-anchor="middle" font-size="5" fill="#1a1a2e" font-family="sans-serif">CANARY</text>

                  <!-- Decorative bands -->
                  <rect x="8" y="70" width="44" height="3" fill="#D4940A"/>
                  <rect x="8" y="22" width="44" height="2" fill="#D4940A"/>

                  <!-- Base -->
                  <rect x="4" y="79" width="52" height="14" rx="2" fill="#D4940A"/>
                  <rect x="6" y="81" width="48" height="4" fill="#FFE066" opacity="0.4"/>
                  <rect x="4" y="91" width="52" height="4" rx="1" fill="#B8860B"/>
                </svg>

                <!-- Dropping letter animation -->
                <svg class="dropping-letter" viewBox="0 0 24 16">
                  <rect x="2" y="2" width="20" height="12" rx="1" fill="#fff" stroke="#2563eb" stroke-width="1.5"/>
                  <path d="M2 2 L12 9 L22 2" fill="none" stroke="#2563eb" stroke-width="1.5"/>
                  <rect x="5" y="4" width="6" height="2" rx="0.5" fill="#dbeafe"/>
                </svg>
              </div>

              <!-- Perched Canary on Pillar Box -->
              <div class="perched-canary-container" aria-hidden="true">
                <svg class="perched-canary" viewBox="0 0 60 50">
                  <defs>
                    <linearGradient id="postboxCanaryGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#FFF176"/>
                      <stop offset="50%" style="stop-color:#FFD93D"/>
                      <stop offset="100%" style="stop-color:#F4C430"/>
                    </linearGradient>
                    <linearGradient id="postboxWingOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#FFCC80"/>
                      <stop offset="100%" style="stop-color:#FF9800"/>
                    </linearGradient>
                  </defs>

                  <!-- Canary body - proud perched pose -->
                  <g class="perched-bird">
                    <!-- Tail -->
                    <ellipse cx="18" cy="38" rx="4" ry="8" fill="url(#postboxWingOrange)" transform="rotate(-25 18 38)"/>
                    <ellipse cx="22" cy="40" rx="3" ry="9" fill="url(#postboxWingOrange)" transform="rotate(-15 22 40)"/>

                    <!-- Body -->
                    <ellipse cx="30" cy="32" rx="12" ry="9" fill="url(#postboxCanaryGold)"/>
                    <ellipse cx="30" cy="34" rx="7" ry="5" fill="#FFFDE7" opacity="0.6"/>

                    <!-- Wings folded -->
                    <ellipse cx="22" cy="30" rx="6" ry="8" fill="url(#postboxWingOrange)" transform="rotate(-10 22 30)"/>
                    <ellipse cx="38" cy="30" rx="6" ry="8" fill="url(#postboxWingOrange)" transform="rotate(10 38 30)"/>

                    <!-- Head -->
                    <circle cx="30" cy="18" r="9" fill="url(#postboxCanaryGold)"/>

                    <!-- Eyes - alert, proud -->
                    <ellipse cx="26" cy="16" rx="2.5" ry="3" fill="white"/>
                    <ellipse cx="26" cy="16" rx="1.5" ry="1.8" fill="#1a1a2e"/>
                    <circle cx="25.5" cy="15.5" r="0.6" fill="white"/>
                    <ellipse cx="34" cy="16" rx="2.5" ry="3" fill="white"/>
                    <ellipse cx="34" cy="16" rx="1.5" ry="1.8" fill="#1a1a2e"/>
                    <circle cx="33.5" cy="15.5" r="0.6" fill="white"/>

                    <!-- Beak - slightly upward (proud pose) -->
                    <path d="M30 20 L40 22 L30 25 Z" fill="#FF8F00"/>
                    <path d="M30 20 L40 22 L30 22 Z" fill="#FFB300"/>

                    <!-- Crest -->
                    <path d="M24 9 Q20 3 26 6 Q28 1 30 5 Q32 1 34 6 Q40 3 36 9" fill="url(#postboxWingOrange)"/>

                    <!-- Feet gripping dome -->
                    <path d="M26 41 L26 48 M24 46 L28 46" stroke="#FF8F00" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                    <path d="M34 41 L34 48 M32 46 L36 46" stroke="#FF8F00" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                  </g>
                </svg>
              </div>

              <div class="dashboard-preview">
                <div class="preview-header">
                  <div class="preview-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <span class="preview-title">RegCanary Intelligence Dashboard</span>
                </div>
                <div class="preview-content">
                  <!-- Realistic Dashboard Mockup -->
                  <div class="dashboard-mockup">
                    <!-- Sidebar with tooltips -->
                    <div class="mock-sidebar">
                      <div class="mock-logo">
                        <div class="mock-canary-icon"></div>
                      </div>
                      <div class="mock-nav-item active" data-tooltip="Dashboard">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      </div>
                      <div class="mock-nav-item" data-tooltip="Updates">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div class="mock-nav-item" data-tooltip="Calendar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                      <div class="mock-nav-item" data-tooltip="Analytics">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                      </div>
                      <div class="mock-nav-item" data-tooltip="Settings">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      </div>
                    </div>

                    <!-- Main content area -->
                    <div class="mock-main">
                      <!-- Header -->
                      <div class="mock-header">
                        <div class="mock-title"></div>
                        <div class="mock-search"></div>
                        <div class="mock-avatar"></div>
                      </div>

                      <!-- Stats row with labels -->
                      <div class="mock-stats-row">
                        <div class="mock-stat-card">
                          <div class="mock-stat-icon blue">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                          </div>
                          <div class="mock-stat-content">
                            <div class="mock-stat-number">47</div>
                            <div class="mock-stat-label">New Updates</div>
                          </div>
                        </div>
                        <div class="mock-stat-card">
                          <div class="mock-stat-icon yellow">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                          </div>
                          <div class="mock-stat-content">
                            <div class="mock-stat-number">12</div>
                            <div class="mock-stat-label">High Priority</div>
                          </div>
                        </div>
                        <div class="mock-stat-card">
                          <div class="mock-stat-icon green">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                          </div>
                          <div class="mock-stat-content">
                            <div class="mock-stat-number">8</div>
                            <div class="mock-stat-label">Deadlines</div>
                          </div>
                        </div>
                      </div>

                      <!-- Charts row -->
                      <div class="mock-charts-row">
                        <!-- Bar chart - Updates by Regulator -->
                        <div class="mock-chart bar-chart">
                          <div class="chart-title">By Regulator</div>
                          <div class="chart-bars">
                            <div class="bar-row"><span class="bar-label">FCA</span><div class="bar-track"><div class="bar-fill fca" style="width:80%"></div></div><span class="bar-value">18</span></div>
                            <div class="bar-row"><span class="bar-label">PRA</span><div class="bar-track"><div class="bar-fill pra" style="width:55%"></div></div><span class="bar-value">12</span></div>
                            <div class="bar-row"><span class="bar-label">EBA</span><div class="bar-track"><div class="bar-fill eba" style="width:40%"></div></div><span class="bar-value">9</span></div>
                            <div class="bar-row"><span class="bar-label">Other</span><div class="bar-track"><div class="bar-fill other" style="width:35%"></div></div><span class="bar-value">8</span></div>
                          </div>
                        </div>
                        <!-- Donut chart - Impact Distribution -->
                        <div class="mock-chart donut-chart">
                          <div class="chart-title">Impact</div>
                          <svg class="donut" viewBox="0 0 42 42">
                            <circle class="donut-ring" cx="21" cy="21" r="15.9" fill="transparent" stroke="#e2e8f0" stroke-width="4"/>
                            <circle class="donut-segment high" cx="21" cy="21" r="15.9" fill="transparent" stroke="#ef4444" stroke-width="4" stroke-dasharray="25 75" stroke-dashoffset="25"/>
                            <circle class="donut-segment medium" cx="21" cy="21" r="15.9" fill="transparent" stroke="#f59e0b" stroke-width="4" stroke-dasharray="45 55" stroke-dashoffset="0"/>
                            <circle class="donut-segment low" cx="21" cy="21" r="15.9" fill="transparent" stroke="#22c55e" stroke-width="4" stroke-dasharray="30 70" stroke-dashoffset="-45"/>
                          </svg>
                          <div class="donut-legend">
                            <span class="legend-item high-legend">25%</span>
                            <span class="legend-item med-legend">45%</span>
                            <span class="legend-item low-legend">30%</span>
                          </div>
                        </div>
                      </div>

                      <!-- Updates feed - 3 visible, cycling through 6 -->
                      <div class="mock-updates">
                        <div class="mock-section-label">Latest Updates</div>
                        <div class="mock-updates-track">
                          <div class="mock-update-item update-1">
                            <div class="mock-update-badge high"></div>
                            <div class="mock-update-content">
                              <div class="mock-update-title">Consumer Duty: Board reporting</div>
                              <div class="mock-update-meta">
                                <span class="mock-tag">FCA</span>
                                <span class="mock-time">2h</span>
                              </div>
                            </div>
                            <div class="mock-update-actions">
                              <button class="mock-bookmark" title="Bookmark"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
                              <button class="mock-share" title="Share"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
                            </div>
                          </div>
                          <div class="mock-update-item update-2">
                            <div class="mock-update-badge medium"></div>
                            <div class="mock-update-content">
                              <div class="mock-update-title">Capital buffer requirements</div>
                              <div class="mock-update-meta">
                                <span class="mock-tag">PRA</span>
                                <span class="mock-time">4h</span>
                              </div>
                            </div>
                            <div class="mock-update-actions">
                              <button class="mock-bookmark" title="Bookmark"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
                              <button class="mock-share" title="Share"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
                            </div>
                          </div>
                          <div class="mock-update-item update-3">
                            <div class="mock-update-badge low"></div>
                            <div class="mock-update-content">
                              <div class="mock-update-title">Loan origination guidelines</div>
                              <div class="mock-update-meta">
                                <span class="mock-tag">EBA</span>
                                <span class="mock-time">6h</span>
                              </div>
                            </div>
                            <div class="mock-update-actions">
                              <button class="mock-bookmark" title="Bookmark"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
                              <button class="mock-share" title="Share"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
                            </div>
                          </div>
                          <div class="mock-update-item update-4">
                            <div class="mock-update-badge high"></div>
                            <div class="mock-update-content">
                              <div class="mock-update-title">MiFID II reporting updates</div>
                              <div class="mock-update-meta">
                                <span class="mock-tag">ESMA</span>
                                <span class="mock-time">8h</span>
                              </div>
                            </div>
                            <div class="mock-update-actions">
                              <button class="mock-bookmark" title="Bookmark"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
                              <button class="mock-share" title="Share"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
                            </div>
                          </div>
                          <div class="mock-update-item update-5">
                            <div class="mock-update-badge medium"></div>
                            <div class="mock-update-content">
                              <div class="mock-update-title">Climate disclosure rules</div>
                              <div class="mock-update-meta">
                                <span class="mock-tag">SEC</span>
                                <span class="mock-time">12h</span>
                              </div>
                            </div>
                            <div class="mock-update-actions">
                              <button class="mock-bookmark" title="Bookmark"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
                              <button class="mock-share" title="Share"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
                            </div>
                          </div>
                          <div class="mock-update-item update-6">
                            <div class="mock-update-badge low"></div>
                            <div class="mock-update-content">
                              <div class="mock-update-title">Digital asset framework</div>
                              <div class="mock-update-meta">
                                <span class="mock-tag">MAS</span>
                                <span class="mock-time">1d</span>
                              </div>
                            </div>
                            <div class="mock-update-actions">
                              <button class="mock-bookmark" title="Bookmark"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
                              <button class="mock-share" title="Share"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Right panel with visible content -->
                    <div class="mock-right-panel">
                      <div class="mock-panel-title">Upcoming</div>
                      <div class="mock-calendar">
                        <div class="mock-cal-header">Jan 2025</div>
                        <div class="mock-cal-grid">
                          <div class="mock-cal-day">6</div>
                          <div class="mock-cal-day">7</div>
                          <div class="mock-cal-day deadline">8<span class="cal-dot red"></span></div>
                          <div class="mock-cal-day">9</div>
                          <div class="mock-cal-day deadline">10<span class="cal-dot yellow"></span></div>
                          <div class="mock-cal-day">11</div>
                          <div class="mock-cal-day deadline">12<span class="cal-dot green"></span></div>
                        </div>
                      </div>
                      <div class="mock-ai-summary">
                        <div class="mock-ai-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                        </div>
                        <div class="mock-ai-content">
                          <div class="mock-ai-text">3 high-impact updates need attention</div>
                          <div class="mock-ai-link">View summary</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Floating notification cards around dashboard -->
              <div class="floating-card alert-card">
                <div class="card-icon alert-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div class="card-content">
                  <strong>High Impact Alert</strong>
                  <span>FCA Consumer Duty deadline</span>
                </div>
              </div>

              <div class="floating-card delivery-card">
                <div class="card-icon delivery-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div class="card-content">
                  <strong>Intelligence Delivered</strong>
                  <span>15 updates tagged for you</span>
                </div>
              </div>

              <div class="floating-card ai-card">
                <div class="card-icon ai-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                </div>
                <div class="card-content">
                  <strong>AI Analysis Complete</strong>
                  <span>Impact: Significant</span>
                </div>
              </div>

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

        <!-- Problem/Solution Section -->
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

        <!-- Features Section -->
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
              <h3>Watch Lists</h3>
              <p>Create custom filters by authority, topic, or sector. Get notified only about what matters to your firm.</p>
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

        <!-- Coverage Section -->
        <section class="section coverage-section" id="coverage">
          <div class="section-header">
            <div class="section-eyebrow">Global Coverage</div>
            <h2>One platform. Every regulator that matters.</h2>
            <p class="section-subtitle">From the FCA to FATF, from MAS to SEC—RegCanary speaks the language of global compliance.</p>
          </div>

          <div class="coverage-content">
            <!-- Animated counter stats -->
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

            <!-- Summary banner -->
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

        <!-- How It Works -->
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

        <!-- Testimonials Section -->
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

        <!-- Pricing Section -->
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
                <span class="currency">£</span>
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
                <span class="currency">£</span>
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
                <span class="currency">£</span>
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

        <!-- FAQ Section -->
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

        <!-- Final CTA -->
        <section class="cta-band">
          <div class="cta-content">
            <div class="cta-canary">
              <svg viewBox="0 0 60 60" class="cta-canary-svg">
                <ellipse cx="30" cy="38" rx="14" ry="10" fill="#FFD93D"/>
                <circle cx="30" cy="22" r="12" fill="#FFD93D"/>
                <polygon points="30,26 40,30 30,34" fill="#FF6B00"/>
                <circle cx="25" cy="19" r="2.5" fill="white"/>
                <circle cx="25" cy="19" r="1.5" fill="#1a1a2e"/>
                <circle cx="35" cy="19" r="2.5" fill="white"/>
                <circle cx="35" cy="19" r="1.5" fill="#1a1a2e"/>
                <path d="M22 10 Q18 4 23 7 Q25 2 30 6 Q35 2 37 7 Q42 4 38 10" fill="#FFB347"/>
                <ellipse cx="18" cy="32" rx="8" ry="5" fill="#FFB347" transform="rotate(-20 18 32)"/>
                <ellipse cx="42" cy="32" rx="8" ry="5" fill="#FFB347" transform="rotate(20 42 32)"/>
              </svg>
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

        <!-- Feature Modal -->
        <div class="feature-modal-overlay" id="featureModal">
          <div class="feature-modal">
            <button class="modal-close" aria-label="Close modal">&times;</button>
            <div class="modal-header">
              <div class="modal-icon" id="modalIcon"></div>
              <h3 id="modalTitle">Feature Title</h3>
            </div>
            <div class="modal-demo" id="modalDemo"></div>
            <div class="modal-benefits">
              <h4>Key Benefits</h4>
              <ul id="modalBenefits"></ul>
            </div>
            <a class="btn primary" href="#demo">Book a Demo</a>
          </div>
        </div>

        <footer class="footer">
          <div class="footer-content">
            <div class="footer-brand">
              <div class="brand">
                <div class="brand-badge small">
                  <svg viewBox="0 0 40 40">
                    <ellipse cx="20" cy="24" rx="8" ry="6" fill="#FFD93D"/>
                    <circle cx="20" cy="14" r="7" fill="#FFD93D"/>
                    <polygon points="20,16 25,18 20,20" fill="#FF6B00"/>
                  </svg>
                </div>
                <span>RegCanary</span>
              </div>
              <p class="footer-tagline">Regulatory intelligence in motion.</p>
            </div>
            <div class="footer-links">
              <div class="footer-col">
                <h5>Platform</h5>
                <a href="#features">Features</a>
                <a href="#coverage">Coverage</a>
                <a href="#pricing">Pricing</a>
              </div>
              <div class="footer-col">
                <h5>Resources</h5>
                <a href="/publications">Weekly Briefings</a>
                <a href="/ai-intelligence">Live Dashboard</a>
                <a href="#faq">FAQ</a>
              </div>
              <div class="footer-col">
                <h5>Company</h5>
                <a href="mailto:hello@regcanary.com">Contact</a>
                <a href="/login">Sign In</a>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <span>&copy; ${new Date().getFullYear()} RegCanary. Built for compliance teams.</span>
          </div>
        </footer>
      </div>

      <script>
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
          anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
              e.preventDefault();
              const target = document.querySelector(href);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          });
        });

        // Intersection Observer for fade-in animations
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        }, observerOptions);

        document.querySelectorAll('.feature-card, .step-card, .testimonial-card, .price-card, .problem-card, .faq-item').forEach(el => {
          el.classList.add('fade-in-up');
          observer.observe(el);
        });

        // Feature Modal Data
        const featureData = {
          'horizon-scanning': {
            title: '24/7 Horizon Scanning',
            icon: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><circle cx="24" cy="24" r="12" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 2"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite"/></circle><circle cx="24" cy="24" r="4" fill="#2563eb"/><line x1="24" y1="24" x2="36" y2="18" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="4s" repeatCount="indefinite"/></line></svg>',
            demo: '<div class="demo-scanning"><div class="scan-radar"><div class="scan-line"></div><div class="scan-dot d1"></div><div class="scan-dot d2"></div><div class="scan-dot d3"></div></div><div class="scan-feed"><div class="scan-item"><span class="scan-reg">FCA</span><span class="scan-text">New guidance detected</span></div><div class="scan-item"><span class="scan-reg">PRA</span><span class="scan-text">Policy statement published</span></div><div class="scan-item"><span class="scan-reg">EBA</span><span class="scan-text">Consultation paper released</span></div></div></div>',
            benefits: [
              'Monitor 120+ regulators across UK, EU, APAC, and Americas',
              'Real-time RSS feeds and intelligent web scraping',
              'Automatic categorization by document type and topic',
              'Instant alerts when critical updates are detected',
              'Never miss a consultation deadline again'
            ]
          },
          'ai-summaries': {
            title: 'Intelligent AI Summaries',
            icon: '<svg viewBox="0 0 48 48"><rect x="8" y="12" width="32" height="24" rx="3" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/><path class="ai-typing" d="M14 20h20M14 26h14M14 32h18" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-dasharray="30" stroke-dashoffset="30"><animate attributeName="stroke-dashoffset" values="30;0" dur="1.5s" repeatCount="indefinite"/></path><circle cx="36" cy="10" r="6" fill="#2563eb"><animate attributeName="r" values="6;7;6" dur="1s" repeatCount="indefinite"/></circle><text x="36" y="13" text-anchor="middle" fill="white" font-size="8" font-weight="bold">AI</text></svg>',
            demo: '<div class="demo-ai"><div class="ai-input"><div class="ai-doc">50-page FCA guidance document</div><div class="ai-arrow">&#8594;</div></div><div class="ai-output"><div class="ai-summary-card"><div class="ai-badge high">High Impact</div><div class="ai-title">Consumer Duty Board Reporting</div><div class="ai-excerpt">Firms must demonstrate value assessments to boards quarterly. Key deadline: Q1 2025 implementation review.</div><div class="ai-sectors"><span>Retail Banking</span><span>Wealth Management</span></div></div></div></div>',
            benefits: [
              'Plain-English executive summaries in seconds',
              'Automatic impact scoring (High / Medium / Low)',
              'Sector relevance mapping to your business',
              'Key deadline extraction and calendar integration',
              'Board-ready briefings without the jargon'
            ]
          },
          'calendar': {
            title: 'Regulatory Calendar',
            icon: '<svg viewBox="0 0 48 48"><rect x="6" y="10" width="36" height="32" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><line x1="14" y1="6" x2="14" y2="14" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/><line x1="34" y1="6" x2="34" y2="14" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/><line x1="6" y1="20" x2="42" y2="20" stroke="#2563eb" stroke-width="2"/><circle cx="16" cy="28" r="3" fill="#ef4444"><animate attributeName="r" values="3;4;3" dur="1s" repeatCount="indefinite"/></circle><circle cx="32" cy="28" r="3" fill="#f59e0b"/><circle cx="24" cy="36" r="3" fill="#22c55e"/></svg>',
            demo: '<div class="demo-calendar"><div class="cal-month">January 2025</div><div class="cal-grid"><div class="cal-day">1</div><div class="cal-day">2</div><div class="cal-day deadline">3<span>FCA</span></div><div class="cal-day">4</div><div class="cal-day">5</div><div class="cal-day impl">6<span>PRA</span></div><div class="cal-day">7</div></div><div class="cal-legend"><span class="legend-item deadline">Consultation Deadline</span><span class="legend-item impl">Implementation Date</span></div></div>',
            benefits: [
              'Unified view of all regulatory deadlines',
              'Consultation close dates auto-populated',
              'Implementation milestones tracked',
              'Export to Outlook, Google, or iCal',
              'Team reminders and escalation alerts'
            ]
          },
          'watchlists': {
            title: 'Custom Watch Lists',
            icon: '<svg viewBox="0 0 48 48"><path d="M24 4L44 14v20L24 44 4 34V14L24 4z" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/><path d="M24 14v20M14 19v10M34 19v10" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="24" r="4" fill="#22c55e"><animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/></circle></svg>',
            demo: '<div class="demo-watchlist"><div class="wl-filter"><span class="wl-tag active">FCA</span><span class="wl-tag active">PRA</span><span class="wl-tag">EBA</span><span class="wl-tag">SEC</span></div><div class="wl-filter"><span class="wl-tag active">Consumer Duty</span><span class="wl-tag active">Capital</span><span class="wl-tag">AML</span></div><div class="wl-result"><div class="wl-count">12</div><div class="wl-label">Matching updates this week</div></div></div>',
            benefits: [
              'Filter by regulator, topic, or sector',
              'Create multiple watch lists for different teams',
              'Get notified only on what matters to you',
              'Reduce noise by 90% or more',
              'Share watch lists across your organization'
            ]
          },
          'dossiers': {
            title: 'Compliance Dossiers',
            icon: '<svg viewBox="0 0 48 48"><rect x="8" y="4" width="28" height="40" rx="3" fill="#e0e7ff" stroke="#6366f1" stroke-width="2"/><rect x="14" y="4" width="28" height="40" rx="3" fill="#eef2ff" stroke="#6366f1" stroke-width="2"/><path d="M20 16h16M20 24h12M20 32h14" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/><circle cx="38" cy="40" r="6" fill="#6366f1"><animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/></circle><path d="M36 40l2 2 4-4" stroke="white" stroke-width="2" fill="none"/></svg>',
            demo: '<div class="demo-dossier"><div class="dossier-card"><div class="dossier-title">Consumer Duty Evidence Pack</div><div class="dossier-items"><div class="dossier-item">FCA PS22/9 Final Rules</div><div class="dossier-item">Internal Gap Analysis</div><div class="dossier-item">Board Presentation Q3</div><div class="dossier-item">Implementation Tracker</div></div><div class="dossier-meta">Last updated: Today</div></div></div>',
            benefits: [
              'Build evidence-based case files',
              'Link related regulatory updates together',
              'Generate audit trails automatically',
              'Export to PDF for board reports',
              'Collaborate with annotations and comments'
            ]
          },
          'kanban': {
            title: 'Kanban Workflows',
            icon: '<svg viewBox="0 0 48 48"><rect x="4" y="8" width="12" height="32" rx="2" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/><rect x="18" y="8" width="12" height="32" rx="2" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/><rect x="32" y="8" width="12" height="32" rx="2" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/><rect x="6" y="14" width="8" height="6" rx="1" fill="#fecaca"><animate attributeName="y" values="14;20;14" dur="3s" repeatCount="indefinite"/></rect><rect x="20" y="16" width="8" height="6" rx="1" fill="#fde68a"/><rect x="34" y="12" width="8" height="6" rx="1" fill="#bbf7d0"/></svg>',
            demo: '<div class="demo-kanban"><div class="kanban-col"><div class="kanban-header red">To Review</div><div class="kanban-card">FCA consultation response</div><div class="kanban-card">PRA buffer assessment</div></div><div class="kanban-col"><div class="kanban-header yellow">In Progress</div><div class="kanban-card">Gap analysis update</div></div><div class="kanban-col"><div class="kanban-header green">Done</div><div class="kanban-card">Board briefing pack</div></div></div>',
            benefits: [
              'Track regulatory projects visually',
              'Assign tasks to team members',
              'Set due dates linked to deadlines',
              'Move items through your workflow',
              'Full audit trail of changes'
            ]
          },
          'analytics': {
            title: 'Analytics Dashboard',
            icon: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="none" stroke="#e2e8f0" stroke-width="4"/><path d="M24 6a18 18 0 0 1 18 18" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="3s" repeatCount="indefinite"/></path><circle cx="24" cy="24" r="8" fill="#2563eb"/></svg>',
            demo: '<div class="demo-analytics"><div class="analytics-chart"><div class="chart-bar b1" style="height:40%"></div><div class="chart-bar b2" style="height:70%"></div><div class="chart-bar b3" style="height:55%"></div><div class="chart-bar b4" style="height:85%"></div><div class="chart-bar b5" style="height:60%"></div></div><div class="analytics-stats"><div class="stat">+23% regulatory activity</div><div class="stat">15 high-impact updates</div></div></div>',
            benefits: [
              'Visualize regulatory trends over time',
              'Track enforcement action patterns',
              'See sector-specific activity heatmaps',
              'Export charts for presentations',
              'Benchmark against industry averages'
            ]
          },
          'digests': {
            title: 'Daily Digests',
            icon: '<svg viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="32" rx="4" fill="#fce7f3" stroke="#ec4899" stroke-width="2"/><path d="M6 16l18 12 18-12" fill="none" stroke="#ec4899" stroke-width="2"/><circle cx="38" cy="12" r="6" fill="#ef4444"><animate attributeName="r" values="6;7;6" dur="1s" repeatCount="indefinite"/></circle><text x="38" y="15" text-anchor="middle" fill="white" font-size="8" font-weight="bold">3</text></svg>',
            demo: '<div class="demo-digest"><div class="digest-email"><div class="digest-header"><span class="digest-from">RegCanary Daily</span><span class="digest-time">08:00</span></div><div class="digest-subject">Your regulatory briefing for today</div><div class="digest-preview"><div class="digest-item high">FCA: Consumer Duty clarification</div><div class="digest-item medium">PRA: Stress testing guidance</div><div class="digest-item low">EBA: Q&A update</div></div></div></div>',
            benefits: [
              'Morning briefing delivered to your inbox',
              'Prioritized by impact level',
              'Personalized to your watch lists',
              'One-click access to full details',
              'Never start the day unprepared'
            ]
          }
        };

        // Feature Modal Functionality
        const modal = document.getElementById('featureModal');
        const modalIcon = document.getElementById('modalIcon');
        const modalTitle = document.getElementById('modalTitle');
        const modalDemo = document.getElementById('modalDemo');
        const modalBenefits = document.getElementById('modalBenefits');
        const modalClose = document.querySelector('.modal-close');

        function openFeatureModal(featureId) {
          const data = featureData[featureId];
          if (!data) return;

          modalIcon.innerHTML = data.icon;
          modalTitle.textContent = data.title;
          modalDemo.innerHTML = data.demo;
          modalBenefits.innerHTML = data.benefits.map(b => '<li>' + b + '</li>').join('');

          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }

        function closeFeatureModal() {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }

        // Click handlers for feature cards
        document.querySelectorAll('.feature-card[data-feature]').forEach(card => {
          card.addEventListener('click', () => {
            openFeatureModal(card.dataset.feature);
          });
          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFeatureModal(card.dataset.feature);
            }
          });
        });

        // Close modal handlers
        modalClose.addEventListener('click', closeFeatureModal);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeFeatureModal();
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeFeatureModal();
        });

      </script>
    </body>
    </html>
  `
}

module.exports = { renderMarketingPage }
