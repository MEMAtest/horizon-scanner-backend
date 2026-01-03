// SVG Assets: Flying canary, perched canary, postbox
function getFlyingCanarySvg() {
  return `
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
          <!-- Tail feathers -->
          <g class="tail-feathers">
            <ellipse cx="35" cy="52" rx="4" ry="12" fill="url(#canaryWingOrange)" transform="rotate(-15 35 52)"/>
            <ellipse cx="40" cy="54" rx="3" ry="14" fill="url(#canaryWingOrange)" transform="rotate(-5 40 54)"/>
            <ellipse cx="45" cy="52" rx="4" ry="12" fill="url(#canaryWingOrange)" transform="rotate(15 45 52)"/>
          </g>

          <!-- Body -->
          <ellipse cx="50" cy="42" rx="16" ry="12" fill="url(#canaryBodyGold)"/>
          <ellipse cx="50" cy="45" rx="10" ry="7" fill="url(#canaryBelly)" opacity="0.7"/>

          <!-- Left Wing -->
          <g class="wing wing-left">
            <ellipse cx="36" cy="36" rx="14" ry="8" fill="url(#canaryWingOrange)" transform="rotate(-25 36 36)"/>
            <ellipse cx="34" cy="32" rx="10" ry="5" fill="#FFE082" opacity="0.5" transform="rotate(-30 34 32)"/>
            <path d="M28 30 Q24 26 22 32" stroke="#E6A500" stroke-width="0.8" fill="none" opacity="0.6"/>
            <path d="M30 34 Q26 30 24 36" stroke="#E6A500" stroke-width="0.8" fill="none" opacity="0.6"/>
          </g>

          <!-- Right Wing -->
          <g class="wing wing-right">
            <ellipse cx="64" cy="36" rx="14" ry="8" fill="url(#canaryWingOrange)" transform="rotate(25 64 36)"/>
            <ellipse cx="66" cy="32" rx="10" ry="5" fill="#FFE082" opacity="0.5" transform="rotate(30 66 32)"/>
            <path d="M72 30 Q76 26 78 32" stroke="#E6A500" stroke-width="0.8" fill="none" opacity="0.6"/>
            <path d="M70 34 Q74 30 76 36" stroke="#E6A500" stroke-width="0.8" fill="none" opacity="0.6"/>
          </g>

          <!-- Head -->
          <circle cx="50" cy="24" r="12" fill="url(#canaryBodyGold)"/>
          <circle cx="42" cy="26" r="3" fill="#FFAB91" opacity="0.3"/>
          <circle cx="58" cy="26" r="3" fill="#FFAB91" opacity="0.3"/>

          <!-- Eyes -->
          <g class="eyes">
            <ellipse cx="45" cy="22" rx="3.5" ry="4" fill="white"/>
            <ellipse cx="45" cy="22" rx="2.2" ry="2.5" fill="#1a1a2e"/>
            <circle cx="44" cy="21" r="1" fill="white"/>
            <ellipse cx="55" cy="22" rx="3.5" ry="4" fill="white"/>
            <ellipse cx="55" cy="22" rx="2.2" ry="2.5" fill="#1a1a2e"/>
            <circle cx="54" cy="21" r="1" fill="white"/>
          </g>

          <!-- Beak -->
          <g class="beak">
            <path d="M50 28 L60 32 L50 36 L50 32 Z" fill="#FF8F00"/>
            <path d="M50 28 L60 32 L50 32 Z" fill="#FFB300"/>
            <path d="M50 32 L58 32 L50 34 Z" fill="#E65100"/>
          </g>

          <!-- Crest -->
          <g class="crest">
            <path d="M42 12 Q38 4 44 8" fill="url(#canaryWingOrange)"/>
            <path d="M46 10 Q44 2 50 6" fill="url(#canaryWingOrange)"/>
            <path d="M50 9 Q50 0 54 5" fill="url(#canaryWingOrange)"/>
            <path d="M54 10 Q56 2 58 8" fill="url(#canaryWingOrange)"/>
          </g>

          <!-- Feet -->
          <g class="feet">
            <path d="M45 54 L45 60 M43 60 L47 60 M44 58 L43 62 M46 58 L47 62" stroke="#FF8F00" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            <path d="M55 54 L55 60 M53 60 L57 60 M54 58 L53 62 M56 58 L57 62" stroke="#FF8F00" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </g>

          <!-- Letter carried in feet -->
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
  `;
}

function getPostboxSvg() {
  return `
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

        <!-- Domed top -->
        <ellipse cx="30" cy="14" rx="22" ry="8" fill="url(#pillarGold)"/>
        <ellipse cx="30" cy="12" rx="18" ry="5" fill="url(#pillarHighlight)" opacity="0.6"/>

        <!-- Main body -->
        <rect x="8" y="14" width="44" height="65" rx="3" fill="url(#pillarGold)"/>
        <rect x="12" y="16" width="8" height="60" rx="2" fill="url(#pillarHighlight)" opacity="0.4"/>

        <!-- Letter slot -->
        <rect x="14" y="28" width="32" height="8" rx="2" fill="#1a1a2e"/>
        <rect x="16" y="30" width="28" height="4" rx="1" fill="#0f172a"/>

        <!-- Emblem -->
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
  `;
}

function getPerchedCanarySvg() {
  return `
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

          <!-- Eyes -->
          <ellipse cx="26" cy="16" rx="2.5" ry="3" fill="white"/>
          <ellipse cx="26" cy="16" rx="1.5" ry="1.8" fill="#1a1a2e"/>
          <circle cx="25.5" cy="15.5" r="0.6" fill="white"/>
          <ellipse cx="34" cy="16" rx="2.5" ry="3" fill="white"/>
          <ellipse cx="34" cy="16" rx="1.5" ry="1.8" fill="#1a1a2e"/>
          <circle cx="33.5" cy="15.5" r="0.6" fill="white"/>

          <!-- Beak -->
          <path d="M30 20 L40 22 L30 25 Z" fill="#FF8F00"/>
          <path d="M30 20 L40 22 L30 22 Z" fill="#FFB300"/>

          <!-- Crest -->
          <path d="M24 9 Q20 3 26 6 Q28 1 30 5 Q32 1 34 6 Q40 3 36 9" fill="url(#postboxWingOrange)"/>

          <!-- Feet -->
          <path d="M26 41 L26 48 M24 46 L28 46" stroke="#FF8F00" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          <path d="M34 41 L34 48 M32 46 L36 46" stroke="#FF8F00" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        </g>
      </svg>
    </div>
  `;
}

function getBrandCanarySvg() {
  return `
    <svg viewBox="0 0 40 40" class="brand-canary">
      <ellipse cx="20" cy="24" rx="8" ry="6" fill="#FFD93D"/>
      <circle cx="20" cy="14" r="7" fill="#FFD93D"/>
      <polygon points="20,16 25,18 20,20" fill="#FF6B00"/>
      <circle cx="17" cy="12" r="1.5" fill="#1a1a2e"/>
      <circle cx="23" cy="12" r="1.5" fill="#1a1a2e"/>
      <path d="M16 7 Q14 3 17 5 Q18 2 20 4 Q22 2 23 5 Q26 3 24 7" fill="#FFB347"/>
    </svg>
  `;
}

function getCtaCanarySvg() {
  return `
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
  `;
}


module.exports = { getFlyingCanarySvg, getPostboxSvg, getPerchedCanarySvg, getBrandCanarySvg, getCtaCanarySvg };
