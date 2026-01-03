// Responsive styles and general animations
function getResponsiveStyles() {
  return `
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
  `;
}


module.exports = { getResponsiveStyles };
