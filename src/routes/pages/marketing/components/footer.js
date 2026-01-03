// Footer component
function getFooter() {
  return `
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
  `;
}


module.exports = { getFooter };
