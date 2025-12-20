// In-app Notifications Module
// Lightweight UI for the /api/notifications endpoints.

(function() {
  const NotificationsModule = (function() {
    const state = {
      initialized: false,
      loadedOnce: false,
      unreadCount: 0,
      notifications: [],
      knownIds: new Set()
    };

    const selectors = {
      bell: 'notificationBell',
      badge: 'notificationBadge',
      center: 'notificationCenter',
      list: 'notificationList'
    };

    function safeText(value) {
      return value == null ? '' : String(value);
    }

    function escapeHtml(value) {
      return safeText(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function showMessage(message, type) {
      if (typeof window !== 'undefined' && typeof window.showMessage === 'function') {
        window.showMessage(message, type || 'info');
        return;
      }
      console.log('[Notifications]', message);
    }

    function formatTimeAgo(timestamp) {
      if (!timestamp) return '—';
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return '—';

      const deltaMs = Date.now() - date.getTime();
      const mins = Math.floor(deltaMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return mins + 'm ago';
      const hours = Math.floor(mins / 60);
      if (hours < 24) return hours + 'h ago';
      const days = Math.floor(hours / 24);
      return days + 'd ago';
    }

    function getEl(id) {
      return document.getElementById(id);
    }

    function isOpen() {
      const center = getEl(selectors.center);
      return Boolean(center && center.classList.contains('open'));
    }

    function setOpen(open) {
      const center = getEl(selectors.center);
      if (!center) return;
      center.classList.toggle('open', Boolean(open));
      if (open) {
        refresh({ silent: true });
      }
    }

    function updateBadge() {
      const badge = getEl(selectors.badge);
      if (!badge) return;
      const count = state.unreadCount || 0;
      badge.textContent = String(count);
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
      badge.setAttribute('aria-label', count > 0 ? (count + ' unread notifications') : 'No unread notifications');
    }

    function renderList() {
      const list = getEl(selectors.list);
      if (!list) return;

      if (!Array.isArray(state.notifications) || state.notifications.length === 0) {
        list.innerHTML = '<div style="padding: 18px; text-align: center; color: #6b7280; font-size: 13px;">No notifications yet</div>';
        return;
      }

      const itemsHtml = state.notifications.map(n => {
        const id = safeText(n.id);
        const title = escapeHtml(n.title || 'Notification');
        const message = escapeHtml(n.message || '');
        const time = formatTimeAgo(n.created_at || n.createdAt || n.timestamp);
        const unread = n.read === false || n.read === 0 || n.read === 'false';
        const actionUrl = safeText(n.action_url || n.actionUrl || '');
        const actionLabel = escapeHtml(n.action_label || n.actionLabel || (actionUrl ? 'View' : ''));

        const viewButton = actionUrl
          ? '<button class="btn-small" data-action="view" data-id="' + escapeHtml(id) + '"> ' + actionLabel + ' </button>'
          : '';
        const readButton = unread
          ? '<button class="btn-small" data-action="read" data-id="' + escapeHtml(id) + '">Mark read</button>'
          : '';
        const dismissButton =
          '<button class="btn-small btn-danger-outline" data-action="dismiss" data-id="' + escapeHtml(id) + '">Dismiss</button>';

        return (
          '<div class="notification-item ' + (unread ? 'unread' : '') + '" data-id="' + escapeHtml(id) + '">' +
            '<div class="notification-title">' + title + '</div>' +
            (message ? '<div class="notification-message">' + message + '</div>' : '') +
            '<div class="notification-meta">' +
              '<div>' + escapeHtml(time) + '</div>' +
              '<div class="notification-actions">' + viewButton + readButton + dismissButton + '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      list.innerHTML = itemsHtml;

      list.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', async (event) => {
          event.preventDefault();
          const action = btn.dataset.action;
          const id = btn.dataset.id;
          const notification = state.notifications.find(n => safeText(n.id) === safeText(id));
          if (!notification) return;
          if (action === 'view') {
            const url = notification.action_url || notification.actionUrl;
            if (url) window.location.href = url;
            return;
          }
          if (action === 'read') {
            await markRead(id);
            return;
          }
          if (action === 'dismiss') {
            await dismiss(id);
          }
        });
      });
    }

    async function safeFetchJson(url, options) {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));
      return { response, data };
    }

    async function fetchNotifications() {
      const { response, data } = await safeFetchJson('/api/notifications?limit=30', {});
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load notifications');
      }
      state.notifications = Array.isArray(data.data) ? data.data : [];
    }

    async function fetchUnreadCount() {
      const { response, data } = await safeFetchJson('/api/notifications/unread-count', {});
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load unread count');
      }
      state.unreadCount = Number(data.data && data.data.count) || 0;
    }

    function detectNewNotifications() {
      const nextIds = new Set();
      const newOnes = [];

      for (const n of state.notifications) {
        const id = safeText(n && n.id);
        if (!id) continue;
        nextIds.add(id);
        if (!state.knownIds.has(id)) {
          newOnes.push(n);
        }
      }

      state.knownIds = nextIds;
      return newOnes;
    }

    async function refresh(options = {}) {
      try {
        await Promise.all([fetchNotifications(), fetchUnreadCount()]);
        updateBadge();
        renderList();

        const newlyFetched = detectNewNotifications();
        if (state.loadedOnce && !options.silent && newlyFetched.length > 0) {
          showMessage('New notification' + (newlyFetched.length === 1 ? '' : 's') + ' received', 'info');
        }

        state.loadedOnce = true;
      } catch (error) {
        console.warn('[Notifications] Refresh failed:', error);
      }
    }

    async function markRead(notificationId) {
      const id = safeText(notificationId);
      if (!id) return;
      const { response, data } = await safeFetchJson('/api/notifications/' + encodeURIComponent(id) + '/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok || !data.success) {
        showMessage(data.error || 'Failed to mark read', 'error');
        return;
      }
      await refresh({ silent: true });
    }

    async function dismiss(notificationId) {
      const id = safeText(notificationId);
      if (!id) return;
      const { response, data } = await safeFetchJson('/api/notifications/' + encodeURIComponent(id) + '/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok || !data.success) {
        showMessage(data.error || 'Failed to dismiss notification', 'error');
        return;
      }
      await refresh({ silent: true });
    }

    async function markAllRead() {
      const { response, data } = await safeFetchJson('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok || !data.success) {
        showMessage(data.error || 'Failed to mark all read', 'error');
        return;
      }
      await refresh({ silent: true });
    }

    async function dismissAll() {
      const { response, data } = await safeFetchJson('/api/notifications/dismiss-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok || !data.success) {
        showMessage(data.error || 'Failed to dismiss all', 'error');
        return;
      }
      await refresh({ silent: true });
    }

    function injectUi() {
      if (getEl(selectors.bell) || getEl(selectors.center)) return;

      const bellContainer = document.createElement('div');
      bellContainer.className = 'notification-bell-container';
      bellContainer.innerHTML = `
        <button id="${selectors.bell}" class="notification-bell" type="button" aria-label="Notifications" title="Notifications">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path>
            <path d="M13.7 21a2 2 0 01-3.4 0"></path>
          </svg>
          <span id="${selectors.badge}" class="notification-badge" style="display:none;">0</span>
        </button>
      `;
      document.body.appendChild(bellContainer);

      const center = document.createElement('div');
      center.id = selectors.center;
      center.className = 'notification-center';
      center.innerHTML = `
        <div class="notification-header">
          <h3>Notifications</h3>
          <div class="notification-header-actions">
            <button class="btn-small" data-role="refresh">Refresh</button>
            <button class="btn-small" data-role="read-all">Read all</button>
            <button class="btn-small btn-danger-outline" data-role="dismiss-all">Dismiss all</button>
            <button class="btn-small" data-role="close">Close</button>
          </div>
        </div>
        <div id="${selectors.list}" class="notification-list"></div>
      `;
      document.body.appendChild(center);

      getEl(selectors.bell).addEventListener('click', () => setOpen(!isOpen()));

      center.querySelector('[data-role="close"]').addEventListener('click', () => setOpen(false));
      center.querySelector('[data-role="refresh"]').addEventListener('click', () => refresh({ silent: true }));
      center.querySelector('[data-role="read-all"]').addEventListener('click', () => markAllRead());
      center.querySelector('[data-role="dismiss-all"]').addEventListener('click', () => dismissAll());

      document.addEventListener('click', (event) => {
        if (!isOpen()) return;
        const target = event.target;
        if (!target) return;
        if (target.closest('#' + selectors.center) || target.closest('#' + selectors.bell)) return;
        setOpen(false);
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isOpen()) setOpen(false);
      });
    }

    function init() {
      if (state.initialized) return;
      state.initialized = true;
      injectUi();
      refresh({ silent: true });
      setInterval(() => refresh({ silent: true }), 60 * 1000);
    }

    return { init, refresh, open: () => setOpen(true), close: () => setOpen(false) };
  })();

  window.NotificationsModule = NotificationsModule;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationsModule.init(), { once: true });
  } else {
    NotificationsModule.init();
  }
})();

