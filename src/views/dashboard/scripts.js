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

      function normalizeId(value) {
        return value == null ? '' : String(value);
      }

      function escapeCssValue(value) {
        const raw = normalizeId(value);
        if (!raw) return '';
        if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
          return CSS.escape(raw);
        }
        return raw.replace(/["\\\\]/g, '\\\\$&');
      }

      function getUpdateById(updateId) {
        const target = normalizeId(updateId);
        if (!target) return null;

        const sources = [
          Array.isArray(window.initialUpdates) ? window.initialUpdates : [],
          Array.isArray(window.dashboardInitialState?.updates) ? window.dashboardInitialState.updates : []
        ];

        for (const list of sources) {
          const found = list.find(u => normalizeId(u && u.id) === target);
          if (found) return found;
        }

        return null;
      }

      function getUpdateCardElement(updateId) {
        const target = normalizeId(updateId);
        if (!target) return null;
        const safe = escapeCssValue(target);
        return document.querySelector('.update-card[data-id="' + safe + '"]');
      }

      function getPinnedUrlSet() {
        if (window.WorkspaceModule && typeof WorkspaceModule.getPinnedUrls === 'function') {
          return new Set(WorkspaceModule.getPinnedUrls().map(String));
        }
        if (Array.isArray(window.__workspacePinnedUrls)) {
          return new Set(window.__workspacePinnedUrls.map(String));
        }
        return new Set();
      }

      function getPinnedUpdateIdSet() {
        if (window.WorkspaceModule && typeof WorkspaceModule.getPinnedUpdateIds === 'function') {
          return new Set(WorkspaceModule.getPinnedUpdateIds().map(String));
        }
        if (Array.isArray(window.__workspacePinnedUpdateIds)) {
          return new Set(window.__workspacePinnedUpdateIds.map(String));
        }
        return new Set();
      }

      function setBookmarkButtonState(button, bookmarked) {
        if (!button) return;
        button.classList.toggle('is-bookmarked', bookmarked);
        button.setAttribute('aria-pressed', bookmarked ? 'true' : 'false');
        button.textContent = bookmarked ? '★' : '☆';
        button.title = bookmarked ? 'Remove bookmark' : 'Bookmark';
      }

      function syncBookmarkButtons(pinnedUrls, pinnedUpdateIds) {
        const pinned = pinnedUrls instanceof Set ? pinnedUrls : getPinnedUrlSet();
        const pinnedIds = pinnedUpdateIds instanceof Set ? pinnedUpdateIds : getPinnedUpdateIdSet();
        document.querySelectorAll('.update-card').forEach(card => {
          const url = card?.dataset?.url ? String(card.dataset.url) : '';
          const id = normalizeId(card?.dataset?.id);
          const button = card.querySelector('.action-btn-bookmark');
          const bookmarked = (!!url && pinned.has(url)) || (!!id && pinnedIds.has(id));
          setBookmarkButtonState(button, bookmarked);
          card.classList.toggle('is-bookmarked', bookmarked);
        });
      }

      function initBookmarkSync() {
        syncBookmarkButtons();
        window.addEventListener('workspace:pins', (event) => {
          const urls = Array.isArray(event?.detail?.urls) ? new Set(event.detail.urls.map(String)) : null;
          const ids = Array.isArray(event?.detail?.updateIds) ? new Set(event.detail.updateIds.map(String)) : null;
          syncBookmarkButtons(urls || undefined, ids || undefined);
        });

        if (window.WorkspaceModule && typeof WorkspaceModule.ready === 'function') {
          WorkspaceModule.ready().then(() => syncBookmarkButtons()).catch(() => {});
        }
      }

      if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initBookmarkSync, { once: true });
        } else {
          initBookmarkSync();
        }
      }

      async function bookmarkUpdate(updateId) {
        const update = getUpdateById(updateId);
        const card = getUpdateCardElement(updateId);
        const cardTitle = card
          ? ((card.querySelector('.update-headline a') && card.querySelector('.update-headline a').textContent) || '').trim()
          : '';

        const updateUrl = (update && update.url && update.url !== '#')
          ? update.url
          : (card && card.dataset && card.dataset.url)
              ? card.dataset.url
              : (window.location.origin + '/update/' + updateId);

        const title = (update && update.headline) || cardTitle || 'Regulatory Update';
        const authority = (update && update.authority) || (card && card.dataset && card.dataset.authority) || 'Unknown';

        const context = {
          updateId: update && update.id ? update.id : updateId,
          authority,
          summary: (update && (update.ai_summary || update.summary)) || '',
          published: update ? (update.publishedDate || update.published_date || update.fetchedDate || update.createdAt || '') : '',
          sectors: update
            ? (update.primarySectors || update.firm_types_affected || (update.sector ? [update.sector] : []))
            : []
        };

        try {
          if (window.WorkspaceModule && typeof WorkspaceModule.togglePin === 'function') {
            await WorkspaceModule.togglePin(updateUrl, title, authority, context);
            return;
          }

          const pinned = getPinnedUrlSet();
          const wasPinned = pinned.has(String(updateUrl));
          const endpoint = wasPinned
            ? '/api/workspace/pin/' + encodeURIComponent(updateUrl)
            : '/api/workspace/pin';

          const response = await fetch(endpoint, {
            method: wasPinned ? 'DELETE' : 'POST',
            headers: wasPinned ? undefined : { 'Content-Type': 'application/json' },
            body: wasPinned ? undefined : JSON.stringify({ url: updateUrl, title, authority, metadata: context })
          });

          if (!response.ok) {
            console.error('[Dashboard] Bookmark toggle failed:', response.status);
          }
        } catch (error) {
          console.error('[Dashboard] Bookmark toggle error:', error);
        } finally {
          syncBookmarkButtons();
        }
      }

      function shareUpdate(updateId) {
        const update = getUpdateById(updateId);

        const shareUrl = window.location.origin + '/update/' + updateId;
        const shareText = (update && update.headline) || 'Regulatory Update';

        if (navigator.share) {
          navigator.share({
            title: shareText,
            text: update ? (update.summary || update.ai_summary || '') : '',
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

      // Add to Dossier function
      async function addToDossier(updateId) {
        const update = getUpdateById(updateId);
        const card = getUpdateCardElement(updateId);
        const cardTitle = card
          ? ((card.querySelector('.update-headline a') && card.querySelector('.update-headline a').textContent) || '').trim()
          : '';

        // Show dossier selector modal
        openDossierModal(updateId, (update && update.headline) || cardTitle || 'Selected Update');
      }

      // Link to Policy function
      async function linkToPolicy(updateId) {
        const update = getUpdateById(updateId);
        const card = getUpdateCardElement(updateId);
        const cardTitle = card
          ? ((card.querySelector('.update-headline a') && card.querySelector('.update-headline a').textContent) || '').trim()
          : '';

        // Show policy selector modal
        openPolicyModal(updateId, (update && update.headline) || cardTitle || 'Selected Update');
      }

      // Dossier Modal
      let dossiersCache = [];
      let currentUpdateForDossier = null;

      async function openDossierModal(updateId, updateTitle) {
        currentUpdateForDossier = updateId;
        let modal = document.getElementById('dossier-select-modal');

        if (!modal) {
          // Create modal if it doesn't exist
          modal = document.createElement('div');
          modal.id = 'dossier-select-modal';
          modal.className = 'modal-overlay';
          modal.innerHTML = getDossierModalHtml();
          document.body.appendChild(modal);

          // Add event listeners
          modal.querySelector('.modal-close').addEventListener('click', closeDossierModal);
          modal.addEventListener('click', (e) => { if (e.target === modal) closeDossierModal(); });
        }

        modal.querySelector('#dossier-update-title').textContent = updateTitle || 'Selected Update';
        modal.classList.add('active');
        await loadDossiers();
      }

      function getDossierModalHtml() {
        return \`
          <div class="modal" style="max-width:500px">
            <div class="modal-header">
              <h2>Add to Research Dossier</h2>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <p style="margin-bottom:12px;color:#6b7280;font-size:14px">Adding: <strong id="dossier-update-title"></strong></p>
              <div id="dossier-list" style="max-height:300px;overflow-y:auto">Loading...</div>
              <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb">
                <label style="font-weight:500;font-size:14px">Notes (optional)</label>
                <textarea id="dossier-notes" placeholder="Add notes about why this update is relevant..." style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:6px;margin-top:6px;min-height:60px;font-size:14px"></textarea>
              </div>
            </div>
            <div class="modal-footer" style="display:flex;gap:12px;justify-content:flex-end;padding:16px 24px;border-top:1px solid #e5e7eb;background:#f9fafb">
              <button onclick="closeDossierModal()" class="btn btn-secondary">Cancel</button>
              <a href="/dossiers" class="btn btn-secondary" style="text-decoration:none">Manage Dossiers</a>
            </div>
          </div>
        \`;
      }

      async function loadDossiers() {
        const listEl = document.getElementById('dossier-list');
        if (!listEl) return;

        try {
          const response = await fetch('/api/dossiers', { headers: { 'x-user-id': 'default' } });
          const result = await response.json();

          if (result.success && result.data.length > 0) {
            dossiersCache = result.data;
            listEl.innerHTML = result.data.map(d => \`
              <div class="dossier-option" style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.borderColor='#6366f1'" onmouseout="this.style.borderColor='#e5e7eb'" onclick="selectDossier('\${d.id}')">
                <div style="font-weight:500">\${escapeHtml(d.name)}</div>
                <div style="font-size:12px;color:#6b7280">\${d.topic || 'No topic'} &bull; \${d.item_count || 0} items</div>
              </div>
            \`).join('');
          } else {
            listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#6b7280">No dossiers yet. <a href="/dossiers" style="color:#6366f1">Create one first</a></div>';
          }
        } catch (error) {
          console.error('[Dashboard] Error loading dossiers:', error);
          listEl.innerHTML = '<div style="color:#ef4444">Error loading dossiers</div>';
        }
      }

      async function selectDossier(dossierId) {
        if (!currentUpdateForDossier || !dossierId) return;

        const notes = document.getElementById('dossier-notes')?.value || '';

        try {
          const response = await fetch('/api/dossiers/' + dossierId + '/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': 'default' },
            body: JSON.stringify({ updateId: currentUpdateForDossier, notes })
          });

          const result = await response.json();
          if (result.success) {
            showToast('Added to dossier successfully', 'success');
            closeDossierModal();
          } else {
            showToast('Error: ' + result.error, 'error');
          }
        } catch (error) {
          console.error('[Dashboard] Error adding to dossier:', error);
          showToast('Failed to add to dossier', 'error');
        }
      }

      function closeDossierModal() {
        const modal = document.getElementById('dossier-select-modal');
        if (modal) modal.classList.remove('active');
        currentUpdateForDossier = null;
      }

      // Policy Modal
      let policiesCache = [];
      let currentUpdateForPolicy = null;

      async function openPolicyModal(updateId, updateTitle) {
        currentUpdateForPolicy = updateId;
        let modal = document.getElementById('policy-select-modal');

        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'policy-select-modal';
          modal.className = 'modal-overlay';
          modal.innerHTML = getPolicyModalHtml();
          document.body.appendChild(modal);

          modal.querySelector('.modal-close').addEventListener('click', closePolicyModal);
          modal.addEventListener('click', (e) => { if (e.target === modal) closePolicyModal(); });
        }

        modal.querySelector('#policy-update-title').textContent = updateTitle || 'Selected Update';
        modal.classList.add('active');
        await loadPolicies();
      }

      function getPolicyModalHtml() {
        return \`
          <div class="modal" style="max-width:500px">
            <div class="modal-header">
              <h2>Link to Policy</h2>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <p style="margin-bottom:12px;color:#6b7280;font-size:14px">Citing: <strong id="policy-update-title"></strong></p>
              <div id="policy-list" style="max-height:300px;overflow-y:auto">Loading...</div>
              <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb">
                <label style="font-weight:500;font-size:14px">Citation context (optional)</label>
                <textarea id="citation-text" placeholder="Describe how this regulatory update relates to the policy..." style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:6px;margin-top:6px;min-height:60px;font-size:14px"></textarea>
              </div>
            </div>
            <div class="modal-footer" style="display:flex;gap:12px;justify-content:flex-end;padding:16px 24px;border-top:1px solid #e5e7eb;background:#f9fafb">
              <button onclick="closePolicyModal()" class="btn btn-secondary">Cancel</button>
              <a href="/policies" class="btn btn-secondary" style="text-decoration:none">Manage Policies</a>
            </div>
          </div>
        \`;
      }

      async function loadPolicies() {
        const listEl = document.getElementById('policy-list');
        if (!listEl) return;

        try {
          const response = await fetch('/api/policies', { headers: { 'x-user-id': 'default' } });
          const result = await response.json();

          if (result.success && result.data.length > 0) {
            policiesCache = result.data;
            listEl.innerHTML = result.data.map(p => \`
              <div class="policy-option" style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.borderColor='#6366f1'" onmouseout="this.style.borderColor='#e5e7eb'" onclick="selectPolicy('\${p.id}')">
                <div style="font-weight:500">\${escapeHtml(p.title)}</div>
                <div style="font-size:12px;color:#6b7280">\${p.category || 'Uncategorized'} &bull; v\${p.current_version || '1.0'}</div>
              </div>
            \`).join('');
          } else {
            listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#6b7280">No policies yet. <a href="/policies" style="color:#6366f1">Create one first</a></div>';
          }
        } catch (error) {
          console.error('[Dashboard] Error loading policies:', error);
          listEl.innerHTML = '<div style="color:#ef4444">Error loading policies</div>';
        }
      }

      async function selectPolicy(policyId) {
        if (!currentUpdateForPolicy || !policyId) return;

        const citationText = document.getElementById('citation-text')?.value || '';

        try {
          const response = await fetch('/api/policies/' + policyId + '/citations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': 'default' },
            body: JSON.stringify({ updateId: currentUpdateForPolicy, citationText })
          });

          const result = await response.json();
          if (result.success) {
            showToast('Linked to policy successfully', 'success');
            closePolicyModal();
          } else {
            showToast('Error: ' + result.error, 'error');
          }
        } catch (error) {
          console.error('[Dashboard] Error linking to policy:', error);
          showToast('Failed to link to policy', 'error');
        }
      }

      function closePolicyModal() {
        const modal = document.getElementById('policy-select-modal');
        if (modal) modal.classList.remove('active');
        currentUpdateForPolicy = null;
      }

      // Toast notification helper
      function showToast(message, type) {
        let container = document.querySelector('.toast-container');
        if (!container) {
          container = document.createElement('div');
          container.className = 'toast-container';
          container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:1100;display:flex;flex-direction:column;gap:8px';
          document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.style.cssText = 'padding:12px 20px;border-radius:8px;color:white;font-size:14px;animation:slideIn 0.3s ease;background:' + (type === 'success' ? '#059669' : '#dc2626');
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
      }

      // HTML escape helper
      function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      }

      // Make functions globally available
      window.viewDetails = viewDetails;
      window.bookmarkUpdate = bookmarkUpdate;
      window.shareUpdate = shareUpdate;
      window.addToDossier = addToDossier;
      window.linkToPolicy = linkToPolicy;
      window.selectDossier = selectDossier;
      window.selectPolicy = selectPolicy;
      window.closeDossierModal = closeDossierModal;
      window.closePolicyModal = closePolicyModal;

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
