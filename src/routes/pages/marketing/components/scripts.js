// Client-side JavaScript for marketing page
const { getFeatureDataScript } = require('./modal.js');

function getMarketingScripts() {
  return `
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
      ${getFeatureDataScript()}

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
  `;
}


module.exports = { getMarketingScripts };
