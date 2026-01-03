// Footer styles
function getFooterStyles() {
  return `
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
  `;
}


module.exports = { getFooterStyles };
