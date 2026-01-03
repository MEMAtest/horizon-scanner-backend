function getMarketingStyles() {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');

      :root {
        --ink: #0b1b33;
        --muted: #445069;
        --blue-900: #0b1b63;
        --blue-700: #1e3a8a;
        --blue-500: #2563eb;
        --blue-300: #93c5fd;
        --blue-100: #dbeafe;
        --yellow-500: #f5c542;
        --yellow-400: #fbbf24;
        --yellow-300: #fde68a;
        --yellow-100: #fef3c7;
        --green-500: #22c55e;
        --green-100: #dcfce7;
        --red-500: #ef4444;
        --red-100: #fee2e2;
        --sunset: #fff4cc;
        --cream: #fffdf7;
        --card: #ffffff;
        --border: rgba(15, 23, 42, 0.12);
        --shadow: 0 28px 70px rgba(15, 23, 42, 0.18);
        --shadow-sm: 0 4px 20px rgba(15, 23, 42, 0.08);
        --shadow-md: 0 12px 40px rgba(15, 23, 42, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: 'Manrope', sans-serif;
        color: var(--ink);
        background: #fafbfc;
        min-height: 100vh;
        overflow-x: hidden;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      img {
        max-width: 100%;
      }

      .marketing-shell {
        overflow-x: hidden;
        position: relative;
      }

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
        2% {
          opacity: 1;
        }
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
        z-index: 95;  /* Lower than postbox (100) so canary appears ON TOP of dome */
        pointer-events: none;
        opacity: 0;
        transform: scale(1) translateY(0);
        animation: perchedLoop 20s ease-in-out infinite;
        animation-delay: 0.5s;
      }

      /* Perched canary loop - synced with flying canary (20s total) */
      @keyframes perchedLoop {
        /* Hidden during flight in (0-50%) */
        0%, 48% {
          opacity: 0;
          transform: scale(0.6) translateY(-20px);
        }
        /* Land with bounce (50-55%) */
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
        /* Idle perching with subtle bob (55-68%) */
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
        /* Prepare to fly - crouch (68-70%) */
        68% {
          opacity: 1;
          transform: scale(0.95) translateY(3px);
        }
        /* Disappear as flying canary takes over (70%) */
        70% {
          opacity: 0;
          transform: scale(1.1) translateY(-10px);
        }
        /* Stay hidden until next cycle */
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

      /* Subtle idle animation for perched bird - always runs when visible */
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
        /* Visible during flight in (0-48%) */
        0% { opacity: 1; transform: translateY(0); }
        45% { opacity: 1; transform: translateY(0); }
        /* Drop at landing (48-52%) */
        48% { opacity: 1; transform: translateY(0); }
        50% { opacity: 0; transform: translateY(15px); }
        /* Hidden while perched and departing (50-85%) */
        52%, 85% { opacity: 0; transform: translateY(15px); }
        /* New letter appears for next flight (85-100%) */
        88% { opacity: 0; transform: translateY(0); }
        92% { opacity: 1; transform: translateY(0); }
        100% { opacity: 1; transform: translateY(0); }
      }

      /* Letter dropping into postbox - synced with 20s loop */
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
        /* Hidden during flight */
        0%, 47% { opacity: 0; transform: translateY(-20px) rotate(-5deg); }
        /* Drop animation at landing (48-55%) */
        48% { opacity: 0; transform: translateY(-20px) rotate(-5deg); }
        49% { opacity: 1; transform: translateY(0) rotate(0deg); }
        52% { opacity: 1; transform: translateY(30px) rotate(5deg); }
        54% { opacity: 0; transform: translateY(45px) rotate(0deg); }
        /* Hidden for rest of cycle */
        100% { opacity: 0; transform: translateY(-20px) rotate(-5deg); }
      }

      /* ===== HERO SECTION ===== */
      .hero {
        position: relative;
        padding: 32px 7vw 80px;
        min-height: 90vh;
        background: radial-gradient(ellipse at 20% 20%, rgba(245, 197, 66, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%),
                    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      }

      .hero-bg-elements {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
      }

      .hero-gradient-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
      }

      .orb-1 {
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, rgba(245, 197, 66, 0.3) 0%, transparent 70%);
        top: -200px;
        left: -100px;
      }

      .orb-2 {
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%);
        bottom: -100px;
        right: -100px;
      }

      .orb-3 {
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(245, 197, 66, 0.15) 0%, transparent 70%);
        top: 50%;
        left: 60%;
      }

      .flight-path {
        position: absolute;
        top: 10%;
        left: 0;
        width: 100%;
        height: 60%;
        opacity: 0.5;
      }

      /* ===== NAVIGATION ===== */
      .nav {
        position: relative;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding-bottom: 40px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 22px;
        letter-spacing: -0.02em;
      }

      .brand-badge {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%);
        border: 2px solid rgba(251, 191, 36, 0.4);
        display: grid;
        place-items: center;
        box-shadow: 0 4px 12px rgba(218, 165, 32, 0.2);
      }

      .brand-badge.small {
        width: 36px;
        height: 36px;
        border-radius: 10px;
      }

      .brand-canary {
        width: 32px;
        height: 32px;
      }

      .nav-links {
        display: flex;
        gap: 24px;
        font-size: 14px;
        font-weight: 500;
        color: var(--muted);
      }

      .nav-links a {
        position: relative;
        padding: 8px 0;
        transition: color 0.2s ease;
      }

      .nav-links a:hover {
        color: var(--blue-500);
      }

      .nav-links a::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--yellow-500), var(--blue-500));
        transition: width 0.2s ease;
      }

      .nav-links a:hover::after {
        width: 100%;
      }

      .nav-cta {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      /* ===== BUTTONS ===== */
      .btn {
        border-radius: 999px;
        padding: 12px 24px;
        font-weight: 600;
        font-size: 14px;
        border: 1px solid transparent;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        text-decoration: none;
      }

      .btn.primary {
        background: linear-gradient(135deg, var(--yellow-500) 0%, #f9b53d 50%, #ffdd75 100%);
        color: var(--blue-900);
        box-shadow: 0 8px 24px rgba(245, 197, 66, 0.35);
      }

      .btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(245, 197, 66, 0.45);
      }

      .btn.ghost {
        background: rgba(255, 255, 255, 0.9);
        border-color: rgba(15, 23, 42, 0.15);
        color: var(--ink);
      }

      .btn.ghost:hover {
        background: #ffffff;
        border-color: var(--blue-300);
      }

      .btn.large {
        padding: 16px 32px;
        font-size: 16px;
      }

      .btn.full-width {
        width: 100%;
      }

      /* ===== HERO GRID ===== */
      .hero-grid {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        gap: 60px;
        align-items: center;
        margin-top: 20px;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        font-size: 12px;
        font-weight: 700;
        color: var(--blue-700);
        margin-bottom: 16px;
      }

      .pulse-dot {
        width: 8px;
        height: 8px;
        background: var(--green-500);
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
      }

      .hero h1 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: clamp(36px, 4.5vw, 60px);
        margin: 0 0 20px;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: var(--ink);
      }

      .hero p.lead {
        font-size: 18px;
        line-height: 1.7;
        color: var(--muted);
        max-width: 540px;
        margin: 0 0 28px;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 40px;
      }

      .hero-stats {
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 20px 24px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 16px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: var(--shadow-sm);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-number {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 28px;
        font-weight: 700;
        color: var(--blue-700);
      }

      .stat-label {
        font-size: 12px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-divider {
        width: 1px;
        height: 40px;
        background: rgba(15, 23, 42, 0.1);
      }

      /* ===== HERO MEDIA ===== */
      .hero-media {
        position: relative;
      }

      .dashboard-preview {
        background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 20px;
        box-shadow: var(--shadow);
        overflow: hidden;
        border: 1px solid rgba(15, 23, 42, 0.1);
      }

      .preview-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: #f1f5f9;
        border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      }

      .preview-dots {
        display: flex;
        gap: 6px;
      }

      .preview-dots span {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #e2e8f0;
      }

      .preview-dots span:nth-child(1) { background: #ef4444; }
      .preview-dots span:nth-child(2) { background: #f59e0b; }
      .preview-dots span:nth-child(3) { background: #22c55e; }

      .preview-title {
        font-size: 12px;
        color: var(--muted);
        font-weight: 500;
      }

      .preview-content {
        padding: 0;
      }

      .hero-video {
        width: 100%;
        display: block;
        border-radius: 0 0 20px 20px;
      }

      /* ===== DASHBOARD MOCKUP ===== */
      .dashboard-mockup {
        display: grid;
        grid-template-columns: 50px 1fr 140px;
        height: 380px;
        background: #f8fafc;
        border-radius: 0 0 20px 20px;
        overflow: hidden;
      }

      .mock-sidebar {
        background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
      }

      .mock-logo {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        border-radius: 8px;
        margin-bottom: 8px;
        display: grid;
        place-items: center;
      }

      .mock-canary-icon {
        width: 18px;
        height: 18px;
        background: #fbbf24;
        border-radius: 50% 50% 40% 40%;
        position: relative;
      }

      .mock-canary-icon::before {
        content: '';
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 12px;
        height: 12px;
        background: #fbbf24;
        border-radius: 50%;
      }

      .mock-nav-item {
        width: 32px;
        height: 32px;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        transition: all 0.2s;
        display: grid;
        place-items: center;
        color: rgba(255,255,255,0.6);
        position: relative;
        cursor: pointer;
      }

      .mock-nav-item:hover {
        background: rgba(255,255,255,0.2);
        color: white;
      }

      .mock-nav-item.active {
        background: rgba(255,255,255,0.25);
        box-shadow: inset 0 0 0 2px rgba(251, 191, 36, 0.5);
        color: white;
      }

      /* Sidebar tooltips */
      .mock-nav-item::after {
        content: attr(data-tooltip);
        position: absolute;
        left: calc(100% + 8px);
        top: 50%;
        transform: translateY(-50%) translateX(-8px);
        background: #1e293b;
        color: white;
        font-size: 10px;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s ease;
        z-index: 100;
      }

      .mock-nav-item:hover::after {
        opacity: 1;
        transform: translateY(-50%) translateX(0);
      }

      .mock-main {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #ffffff;
      }

      .mock-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mock-title {
        width: 120px;
        height: 20px;
        background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 100%);
        border-radius: 4px;
      }

      .mock-search {
        flex: 1;
        height: 32px;
        background: #f1f5f9;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .mock-avatar {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 50%;
      }

      .mock-stats-row {
        display: flex;
        gap: 10px;
      }

      .mock-stat-card {
        flex: 1;
        background: #f8fafc;
        border-radius: 10px;
        padding: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #e2e8f0;
      }

      .mock-stat-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: grid;
        place-items: center;
      }

      .mock-stat-icon.blue {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        color: #2563eb;
      }
      .mock-stat-icon.yellow {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        color: #d97706;
      }
      .mock-stat-icon.green {
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        color: #16a34a;
      }

      .mock-stat-content {
        flex: 1;
      }

      .mock-stat-number {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 16px;
        font-weight: 700;
        color: var(--ink);
        line-height: 1;
      }

      .mock-stat-label {
        font-size: 8px;
        color: #64748b;
        margin-top: 2px;
        font-weight: 500;
      }

      /* ===== CHARTS ROW ===== */
      .mock-charts-row {
        display: flex;
        gap: 10px;
        margin-bottom: 8px;
      }

      .mock-chart {
        flex: 1;
        background: #f8fafc;
        border-radius: 8px;
        padding: 8px;
        border: 1px solid #e2e8f0;
      }

      .chart-title {
        font-size: 8px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
      }

      /* Bar chart */
      .chart-bars {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .bar-row {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .bar-label {
        font-size: 7px;
        color: #64748b;
        width: 24px;
        text-align: right;
      }

      .bar-track {
        flex: 1;
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        border-radius: 3px;
        animation: barGrow 1.5s ease-out;
      }

      .bar-fill.fca { background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%); }
      .bar-fill.pra { background: linear-gradient(90deg, #7c3aed 0%, #8b5cf6 100%); }
      .bar-fill.eba { background: linear-gradient(90deg, #059669 0%, #10b981 100%); }
      .bar-fill.other { background: linear-gradient(90deg, #64748b 0%, #94a3b8 100%); }

      .bar-value {
        font-size: 7px;
        font-weight: 600;
        color: #475569;
        width: 14px;
      }

      @keyframes barGrow {
        from { width: 0; }
      }

      /* Donut chart */
      .donut-chart {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .donut {
        width: 50px;
        height: 50px;
        transform: rotate(-90deg);
      }

      .donut-segment {
        animation: donutFill 1.5s ease-out;
      }

      @keyframes donutFill {
        from { stroke-dasharray: 0 100; }
      }

      .donut-legend {
        display: flex;
        gap: 6px;
        margin-top: 4px;
      }

      .legend-item {
        font-size: 7px;
        font-weight: 600;
        padding: 2px 4px;
        border-radius: 2px;
      }

      .high-legend { background: #fee2e2; color: #dc2626; }
      .med-legend { background: #fef3c7; color: #d97706; }
      .low-legend { background: #dcfce7; color: #16a34a; }

      .mock-updates {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow: hidden;
        position: relative;
      }

      .mock-section-label {
        font-size: 10px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
      }

      .mock-updates-track {
        display: flex;
        flex-direction: column;
        gap: 4px;
        height: 120px;
        overflow: hidden;
        position: relative;
      }

      .mock-update-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        background: #ffffff;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        animation: slideCard 30s ease-in-out infinite;
        opacity: 0;
        transform: translateY(-100%);
        position: absolute;
        width: calc(100% - 4px);
        left: 2px;
        transition: background 0.2s;
      }

      .mock-update-item:hover {
        background: #f8fafc;
      }

      /* 6 cards, 3 visible at a time, 5s each */
      .mock-update-item.update-1 { animation-delay: 0s; top: 0; }
      .mock-update-item.update-2 { animation-delay: 0s; top: 40px; }
      .mock-update-item.update-3 { animation-delay: 0s; top: 80px; }
      .mock-update-item.update-4 { animation-delay: 15s; top: 0; }
      .mock-update-item.update-5 { animation-delay: 15s; top: 40px; }
      .mock-update-item.update-6 { animation-delay: 15s; top: 80px; }

      @keyframes slideCard {
        /* Start visible for first group, hidden for second */
        0% {
          opacity: 1;
          transform: translateY(0);
        }
        /* Stay visible */
        48% {
          opacity: 1;
          transform: translateY(0);
        }
        /* Fade out */
        50% {
          opacity: 0;
          transform: translateY(-10px);
        }
        /* Stay hidden */
        98% {
          opacity: 0;
          transform: translateY(10px);
        }
        /* Fade back in */
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .mock-update-badge {
        width: 4px;
        height: 32px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .mock-update-badge.high { background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%); }
      .mock-update-badge.medium { background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%); }
      .mock-update-badge.low { background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%); }

      .mock-update-content {
        flex: 1;
        min-width: 0;
      }

      .mock-update-title {
        font-size: 10px;
        font-weight: 500;
        color: #1e293b;
        line-height: 1.3;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mock-update-meta {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .mock-tag {
        font-size: 8px;
        font-weight: 700;
        color: #2563eb;
        background: #dbeafe;
        padding: 2px 5px;
        border-radius: 3px;
      }

      .mock-time {
        font-size: 8px;
        color: #94a3b8;
      }

      /* Update card action buttons */
      .mock-update-actions {
        display: flex;
        gap: 4px;
        opacity: 0.4;
        transition: opacity 0.2s;
      }

      .mock-update-item:hover .mock-update-actions {
        opacity: 1;
      }

      .mock-bookmark,
      .mock-share {
        width: 18px;
        height: 18px;
        border: none;
        background: transparent;
        color: #94a3b8;
        cursor: pointer;
        display: grid;
        place-items: center;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .mock-bookmark:hover,
      .mock-share:hover {
        background: #e2e8f0;
        color: #475569;
      }

      .mock-right-panel {
        background: #f8fafc;
        padding: 12px;
        border-left: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .mock-panel-title {
        font-size: 10px;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .mock-calendar {
        background: white;
        border-radius: 8px;
        padding: 8px;
        border: 1px solid #e2e8f0;
      }

      .mock-cal-header {
        font-size: 9px;
        font-weight: 600;
        color: #64748b;
        margin-bottom: 6px;
      }

      .mock-cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 3px;
      }

      .mock-cal-day {
        width: 14px;
        height: 14px;
        background: #f8fafc;
        border-radius: 4px;
        font-size: 7px;
        font-weight: 500;
        color: #64748b;
        display: grid;
        place-items: center;
        position: relative;
      }

      .mock-cal-day.deadline {
        background: #fef3c7;
        color: #92400e;
        font-weight: 600;
      }

      .cal-dot {
        position: absolute;
        bottom: 1px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        animation: calPulse 2s ease-in-out infinite;
      }

      .cal-dot.red { background: #ef4444; }
      .cal-dot.yellow { background: #f59e0b; }
      .cal-dot.green { background: #22c55e; animation-delay: 0.5s; }

      @keyframes calPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
      }

      .mock-ai-summary {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-radius: 8px;
        padding: 8px;
        border: 1px solid #bfdbfe;
        display: flex;
        gap: 8px;
        align-items: flex-start;
      }

      .mock-ai-icon {
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 6px;
        flex-shrink: 0;
        display: grid;
        place-items: center;
        color: white;
      }

      .mock-ai-content {
        flex: 1;
      }

      .mock-ai-text {
        font-size: 9px;
        color: #1e40af;
        line-height: 1.3;
        margin-bottom: 4px;
      }

      .mock-ai-link {
        font-size: 8px;
        color: #2563eb;
        font-weight: 600;
        cursor: pointer;
      }

      .mock-ai-link:hover {
        text-decoration: underline;
      }

      /* Animated shimmer effect on mockup */
      .dashboard-mockup::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: shimmer 3s ease-in-out infinite;
        pointer-events: none;
      }

      @keyframes shimmer {
        0% { left: -100%; }
        50%, 100% { left: 200%; }
      }

      /* ===== FLOATING NOTIFICATION CARDS ===== */
      .floating-card {
        position: absolute;
        background: var(--card);
        border-radius: 12px;
        padding: 10px 12px;
        box-shadow: var(--shadow-md);
        border: 1px solid rgba(15, 23, 42, 0.08);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: float 4s ease-in-out infinite;
        z-index: 5;
        max-width: 180px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .floating-card:hover {
        transform: scale(1.05);
        box-shadow: var(--shadow-lg);
      }

      .floating-card .card-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .alert-card {
        left: -8%;
        top: -5%;
        animation-delay: 0s;
      }

      .alert-card .card-icon {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: var(--red-500);
      }

      .delivery-card {
        right: -8%;
        top: 15%;
        animation-delay: 1.3s;
      }

      .delivery-card .card-icon {
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        color: var(--green-500);
      }

      .ai-card {
        left: -8%;
        bottom: 15%;
        animation-delay: 2.6s;
      }

      .ai-card .card-icon {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        color: var(--blue-500);
      }

      .card-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .card-content strong {
        font-size: 11px;
        color: var(--ink);
        font-weight: 600;
      }

      .card-content span {
        font-size: 9px;
        color: var(--muted);
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }

      /* ===== HERO LOGOS ===== */
      .hero-logos {
        margin-top: 60px;
        padding-top: 40px;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
        text-align: center;
      }

      .logos-label {
        font-size: 13px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .logos-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 40px;
        margin-top: 20px;
        flex-wrap: wrap;
      }

      .logo-item {
        font-size: 14px;
        font-weight: 600;
        color: #94a3b8;
        padding: 8px 16px;
        background: rgba(148, 163, 184, 0.1);
        border-radius: 8px;
      }

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

      /* ===== FOOTER ===== */
      .footer {
        padding: 60px 7vw 40px;
        background: #f8fafc;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        gap: 48px;
        flex-wrap: wrap;
        margin-bottom: 40px;
      }

      .footer-brand {
        max-width: 280px;
      }

      .footer-tagline {
        font-size: 14px;
        color: var(--muted);
        margin: 12px 0 0;
      }

      .footer-links {
        display: flex;
        gap: 48px;
        flex-wrap: wrap;
      }

      .footer-col {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .footer-col h5 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 14px;
        font-weight: 700;
        margin: 0 0 8px;
        color: var(--ink);
      }

      .footer-col a {
        font-size: 14px;
        color: var(--muted);
        transition: color 0.2s ease;
      }

      .footer-col a:hover {
        color: var(--blue-500);
      }

      .footer-bottom {
        padding-top: 24px;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
        text-align: center;
      }

      .footer-bottom span {
        font-size: 13px;
        color: var(--muted);
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

      /* ===== FEATURE MODAL ===== */
      .feature-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .feature-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .feature-modal {
        background: var(--card);
        border-radius: 24px;
        padding: 32px;
        max-width: 560px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 40px 100px rgba(15, 23, 42, 0.3);
        transform: translateY(20px) scale(0.95);
        transition: transform 0.3s ease;
        position: relative;
      }

      .feature-modal-overlay.active .feature-modal {
        transform: translateY(0) scale(1);
      }

      .modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #f1f5f9;
        color: var(--muted);
        font-size: 24px;
        cursor: pointer;
        display: grid;
        place-items: center;
        transition: background 0.2s ease, color 0.2s ease;
      }

      .modal-close:hover {
        background: #e2e8f0;
        color: var(--ink);
      }

      .modal-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .modal-icon {
        width: 64px;
        height: 64px;
        flex-shrink: 0;
      }

      .modal-icon svg {
        width: 100%;
        height: 100%;
      }

      .modal-header h3 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 24px;
        margin: 0;
        color: var(--ink);
      }

      .modal-demo {
        background: #f8fafc;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        min-height: 160px;
        border: 1px solid rgba(15, 23, 42, 0.08);
      }

      .modal-benefits h4 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 16px;
        margin: 0 0 12px;
        color: var(--ink);
      }

      .modal-benefits ul {
        list-style: none;
        padding: 0;
        margin: 0 0 24px;
      }

      .modal-benefits li {
        font-size: 14px;
        color: var(--muted);
        padding: 8px 0;
        padding-left: 24px;
        position: relative;
        border-bottom: 1px solid rgba(15, 23, 42, 0.06);
      }

      .modal-benefits li:last-child {
        border-bottom: none;
      }

      .modal-benefits li::before {
        content: '';
        position: absolute;
        left: 0;
        top: 14px;
        width: 8px;
        height: 8px;
        background: var(--green-500);
        border-radius: 50%;
      }

      /* ===== MODAL DEMO ANIMATIONS ===== */

      /* Horizon Scanning Demo */
      .demo-scanning {
        display: flex;
        gap: 24px;
        align-items: center;
      }

      .scan-radar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        position: relative;
        overflow: hidden;
      }

      .scan-line {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 50%;
        height: 2px;
        background: linear-gradient(90deg, #2563eb, transparent);
        transform-origin: left center;
        animation: radarScan 2s linear infinite;
      }

      @keyframes radarScan {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .scan-dot {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #2563eb;
        border-radius: 50%;
        animation: blip 2s ease-in-out infinite;
      }

      .scan-dot.d1 { top: 20%; left: 60%; animation-delay: 0s; }
      .scan-dot.d2 { top: 50%; left: 30%; animation-delay: 0.7s; }
      .scan-dot.d3 { top: 70%; left: 65%; animation-delay: 1.4s; }

      @keyframes blip {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
      }

      .scan-feed {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .scan-item {
        background: white;
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        animation: slideInRight 0.5s ease-out;
      }

      .scan-item:nth-child(2) { animation-delay: 0.2s; }
      .scan-item:nth-child(3) { animation-delay: 0.4s; }

      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }

      .scan-reg {
        font-size: 10px;
        font-weight: 700;
        color: #2563eb;
        background: #dbeafe;
        padding: 3px 8px;
        border-radius: 4px;
      }

      .scan-text {
        font-size: 12px;
        color: var(--muted);
      }

      /* AI Summaries Demo */
      .demo-ai {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .ai-input {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ai-doc {
        background: #e2e8f0;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 12px;
        color: var(--muted);
      }

      .ai-arrow {
        font-size: 24px;
        color: var(--blue-500);
        animation: arrowPulse 1s ease-in-out infinite;
      }

      @keyframes arrowPulse {
        0%, 100% { transform: translateX(0); opacity: 1; }
        50% { transform: translateX(8px); opacity: 0.5; }
      }

      .ai-summary-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        animation: fadeInUp 0.5s ease-out 0.3s both;
      }

      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .ai-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 999px;
        margin-bottom: 8px;
      }

      .ai-badge.high {
        background: #fee2e2;
        color: #dc2626;
      }

      .ai-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--ink);
        margin-bottom: 6px;
      }

      .ai-excerpt {
        font-size: 12px;
        color: var(--muted);
        line-height: 1.5;
        margin-bottom: 10px;
      }

      .ai-sectors {
        display: flex;
        gap: 6px;
      }

      .ai-sectors span {
        font-size: 10px;
        background: #f1f5f9;
        padding: 3px 8px;
        border-radius: 4px;
        color: var(--muted);
      }

      /* Calendar Demo */
      .demo-calendar {
        text-align: center;
      }

      .cal-month {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 600;
        font-size: 14px;
        color: var(--ink);
        margin-bottom: 12px;
      }

      .cal-grid {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 16px;
      }

      .cal-day {
        width: 48px;
        height: 48px;
        background: white;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: var(--ink);
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }

      .cal-day.deadline {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        color: #dc2626;
      }

      .cal-day.impl {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        color: #92400e;
      }

      .cal-day span {
        font-size: 8px;
        font-weight: 700;
        margin-top: 2px;
      }

      .cal-legend {
        display: flex;
        justify-content: center;
        gap: 16px;
      }

      .legend-item {
        font-size: 10px;
        color: var(--muted);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .legend-item::before {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 3px;
      }

      .legend-item.deadline::before {
        background: #fee2e2;
      }

      .legend-item.impl::before {
        background: #fef3c7;
      }

      /* Watchlist Demo */
      .demo-watchlist {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .wl-filter {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .wl-tag {
        font-size: 11px;
        padding: 6px 12px;
        border-radius: 999px;
        background: #e2e8f0;
        color: var(--muted);
        transition: all 0.2s ease;
      }

      .wl-tag.active {
        background: #2563eb;
        color: white;
      }

      .wl-result {
        background: white;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      }

      .wl-count {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 36px;
        font-weight: 700;
        color: var(--blue-500);
        animation: countUp 1s ease-out;
      }

      @keyframes countUp {
        from { opacity: 0; transform: scale(0.5); }
        to { opacity: 1; transform: scale(1); }
      }

      .wl-label {
        font-size: 12px;
        color: var(--muted);
      }

      /* Dossier Demo */
      .demo-dossier {
        display: flex;
        justify-content: center;
      }

      .dossier-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        width: 100%;
        max-width: 320px;
      }

      .dossier-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--ink);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #6366f1;
      }

      .dossier-items {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }

      .dossier-item {
        font-size: 12px;
        color: var(--muted);
        padding: 6px 10px;
        background: #f8fafc;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dossier-item::before {
        content: '';
        width: 6px;
        height: 6px;
        background: #6366f1;
        border-radius: 2px;
      }

      .dossier-meta {
        font-size: 10px;
        color: #94a3b8;
      }

      /* Kanban Demo */
      .demo-kanban {
        display: flex;
        gap: 12px;
      }

      .kanban-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .kanban-header {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 6px 10px;
        border-radius: 6px;
        text-align: center;
      }

      .kanban-header.red { background: #fee2e2; color: #dc2626; }
      .kanban-header.yellow { background: #fef3c7; color: #92400e; }
      .kanban-header.green { background: #dcfce7; color: #16a34a; }

      .kanban-card {
        background: white;
        border-radius: 6px;
        padding: 10px;
        font-size: 11px;
        color: var(--ink);
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        animation: cardDrop 0.4s ease-out;
      }

      @keyframes cardDrop {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Analytics Demo */
      .demo-analytics {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .analytics-chart {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: 12px;
        height: 80px;
        padding: 0 20px;
      }

      .chart-bar {
        width: 40px;
        background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 4px 4px 0 0;
        animation: barGrow 1s ease-out;
      }

      @keyframes barGrow {
        from { height: 0 !important; }
      }

      .chart-bar.b1 { animation-delay: 0s; }
      .chart-bar.b2 { animation-delay: 0.15s; }
      .chart-bar.b3 { animation-delay: 0.3s; }
      .chart-bar.b4 { animation-delay: 0.45s; }
      .chart-bar.b5 { animation-delay: 0.6s; }

      .analytics-stats {
        display: flex;
        justify-content: center;
        gap: 24px;
      }

      .analytics-stats .stat {
        font-size: 12px;
        color: var(--muted);
        padding: 8px 12px;
        background: white;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }

      /* Digest Demo */
      .demo-digest {
        display: flex;
        justify-content: center;
      }

      .digest-email {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        width: 100%;
        max-width: 360px;
      }

      .digest-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .digest-from {
        font-size: 12px;
        font-weight: 600;
        color: var(--ink);
      }

      .digest-time {
        font-size: 10px;
        color: #94a3b8;
      }

      .digest-subject {
        font-size: 14px;
        font-weight: 600;
        color: var(--ink);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
      }

      .digest-preview {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .digest-item {
        font-size: 11px;
        padding: 8px 10px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .digest-item::before {
        content: '';
        width: 4px;
        height: 100%;
        min-height: 16px;
        border-radius: 2px;
      }

      .digest-item.high {
        background: #fef2f2;
      }
      .digest-item.high::before { background: #ef4444; }

      .digest-item.medium {
        background: #fffbeb;
      }
      .digest-item.medium::before { background: #f59e0b; }

      .digest-item.low {
        background: #f0fdf4;
      }
      .digest-item.low::before { background: #22c55e; }

      /* ===== ANIMATIONS ===== */
      .fade-in-up {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }

      .fade-in-up.visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* ===== RESPONSIVE ===== */
      @media (max-width: 1024px) {
        .hero-grid {
          grid-template-columns: 1fr;
          gap: 48px;
        }

        .hero-media {
          order: -1;
        }

        .coverage-content {
          grid-template-columns: 1fr;
        }

        .coverage-stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }

        .step-connector {
          display: none;
        }
      }

      @media (max-width: 768px) {
        .nav-links {
          display: none;
        }

        .hero {
          padding: 24px 5vw 60px;
        }

        .section {
          padding: 60px 5vw;
        }

        .hero-stats {
          flex-direction: column;
          gap: 16px;
          text-align: center;
        }

        .stat-divider {
          width: 60px;
          height: 1px;
        }

        .cta-band {
          margin: 40px 5vw 60px;
          padding: 32px 24px;
        }

        .flying-canary-container {
          width: 70px;
          height: 56px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .flying-canary-container,
        .pulse-dot,
        .floating-card,
        .cal-dot {
          animation: none;
        }

        .fade-in-up {
          opacity: 1;
          transform: none;
        }

        .mock-update-item {
          animation: none;
          opacity: 1;
          transform: none;
        }
      }

      /* Hide floating cards on smaller screens to avoid overlap */
      @media (max-width: 1024px) {
        .floating-card {
          display: none;
        }
      }
    </style>
  `
}

module.exports = { getMarketingStyles }
