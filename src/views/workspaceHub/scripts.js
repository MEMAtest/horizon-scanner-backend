function serializeForScript(data) {
  const json = JSON.stringify(data)
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function getWorkspaceHubScripts({ pinnedItems, bookmarkCollections, userId }) {
  const initialState = serializeForScript({
    pinnedItems: Array.isArray(pinnedItems) ? pinnedItems : [],
    bookmarkCollections: Array.isArray(bookmarkCollections) ? bookmarkCollections : [],
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
          'ESG / Sustainability'
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
          return normalizeId(raw);
        }

        function buildTopicOptions(currentTopicArea) {
          const current = normalizeId(currentTopicArea);
          const ordered = TOPIC_AREAS.slice();
          if (current && !ordered.some(topic => normalizeId(topic) === current)) {
            ordered.unshift(current);
          }

          const options = [];
          options.push('<option value="" ' + (current ? '' : 'selected') + '>Uncategorised</option>');

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

        async function moveBookmark(updateUrl, collectionId) {
          const url = normalizeId(updateUrl);
          const nextCollectionId = normalizeId(collectionId);
          if (!url || !nextCollectionId) return;

          try {
            const response = await fetch('/api/workspace/pin/' + encodeURIComponent(url) + '/collection', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ collectionId: nextCollectionId })
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

        async function updateBookmarkTopic(updateUrl, topicArea) {
          const url = normalizeId(updateUrl);
          if (!url) return;
          const nextTopicArea = normalizeId(topicArea);

          try {
            const response = await fetch('/api/workspace/pin/' + encodeURIComponent(url) + '/topic', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topicArea: nextTopicArea })
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
                    <span>Topic: \${escapeHtml(topicArea || 'Uncategorised')}</span>
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
              select.addEventListener('change', () => moveBookmark(url, select.value));
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
                  await updateBookmarkTopic(url, next);
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
        }

        function init() {
          bindControls();
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
