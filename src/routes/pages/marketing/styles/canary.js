// Canary animations: flying canary, perched canary, postbox, letter
function getCanaryStyles() {
  return `
      /* ===== PREMIUM FLYING CANARY WITH LOOP ===== */
      .flying-canary-container {
        position: fixed;
        top: 0;
        left: -200px;
        width: 120px;
        height: 100px;
        z-index: 1000;
        pointer-events: none;
        animation: flyAndLandLoop 20s ease-in-out infinite;
        animation-delay: 0.5s;
      }

      .flying-canary {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 8px 24px rgba(245, 197, 66, 0.5));
      }

      /* Wing flapping animation */
      .wing-left, .wing-right {
        animation: wingFlap 0.1s ease-in-out infinite alternate;
        transform-origin: 50px 36px;
      }

      .wing-right {
        animation-delay: 0.05s;
      }

      /* Sparkle trail */
      .sparkle { opacity: 0; }
      .flying-canary-container .sparkle {
        animation: sparkleTrail 0.5s ease-out infinite;
      }
      .sparkle.s1 { animation-delay: 0s; }
      .sparkle.s2 { animation-delay: 0.12s; }
      .sparkle.s3 { animation-delay: 0.24s; }
      .sparkle.s4 { animation-delay: 0.36s; }

      @keyframes sparkleTrail {
        0% { opacity: 0.9; transform: translateX(0) scale(1); }
        100% { opacity: 0; transform: translateX(-40px) scale(0.2); }
      }

      /* Main flight + landing + departure loop animation (20s total) */
      @keyframes flyAndLandLoop {
        /* Phase 1: Fly in from left (0-50% = 10s) */
        0% {
          left: -200px;
          top: 8%;
          transform: translateY(0) rotate(-10deg) scale(0.7) scaleX(1);
          opacity: 0;
        }
        2% { opacity: 1; }
        8% {
          left: 5%;
          top: 5%;
          transform: translateY(-30px) rotate(-5deg) scale(1) scaleX(1);
        }
        18% {
          left: 25%;
          top: 12%;
          transform: translateY(20px) rotate(8deg) scale(1) scaleX(1);
        }
        28% {
          left: 45%;
          top: 3%;
          transform: translateY(-25px) rotate(-6deg) scale(1) scaleX(1);
        }
        38% {
          left: 60%;
          top: 10%;
          transform: translateY(15px) rotate(5deg) scale(1) scaleX(1);
        }
        45% {
          left: 72%;
          top: 6%;
          transform: translateY(-10px) rotate(-3deg) scale(0.95) scaleX(1);
        }
        /* Phase 2: Land on postbox (50-55%) */
        50% {
          left: 80%;
          top: 17%;
          transform: translateY(0) rotate(0deg) scale(0.8) scaleX(1);
          opacity: 1;
        }
        /* Phase 3: Hidden while perched (55-70%) */
        52% {
          left: 80%;
          top: 17%;
          transform: translateY(0) rotate(0deg) scale(0.8) scaleX(1);
          opacity: 0;
        }
        68% {
          left: 80%;
          top: 17%;
          transform: translateY(0) rotate(0deg) scale(0.8) scaleX(-1);
          opacity: 0;
        }
        /* Phase 4: Fly away to right (70-85%) - flipped horizontally */
        70% {
          left: 80%;
          top: 17%;
          transform: translateY(0) rotate(0deg) scale(0.8) scaleX(-1);
          opacity: 1;
        }
        75% {
          left: 90%;
          top: 10%;
          transform: translateY(-20px) rotate(5deg) scale(0.9) scaleX(-1);
          opacity: 1;
        }
        80% {
          left: 105%;
          top: 5%;
          transform: translateY(-30px) rotate(8deg) scale(1) scaleX(-1);
          opacity: 1;
        }
        85% {
          left: 120%;
          top: 8%;
          transform: translateY(0) rotate(10deg) scale(0.9) scaleX(-1);
          opacity: 0;
        }
        /* Phase 5: Reset for next loop (85-100%) */
        100% {
          left: -200px;
          top: 8%;
          transform: translateY(0) rotate(-10deg) scale(0.7) scaleX(1);
          opacity: 0;
        }
      }

      @keyframes wingFlap {
        0% { transform: rotate(-25deg) scaleY(1); }
        100% { transform: rotate(30deg) scaleY(0.8); }
      }

      /* Perched canary - syncs with flying canary 20s loop */
      .perched-canary-container {
        position: absolute;
        right: 18px;
        top: -80px;
        width: 50px;
        height: 60px;
        z-index: 95;
        pointer-events: none;
        opacity: 0;
        transform: scale(1) translateY(0);
        animation: perchedLoop 20s ease-in-out infinite;
        animation-delay: 0.5s;
      }

      @keyframes perchedLoop {
        0%, 48% {
          opacity: 0;
          transform: scale(0.6) translateY(-20px);
        }
        50% {
          opacity: 0;
          transform: scale(0.6) translateY(-20px);
        }
        53% {
          opacity: 1;
          transform: scale(1.1) translateY(5px);
        }
        55% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        58% {
          opacity: 1;
          transform: scale(1) translateY(-2px);
        }
        62% {
          opacity: 1;
          transform: scale(1) translateY(1px);
        }
        66% {
          opacity: 1;
          transform: scale(1) translateY(-1px);
        }
        68% {
          opacity: 1;
          transform: scale(0.95) translateY(3px);
        }
        70% {
          opacity: 0;
          transform: scale(1.1) translateY(-10px);
        }
        100% {
          opacity: 0;
          transform: scale(0.6) translateY(-20px);
        }
      }

      .perched-canary {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 4px 16px rgba(245, 197, 66, 0.45));
      }

      .perched-bird {
        animation: birdIdle 2s ease-in-out infinite;
        transform-origin: center bottom;
      }

      @keyframes birdIdle {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-1px) rotate(0.5deg); }
        50% { transform: translateY(0) rotate(-0.5deg); }
        75% { transform: translateY(-0.5px) rotate(0.3deg); }
      }

      /* Gold British Pillar Box (RegCanary Postbox) */
      .reg-postbox-container {
        position: absolute;
        right: 15px;
        top: -75px;
        width: 55px;
        height: 90px;
        z-index: 100;
      }

      .reg-pillar-box {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
      }

      /* Letter carried by canary - synced with 20s loop */
      .carried-letter {
        animation: carryLetterLoop 20s ease-in-out infinite;
        animation-delay: 0.5s;
      }

      @keyframes carryLetterLoop {
        0% { opacity: 1; transform: translateY(0); }
        45% { opacity: 1; transform: translateY(0); }
        48% { opacity: 1; transform: translateY(0); }
        50% { opacity: 0; transform: translateY(15px); }
        52%, 85% { opacity: 0; transform: translateY(15px); }
        88% { opacity: 0; transform: translateY(0); }
        92% { opacity: 1; transform: translateY(0); }
        100% { opacity: 1; transform: translateY(0); }
      }

      /* Letter dropping into postbox */
      .dropping-letter {
        position: absolute;
        right: 32px;
        top: -40px;
        width: 20px;
        height: 14px;
        opacity: 0;
        animation: letterDropLoop 20s ease-in-out infinite;
        animation-delay: 0.5s;
        z-index: 105;
      }

      @keyframes letterDropLoop {
        0%, 47% { opacity: 0; transform: translateY(-20px) rotate(-5deg); }
        48% { opacity: 0; transform: translateY(-20px) rotate(-5deg); }
        49% { opacity: 1; transform: translateY(0) rotate(0deg); }
        52% { opacity: 1; transform: translateY(30px) rotate(5deg); }
        54% { opacity: 0; transform: translateY(45px) rotate(0deg); }
        100% { opacity: 0; transform: translateY(-20px) rotate(-5deg); }
      }
  `;
}

module.exports = { getCanaryStyles };
