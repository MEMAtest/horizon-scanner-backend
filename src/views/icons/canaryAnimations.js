/**
 * Canary Icon CSS Animations
 * Keyframes and animation classes for the RegCanary mascot
 */

function getCanaryAnimationStyles() {
  return `
    /* Canary Icon Container */
    .canary-icon-container {
      width: 48px;
      height: 48px;
      background: linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%);
      border: 2px solid rgba(251, 191, 36, 0.4);
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(218, 165, 32, 0.25), inset 0 1px 0 rgba(255,255,255,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .canary-icon-container svg {
      width: 36px;
      height: 40px;
    }

    /* Base Animation Classes */
    .canary-icon-animated {
      filter: drop-shadow(0 3px 6px rgba(218, 165, 32, 0.35));
    }

    .canary-body {
      animation: canaryBreathe 2s ease-in-out infinite;
      transform-origin: center;
    }

    .canary-wing {
      animation: wingFlap 0.8s ease-in-out infinite;
      transform-origin: 70% 50%;
    }

    .canary-head {
      animation: headBob 2.5s ease-in-out infinite;
      transform-origin: center bottom;
    }

    .canary-eye {
      animation: eyeBlink 4s ease-in-out infinite;
    }

    .shield-glow {
      animation: shieldPulse 3s ease-in-out infinite;
    }

    /* Base Keyframes */
    @keyframes canaryBreathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    @keyframes wingFlap {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-8deg); }
      75% { transform: rotate(5deg); }
    }

    @keyframes headBob {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      30% { transform: translateY(-1px) rotate(2deg); }
      70% { transform: translateY(0.5px) rotate(-1deg); }
    }

    @keyframes eyeBlink {
      0%, 45%, 55%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(0.1); }
    }

    @keyframes shieldPulse {
      0%, 100% { opacity: 0.6; filter: blur(3px); }
      50% { opacity: 0.9; filter: blur(5px); }
    }

    /* Page-Specific Animation Variations */

    /* Profile Hub - Wave animation */
    .canary-wing-wave {
      animation: wingWave 1.5s ease-in-out infinite;
      transform-origin: 70% 50%;
    }
    @keyframes wingWave {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-15deg); }
      50% { transform: rotate(10deg); }
      75% { transform: rotate(-10deg); }
    }

    /* Analytics - Eye scanning */
    .canary-eye-scan {
      animation: eyeScan 3s ease-in-out infinite;
    }
    @keyframes eyeScan {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-1px); }
      75% { transform: translateX(1px); }
    }

    /* Calendar - Clock tick */
    .clock-hand {
      animation: clockTick 2s steps(4) infinite;
      transform-origin: center;
    }
    @keyframes clockTick {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Watch Lists - Radar scan */
    .radar-sweep {
      animation: radarSweep 2s linear infinite;
      transform-origin: center;
    }
    @keyframes radarSweep {
      0% { transform: rotate(0deg); opacity: 0.8; }
      100% { transform: rotate(360deg); opacity: 0.8; }
    }

    /* Dossiers - Folder animation */
    .folder-flap {
      animation: folderOpen 2s ease-in-out infinite;
      transform-origin: bottom;
    }
    @keyframes folderOpen {
      0%, 100% { transform: rotateX(0deg); }
      50% { transform: rotateX(-10deg); }
    }

    /* Policies - Checkmark appear */
    .checkmark-draw {
      stroke-dasharray: 20;
      stroke-dashoffset: 20;
      animation: checkDraw 2s ease-in-out infinite;
    }
    @keyframes checkDraw {
      0%, 40% { stroke-dashoffset: 20; }
      60%, 100% { stroke-dashoffset: 0; }
    }

    /* Kanban - Card shuffle */
    .card-shuffle {
      animation: cardMove 2s ease-in-out infinite;
    }
    @keyframes cardMove {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(2px); }
    }

    /* Predictive - Mystical glow */
    .crystal-glow {
      animation: crystalPulse 2s ease-in-out infinite;
    }
    @keyframes crystalPulse {
      0%, 100% { opacity: 0.5; filter: blur(2px); }
      50% { opacity: 1; filter: blur(4px); }
    }

    /* Weekly Roundup - Page flip */
    .page-flip {
      animation: pageFlip 3s ease-in-out infinite;
      transform-origin: left center;
    }
    @keyframes pageFlip {
      0%, 100% { transform: rotateY(0deg); }
      50% { transform: rotateY(-20deg); }
    }
  `
}

module.exports = { getCanaryAnimationStyles }
