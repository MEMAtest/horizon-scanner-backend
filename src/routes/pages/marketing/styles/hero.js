// Hero section styles: navigation, buttons, hero grid, hero media
function getHeroStyles() {
  return `
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
  `;
}

module.exports = { getHeroStyles };
