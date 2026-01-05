/**
 * Unique Canary Pose SVGs
 * Each page has a distinct canary pose/action
 */

// Shared SVG Gradient Definitions
function getCanaryGradients() {
  return `
    <defs>
      <linearGradient id="canaryGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFE066"/>
        <stop offset="50%" style="stop-color:#FFD93D"/>
        <stop offset="100%" style="stop-color:#F4C430"/>
      </linearGradient>
      <linearGradient id="canaryOrange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFB347"/>
        <stop offset="100%" style="stop-color:#FF8C00"/>
      </linearGradient>
      <linearGradient id="accentBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6"/>
        <stop offset="100%" style="stop-color:#1d4ed8"/>
      </linearGradient>
      <linearGradient id="crystalPurple" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#a855f7"/>
        <stop offset="100%" style="stop-color:#7c3aed"/>
      </linearGradient>
    </defs>
  `
}

/**
 * 1. Dashboard - Standing Alert Canary
 * Upright posture, wings at sides, vigilant expression
 */
function getDashboardCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Body - upright -->
    <g class="canary-body">
      <ellipse cx="25" cy="30" rx="10" ry="8" fill="url(#canaryGold)"/>
      <ellipse cx="25" cy="32" rx="6" ry="4" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Wings folded at sides -->
    <g class="canary-wing">
      <ellipse cx="18" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
      <ellipse cx="32" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
    </g>
    <!-- Tail -->
    <polygon points="25,38 20,46 25,44 30,46" fill="url(#canaryOrange)"/>
    <!-- Head - forward facing -->
    <g class="canary-head">
      <circle cx="25" cy="18" r="8" fill="url(#canaryGold)"/>
      <circle cx="25" cy="20" r="3" fill="#FFB347" opacity="0.4"/>
      <!-- Eyes - both visible, alert -->
      <circle cx="22" cy="16" r="2" fill="white"/>
      <circle class="canary-eye" cx="22" cy="16" r="1.2" fill="#1a1a2e"/>
      <circle cx="28" cy="16" r="2" fill="white"/>
      <circle class="canary-eye" cx="28" cy="16" r="1.2" fill="#1a1a2e"/>
      <!-- Beak - forward -->
      <polygon points="25,19 25,22 30,20" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M22 10 Q20 6 23 8 Q22 4 25 7 Q28 4 27 8 Q30 6 28 10" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M22 38 L22 42 M20 42 L24 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M28 38 L28 42 M26 42 L30 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 2. Profile Hub - Waving Canary
 * Friendly wave gesture, one wing raised high
 */
function getProfileCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Body -->
    <g class="canary-body">
      <ellipse cx="25" cy="30" rx="10" ry="8" fill="url(#canaryGold)"/>
      <ellipse cx="25" cy="32" rx="6" ry="4" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Left wing - normal -->
    <ellipse cx="17" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
    <!-- Right wing - raised waving -->
    <g class="canary-wing-wave">
      <ellipse cx="36" cy="18" rx="4" ry="6" fill="url(#canaryOrange)" transform="rotate(-30 36 18)"/>
      <path d="M34 14 L40 10 M35 16 L41 14 M36 18 L42 17" stroke="#E6A500" stroke-width="1" stroke-linecap="round"/>
    </g>
    <!-- Tail -->
    <polygon points="25,38 20,46 25,44 30,46" fill="url(#canaryOrange)"/>
    <!-- Head - tilted friendly -->
    <g class="canary-head" transform="rotate(5 25 18)">
      <circle cx="25" cy="18" r="8" fill="url(#canaryGold)"/>
      <!-- Happy eye -->
      <circle cx="28" cy="16" r="2" fill="white"/>
      <circle class="canary-eye" cx="28" cy="16" r="1.2" fill="#1a1a2e"/>
      <circle cx="29" cy="15" r="0.4" fill="white"/>
      <!-- Smiling beak -->
      <path d="M32 18 Q36 19 34 21" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M22 10 Q20 6 23 8 Q22 4 25 7 Q28 4 27 8" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M22 38 L22 42 M20 42 L24 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M28 38 L28 42 M26 42 L30 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 3. Analytics - Magnifying Glass Canary
 * Holding magnifying glass, curious investigative pose
 */
function getAnalyticsCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Body - leaning forward -->
    <g class="canary-body" transform="rotate(-8 25 30)">
      <ellipse cx="25" cy="30" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="25" cy="31" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Left wing holding magnifying glass -->
    <g class="canary-wing">
      <ellipse cx="16" cy="26" rx="3" ry="4" fill="url(#canaryOrange)"/>
    </g>
    <!-- Magnifying glass -->
    <g class="magnifying-glass">
      <circle cx="10" cy="16" r="7" fill="none" stroke="url(#accentBlue)" stroke-width="2.5"/>
      <circle cx="10" cy="16" r="5" fill="#e0f2fe" opacity="0.4"/>
      <line x1="15" y1="21" x2="20" y2="26" stroke="url(#accentBlue)" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <!-- Right wing -->
    <ellipse cx="34" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
    <!-- Tail -->
    <polygon points="32,36 36,44 32,42 28,44" fill="url(#canaryOrange)"/>
    <!-- Head - looking through glass -->
    <g class="canary-head">
      <circle cx="22" cy="18" r="7" fill="url(#canaryGold)"/>
      <!-- Big curious eye (magnified) -->
      <circle cx="18" cy="17" r="3.5" fill="white"/>
      <circle class="canary-eye-scan" cx="18" cy="17" r="2" fill="#1a1a2e"/>
      <circle cx="17" cy="16" r="0.6" fill="white"/>
      <!-- Small eye -->
      <circle cx="25" cy="16" r="1.5" fill="white"/>
      <circle cx="25" cy="16" r="0.9" fill="#1a1a2e"/>
      <!-- Beak -->
      <polygon points="26,19 30,18 27,21" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M20 11 Q18 7 21 9 Q21 5 24 8" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M22 38 L22 42 M20 42 L24 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M28 38 L28 42 M26 42 L30 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 4. Weekly Roundup - Reading Canary
 * Holding newspaper/document, scholarly pose
 */
function getWeeklyRoundupCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Body -->
    <g class="canary-body">
      <ellipse cx="25" cy="32" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="25" cy="33" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Wings holding newspaper -->
    <g class="canary-wing">
      <ellipse cx="16" cy="28" rx="3" ry="4" fill="url(#canaryOrange)"/>
      <ellipse cx="34" cy="28" rx="3" ry="4" fill="url(#canaryOrange)"/>
    </g>
    <!-- Newspaper/Document -->
    <g class="document-reading">
      <rect x="12" y="22" width="18" height="14" rx="1" fill="white" stroke="#cbd5e1" stroke-width="0.5"/>
      <line x1="14" y1="25" x2="28" y2="25" stroke="#94a3b8" stroke-width="1"/>
      <line x1="14" y1="28" x2="26" y2="28" stroke="#cbd5e1" stroke-width="0.8"/>
      <line x1="14" y1="31" x2="24" y2="31" stroke="#cbd5e1" stroke-width="0.8"/>
      <line x1="14" y1="34" x2="27" y2="34" stroke="#cbd5e1" stroke-width="0.8"/>
    </g>
    <!-- Tail -->
    <polygon points="25,39 20,46 25,44 30,46" fill="url(#canaryOrange)"/>
    <!-- Head - looking down at paper -->
    <g class="canary-head" transform="rotate(10 28 16)">
      <circle cx="28" cy="16" r="7" fill="url(#canaryGold)"/>
      <!-- Reading glasses -->
      <circle cx="26" cy="16" r="2.5" fill="none" stroke="#64748b" stroke-width="0.8"/>
      <circle cx="32" cy="16" r="2.5" fill="none" stroke="#64748b" stroke-width="0.8"/>
      <line x1="28.5" y1="16" x2="29.5" y2="16" stroke="#64748b" stroke-width="0.8"/>
      <!-- Eyes behind glasses -->
      <circle class="canary-eye" cx="26" cy="16" r="0.8" fill="#1a1a2e"/>
      <circle class="canary-eye" cx="32" cy="16" r="0.8" fill="#1a1a2e"/>
      <!-- Beak -->
      <polygon points="29,19 33,20 30,22" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M25 9 Q24 5 27 7 Q27 4 30 7" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M22 40 L22 44 M20 44 L24 44" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M28 40 L28 44 M26 44 L30 44" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 5. Calendar - Clock Pointing Canary
 * Standing next to clock, wing pointing
 */
function getCalendarCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Clock -->
    <g class="clock-icon">
      <circle cx="12" cy="20" r="9" fill="white" stroke="url(#accentBlue)" stroke-width="2"/>
      <circle cx="12" cy="20" r="7" fill="none" stroke="#e2e8f0" stroke-width="0.5"/>
      <!-- Clock hands -->
      <line x1="12" y1="20" x2="12" y2="14" stroke="#1e40af" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="12" y1="20" x2="17" y2="20" stroke="#3b82f6" stroke-width="1" stroke-linecap="round"/>
      <circle cx="12" cy="20" r="1" fill="#1e40af"/>
      <!-- Hour markers -->
      <circle cx="12" cy="13" r="0.5" fill="#64748b"/>
      <circle cx="19" cy="20" r="0.5" fill="#64748b"/>
      <circle cx="12" cy="27" r="0.5" fill="#64748b"/>
      <circle cx="5" cy="20" r="0.5" fill="#64748b"/>
    </g>
    <!-- Body -->
    <g class="canary-body">
      <ellipse cx="32" cy="30" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="32" cy="31" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Left wing - pointing at clock -->
    <g class="canary-wing">
      <ellipse cx="24" cy="24" rx="4" ry="3" fill="url(#canaryOrange)" transform="rotate(-45 24 24)"/>
      <path d="M22 22 L18 18" stroke="#E6A500" stroke-width="1.5" stroke-linecap="round"/>
    </g>
    <!-- Right wing -->
    <ellipse cx="40" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
    <!-- Tail -->
    <polygon points="38,36 42,44 38,42 34,44" fill="url(#canaryOrange)"/>
    <!-- Head -->
    <g class="canary-head">
      <circle cx="32" cy="18" r="7" fill="url(#canaryGold)"/>
      <!-- Eyes looking at clock -->
      <circle cx="29" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="28" cy="17" r="1" fill="#1a1a2e"/>
      <!-- Beak -->
      <polygon points="26,19 22,18 25,21" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M30 11 Q28 7 31 9 Q31 5 34 8 Q37 5 35 9" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M29 37 L29 41 M27 41 L31 41" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M35 37 L35 41 M33 41 L37 41" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 6. Watch Lists - Binoculars Canary
 * Looking through binoculars, scanning pose
 */
function getWatchListsCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Body -->
    <g class="canary-body">
      <ellipse cx="25" cy="32" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="25" cy="33" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Wings holding binoculars -->
    <g class="canary-wing">
      <ellipse cx="17" cy="22" rx="3" ry="4" fill="url(#canaryOrange)"/>
      <ellipse cx="33" cy="22" rx="3" ry="4" fill="url(#canaryOrange)"/>
    </g>
    <!-- Binoculars -->
    <g class="binoculars">
      <!-- Left lens -->
      <circle cx="20" cy="14" r="5" fill="#1e293b"/>
      <circle cx="20" cy="14" r="4" fill="#334155"/>
      <circle cx="20" cy="14" r="2.5" fill="#60a5fa" opacity="0.3"/>
      <circle cx="19" cy="13" r="1" fill="white" opacity="0.5"/>
      <!-- Right lens -->
      <circle cx="30" cy="14" r="5" fill="#1e293b"/>
      <circle cx="30" cy="14" r="4" fill="#334155"/>
      <circle cx="30" cy="14" r="2.5" fill="#60a5fa" opacity="0.3"/>
      <circle cx="29" cy="13" r="1" fill="white" opacity="0.5"/>
      <!-- Bridge -->
      <rect x="24" y="12" width="2" height="4" fill="#1e293b"/>
    </g>
    <!-- Tail -->
    <polygon points="25,39 20,46 25,44 30,46" fill="url(#canaryOrange)"/>
    <!-- Head - behind binoculars -->
    <g class="canary-head">
      <circle cx="25" cy="18" r="6" fill="url(#canaryGold)"/>
      <!-- Beak below binoculars -->
      <polygon points="25,22 29,24 25,26 21,24" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M22 8 Q20 4 23 6 Q23 2 26 5 Q29 2 28 6 Q31 4 29 8" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M22 40 L22 44 M20 44 L24 44" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M28 40 L28 44 M26 44 L30 44" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 7. Dossiers - Folder Carrying Canary
 * Carrying folder under wing, walking pose
 */
function getDossiersCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Body - walking pose -->
    <g class="canary-body" transform="rotate(-5 25 30)">
      <ellipse cx="26" cy="30" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="26" cy="31" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Left wing holding folder -->
    <g class="canary-wing">
      <ellipse cx="18" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
    </g>
    <!-- Folder tucked under wing -->
    <g class="folder-icon">
      <path d="M8 24 L8 38 L22 38 L22 24 L16 24 L14 21 L8 21 Z" fill="#fbbf24"/>
      <path d="M8 24 L22 24" stroke="#f59e0b" stroke-width="1"/>
      <rect x="10" y="26" width="10" height="1" fill="#f59e0b" opacity="0.5"/>
      <rect x="10" y="29" width="8" height="1" fill="#f59e0b" opacity="0.5"/>
      <rect x="10" y="32" width="9" height="1" fill="#f59e0b" opacity="0.5"/>
    </g>
    <!-- Right wing -->
    <ellipse cx="34" cy="27" rx="3" ry="5" fill="url(#canaryOrange)"/>
    <!-- Tail -->
    <polygon points="32,36 36,44 32,42 28,44" fill="url(#canaryOrange)"/>
    <!-- Head - looking forward purposefully -->
    <g class="canary-head">
      <circle cx="30" cy="18" r="7" fill="url(#canaryGold)"/>
      <!-- Determined eyes -->
      <circle cx="33" cy="16" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="34" cy="16" r="1" fill="#1a1a2e"/>
      <!-- Beak -->
      <polygon points="36,18 42,17 37,20" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M27 11 Q25 7 28 9 Q28 5 31 8 Q34 5 32 9" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet - walking -->
    <g fill="#FF6B00">
      <path d="M24 38 L22 42 M20 42 L24 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M30 37 L32 41 M30 41 L34 41" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 8. Policies - Clipboard Canary
 * Holding clipboard, official inspector pose
 */
function getPoliciesCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Body - upright official -->
    <g class="canary-body">
      <ellipse cx="30" cy="32" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="30" cy="33" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Clipboard -->
    <g class="clipboard-icon">
      <rect x="6" y="14" width="16" height="22" rx="2" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1"/>
      <!-- Clip at top -->
      <rect x="10" y="12" width="8" height="4" rx="1" fill="#64748b"/>
      <rect x="12" y="13" width="4" height="2" rx="0.5" fill="#94a3b8"/>
      <!-- Checklist items -->
      <rect x="9" y="19" width="3" height="3" rx="0.5" fill="none" stroke="#10b981" stroke-width="1"/>
      <path d="M9.5 20.5 L10.5 21.5 L12 19.5" stroke="#10b981" stroke-width="1" fill="none"/>
      <line x1="14" y1="20.5" x2="20" y2="20.5" stroke="#cbd5e1" stroke-width="1"/>

      <rect x="9" y="25" width="3" height="3" rx="0.5" fill="none" stroke="#10b981" stroke-width="1"/>
      <path d="M9.5 26.5 L10.5 27.5 L12 25.5" stroke="#10b981" stroke-width="1" fill="none"/>
      <line x1="14" y1="26.5" x2="19" y2="26.5" stroke="#cbd5e1" stroke-width="1"/>

      <rect x="9" y="31" width="3" height="3" rx="0.5" fill="none" stroke="#94a3b8" stroke-width="1"/>
      <line x1="14" y1="32.5" x2="18" y2="32.5" stroke="#cbd5e1" stroke-width="1"/>
    </g>
    <!-- Left wing holding clipboard -->
    <g class="canary-wing">
      <ellipse cx="22" cy="26" rx="4" ry="5" fill="url(#canaryOrange)"/>
    </g>
    <!-- Right wing with pen -->
    <g>
      <ellipse cx="38" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
      <!-- Pen -->
      <rect x="40" y="22" width="2" height="10" rx="0.5" fill="#3b82f6" transform="rotate(20 41 27)"/>
      <polygon points="40,32 41,35 42,32" fill="#1e40af" transform="rotate(20 41 33)"/>
    </g>
    <!-- Tail -->
    <polygon points="36,38 40,46 36,44 32,46" fill="url(#canaryOrange)"/>
    <!-- Head - professional -->
    <g class="canary-head">
      <circle cx="30" cy="18" r="7" fill="url(#canaryGold)"/>
      <!-- Focused eyes -->
      <circle cx="27" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="27" cy="17" r="1" fill="#1a1a2e"/>
      <circle cx="33" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="33" cy="17" r="1" fill="#1a1a2e"/>
      <!-- Beak -->
      <polygon points="30,20 34,21 30,23" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M27 11 Q25 7 28 9 Q28 5 31 8 Q34 5 32 9" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M27 40 L27 44 M25 44 L29 44" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M33 40 L33 44 M31 44 L35 44" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 9. Kanban - Card Arranging Canary
 * Wings spread moving cards around
 */
function getKanbanCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Floating cards -->
    <g class="kanban-cards">
      <!-- Left card -->
      <rect x="4" y="12" width="10" height="14" rx="2" fill="#dbeafe" stroke="#3b82f6" stroke-width="1"/>
      <line x1="6" y1="16" x2="12" y2="16" stroke="#93c5fd" stroke-width="1"/>
      <line x1="6" y1="19" x2="10" y2="19" stroke="#bfdbfe" stroke-width="1"/>
      <!-- Right card -->
      <rect x="36" y="10" width="10" height="14" rx="2" fill="#dcfce7" stroke="#22c55e" stroke-width="1"/>
      <line x1="38" y1="14" x2="44" y2="14" stroke="#86efac" stroke-width="1"/>
      <line x1="38" y1="17" x2="42" y2="17" stroke="#bbf7d0" stroke-width="1"/>
      <!-- Center card (being moved) -->
      <g class="card-shuffle">
        <rect x="20" y="6" width="10" height="12" rx="2" fill="#fef3c7" stroke="#f59e0b" stroke-width="1"/>
        <line x1="22" y1="9" x2="28" y2="9" stroke="#fcd34d" stroke-width="1"/>
        <line x1="22" y1="12" x2="26" y2="12" stroke="#fde68a" stroke-width="1"/>
      </g>
    </g>
    <!-- Body -->
    <g class="canary-body">
      <ellipse cx="25" cy="34" rx="8" ry="6" fill="url(#canaryGold)"/>
      <ellipse cx="25" cy="35" rx="4" ry="2.5" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Wings spread wide -->
    <g class="canary-wing">
      <ellipse cx="12" cy="26" rx="5" ry="4" fill="url(#canaryOrange)" transform="rotate(-20 12 26)"/>
      <ellipse cx="38" cy="24" rx="5" ry="4" fill="url(#canaryOrange)" transform="rotate(20 38 24)"/>
    </g>
    <!-- Tail -->
    <polygon points="25,40 20,46 25,44 30,46" fill="url(#canaryOrange)"/>
    <!-- Head - focused on work -->
    <g class="canary-head">
      <circle cx="25" cy="24" r="6" fill="url(#canaryGold)"/>
      <!-- Eyes looking up at cards -->
      <circle cx="23" cy="22" r="1.5" fill="white"/>
      <circle class="canary-eye" cx="23" cy="21.5" r="0.9" fill="#1a1a2e"/>
      <circle cx="27" cy="22" r="1.5" fill="white"/>
      <circle class="canary-eye" cx="27" cy="21.5" r="0.9" fill="#1a1a2e"/>
      <!-- Beak -->
      <polygon points="25,25 28,26 25,28 22,26" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M23 18 Q22 15 24 16 Q24 13 26 15 Q28 13 27 16 Q29 15 28 18" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M22 40 L22 44 M20 44 L24 44" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M28 40 L28 44 M26 44 L30 44" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 10. Predictive Analytics - Crystal Ball Canary
 * Gazing into crystal ball, mystical pose
 */
function getPredictiveCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Crystal ball with glow -->
    <g class="crystal-ball">
      <ellipse cx="25" cy="40" rx="10" ry="3" fill="#4c1d95" opacity="0.3"/>
      <circle cx="25" cy="28" r="12" fill="url(#crystalPurple)" opacity="0.2"/>
      <circle cx="25" cy="28" r="10" fill="#ede9fe"/>
      <circle cx="25" cy="28" r="10" fill="url(#crystalPurple)" opacity="0.15"/>
      <!-- Inner glow -->
      <circle class="crystal-glow" cx="25" cy="28" r="6" fill="#a855f7" opacity="0.3"/>
      <circle cx="22" cy="25" r="2" fill="white" opacity="0.6"/>
      <!-- Trend line inside -->
      <path d="M18 32 Q22 26 25 28 Q28 30 32 24" fill="none" stroke="#7c3aed" stroke-width="1.5" opacity="0.6"/>
      <!-- Base -->
      <ellipse cx="25" cy="38" rx="6" ry="2" fill="#6b21a8"/>
      <rect x="21" y="36" width="8" height="3" fill="#7c3aed"/>
    </g>
    <!-- Body - mystical floating feel -->
    <g class="canary-body">
      <ellipse cx="25" cy="14" rx="7" ry="5" fill="url(#canaryGold)"/>
      <ellipse cx="25" cy="15" rx="4" ry="2" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Wings hovering over ball -->
    <g class="canary-wing">
      <ellipse cx="16" cy="18" rx="4" ry="3" fill="url(#canaryOrange)" transform="rotate(30 16 18)"/>
      <ellipse cx="34" cy="18" rx="4" ry="3" fill="url(#canaryOrange)" transform="rotate(-30 34 18)"/>
    </g>
    <!-- Tail -->
    <polygon points="25,19 21,24 25,22 29,24" fill="url(#canaryOrange)"/>
    <!-- Head - looking down at ball -->
    <g class="canary-head" transform="rotate(15 25 8)">
      <circle cx="25" cy="8" r="5" fill="url(#canaryGold)"/>
      <!-- Mystical eyes -->
      <circle cx="23" cy="8" r="1.3" fill="white"/>
      <circle class="canary-eye" cx="23" cy="8.5" r="0.8" fill="#7c3aed"/>
      <circle cx="27" cy="8" r="1.3" fill="white"/>
      <circle class="canary-eye" cx="27" cy="8.5" r="0.8" fill="#7c3aed"/>
      <!-- Beak pointing down -->
      <polygon points="25,10 27,13 25,12 23,13" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M23 3 Q22 0 24 2 Q25 -1 26 2 Q28 0 27 3" fill="url(#canaryOrange)"/>
    </g>
    <!-- Sparkles around -->
    <g class="sparkles" fill="#a855f7">
      <circle cx="10" cy="20" r="1" opacity="0.6"/>
      <circle cx="40" cy="22" r="0.8" opacity="0.5"/>
      <circle cx="8" cy="32" r="0.6" opacity="0.4"/>
      <circle cx="42" cy="34" r="0.7" opacity="0.5"/>
    </g>
  </svg>`
}

/**
 * 11. Enforcement - Gavel Canary
 * Holding gavel, authoritative judge pose
 */
function getEnforcementCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Gavel -->
    <g class="gavel">
      <!-- Handle -->
      <rect x="6" y="20" width="16" height="4" rx="1" fill="#78350f" transform="rotate(-30 14 22)"/>
      <!-- Head -->
      <rect x="2" y="12" width="8" height="12" rx="2" fill="#92400e" transform="rotate(-30 6 18)"/>
      <rect x="3" y="13" width="6" height="10" rx="1" fill="#a16207" transform="rotate(-30 6 18)"/>
    </g>
    <!-- Body - authoritative pose -->
    <g class="canary-body">
      <ellipse cx="30" cy="30" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="30" cy="31" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Left wing holding gavel -->
    <g class="canary-wing">
      <ellipse cx="22" cy="24" rx="4" ry="5" fill="url(#canaryOrange)" transform="rotate(-20 22 24)"/>
    </g>
    <!-- Right wing -->
    <ellipse cx="38" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
    <!-- Tail -->
    <polygon points="36,36 40,44 36,42 32,44" fill="url(#canaryOrange)"/>
    <!-- Head - stern expression -->
    <g class="canary-head">
      <circle cx="30" cy="18" r="7" fill="url(#canaryGold)"/>
      <!-- Stern eyes -->
      <circle cx="27" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="27" cy="17" r="1" fill="#1a1a2e"/>
      <circle cx="33" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="33" cy="17" r="1" fill="#1a1a2e"/>
      <!-- Brow furrow -->
      <path d="M25 15 L28 16" stroke="#E6A500" stroke-width="0.8"/>
      <path d="M32 16 L35 15" stroke="#E6A500" stroke-width="0.8"/>
      <!-- Beak -->
      <polygon points="30,20 34,21 30,23" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M27 11 Q25 7 28 9 Q28 5 31 8 Q34 5 32 9" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M27 38 L27 42 M25 42 L29 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M33 38 L33 42 M31 42 L35 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 12. Authority Spotlight - Detective Canary with Magnifying Glass on Badge
 * Investigating a regulator badge/shield, detective pose with monocle
 */
function getSpotlightCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <defs>
      <linearGradient id="badgeGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#fbbf24"/>
        <stop offset="100%" style="stop-color:#d97706"/>
      </linearGradient>
    </defs>
    <!-- Authority Badge/Shield being examined -->
    <g class="authority-badge">
      <path d="M10 18 L10 28 Q10 34 16 36 Q22 34 22 28 L22 18 L16 14 Z" fill="url(#badgeGold)" stroke="#92400e" stroke-width="1"/>
      <path d="M12 20 L12 27 Q12 31 16 33 Q20 31 20 27 L20 20 L16 17 Z" fill="#fef3c7"/>
      <!-- Star emblem on badge -->
      <polygon points="16,21 17.2,24 20.5,24 18,26 19,29 16,27 13,29 14,26 11.5,24 14.8,24" fill="#d97706"/>
    </g>
    <!-- Magnifying glass examining badge -->
    <g class="magnifying-glass-spotlight">
      <circle cx="18" cy="26" r="6" fill="none" stroke="#1e40af" stroke-width="2"/>
      <circle cx="18" cy="26" r="4.5" fill="#bfdbfe" opacity="0.3"/>
      <line x1="22.5" y1="30.5" x2="28" y2="36" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Shine on lens -->
      <circle cx="16" cy="24" r="1" fill="white" opacity="0.7"/>
    </g>
    <!-- Body - leaning forward investigating -->
    <g class="canary-body" transform="rotate(-5 32 30)">
      <ellipse cx="34" cy="30" rx="8" ry="6" fill="url(#canaryGold)"/>
      <ellipse cx="34" cy="31" rx="4" ry="2.5" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Left wing holding magnifying glass -->
    <g class="canary-wing">
      <ellipse cx="28" cy="30" rx="3" ry="4" fill="url(#canaryOrange)" transform="rotate(-20 28 30)"/>
    </g>
    <!-- Right wing -->
    <ellipse cx="40" cy="28" rx="2.5" ry="4" fill="url(#canaryOrange)"/>
    <!-- Tail -->
    <polygon points="40,34 44,42 40,40 36,42" fill="url(#canaryOrange)"/>
    <!-- Head with detective monocle -->
    <g class="canary-head">
      <circle cx="34" cy="18" r="6" fill="url(#canaryGold)"/>
      <!-- Detective hat brim hint -->
      <ellipse cx="34" cy="13" rx="7" ry="2" fill="#475569"/>
      <rect x="30" y="10" width="8" height="4" rx="1" fill="#374151"/>
      <!-- Monocle on one eye -->
      <circle cx="31" cy="17" r="2.5" fill="none" stroke="#64748b" stroke-width="1"/>
      <line x1="33.5" y1="17" x2="36" y2="20" stroke="#64748b" stroke-width="0.8"/>
      <!-- Eye behind monocle - focused -->
      <circle cx="31" cy="17" r="1.5" fill="white"/>
      <circle class="canary-eye" cx="31" cy="17.5" r="0.9" fill="#1a1a2e"/>
      <!-- Other eye -->
      <circle cx="37" cy="17" r="1.3" fill="white"/>
      <circle cx="37" cy="17" r="0.7" fill="#1a1a2e"/>
      <!-- Beak -->
      <polygon points="34,20 38,21 34,23" fill="#FF6B00"/>
      <!-- Small crest visible under hat -->
      <path d="M30 12 Q29 10 31 11" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M31 37 L31 41 M29 41 L33 41" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M37 37 L37 41 M35 41 L39 41" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 13. Sector Intelligence - Radar Canary
 * With radar dish/antenna, scanning for signals
 */
function getIntelligenceCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Radar dish -->
    <g class="radar-dish">
      <ellipse cx="12" cy="16" r="10" fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.3"/>
      <ellipse cx="12" cy="16" r="6" fill="none" stroke="#3b82f6" stroke-width="1" opacity="0.4"/>
      <ellipse cx="12" cy="16" r="2" fill="#3b82f6" opacity="0.5"/>
      <!-- Antenna pole -->
      <line x1="12" y1="16" x2="12" y2="28" stroke="#64748b" stroke-width="2"/>
      <rect x="10" y="26" width="4" height="6" rx="1" fill="#475569"/>
      <!-- Signal waves -->
      <path class="radar-sweep" d="M12 16 Q16 12 20 14" fill="none" stroke="#60a5fa" stroke-width="1" opacity="0.6"/>
      <path d="M12 16 Q18 10 24 13" fill="none" stroke="#93c5fd" stroke-width="0.8" opacity="0.4"/>
    </g>
    <!-- Body -->
    <g class="canary-body">
      <ellipse cx="32" cy="30" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="32" cy="31" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Wings -->
    <g class="canary-wing">
      <ellipse cx="24" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
      <ellipse cx="40" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
    </g>
    <!-- Tail -->
    <polygon points="38,36 42,44 38,42 34,44" fill="url(#canaryOrange)"/>
    <!-- Head - listening intently -->
    <g class="canary-head">
      <circle cx="32" cy="18" r="7" fill="url(#canaryGold)"/>
      <!-- One ear/antenna tuft raised -->
      <path d="M28 10 Q26 4 29 7 Q30 2 32 6" fill="url(#canaryOrange)"/>
      <path d="M34 11 Q36 8 35 11" fill="url(#canaryOrange)"/>
      <!-- Alert eyes -->
      <circle cx="29" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="29" cy="17" r="1" fill="#1a1a2e"/>
      <circle cx="35" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="35" cy="17" r="1" fill="#1a1a2e"/>
      <!-- Beak -->
      <polygon points="32,20 36,21 32,23" fill="#FF6B00"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M29 38 L29 42 M27 42 L31 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M35 38 L35 42 M33 42 L37 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * Build a canary icon (legacy support)
 * @deprecated Use specific pose functions instead
 */
function buildCanaryIcon(backgroundSvg, options = {}) {
  // For backwards compatibility, return dashboard canary
  return getDashboardCanary()
}

/**
 * Get canary bird SVG (legacy support)
 * @deprecated Use specific pose functions instead
 */
function getCanaryBird(options = {}) {
  return ''
}

/**
 * 14. Reg Notices - Document with canary perched on top
 * Official notice/document with seal, canary reading or perched
 */
function getRegNoticesCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <defs>
      <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f8fafc"/>
        <stop offset="100%" style="stop-color:#e2e8f0"/>
      </linearGradient>
      <linearGradient id="sealGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#fbbf24"/>
        <stop offset="100%" style="stop-color:#d97706"/>
      </linearGradient>
    </defs>
    <!-- Document shadow -->
    <rect x="11" y="17" width="28" height="34" rx="2" fill="#94a3b8" opacity="0.3"/>
    <!-- Main document -->
    <g class="document">
      <rect x="9" y="15" width="28" height="34" rx="2" fill="url(#docGradient)" stroke="#cbd5e1" stroke-width="1"/>
      <!-- Document lines -->
      <line x1="14" y1="22" x2="32" y2="22" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="14" y1="27" x2="28" y2="27" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="14" y1="31" x2="30" y2="31" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="14" y1="35" x2="26" y2="35" stroke="#cbd5e1" stroke-width="1"/>
      <!-- Official seal -->
      <circle class="doc-seal" cx="28" cy="42" r="5" fill="url(#sealGold)"/>
      <circle cx="28" cy="42" r="3" fill="#fef3c7"/>
      <text x="28" y="43.5" font-size="4" fill="#92400e" text-anchor="middle" font-weight="bold">FCA</text>
      <!-- Corner fold -->
      <path d="M31 15 L37 15 L37 21 Z" fill="#e2e8f0"/>
      <path d="M31 15 L37 21 L31 21 Z" fill="#cbd5e1"/>
    </g>
    <!-- Canary body - perched on top of document -->
    <g class="canary-body">
      <ellipse cx="35" cy="10" rx="6" ry="4.5" fill="url(#canaryGold)"/>
      <ellipse cx="35" cy="11" rx="3" ry="2" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Wings -->
    <g class="canary-wing">
      <ellipse cx="31" cy="9" rx="3" ry="4" fill="url(#canaryOrange)" transform="rotate(-15 31 9)"/>
    </g>
    <ellipse cx="39" cy="9" rx="2.5" ry="3.5" fill="url(#canaryOrange)" transform="rotate(15 39 9)"/>
    <!-- Tail -->
    <polygon points="40,12 44,17 40,15 37,17" fill="url(#canaryOrange)"/>
    <!-- Head - reading pose, looking down -->
    <g class="canary-head">
      <circle cx="33" cy="5" r="5" fill="url(#canaryGold)"/>
      <!-- Eyes looking down at document -->
      <circle cx="31" cy="5" r="1.3" fill="white"/>
      <circle class="canary-eye" cx="31" cy="5.5" r="0.7" fill="#1a1a2e"/>
      <circle cx="35" cy="5" r="1.3" fill="white"/>
      <circle class="canary-eye" cx="35" cy="5.5" r="0.7" fill="#1a1a2e"/>
      <!-- Beak pointing down -->
      <polygon points="33,7 36,8.5 33,10" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M31 1 Q29 -2 32 0 Q33 -3 35 0" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet on document edge -->
    <g fill="#FF6B00">
      <path d="M33 14 L33 15 M32 15 L34 15" stroke="#FF6B00" stroke-width="1" stroke-linecap="round"/>
      <path d="M37 14 L37 15 M36 15 L38 15" stroke="#FF6B00" stroke-width="1" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * 15. International - Globe-Watching Canary
 * Looking at/holding a small globe, representing global regulatory monitoring
 */
function getInternationalCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <defs>
      <linearGradient id="globeBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#60a5fa"/>
        <stop offset="100%" style="stop-color:#2563eb"/>
      </linearGradient>
      <linearGradient id="landGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4ade80"/>
        <stop offset="100%" style="stop-color:#16a34a"/>
      </linearGradient>
    </defs>
    <!-- Globe being observed -->
    <g class="globe">
      <circle cx="14" cy="24" r="10" fill="url(#globeBlue)"/>
      <!-- Globe grid lines -->
      <ellipse cx="14" cy="24" rx="10" ry="4" fill="none" stroke="#93c5fd" stroke-width="0.6" opacity="0.6"/>
      <ellipse cx="14" cy="24" rx="6" ry="10" fill="none" stroke="#93c5fd" stroke-width="0.6" opacity="0.6"/>
      <line x1="4" y1="24" x2="24" y2="24" stroke="#93c5fd" stroke-width="0.6" opacity="0.6"/>
      <!-- Continents (simplified) -->
      <path d="M10 18 Q12 16 15 17 Q18 18 17 21 Q15 20 12 21 Q10 20 10 18" fill="url(#landGreen)" opacity="0.8"/>
      <path d="M8 26 Q10 25 12 26 Q11 28 9 28 Q8 27 8 26" fill="url(#landGreen)" opacity="0.8"/>
      <path d="M16 26 Q18 25 19 27 Q18 29 16 28 Q15 27 16 26" fill="url(#landGreen)" opacity="0.8"/>
      <!-- Globe shine -->
      <circle cx="10" cy="20" r="2" fill="white" opacity="0.3"/>
    </g>
    <!-- Body - leaning forward to observe globe -->
    <g class="canary-body" transform="rotate(-8 32 30)">
      <ellipse cx="32" cy="30" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="32" cy="31" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Left wing - extended toward globe -->
    <g class="canary-wing">
      <ellipse cx="24" cy="26" rx="4" ry="5" fill="url(#canaryOrange)" transform="rotate(-15 24 26)"/>
    </g>
    <!-- Right wing -->
    <ellipse cx="40" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
    <!-- Tail -->
    <polygon points="38,36 42,44 38,42 34,44" fill="url(#canaryOrange)"/>
    <!-- Head - looking at globe with interest -->
    <g class="canary-head">
      <circle cx="30" cy="18" r="7" fill="url(#canaryGold)"/>
      <!-- Curious eyes looking at globe -->
      <circle cx="27" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="26" cy="17" r="1" fill="#1a1a2e"/>
      <circle cx="33" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="32" cy="17" r="1" fill="#1a1a2e"/>
      <!-- Eye sparkle -->
      <circle cx="26" cy="16" r="0.3" fill="white"/>
      <!-- Beak -->
      <polygon points="24,19 20,18 23,21" fill="#FF6B00"/>
      <!-- Crest -->
      <path d="M28 11 Q26 7 29 9 Q29 5 32 8 Q35 5 33 9" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M29 38 L29 42 M27 42 L31 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M35 38 L35 42 M33 42 L37 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * Bank News - Canary monitoring a bank building
 * Banking-focused pose with a stylized bank facade
 */
function getBankNewsCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Bank building -->
    <g class="bank-building">
      <polygon points="6,22 18,16 30,22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <rect x="8" y="22" width="20" height="16" rx="1.5" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
      <line x1="12" y1="22" x2="12" y2="38" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="18" y1="22" x2="18" y2="38" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="24" y1="22" x2="24" y2="38" stroke="#cbd5e1" stroke-width="1"/>
      <rect x="16" y="30" width="4" height="8" fill="#e2e8f0"/>
    </g>
    <!-- Body -->
    <g class="canary-body" transform="rotate(-6 34 30)">
      <ellipse cx="34" cy="30" rx="8" ry="6" fill="url(#canaryGold)"/>
      <ellipse cx="34" cy="31" rx="4.5" ry="2.5" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Left wing - gesturing toward bank -->
    <g class="canary-wing">
      <ellipse cx="26" cy="27" rx="3.5" ry="4.5" fill="url(#canaryOrange)" transform="rotate(-18 26 27)"/>
    </g>
    <!-- Right wing -->
    <ellipse cx="41" cy="29" rx="2.8" ry="4.5" fill="url(#canaryOrange)"/>
    <!-- Tail -->
    <polygon points="38,36 42,44 38,42 34,44" fill="url(#canaryOrange)"/>
    <!-- Head -->
    <g class="canary-head">
      <circle cx="32" cy="18" r="7" fill="url(#canaryGold)"/>
      <circle cx="29" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="28" cy="17" r="1" fill="#1a1a2e"/>
      <circle cx="35" cy="17" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="34" cy="17" r="1" fill="#1a1a2e"/>
      <circle cx="28" cy="16" r="0.3" fill="white"/>
      <polygon points="26,19 22,18 25,21" fill="#FF6B00"/>
      <path d="M30 11 Q28 7 31 9 Q31 5 34 8 Q37 5 35 9" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M31 38 L31 42 M29 42 L33 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M37 38 L37 42 M35 42 L39 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * Dear CEO Letters - Canary holding/reading an official letter
 * Serious expression, holding envelope with seal
 */
function getDearCeoCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Official Letter/Envelope -->
    <g class="letter">
      <!-- Envelope body -->
      <rect x="4" y="22" width="18" height="14" rx="2" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
      <!-- Envelope flap -->
      <path d="M4 22 L13 30 L22 22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <!-- Red seal -->
      <circle cx="13" cy="30" r="4" fill="#dc2626"/>
      <circle cx="13" cy="30" r="2.5" fill="#ef4444"/>
      <text x="13" y="31.5" text-anchor="middle" font-size="4" fill="white" font-weight="bold">!</text>
    </g>
    <!-- Body - attentive reading pose -->
    <g class="canary-body">
      <ellipse cx="32" cy="30" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="32" cy="31" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Left wing holding letter -->
    <g class="canary-wing">
      <ellipse cx="23" cy="26" rx="4" ry="5" fill="url(#canaryOrange)" transform="rotate(-15 23 26)"/>
    </g>
    <!-- Right wing -->
    <ellipse cx="40" cy="28" rx="3" ry="5" fill="url(#canaryOrange)"/>
    <!-- Tail -->
    <polygon points="38,36 42,44 38,42 34,44" fill="url(#canaryOrange)"/>
    <!-- Head - focused on letter -->
    <g class="canary-head">
      <circle cx="32" cy="18" r="7" fill="url(#canaryGold)"/>
      <!-- Focused eyes looking down at letter -->
      <circle cx="29" cy="18" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="28" cy="18.5" r="1" fill="#1a1a2e"/>
      <circle cx="35" cy="18" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="34" cy="18.5" r="1" fill="#1a1a2e"/>
      <!-- Concentrated brow -->
      <path d="M27 16 L29 17" stroke="#E6A500" stroke-width="0.8"/>
      <path d="M35 17 L37 16" stroke="#E6A500" stroke-width="0.8"/>
      <!-- Beak - slightly open as if reading -->
      <polygon points="32,21 36,22 32,24" fill="#FF6B00"/>
      <path d="M32 22.5 L35 22.5" stroke="#e65c00" stroke-width="0.5"/>
      <!-- Crest -->
      <path d="M29 11 Q27 7 30 9 Q30 5 33 8 Q36 5 34 9" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M29 38 L29 42 M27 42 L31 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M35 38 L35 42 M33 42 L37 42" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

/**
 * Consultations - Canary with megaphone/speech bubble
 * Engaged in consultation, speaking/listening pose
 */
function getConsultationsCanary() {
  return `<svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true">
    ${getCanaryGradients()}
    <!-- Speech bubble -->
    <g class="speech-bubble">
      <path d="M4 10 Q4 6 8 6 L22 6 Q26 6 26 10 L26 18 Q26 22 22 22 L12 22 L8 26 L10 22 L8 22 Q4 22 4 18 Z" fill="#f0f9ff" stroke="#3b82f6" stroke-width="1.5"/>
      <!-- Dots indicating discussion -->
      <circle cx="10" cy="14" r="1.5" fill="#3b82f6"/>
      <circle cx="15" cy="14" r="1.5" fill="#3b82f6"/>
      <circle cx="20" cy="14" r="1.5" fill="#3b82f6"/>
    </g>
    <!-- Body - engaged speaking pose -->
    <g class="canary-body">
      <ellipse cx="32" cy="32" rx="9" ry="7" fill="url(#canaryGold)"/>
      <ellipse cx="32" cy="33" rx="5" ry="3" fill="#FFF3B0" opacity="0.6"/>
    </g>
    <!-- Left wing gesturing -->
    <g class="canary-wing">
      <ellipse cx="24" cy="26" rx="4" ry="5" fill="url(#canaryOrange)" transform="rotate(-25 24 26)"/>
    </g>
    <!-- Right wing -->
    <ellipse cx="40" cy="30" rx="3" ry="5" fill="url(#canaryOrange)"/>
    <!-- Tail -->
    <polygon points="38,38 42,46 38,44 34,46" fill="url(#canaryOrange)"/>
    <!-- Head - speaking/engaging expression -->
    <g class="canary-head">
      <circle cx="32" cy="20" r="7" fill="url(#canaryGold)"/>
      <!-- Engaged, friendly eyes -->
      <circle cx="29" cy="19" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="29" cy="19" r="1" fill="#1a1a2e"/>
      <circle cx="35" cy="19" r="1.8" fill="white"/>
      <circle class="canary-eye" cx="35" cy="19" r="1" fill="#1a1a2e"/>
      <!-- Eye sparkle -->
      <circle cx="29.5" cy="18.5" r="0.3" fill="white"/>
      <circle cx="35.5" cy="18.5" r="0.3" fill="white"/>
      <!-- Beak - open as if speaking -->
      <polygon points="32,22 37,23 32,25" fill="#FF6B00"/>
      <polygon points="32,24 36,25 32,26" fill="#e65c00"/>
      <!-- Crest -->
      <path d="M29 13 Q27 9 30 11 Q30 7 33 10 Q36 7 34 11" fill="url(#canaryOrange)"/>
    </g>
    <!-- Feet -->
    <g fill="#FF6B00">
      <path d="M29 40 L29 44 M27 44 L31 44" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M35 40 L35 44 M33 44 L37 44" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  </svg>`
}

module.exports = {
  getCanaryGradients,
  getCanaryBird,
  buildCanaryIcon,
  // Pose-specific exports
  getDashboardCanary,
  getProfileCanary,
  getAnalyticsCanary,
  getWeeklyRoundupCanary,
  getCalendarCanary,
  getWatchListsCanary,
  getDossiersCanary,
  getPoliciesCanary,
  getKanbanCanary,
  getPredictiveCanary,
  getEnforcementCanary,
  getSpotlightCanary,
  getIntelligenceCanary,
  getRegNoticesCanary,
  getInternationalCanary,
  getBankNewsCanary,
  getDearCeoCanary,
  getConsultationsCanary
}
