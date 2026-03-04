(function () {
  var STORAGE_KEY = 'rc-cookie-consent';

  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveConsent(analytics) {
    var consent = {
      essential: true,
      analytics: analytics,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  }

  function removeBanner() {
    var el = document.getElementById('rc-cookie-banner');
    if (el) el.parentNode.removeChild(el);
  }

  function createBanner() {
    var style = document.createElement('style');
    style.textContent =
      '#rc-cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;' +
      'background:#0f172a;border-top:3px solid #3b82f6;box-shadow:0 -2px 10px rgba(0,0,0,0.3);' +
      'padding:16px 24px;font-family:Inter,system-ui,sans-serif}' +
      '#rc-cookie-banner .rc-cb-inner{max-width:960px;margin:0 auto;display:flex;' +
      'flex-wrap:wrap;align-items:center;gap:16px}' +
      '#rc-cookie-banner p{flex:1;min-width:280px;margin:0;color:#d1d5db;font-size:14px;line-height:1.5}' +
      '#rc-cookie-banner a{color:#3b82f6;text-decoration:underline}' +
      '#rc-cookie-banner .rc-cb-btns{display:flex;gap:8px;flex-shrink:0}' +
      '#rc-cookie-banner button{padding:8px 16px;font-size:14px;border-radius:6px;cursor:pointer;' +
      'font-family:inherit}' +
      '#rc-cookie-banner .rc-btn-ess{border:1px solid #475569;background:transparent;color:#d1d5db}' +
      '#rc-cookie-banner .rc-btn-all{border:none;background:#3b82f6;color:#fff}';
    document.head.appendChild(style);

    var banner = document.createElement('div');
    banner.id = 'rc-cookie-banner';
    banner.innerHTML =
      '<div class="rc-cb-inner">' +
      '<p>We use cookies to keep you logged in and improve your experience. ' +
      'Essential cookies are always active. ' +
      '<a href="/about">Learn more</a></p>' +
      '<div class="rc-cb-btns">' +
      '<button class="rc-btn-ess" id="rc-btn-essential">Essential Only</button>' +
      '<button class="rc-btn-all" id="rc-btn-accept">Accept All</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(banner);

    document.getElementById('rc-btn-essential').addEventListener('click', function () {
      saveConsent(false);
      removeBanner();
    });

    document.getElementById('rc-btn-accept').addEventListener('click', function () {
      saveConsent(true);
      removeBanner();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (!getConsent()) createBanner();
    });
  } else {
    if (!getConsent()) createBanner();
  }
})();
