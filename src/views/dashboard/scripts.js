const { serializeForScript } = require('./helpers')

function getDashboardScripts({ updates, stats, filterOptions, currentFilters }) {
  const serializedUpdates = serializeForScript(updates)
  const serializedStats = serializeForScript(stats)
  const serializedFilterOptions = serializeForScript(filterOptions)
  const serializedCurrentFilters = serializeForScript(currentFilters)

  return `
    <script>
      window.dashboardInitialState = {
        updates: ${serializedUpdates},
        stats: ${serializedStats},
        filterOptions: ${serializedFilterOptions},
        currentFilters: ${serializedCurrentFilters}
      };
      window.initialUpdates = window.dashboardInitialState.updates;
      window.dashboardStats = window.dashboardInitialState.stats;
      window.filterOptions = window.dashboardInitialState.filterOptions;
      window.currentFilters = window.dashboardInitialState.currentFilters;
      if (typeof document !== 'undefined' && document.dispatchEvent) {
        document.dispatchEvent(new CustomEvent('dashboard:state-ready', { detail: window.dashboardInitialState }));
      }
    </script>
    <script>
      (function() {
        const state = window.dashboardInitialState || {};
        const DashboardPage = {
          init: function() {
            this.cacheElements();
            this.bindEvents();
          },
          cacheElements: function() {
            this.filterForm = document.querySelector('.filters-grid');
            this.searchInput = document.querySelector('#search');
          },
          bindEvents: function() {
            if (this.filterForm) {
              this.filterForm.addEventListener('submit', () => {
                console.log('[Dashboard] Applying filters...');
              });
            }
          },
          removeFilter: function(field) {
            if (!this.filterForm) return;
            const fieldElement = this.filterForm.querySelector('[name=\"' + field + '\"]');
            if (fieldElement) {
              if (fieldElement.tagName === 'SELECT') {
                fieldElement.selectedIndex = 0;
              } else {
                fieldElement.value = '';
              }
            }
            this.filterForm.submit();
          },
          clearAllFilters: function() {
            if (!this.filterForm) return;
            Array.from(this.filterForm.elements).forEach(element => {
              if (!element.name) return;
              if (element.tagName === 'SELECT') {
                element.selectedIndex = 0;
              } else {
                element.value = '';
              }
            });
            this.filterForm.submit();
          },
          changeProfile: function(profileId) {
            const currentUrl = new URL(window.location.href);
            if (profileId) {
              currentUrl.searchParams.set('profileId', profileId);
            } else {
              currentUrl.searchParams.delete('profileId');
            }
            window.location.href = currentUrl.toString();
          }
        };

        window.DashboardPage = DashboardPage;
        DashboardPage.init();
      })();

      // Card action functions
      function viewDetails(updateId) {
        window.location.href = '/update/' + updateId;
      }

      function bookmarkUpdate(updateId) {
        console.log('[Dashboard] Bookmark update:', updateId);
        // TODO: Implement bookmark functionality
        alert('Bookmark feature coming soon!');
      }

      function shareUpdate(updateId) {
        const update = window.initialUpdates.find(u => u.id === updateId);
        if (!update) {
          console.error('[Dashboard] Update not found:', updateId);
          return;
        }

        const shareUrl = window.location.origin + '/update/' + updateId;
        const shareText = update.headline || 'Regulatory Update';

        if (navigator.share) {
          navigator.share({
            title: shareText,
            text: update.summary || update.ai_summary || '',
            url: shareUrl
          }).catch(err => console.log('[Dashboard] Share cancelled:', err));
        } else {
          // Fallback: Copy to clipboard
          navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Link copied to clipboard!');
          }).catch(err => {
            console.error('[Dashboard] Copy failed:', err);
            alert('Share URL: ' + shareUrl);
          });
        }
      }

      // Make functions globally available
      window.viewDetails = viewDetails;
      window.bookmarkUpdate = bookmarkUpdate;
      window.shareUpdate = shareUpdate;
    </script>
  `
}

module.exports = { getDashboardScripts }
