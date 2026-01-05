function serializeForScript(data) {
  const json = JSON.stringify(data)
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function getWorkspaceHubScripts({ pinnedItems, bookmarkCollections, savedSearches, customAlerts, upcomingEvents, userId }) {
  const initialState = serializeForScript({
    pinnedItems: Array.isArray(pinnedItems) ? pinnedItems : [],
    bookmarkCollections: Array.isArray(bookmarkCollections) ? bookmarkCollections : [],
    savedSearches: Array.isArray(savedSearches) ? savedSearches : [],
    customAlerts: Array.isArray(customAlerts) ? customAlerts : [],
    upcomingEvents: Array.isArray(upcomingEvents) ? upcomingEvents : [],
    userId: userId || 'default'
  })

  return `
    <script>
      window.workspaceHubInitialState = ${initialState};
    </script>
    <script>
      (function() {
        const state = {
          pinnedItems: Array.isArray(window.workspaceHubInitialState?.pinnedItems) ? window.workspaceHubInitialState.pinnedItems : [],
          bookmarkCollections: Array.isArray(window.workspaceHubInitialState?.bookmarkCollections) ? window.workspaceHubInitialState.bookmarkCollections : [],
          savedSearches: Array.isArray(window.workspaceHubInitialState?.savedSearches) ? window.workspaceHubInitialState.savedSearches : [],
          customAlerts: Array.isArray(window.workspaceHubInitialState?.customAlerts) ? window.workspaceHubInitialState.customAlerts : [],
          activityLog: [],
          selectedCollectionId: 'personal',
          searchQuery: ''
        };

        function showMessage(message, type) {
          if (typeof window !== 'undefined' && typeof window.showMessage === 'function') {
            window.showMessage(message, type || 'info');
            return;
          }
          console.log('[ProfileHub]', message);
        }

	        function normalizeId(value) {
	          return value == null ? '' : String(value).trim();
	        }

	        function deriveAuthorityFromUrl(url) {
	          try {
	            const parsed = new URL(String(url || ''), window.location.origin);
	            const host = normalizeId(parsed.hostname);
	            return host.replace(/^www\./, '');
	          } catch (error) {
	            return '';
	          }
	        }

	        function escapeHtml(value) {
	          return String(value ?? '')
	            .replace(/&/g, '&amp;')
	            .replace(/</g, '&lt;')
	            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        const TOPIC_AREAS = [
          'Consumer Duty',
          'Operational Resilience',
          'Financial Crime / AML',
          'Sanctions',
          'Capital & Liquidity',
          'Conduct & Market Abuse',
          'Payments',
          'Data Protection',
          'ESG / Sustainability',
          'Other'
        ];

        function formatDate(value) {
          if (!value) return 'Unknown';
          const parsed = new Date(value);
          if (Number.isNaN(parsed.getTime())) return 'Unknown';
          return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        function getPinnedItemCollectionId(item) {
          const metadata = item && typeof item === 'object'
            ? (item.metadata && typeof item.metadata === 'object' ? item.metadata : {})
            : {};
          const raw = metadata.collectionId || metadata.collection_id || '';
          return normalizeId(raw) || 'personal';
        }

        function getPinnedItemTopicArea(item) {
          const metadata = item && typeof item === 'object'
            ? (item.metadata && typeof item.metadata === 'object' ? item.metadata : {})
            : {};
          const raw = metadata.topicArea || metadata.topic_area || metadata.topic || '';
          const normalized = normalizeId(raw);
          if (!normalized) return 'Other';
          const lowered = normalized.toLowerCase();
          if (lowered === 'uncategorized' || lowered === 'uncategorised') return 'Other';
          return normalized;
        }

        function buildTopicOptions(currentTopicArea) {
          const current = normalizeId(currentTopicArea) || 'Other';
          const ordered = TOPIC_AREAS.slice();
          if (current && !ordered.some(topic => normalizeId(topic) === current)) {
            ordered.unshift(current);
          }

          const options = [];
          ordered.forEach(topic => {
            const value = normalizeId(topic);
            if (!value) return;
            const selected = current && value === current ? 'selected' : '';
            options.push(
              '<option value="' + escapeHtml(value) + '" ' + selected + '>' + escapeHtml(topic) + '</option>'
            );
          });

          options.push('<option value="__custom__">Custom…</option>');
          return options.join('');
        }

        function getBookmarkCollectionName(collectionId) {
          const id = normalizeId(collectionId);
          const match = state.bookmarkCollections.find(c => normalizeId(c && c.id) === id);
          return match ? (match.name || id) : (id || 'Personal');
        }

        function buildCollectionCounts() {
          const counts = new Map();
          for (const item of state.pinnedItems) {
            const id = getPinnedItemCollectionId(item);
            counts.set(id, (counts.get(id) || 0) + 1);
          }
          return counts;
        }

        function getFilteredPinnedItems() {
          const selected = normalizeId(state.selectedCollectionId);
          const query = normalizeId(state.searchQuery).toLowerCase();

          return (Array.isArray(state.pinnedItems) ? state.pinnedItems : []).filter(item => {
            if (!item || typeof item !== 'object') return false;

            const collectionId = getPinnedItemCollectionId(item);
            if (selected && selected !== 'all' && normalizeId(collectionId) !== selected) return false;

            if (!query) return true;
            const title = normalizeId(item.update_title || item.updateTitle || item.title).toLowerCase();
            const authority = normalizeId(item.update_authority || item.updateAuthority || item.authority).toLowerCase();
            const url = normalizeId(item.update_url || item.updateUrl || item.url).toLowerCase();
            return title.includes(query) || authority.includes(query) || url.includes(query);
          });
        }

        async function fetchCollections() {
          const response = await fetch('/api/workspace/bookmark-collections');
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to load collections');
          }
          state.bookmarkCollections = Array.isArray(data.collections) ? data.collections : [];
        }

        async function fetchPinnedItems() {
          const response = await fetch('/api/workspace/pinned');
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to load bookmarks');
          }
          state.pinnedItems = Array.isArray(data.items) ? data.items : [];
        }

        async function refreshAll() {
          try {
            await Promise.all([fetchCollections(), fetchPinnedItems()]);
            render();
            broadcastPins();
            if (window.WorkspaceModule && typeof window.WorkspaceModule.refresh === 'function') {
              window.WorkspaceModule.refresh().catch(() => {});
            }
          } catch (error) {
            console.error('[ProfileHub] Refresh failed:', error);
            showMessage(error.message || 'Failed to refresh', 'error');
          }
        }

        function broadcastPins() {
          try {
            const urls = state.pinnedItems
              .map(item => normalizeId(item && (item.update_url || item.updateUrl || item.url)))
              .filter(Boolean);
            window.__workspacePinnedUrls = urls;
            window.dispatchEvent(new CustomEvent('workspace:pins', { detail: { urls } }));
          } catch (error) {
            console.warn('[ProfileHub] Pin broadcast failed:', error);
          }
        }

        async function createCollection() {
          const name = prompt('New collection name:');
          if (!name) return;
          try {
            const response = await fetch('/api/workspace/bookmark-collections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to create collection');
            }
            showMessage('Collection created', 'success');
            logActivity('collection_created', { title: name });
            state.selectedCollectionId = data.collection?.id || state.selectedCollectionId;
            await refreshAll();
          } catch (error) {
            console.error('[ProfileHub] Create collection error:', error);
            showMessage(error.message || 'Failed to create collection', 'error');
          }
        }

        async function renameCollection(collection) {
          if (!collection || collection.isSystem) return;
          const nextName = prompt('Rename collection:', collection.name || '');
          if (!nextName) return;
          try {
            const response = await fetch('/api/workspace/bookmark-collections/' + encodeURIComponent(collection.id), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: nextName })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to rename collection');
            }
            showMessage('Collection updated', 'success');
            await refreshAll();
          } catch (error) {
            console.error('[ProfileHub] Rename collection error:', error);
            showMessage(error.message || 'Failed to rename collection', 'error');
          }
        }

        async function deleteCollection(collection) {
          if (!collection || collection.isSystem) return;
          if (!confirm('Delete this collection? Bookmarks will move to Personal.')) return;
          try {
            const response = await fetch('/api/workspace/bookmark-collections/' + encodeURIComponent(collection.id), {
              method: 'DELETE'
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to delete collection');
            }
            showMessage('Collection deleted', 'success');
            state.selectedCollectionId = 'personal';
            await refreshAll();
          } catch (error) {
            console.error('[ProfileHub] Delete collection error:', error);
            showMessage(error.message || 'Failed to delete collection', 'error');
          }
        }

        async function moveBookmark(updateUrl, collectionId, updateId) {
          const url = normalizeId(updateUrl);
          const nextCollectionId = normalizeId(collectionId);
          const normalizedUpdateId = normalizeId(updateId);
          if ((!url && !normalizedUpdateId) || !nextCollectionId) return;
          const urlParam = url || normalizedUpdateId;

          try {
            const response = await fetch('/api/workspace/pin/' + encodeURIComponent(urlParam) + '/collection', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ collectionId: nextCollectionId, updateId: normalizedUpdateId || undefined })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to move bookmark');
            }
            showMessage('Bookmark moved to ' + getBookmarkCollectionName(nextCollectionId), 'success');
            await refreshAll();
          } catch (error) {
            console.error('[ProfileHub] Move bookmark error:', error);
            showMessage(error.message || 'Failed to move bookmark', 'error');
          }
        }

        async function updateBookmarkTopic(updateUrl, topicArea, updateId, itemId) {
          const url = normalizeId(updateUrl);
          const normalizedUpdateId = normalizeId(updateId);
          const normalizedItemId = normalizeId(itemId);
          if (!url && !normalizedUpdateId && !normalizedItemId) return;
          const urlParam = url || normalizedUpdateId || normalizedItemId;
          const nextTopicArea = normalizeId(topicArea);

          try {
            const response = await fetch('/api/workspace/pin/' + encodeURIComponent(urlParam) + '/topic', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topicArea: nextTopicArea,
                updateId: normalizedUpdateId || undefined,
                itemId: normalizedItemId || undefined
              })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to update topic');
            }
            showMessage(nextTopicArea ? ('Topic set to ' + nextTopicArea) : 'Topic cleared', 'success');
            await refreshAll();
          } catch (error) {
            console.error('[ProfileHub] Update topic error:', error);
            showMessage(error.message || 'Failed to update topic', 'error');
          }
        }

	        async function removeBookmark(updateUrl) {
	          const url = normalizeId(updateUrl);
	          if (!url) return;
	          if (!confirm('Remove this bookmark?')) return;

          try {
            const response = await fetch('/api/workspace/pin/' + encodeURIComponent(url), {
              method: 'DELETE'
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to remove bookmark');
            }
            showMessage('Bookmark removed', 'success');
            logActivity('bookmark_removed', { title: 'Bookmark removed' });
            await refreshAll();
          } catch (error) {
            console.error('[ProfileHub] Remove bookmark error:', error);
            showMessage(error.message || 'Failed to remove bookmark', 'error');
	          }
	        }

	        async function addBookmarkByUrl() {
	          const rawUrl = prompt('Paste a URL to bookmark:');
	          if (!rawUrl) return;
	          let url = String(rawUrl).trim();
	          if (!url) return;

		          if (!/^https?:\\/\\//i.test(url)) {
		            url = 'https://' + url;
		          }

	          let parsed;
	          try {
	            parsed = new URL(url);
	          } catch (error) {
	            showMessage('Invalid URL', 'error');
	            return;
	          }

	          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
	            showMessage('Only http/https URLs are supported', 'error');
	            return;
	          }

	          const titleInput = prompt('Title (optional):', '') || '';
	          const title = titleInput.trim() || parsed.hostname || url;
	          const authorityInput = prompt('Source/authority (optional):', parsed.hostname || '') || '';
	          const authority = authorityInput.trim() || parsed.hostname || 'External';

	          const selectedCollectionId = normalizeId(state.selectedCollectionId);
	          const collectionId = selectedCollectionId && selectedCollectionId !== 'all'
	            ? selectedCollectionId
	            : 'personal';

	          try {
	            const response = await fetch('/api/workspace/pin', {
	              method: 'POST',
	              headers: { 'Content-Type': 'application/json' },
	              body: JSON.stringify({
	                url: parsed.toString(),
	                title,
	                authority,
	                metadata: { collectionId, source: 'url' }
	              })
	            });
	            const data = await response.json().catch(() => ({}));
	            if (!response.ok || !data.success) {
	              throw new Error(data.error || 'Failed to bookmark URL');
	            }
	            showMessage('URL bookmarked in ' + getBookmarkCollectionName(collectionId), 'success');
	            logActivity('bookmark_saved', { title: title });
	            await refreshAll();
	          } catch (error) {
	            console.error('[ProfileHub] Add URL bookmark error:', error);
	            showMessage(error.message || 'Failed to bookmark URL', 'error');
	          }
	        }

	        async function createActionFromBookmark(item) {
	          if (!item || typeof item !== 'object') return;

	          const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
	          const updateId = metadata.updateId || metadata.update_id || item.update_id || item.updateId || null;
	          const title = item.update_title || metadata.title || 'Regulatory Change';
	          const sourceUrl = item.update_url || item.updateUrl || item.url || '';
		          const rawAuthority = normalizeId(item.update_authority || item.updateAuthority || item.authority || metadata.authority);
		          const authority = rawAuthority && rawAuthority.toLowerCase() !== 'unknown'
		            ? rawAuthority
		            : (deriveAuthorityFromUrl(sourceUrl) || rawAuthority || 'Unknown');
	          const description = metadata.summary || '';
	          let preferredTemplateId = null;
          try {
            preferredTemplateId = localStorage.getItem('kanbanLastTemplateId');
          } catch (error) {
            preferredTemplateId = null;
          }

          try {
            let response;
            const payload = {};
            if (preferredTemplateId) {
              payload.workflow_template_id = preferredTemplateId;
            }
            if (updateId) {
              response = await fetch('/api/regulatory-changes/from-update/' + encodeURIComponent(updateId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': window.workspaceHubInitialState?.userId || 'default' },
                body: JSON.stringify(payload)
              });
            } else {
              if (preferredTemplateId) {
                payload.workflow_template_id = preferredTemplateId;
              }
              payload.title = title;
              payload.description = description;
              if (authority) payload.authority = authority;
              if (sourceUrl) payload.source_url = sourceUrl;
              response = await fetch('/api/regulatory-changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': window.workspaceHubInitialState?.userId || 'default' },
                body: JSON.stringify(payload)
              });
            }

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to create action');
            }

            const created = data.data || data.item || null;
            const createdId = created && (created.id || created.item_id || created.itemId);
            const workflowTemplateId = created && (created.workflow_template_id || created.workflowTemplateId) || preferredTemplateId;

            const destination = new URL('/kanban', window.location.origin);
            if (workflowTemplateId) destination.searchParams.set('templateId', workflowTemplateId);
            if (createdId) destination.searchParams.set('openItemId', createdId);

            showMessage('Action created in Change Management', 'success');
            logActivity('action_created', { title: title, from: 'bookmark' });
            window.location.href = destination.toString();
          } catch (error) {
            console.error('[ProfileHub] Create action error:', error);
            showMessage(error.message || 'Failed to create action', 'error');
          }
        }

        function renderCollections() {
          const container = document.getElementById('workspaceHubCollections');
          if (!container) return;

          container.innerHTML = '';
          const counts = buildCollectionCounts();

          const allItem = document.createElement('div');
          allItem.className = 'collection-item' + (state.selectedCollectionId === 'all' ? ' active' : '');
          allItem.onclick = () => {
            state.selectedCollectionId = 'all';
            render();
          };
          allItem.innerHTML = \`
            <div class="collection-meta">
              <div class="collection-name">All collections</div>
              <div class="collection-hint">Everything you\\'ve bookmarked</div>
            </div>
            <div class="collection-actions">
              <span class="collection-count">\${state.pinnedItems.length}</span>
            </div>
          \`;
          container.appendChild(allItem);

          (Array.isArray(state.bookmarkCollections) ? state.bookmarkCollections : []).forEach(collection => {
            if (!collection) return;
            const id = normalizeId(collection.id);
            const count = counts.get(id) || 0;
            const active = normalizeId(state.selectedCollectionId) === id;

            const el = document.createElement('div');
            el.className = 'collection-item' + (active ? ' active' : '');
            el.onclick = () => {
              state.selectedCollectionId = id;
              render();
            };

            const hint = collection.isSystem
              ? (id === 'personal' ? 'Default for new bookmarks' : 'Work-facing collection')
              : 'Custom collection';

            const renameButton = (!collection.isSystem)
              ? \`<button class="btn-small" data-action="rename">Rename</button>\`
              : '';
            const deleteButton = (!collection.isSystem)
              ? \`<button class="btn-small btn-danger-outline" data-action="delete">Delete</button>\`
              : '';

            el.innerHTML = \`
              <div class="collection-meta">
                <div class="collection-name">\${escapeHtml(collection.name || id)}</div>
                <div class="collection-hint">\${escapeHtml(hint)}</div>
              </div>
              <div class="collection-actions">
                <span class="collection-count">\${count}</span>
                \${renameButton}
                \${deleteButton}
              </div>
            \`;

            el.querySelectorAll('button[data-action]').forEach(btn => {
              btn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'rename') renameCollection(collection);
                if (action === 'delete') deleteCollection(collection);
              });
            });

            container.appendChild(el);
          });
        }

        function renderBookmarks() {
          const container = document.getElementById('workspaceHubBookmarks');
          if (!container) return;

          const items = getFilteredPinnedItems();
          container.innerHTML = '';

          if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = state.searchQuery
              ? 'No bookmarks match your search.'
              : (state.selectedCollectionId === 'all'
                  ? 'No bookmarks yet. Star an update to save it here.'
                  : 'No bookmarks in this collection yet.');
            container.appendChild(empty);
            return;
          }

		          items.forEach(item => {
		            const itemId = normalizeId(item.id || '');
		            const url = normalizeId(item.update_url || item.updateUrl || item.url);
		            const title = normalizeId(item.update_title || item.updateTitle || item.title) || 'Untitled update';
		            const rawAuthority = normalizeId(item.update_authority || item.updateAuthority || item.authority);
		            const authority = rawAuthority && rawAuthority.toLowerCase() !== 'unknown'
		              ? rawAuthority
		              : (deriveAuthorityFromUrl(url) || rawAuthority || 'Unknown');
		            const pinnedDate = item.pinned_date || item.pinnedDate || '';
		            const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
		            const updateId = normalizeId(metadata.updateId || metadata.update_id || item.update_id || item.updateId || '');
		            const topicArea = getPinnedItemTopicArea(item);
	            const topicOptions = buildTopicOptions(topicArea);

            const card = document.createElement('div');
            card.className = 'bookmark-card';

            const currentCollectionId = getPinnedItemCollectionId(item);
            const summary = normalizeId(metadata.summary);

            const options = (Array.isArray(state.bookmarkCollections) ? state.bookmarkCollections : [])
              .map(c => \`<option value="\${escapeHtml(c.id)}" \${normalizeId(c.id) === normalizeId(currentCollectionId) ? 'selected' : ''}>\${escapeHtml(c.name)}</option>\`)
              .join('');

	            const internalHref = updateId ? ('/update/' + encodeURIComponent(updateId)) : '';
	            const safeHref = internalHref || url || '#';

            card.innerHTML = \`
              <div class="bookmark-card-header">
                <div style="min-width:0;">
                  <a class="bookmark-title" href="\${escapeHtml(safeHref)}" target="_blank" rel="noopener">\${escapeHtml(title)}</a>
                  <div class="bookmark-meta">
                    <span>\${escapeHtml(authority)}</span>
                    <span>Saved: \${escapeHtml(formatDate(pinnedDate))}</span>
                    <span>Collection: \${escapeHtml(getBookmarkCollectionName(currentCollectionId))}</span>
                    <span>Topic: \${escapeHtml(topicArea || 'Other')}</span>
                  </div>
                </div>
              </div>
              \${summary ? \`<div class="bookmark-meta" style="margin-top:10px;">\${escapeHtml(summary.length > 220 ? summary.slice(0, 220) + '…' : summary)}</div>\` : ''}
              <div class="bookmark-actions">
                <select data-role="collection-select" aria-label="Move bookmark">\${options}</select>
                <select data-role="topic-select" aria-label="Topic area">\${topicOptions}</select>
                <button class="btn-small" data-role="action">Create action</button>
                <button class="btn-small btn-danger-outline" data-role="remove">Remove</button>
              </div>
            \`;

            const select = card.querySelector('select[data-role=\"collection-select\"]');
            if (select) {
              select.addEventListener('change', () => moveBookmark(url, select.value, updateId));
            }

            const topicSelect = card.querySelector('select[data-role=\"topic-select\"]');
            if (topicSelect) {
              topicSelect.addEventListener('change', async () => {
                const previousTopic = topicArea;
                let next = topicSelect.value;
                if (next === '__custom__') {
                  const custom = prompt('Topic area:', previousTopic || '');
                  if (custom == null) {
                    topicSelect.value = previousTopic || '';
                    return;
                  }
                  next = String(custom).trim();
                }
                topicSelect.disabled = true;
                try {
                  await updateBookmarkTopic(url, next, updateId, itemId);
                } finally {
                  topicSelect.disabled = false;
                }
              });
            }

            const actionButton = card.querySelector('button[data-role=\"action\"]');
            if (actionButton) {
              actionButton.addEventListener('click', async () => {
                actionButton.disabled = true;
                const previous = actionButton.textContent;
                actionButton.textContent = 'Creating...';
                try {
                  await createActionFromBookmark(item);
                } finally {
                  actionButton.disabled = false;
                  actionButton.textContent = previous;
                }
              });
            }

            const removeButton = card.querySelector('button[data-role=\"remove\"]');
            if (removeButton) {
              removeButton.addEventListener('click', () => removeBookmark(url));
            }

            container.appendChild(card);
          });
        }

        function render() {
          renderCollections();
          renderBookmarks();
          renderActivityChart();
          renderBookmarkThemesChart();
        }

        // Saved Searches Widget
        async function runSavedSearch(searchId) {
          const search = state.savedSearches.find(s => s.id === searchId);
          if (!search) return;

          try {
            // Navigate to dashboard with search filters
            const filterParams = search.filter_params || search.filterParams || {};
            const queryString = new URLSearchParams(filterParams).toString();
            window.location.href = '/dashboard' + (queryString ? '?' + queryString : '');
          } catch (error) {
            console.error('[ProfileHub] Run search error:', error);
            showMessage('Failed to run search', 'error');
          }
        }

        async function convertSearchToAlert(searchId) {
          const search = state.savedSearches.find(s => s.id === searchId);
          if (!search) return;

          const name = search.search_name || search.searchName || 'Unnamed Search';

          try {
            const response = await fetch('/api/workspace/custom-alerts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                alertName: 'Alert: ' + name,
                alertConditions: {
                  type: 'saved_search',
                  searchId: searchId,
                  filterParams: search.filter_params || search.filterParams || {}
                },
                isActive: true
              })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to create alert');
            }

            showMessage('Alert created from search', 'success');
            logActivity('alert_created', { title: 'Alert: ' + name, from: 'search' });
          } catch (error) {
            console.error('[ProfileHub] Create alert error:', error);
            showMessage(error.message || 'Failed to create alert', 'error');
          }
        }

        // Activity Timeline - 30-Day Line Graph
        function logActivity(type, data) {
          const payload = data && typeof data === 'object' ? data : {};
          const activityType = type || payload.type || 'activity';
          const activityTimestamp = payload.timestamp || payload.pinned_date || new Date().toISOString();
          const activity = Object.assign({}, payload, {
            type: activityType,
            timestamp: activityTimestamp
          });

          state.activityLog.unshift(activity);
          // Keep more activity for 30-day chart
          if (state.activityLog.length > 500) {
            state.activityLog = state.activityLog.slice(0, 500);
          }

          // Save to localStorage
          try {
            localStorage.setItem('profileHubActivity', JSON.stringify(state.activityLog));
          } catch (error) {
            console.warn('[ProfileHub] Failed to save activity:', error);
          }

          renderActivityChart();
        }

        function loadActivityLog() {
          try {
            const saved = localStorage.getItem('profileHubActivity');
            if (saved) {
              state.activityLog = JSON.parse(saved);
            }
          } catch (error) {
            console.warn('[ProfileHub] Failed to load activity:', error);
          }
        }

        function seedActivityFromPinnedItems() {
          // Always rebuild from pinned items to ensure fresh data
          const seeds = (Array.isArray(state.pinnedItems) ? state.pinnedItems : [])
            .filter(item => item && (item.pinned_date || item.pinnedDate))
            .map(item => ({
              type: 'bookmark_saved',
              title: item.update_title || item.updateTitle || item.title || 'Untitled update',
              authority: item.update_authority || item.updateAuthority || item.authority || 'Unknown',
              url: item.update_url || item.updateUrl || item.url || '',
              timestamp: item.pinned_date || item.pinnedDate
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 500);

          if (!seeds.length) return;
          state.activityLog = seeds;
          try {
            localStorage.setItem('profileHubActivity', JSON.stringify(state.activityLog));
          } catch (error) {
            console.warn('[ProfileHub] Failed to persist seeded activity:', error);
          }
        }

        function bindWorkspaceActivity() {
          window.addEventListener('workspace:activity', (event) => {
            const detail = event && event.detail;
            if (!detail || typeof detail !== 'object') return;
            logActivity(detail.type || 'activity', detail);
          });
        }

        function aggregateActivityByDay(days = 30) {
          const counts = {};
          const now = new Date();
          now.setHours(23, 59, 59, 999);

          // Initialize all days to 0
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = date.toISOString().split('T')[0];
            counts[key] = 0;
          }

          // Count activities per day
          state.activityLog.forEach(activity => {
            if (!activity.timestamp) return;
            const key = new Date(activity.timestamp).toISOString().split('T')[0];
            if (counts[key] !== undefined) {
              counts[key]++;
            }
          });

          return Object.entries(counts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date, count }));
        }

        // Chart.js instances for cleanup
        let activityChartInstance = null;
        let themesChartInstance = null;

        // Chart.js color palette
        const chartColors = {
          primary: '#3b82f6',
          gradient: ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#6366f1']
        };

        // Theme colors configuration
        const themeColorConfig = {
          'Consumer Duty': '#3b82f6',
          'Operational Resilience': '#10b981',
          'Financial Crime / AML': '#ef4444',
          'Sanctions': '#f97316',
          'Capital & Liquidity': '#8b5cf6',
          'Conduct & Market Abuse': '#ec4899',
          'Payments': '#14b8a6',
          'Data Protection': '#6b7280',
          'ESG / Sustainability': '#059669',
          'Other': '#94a3b8',
          'Other themes': '#94a3b8'
        };

        function renderBookmarkThemesChart() {
          const canvas = document.getElementById('bookmarkThemesChart');
          if (!canvas) return;

          // Count topics from pinnedItems - use multiple fallbacks
          const themeCounts = {};
          const items = Array.isArray(state.pinnedItems) ? state.pinnedItems : [];
          for (const item of items) {
            const metadata = item && item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
            // Try multiple sources for topic: explicit topic, then area, then sector, then authority
            let topic = normalizeId(
              metadata.topicArea || metadata.topic_area || metadata.topic ||
              metadata.area || item.area || item.update_area ||
              metadata.sector || item.sector || item.update_sector ||
              ''
            );
            // Normalize common uncategorized values
            if (!topic || topic.toLowerCase() === 'uncategorized' || topic.toLowerCase() === 'uncategorised' || topic.toLowerCase() === 'general') {
              // Try to derive from authority as last resort
              const authority = normalizeId(item.update_authority || item.authority || metadata.authority || '');
              if (authority && authority.toLowerCase() !== 'unknown') {
                topic = authority;
              } else {
                topic = 'Other';
              }
            }
            themeCounts[topic] = (themeCounts[topic] || 0) + 1;
          }

          const sortedThemes = Object.entries(themeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

          const topCount = sortedThemes.reduce((sum, [, count]) => sum + count, 0);
          const otherCount = items.length > 0 ? Math.max(items.length - topCount, 0) : 0;

          const themeEntries = [...sortedThemes];
          if (otherCount > 0) {
            themeEntries.push(['Other themes', otherCount]);
          }

          if (themeEntries.length === 0) return;

          const themeLabels = themeEntries.map(([theme]) => theme);
          const themeCntValues = themeEntries.map(([, count]) => count);
          const themeColors = themeEntries.map(([theme], i) => {
            return themeColorConfig[theme] || chartColors.gradient[i % chartColors.gradient.length];
          });

          // Destroy existing chart instance if it exists
          if (themesChartInstance) {
            themesChartInstance.destroy();
            themesChartInstance = null;
          }

          const ctx = canvas.getContext('2d');
          themesChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: themeLabels,
              datasets: [{
                data: themeCntValues,
                backgroundColor: themeColors,
                borderWidth: 0,
                hoverOffset: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '55%',
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    usePointStyle: true,
                    pointStyle: 'rectRounded',
                    padding: 10,
                    font: { size: 10 },
                    color: '#475569'
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  padding: 12,
                  titleFont: { size: 12, weight: '600' },
                  bodyFont: { size: 11 },
                  cornerRadius: 8,
                  callbacks: {
                    label: function(context) {
                      const value = context.parsed;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return context.label + ': ' + value + ' (' + percentage + '%)';
                    }
                  }
                }
              }
            }
          });
        }

        function renderActivityChart() {
          const canvas = document.getElementById('activityChart');
          const peakEl = document.getElementById('activityPeak');
          const avgEl = document.getElementById('activityAvg');
          const totalEl = document.getElementById('activityTotal');

          if (!canvas) return;

          const data = aggregateActivityByDay(30);
          const counts = data.map(d => d.count);
          const total = counts.reduce((a, b) => a + b, 0);
          const avg = (total / counts.length).toFixed(1);
          const peak = Math.max(...counts);

          // Format labels as short dates
          const labels = data.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          });

          // Destroy existing chart instance if it exists
          if (activityChartInstance) {
            activityChartInstance.destroy();
            activityChartInstance = null;
          }

          const ctx = canvas.getContext('2d');

          // Create gradient for area fill
          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

          activityChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                data: counts,
                borderColor: chartColors.primary,
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: chartColors.primary,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                intersect: false,
                mode: 'index'
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  padding: 12,
                  titleFont: { size: 12, weight: '600' },
                  bodyFont: { size: 11 },
                  cornerRadius: 8,
                  callbacks: {
                    label: function(context) {
                      const value = context.parsed.y;
                      return value + ' action' + (value !== 1 ? 's' : '');
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { display: false },
                  border: { display: false }
                },
                y: {
                  beginAtZero: true,
                  grid: {
                    color: '#f1f5f9',
                    drawBorder: false
                  },
                  ticks: {
                    stepSize: 1,
                    font: { size: 10 },
                    color: '#94a3b8',
                    padding: 8
                  },
                  border: { display: false }
                }
              }
            }
          });

          // Update stats
          if (peakEl) peakEl.textContent = peak;
          if (avgEl) avgEl.textContent = avg;
          if (totalEl) totalEl.textContent = total;
        }

        function bindSavedSearches() {
          const container = document.getElementById('savedSearchesList');
          if (!container) return;

          container.addEventListener('click', async (event) => {
            const btn = event.target.closest('button[data-action]');
            if (!btn) return;

            const item = btn.closest('.search-card');
            if (!item) return;

            const searchId = item.dataset.searchId;
            if (!searchId) return;

            const action = btn.dataset.action;

            if (action === 'run') {
              btn.disabled = true;
              try {
                await runSavedSearch(searchId);
              } finally {
                btn.disabled = false;
              }
            } else if (action === 'alert') {
              btn.disabled = true;
              try {
                await convertSearchToAlert(searchId);
              } finally {
                btn.disabled = false;
              }
            }
          });

          // Save current search button
          const saveBtn = document.getElementById('saveCurrentSearchBtn');
          if (saveBtn) {
            saveBtn.addEventListener('click', () => {
              // Navigate to dashboard to save a search
              window.location.href = '/dashboard';
            });
          }
        }

        function setEventsView(view) {
          const target = view || 'list';
          document.querySelectorAll('[data-events-view]').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.eventsView === target);
          });
          document.querySelectorAll('[data-events-toggle]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.eventsToggle === target);
          });
          try {
            localStorage.setItem('profileHubEventsView', target);
          } catch (error) {
            // ignore storage errors
          }
        }

        function bindEventsToggle() {
          const buttons = Array.from(document.querySelectorAll('[data-events-toggle]'));
          if (!buttons.length) return;

          buttons.forEach(btn => {
            btn.addEventListener('click', () => {
              const view = btn.dataset.eventsToggle || 'list';
              setEventsView(view);
            });
          });

          let savedView = 'list';
          try {
            savedView = localStorage.getItem('profileHubEventsView') || 'list';
          } catch (error) {
            savedView = 'list';
          }
          setEventsView(savedView);
        }

        function bindControls() {
          const newButton = document.getElementById('hubNewCollectionBtn');
          if (newButton) {
            newButton.addEventListener('click', (event) => {
              event.preventDefault();
              createCollection();
            });
          }

	          const refreshButton = document.getElementById('hubRefreshBtn');
	          if (refreshButton) {
	            refreshButton.addEventListener('click', (event) => {
	              event.preventDefault();
	              refreshAll();
	            });
	          }

	          const addUrlButton = document.getElementById('hubAddUrlBtn');
	          if (addUrlButton) {
	            addUrlButton.addEventListener('click', (event) => {
	              event.preventDefault();
	              addBookmarkByUrl();
	            });
	          }

	          const search = document.getElementById('workspaceHubSearch');
	          if (search) {
	            search.addEventListener('input', () => {
	              state.searchQuery = search.value || '';
              renderBookmarks();
            });
          }

          // Refresh All button
          const refreshAllBtn = document.getElementById('hubRefreshAllBtn');
          if (refreshAllBtn) {
            refreshAllBtn.addEventListener('click', async (event) => {
              event.preventDefault();
              refreshAllBtn.disabled = true;
              refreshAllBtn.innerHTML = '<span>Refreshing...</span>';
              try {
                await refreshAll();
                showMessage('Data refreshed', 'success');
              } finally {
                refreshAllBtn.disabled = false;
                refreshAllBtn.innerHTML = \`
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  Refresh
                \`;
              }
            });
          }
        }

        function init() {
          loadActivityLog();
          seedActivityFromPinnedItems();
          bindWorkspaceActivity();
          bindControls();
          bindSavedSearches();
          bindEventsToggle();
          render();
          refreshAll();
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init, { once: true });
        } else {
          init();
        }
      })();
    </script>
  `
}

module.exports = { getWorkspaceHubScripts }
