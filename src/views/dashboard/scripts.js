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

      // Profile Modal Functions
      let profilesCache = [];

      async function openProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
          modal.style.display = 'flex';
          await loadProfiles();
        }
      }

      function closeProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
          modal.style.display = 'none';
          cancelProfileForm();
        }
      }

      async function loadProfiles() {
        const listEl = document.getElementById('profile-list');
        if (!listEl) return;

        listEl.innerHTML = '<div class="loading">Loading profiles...</div>';

        try {
          const response = await fetch('/api/business-line-profiles');
          if (!response.ok) throw new Error('Failed to load profiles');

          const data = await response.json();
          profilesCache = data.profiles || [];

          if (profilesCache.length === 0) {
            listEl.innerHTML = '<p class="no-profiles">No profiles yet. Create your first profile below.</p>';
          } else {
            listEl.innerHTML = profilesCache.map(profile => renderProfileItem(profile)).join('');
          }
        } catch (err) {
          console.error('Load profiles error:', err);
          listEl.innerHTML = '<p class="error">Failed to load profiles. Please try again.</p>';
        }
      }

      function renderProfileItem(profile) {
        return '<div class="profile-item" data-id="' + profile.id + '">' +
          '<div class="profile-item-header">' +
            '<span class="profile-color" style="background-color: ' + (profile.color || '#6b7280') + '"></span>' +
            '<span class="profile-name">' + (profile.name || 'Unnamed') + '</span>' +
            (profile.isDefault ? '<span class="default-badge">Default</span>' : '') +
          '</div>' +
          '<div class="profile-item-details">' +
            (profile.sectors && profile.sectors.length ? '<span>Sectors: ' + profile.sectors.slice(0, 3).join(', ') + '</span>' : '') +
          '</div>' +
          '<div class="profile-item-actions">' +
            '<button class="btn btn-sm" onclick="editProfile(\\'' + profile.id + '\\')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteProfile(\\'' + profile.id + '\\')">Delete</button>' +
          '</div>' +
        '</div>';
      }

      function showProfileForm(profileId = null) {
        const formEl = document.getElementById('profile-form');
        const listEl = document.getElementById('profile-list');
        const titleEl = document.getElementById('profile-form-title');

        if (formEl) formEl.style.display = 'block';
        if (listEl) listEl.style.display = 'none';

        if (profileId) {
          const profile = profilesCache.find(p => p.id === profileId);
          if (profile) {
            titleEl.textContent = 'Edit Profile';
            document.getElementById('profile-id').value = profile.id;
            document.getElementById('profile-name').value = profile.name || '';
            document.getElementById('profile-description').value = profile.description || '';
            document.getElementById('profile-color').value = profile.color || '#3b82f6';
            document.getElementById('profile-sectors').value = (profile.sectors || []).join(', ');
            document.getElementById('profile-regulators').value = (profile.regulators || []).join(', ');
            document.getElementById('profile-default').checked = profile.isDefault || false;
          }
        } else {
          titleEl.textContent = 'Create New Profile';
          document.getElementById('profile-id').value = '';
          document.getElementById('profile-name').value = '';
          document.getElementById('profile-description').value = '';
          document.getElementById('profile-color').value = '#3b82f6';
          document.getElementById('profile-sectors').value = '';
          document.getElementById('profile-regulators').value = '';
          document.getElementById('profile-default').checked = false;
        }
      }

      function cancelProfileForm() {
        const formEl = document.getElementById('profile-form');
        const listEl = document.getElementById('profile-list');

        if (formEl) formEl.style.display = 'none';
        if (listEl) listEl.style.display = 'block';
      }

      function editProfile(profileId) {
        showProfileForm(profileId);
      }

      async function saveProfile() {
        const profileId = document.getElementById('profile-id').value;
        const name = document.getElementById('profile-name').value.trim();
        const description = document.getElementById('profile-description').value.trim();
        const color = document.getElementById('profile-color').value;
        const sectors = document.getElementById('profile-sectors').value.split(',').map(s => s.trim()).filter(Boolean);
        const regulators = document.getElementById('profile-regulators').value.split(',').map(s => s.trim()).filter(Boolean);
        const isDefault = document.getElementById('profile-default').checked;

        if (!name) {
          alert('Please enter a profile name');
          return;
        }

        const profileData = { name, description, color, sectors, regulators, isDefault };

        try {
          const url = profileId
            ? '/api/business-line-profiles/' + profileId
            : '/api/business-line-profiles';
          const method = profileId ? 'PUT' : 'POST';

          const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
          });

          if (!response.ok) throw new Error('Failed to save profile');

          cancelProfileForm();
          await loadProfiles();

          // Refresh the dropdown selector
          window.location.reload();
        } catch (err) {
          console.error('Save profile error:', err);
          alert('Failed to save profile. Please try again.');
        }
      }

      async function deleteProfile(profileId) {
        if (!confirm('Are you sure you want to delete this profile?')) return;

        try {
          const response = await fetch('/api/business-line-profiles/' + profileId, {
            method: 'DELETE'
          });

          if (!response.ok) throw new Error('Failed to delete profile');

          await loadProfiles();
          window.location.reload();
        } catch (err) {
          console.error('Delete profile error:', err);
          alert('Failed to delete profile. Please try again.');
        }
      }

      // Close modal on outside click
      document.addEventListener('click', function(e) {
        const modal = document.getElementById('profile-modal');
        if (e.target === modal) {
          closeProfileModal();
        }
      });

      // Close modal on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closeProfileModal();
        }
      });

      window.openProfileModal = openProfileModal;
      window.closeProfileModal = closeProfileModal;
      window.showProfileForm = showProfileForm;
      window.cancelProfileForm = cancelProfileForm;
      window.editProfile = editProfile;
      window.saveProfile = saveProfile;
      window.deleteProfile = deleteProfile;
    </script>
  `
}

module.exports = { getDashboardScripts }
