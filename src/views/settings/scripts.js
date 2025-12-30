function getSettingsScripts() {
  return `
    <script>
      // Settings Page Scripts
      (function() {
        const SettingsPage = {
          state: {
            activeTab: 'notifications',
            activeFilter: 'all',
            notifications: [],
            loading: false
          },

          init() {
            this.bindEvents();
            this.initFromUrl();
          },

          bindEvents() {
            // Tab switching
            document.querySelectorAll('.settings-tab').forEach(tab => {
              tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
              });
            });

            // Filter tabs
            document.querySelectorAll('.filter-tab').forEach(tab => {
              tab.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.switchFilter(filter);
              });
            });

            // Bulk actions
            const markAllBtn = document.getElementById('markAllReadBtn');
            if (markAllBtn) {
              markAllBtn.addEventListener('click', () => this.markAllRead());
            }

            const dismissAllBtn = document.getElementById('dismissAllBtn');
            if (dismissAllBtn) {
              dismissAllBtn.addEventListener('click', () => this.dismissAll());
            }

            const refreshBtn = document.getElementById('refreshNotificationsBtn');
            if (refreshBtn) {
              refreshBtn.addEventListener('click', () => this.refreshNotifications());
            }

            // Individual notification actions (delegated)
            document.addEventListener('click', (e) => {
              const btn = e.target.closest('[data-notification-action]');
              if (!btn) return;

              const action = btn.dataset.notificationAction;
              const id = btn.dataset.notificationId;

              if (action === 'view') {
                const url = btn.dataset.actionUrl;
                if (url) window.location.href = url;
              } else if (action === 'read') {
                this.markRead(id);
              } else if (action === 'dismiss') {
                this.dismiss(id);
              }
            });
          },

          initFromUrl() {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab && ['notifications', 'preferences', 'account'].includes(tab)) {
              this.switchTab(tab, false);
            }
          },

          switchTab(tabId, updateUrl = true) {
            this.state.activeTab = tabId;

            // Update tab buttons
            document.querySelectorAll('.settings-tab').forEach(tab => {
              tab.classList.toggle('active', tab.dataset.tab === tabId);
            });

            // Update tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => {
              panel.classList.toggle('active', panel.id === tabId + '-panel');
            });

            // Update URL
            if (updateUrl) {
              const url = new URL(window.location);
              url.searchParams.set('tab', tabId);
              window.history.replaceState({}, '', url);
            }
          },

          switchFilter(filter) {
            this.state.activeFilter = filter;

            // Update filter tabs
            document.querySelectorAll('.filter-tab').forEach(tab => {
              tab.classList.toggle('active', tab.dataset.filter === filter);
            });

            // Filter notifications visually
            document.querySelectorAll('.notification-card').forEach(card => {
              const type = card.dataset.type;
              const show = filter === 'all' || type === filter;
              card.style.display = show ? '' : 'none';
            });
          },

          async markRead(id) {
            try {
              const response = await fetch('/api/notifications/' + encodeURIComponent(id) + '/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });

              const data = await response.json();
              if (data.success) {
                const card = document.querySelector('.notification-card[data-id="' + id + '"]');
                if (card) {
                  card.classList.remove('unread');
                  const readBtn = card.querySelector('[data-notification-action="read"]');
                  if (readBtn) readBtn.remove();
                }
                this.updateUnreadCount(-1);
              }
            } catch (error) {
              console.error('Failed to mark notification read:', error);
            }
          },

          async dismiss(id) {
            try {
              const response = await fetch('/api/notifications/' + encodeURIComponent(id) + '/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });

              const data = await response.json();
              if (data.success) {
                const card = document.querySelector('.notification-card[data-id="' + id + '"]');
                if (card) {
                  card.style.opacity = '0';
                  card.style.transform = 'translateX(20px)';
                  setTimeout(() => card.remove(), 200);
                }
              }
            } catch (error) {
              console.error('Failed to dismiss notification:', error);
            }
          },

          async markAllRead() {
            const btn = document.getElementById('markAllReadBtn');
            if (btn) btn.disabled = true;

            try {
              const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });

              const data = await response.json();
              if (data.success) {
                document.querySelectorAll('.notification-card.unread').forEach(card => {
                  card.classList.remove('unread');
                  const readBtn = card.querySelector('[data-notification-action="read"]');
                  if (readBtn) readBtn.remove();
                });
                this.updateUnreadCount(0, true);
                this.showMessage('All notifications marked as read', 'success');
              }
            } catch (error) {
              console.error('Failed to mark all read:', error);
              this.showMessage('Failed to mark all as read', 'error');
            } finally {
              if (btn) btn.disabled = false;
            }
          },

          async dismissAll() {
            if (!confirm('Are you sure you want to dismiss all notifications?')) return;

            const btn = document.getElementById('dismissAllBtn');
            if (btn) btn.disabled = true;

            try {
              const response = await fetch('/api/notifications/dismiss-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });

              const data = await response.json();
              if (data.success) {
                const list = document.querySelector('.notifications-list');
                if (list) {
                  list.innerHTML = this.renderEmptyState();
                }
                this.updateUnreadCount(0, true);
                this.showMessage('All notifications dismissed', 'success');
              }
            } catch (error) {
              console.error('Failed to dismiss all:', error);
              this.showMessage('Failed to dismiss all notifications', 'error');
            } finally {
              if (btn) btn.disabled = false;
            }
          },

          async refreshNotifications() {
            const btn = document.getElementById('refreshNotificationsBtn');
            if (btn) {
              btn.disabled = true;
              btn.querySelector('svg')?.classList.add('animate-spin');
            }

            try {
              const response = await fetch('/api/notifications?limit=50');
              const data = await response.json();

              if (data.success) {
                const list = document.querySelector('.notifications-list');
                if (list && data.data) {
                  if (data.data.length === 0) {
                    list.innerHTML = this.renderEmptyState();
                  } else {
                    list.innerHTML = data.data.map(n => this.renderNotificationCard(n)).join('');
                  }
                }

                // Update unread count
                const countResponse = await fetch('/api/notifications/unread-count');
                const countData = await countResponse.json();
                if (countData.success && countData.data) {
                  this.updateUnreadCount(countData.data.count, true);
                }

                this.showMessage('Notifications refreshed', 'success');
              }
            } catch (error) {
              console.error('Failed to refresh notifications:', error);
              this.showMessage('Failed to refresh', 'error');
            } finally {
              if (btn) {
                btn.disabled = false;
                btn.querySelector('svg')?.classList.remove('animate-spin');
              }
            }
          },

          updateUnreadCount(delta, absolute = false) {
            const badge = document.querySelector('.settings-tab .tab-badge');
            const countEl = document.querySelector('.notifications-count');

            if (absolute) {
              if (badge) badge.textContent = delta;
              if (countEl) countEl.textContent = delta + ' total';
            } else {
              if (badge) {
                const current = parseInt(badge.textContent) || 0;
                badge.textContent = Math.max(0, current + delta);
              }
            }
          },

          renderNotificationCard(n) {
            const id = n.id || '';
            const title = this.escapeHtml(n.title || 'Notification');
            const message = this.escapeHtml(n.message || '');
            const type = n.type || 'system';
            const time = this.formatTimeAgo(n.created_at || n.createdAt);
            const unread = n.read === false || n.read === 0;
            const actionUrl = n.action_url || n.actionUrl || '';

            return '<div class="notification-card ' + (unread ? 'unread' : '') + '" data-id="' + id + '" data-type="' + type + '">' +
              '<div class="notification-card-header">' +
                '<h3 class="notification-card-title">' + title + '</h3>' +
                '<span class="notification-card-time">' + time + '</span>' +
              '</div>' +
              '<p class="notification-card-message">' + message + '</p>' +
              '<div class="notification-card-footer">' +
                '<div class="notification-card-type">' +
                  '<span class="notification-type-badge ' + type + '">' + this.formatType(type) + '</span>' +
                '</div>' +
                '<div class="notification-card-actions">' +
                  (actionUrl ? '<button class="notification-card-btn primary" data-notification-action="view" data-notification-id="' + id + '" data-action-url="' + this.escapeHtml(actionUrl) + '">View</button>' : '') +
                  (unread ? '<button class="notification-card-btn" data-notification-action="read" data-notification-id="' + id + '">Mark Read</button>' : '') +
                  '<button class="notification-card-btn danger" data-notification-action="dismiss" data-notification-id="' + id + '">Dismiss</button>' +
                '</div>' +
              '</div>' +
            '</div>';
          },

          renderEmptyState() {
            return '<div class="notifications-empty">' +
              '<svg class="notifications-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path>' +
                '<path d="M13.7 21a2 2 0 01-3.4 0"></path>' +
              '</svg>' +
              '<h3>No notifications</h3>' +
              '<p>You\\'re all caught up! New notifications will appear here.</p>' +
            '</div>';
          },

          formatType(type) {
            const types = {
              watch_list_match: 'Watch List',
              enforcement: 'Enforcement',
              system: 'System',
              fca_fine: 'FCA Fine'
            };
            return types[type] || type;
          },

          formatTimeAgo(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';

            const deltaMs = Date.now() - date.getTime();
            const mins = Math.floor(deltaMs / 60000);
            if (mins < 1) return 'Just now';
            if (mins < 60) return mins + 'm ago';
            const hours = Math.floor(mins / 60);
            if (hours < 24) return hours + 'h ago';
            const days = Math.floor(hours / 24);
            if (days < 7) return days + 'd ago';
            return date.toLocaleDateString();
          },

          escapeHtml(str) {
            if (!str) return '';
            return String(str)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          },

          showMessage(message, type) {
            if (typeof window.showMessage === 'function') {
              window.showMessage(message, type);
            } else {
              console.log('[Settings]', type + ':', message);
            }
          }
        };

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => SettingsPage.init());
        } else {
          SettingsPage.init();
        }

        // Expose for debugging
        window.SettingsPage = SettingsPage;
      })();
    </script>
  `
}

module.exports = { getSettingsScripts }
