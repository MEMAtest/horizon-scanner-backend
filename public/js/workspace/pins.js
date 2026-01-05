(function() {
  const registry = window.__WorkspaceModuleRegistry = window.__WorkspaceModuleRegistry || [];

  registry.push(function applyWorkspacePins(context) {
    const state = context.state;
    const constants = context.constants;

    function normalizePinnedItem(item) {
      if (!item || typeof item !== 'object') return null;

      const metadata = item.metadata && typeof item.metadata === 'object'
        ? Object.assign({}, item.metadata)
        : {};

      const rawSectors = Array.isArray(item.sectors)
        ? item.sectors
        : Array.isArray(metadata.sectors)
          ? metadata.sectors
          : [];

      const sectors = Array.from(new Set(rawSectors.map(context.normalizeSector).filter(Boolean)));
      metadata.sectors = sectors;

      if (!metadata.summary && item.summary) {
        metadata.summary = item.summary;
      }
      if (!metadata.published && item.pinned_date) {
        metadata.published = item.pinned_date;
      }

      const personas = Array.isArray(metadata.personas)
        ? metadata.personas.filter(Boolean)
        : Array.isArray(item.personas)
          ? item.personas.filter(Boolean)
          : [];
      metadata.personas = personas;

      if (!metadata.updateId && (item.update_id || item.updateId)) {
        metadata.updateId = item.update_id || item.updateId;
      }

      if (!metadata.collectionId && metadata.collection_id) {
        metadata.collectionId = metadata.collection_id;
      }
      if (!metadata.collectionId) {
        metadata.collectionId = 'personal';
      }

      return {
        id: item.id || metadata.id || Date.now(),
        update_url: item.update_url || item.updateUrl || item.url || '',
        update_title: item.update_title || item.updateTitle || item.title || '',
        update_authority: item.update_authority || item.updateAuthority || item.authority || '',
        notes: item.notes || '',
        pinned_date: item.pinned_date || item.pinnedDate || new Date().toISOString(),
        sectors,
        metadata
      };
    }

    function getPinnedItemUpdateId(item) {
      if (!item || typeof item !== 'object') return null;
      const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
      return metadata.updateId || metadata.update_id || item.update_id || item.updateId || null;
    }

    function getPinnedItemUrl(item) {
      if (!item || typeof item !== 'object') return '';
      return String(item.update_url || item.updateUrl || item.url || '').trim();
    }

    function rebuildPinnedIndexes(items) {
      const source = Array.isArray(items) ? items : state.pinnedItems;
      state.pinnedUrls = new Set();
      state.pinnedUpdateIds = new Set();
      source.forEach(item => {
        const url = getPinnedItemUrl(item);
        if (url) state.pinnedUrls.add(url);
        const updateId = getPinnedItemUpdateId(item);
        if (updateId != null && updateId !== '') state.pinnedUpdateIds.add(String(updateId));
      });
    }

    function deriveAuthorityFromUrl(url) {
      try {
        const parsed = new URL(String(url || ''), window.location.origin);
        const host = String(parsed.hostname || '').trim();
        return host.replace(/^www\./, '');
      } catch (error) {
        return '';
      }
    }

    function persistProfileHubActivity(entry) {
      try {
        const key = 'profileHubActivity';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift(entry);
        if (existing.length > 500) existing.length = 500;
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (error) {
        // ignore storage issues
      }
    }

    function broadcastWorkspaceActivity(entry) {
      if (typeof context.broadcastWorkspaceActivity === 'function') {
        context.broadcastWorkspaceActivity(entry);
        return;
      }
      try {
        window.dispatchEvent(new CustomEvent('workspace:activity', { detail: entry }));
      } catch (error) {
        // ignore event errors
      }
    }

    function recordProfileHubActivity(type, details) {
      const payload = details && typeof details === 'object' ? details : {};
      const entry = Object.assign({}, payload, {
        type: type || payload.type || 'activity',
        timestamp: payload.timestamp || new Date().toISOString()
      });
      const isProfileHub = window.location && window.location.pathname === '/profile-hub';
      if (!isProfileHub) {
        persistProfileHubActivity(entry);
      }
      broadcastWorkspaceActivity(entry);
    }

    function getPreferredKanbanTemplateId() {
      try {
        const fromState = window.kanbanState && window.kanbanState.selectedTemplateId;
        if (fromState) return String(fromState);
      } catch (error) {}

      try {
        const params = new URLSearchParams(window.location.search || '');
        const fromQuery = params.get('templateId');
        if (fromQuery) return String(fromQuery);
      } catch (error) {}

      try {
        const fromStorage = localStorage.getItem('kanbanLastTemplateId');
        if (fromStorage) return String(fromStorage);
      } catch (error) {}

      return null;
    }

    function buildKanbanDeepLink(createdItem, fallbackTemplateId) {
      const item = createdItem && typeof createdItem === 'object' ? createdItem : {};
      const id = item.id || item.item_id || item.itemId || null;
      const workflowTemplateId = item.workflow_template_id || item.workflowTemplateId || fallbackTemplateId || null;

      try {
        const url = new URL('/kanban', window.location.origin);
        if (workflowTemplateId) url.searchParams.set('templateId', workflowTemplateId);
        if (id != null) url.searchParams.set('openItemId', id);
        return url.toString();
      } catch (error) {
        return '/kanban';
      }
    }

    async function createKanbanActionFromPinnedItem(item) {
      if (!item || typeof item !== 'object') return null;

      const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
      const updateId = metadata.updateId || metadata.update_id || item.update_id || item.updateId || null;
      const workflowTemplateId = getPreferredKanbanTemplateId();

      const title = item.update_title || metadata.title || 'Regulatory Change';
      const authority = item.update_authority || metadata.authority || 'Unknown';
      const sourceUrl = item.update_url || '';
      const description = metadata.summary || '';

      try {
        let response;

        if (updateId) {
          response = await fetch('/api/regulatory-changes/from-update/' + encodeURIComponent(updateId), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': 'default'
            },
            body: JSON.stringify(workflowTemplateId ? { workflow_template_id: workflowTemplateId } : {})
          });
        } else {
          const payload = {
            title,
            description
          };
          if (workflowTemplateId) payload.workflow_template_id = workflowTemplateId;
          if (authority) payload.authority = authority;
          if (sourceUrl) payload.source_url = sourceUrl;
          response = await fetch('/api/regulatory-changes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': 'default'
            },
            body: JSON.stringify(payload)
          });
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to create action');
        }

        return data.data || null;
      } catch (error) {
        console.error('Create action error:', error);
        context.showMessage(error.message || 'Failed to create action', 'error');
        return null;
      }
    }

    async function togglePin(url, title, authority, contextInfo) {
      const normalizedUrl = String(url || '').trim();
      if (!normalizedUrl) {
        context.showMessage('Unable to pin this update: missing URL', 'error');
        return;
      }
      try {
        const contextPayload = contextInfo && typeof contextInfo === 'object' && !Array.isArray(contextInfo)
          ? contextInfo
          : {};
        const requestedSectors = Array.isArray(contextPayload.sectors) ? contextPayload.sectors : [];
        const normalizedSectors = Array.from(new Set(requestedSectors.map(context.normalizeSector).filter(Boolean)));
        const personas = Array.isArray(contextPayload.personas)
          ? contextPayload.personas.filter(Boolean)
          : typeof contextPayload.persona === 'string'
            ? [contextPayload.persona]
            : [];
        const resolvedAuthority = (() => {
          const candidate = (authority || contextPayload.authority || '').trim();
          if (candidate && candidate.toLowerCase() !== 'unknown') return candidate;
          return deriveAuthorityFromUrl(normalizedUrl) || candidate || 'Unknown';
        })();
        const metadata = Object.assign(
          {
            sectors: normalizedSectors,
            personas,
            summary: contextPayload.summary || '',
            published: contextPayload.published || '',
            updateId: contextPayload.updateId || contextPayload.id || null,
            authority: resolvedAuthority
          },
          typeof contextPayload.metadata === 'object' && contextPayload.metadata !== null
            ? contextPayload.metadata
            : {}
        );

        if (!metadata.sectors || metadata.sectors.length === 0) {
          metadata.sectors = normalizedSectors;
        }
        if (!metadata.personas || metadata.personas.length === 0) {
          metadata.personas = personas;
        }

        const normalizedUpdateId = metadata.updateId != null && metadata.updateId !== ''
          ? String(metadata.updateId)
          : '';
        const pinnedItemByUpdateId = normalizedUpdateId
          ? state.pinnedItems.find(item => String(getPinnedItemUpdateId(item) || '') === normalizedUpdateId)
          : null;
        const wasPinned = Boolean(pinnedItemByUpdateId) || state.pinnedUrls.has(normalizedUrl);
        const unpinUrl = pinnedItemByUpdateId && pinnedItemByUpdateId.update_url
          ? pinnedItemByUpdateId.update_url
          : normalizedUrl;
        let response;

        if (wasPinned) {
          response = await fetch(`/api/workspace/pin/${encodeURIComponent(unpinUrl)}`, {
            method: 'DELETE'
          });
        } else {
          response = await fetch('/api/workspace/pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: normalizedUrl,
              title: title || 'Untitled Update',
              authority: resolvedAuthority,
              notes: contextPayload.notes || '',
              sectors: normalizedSectors,
              personas,
              summary: contextPayload.summary || '',
              published: contextPayload.published || '',
              updateId: contextPayload.updateId || contextPayload.id || null,
              metadata
            })
          });
        }

        if (!response.ok) {
          throw new Error(wasPinned ? 'Failed to unpin' : 'Failed to pin');
        }

        let savedItem = null;
        let savedUrl = normalizedUrl;
        let savedUpdateId = normalizedUpdateId;

        if (!wasPinned) {
          const payload = await response.json().catch(() => ({}));
          savedItem = normalizePinnedItem(payload.item || payload.data || {
            update_url: normalizedUrl,
            update_title: title || 'Untitled Update',
            update_authority: resolvedAuthority,
            metadata
          });
          savedUrl = getPinnedItemUrl(savedItem) || normalizedUrl;
          const responseUpdateId = getPinnedItemUpdateId(savedItem);
          if (responseUpdateId != null && responseUpdateId !== '') {
            savedUpdateId = String(responseUpdateId);
          }

          state.pinnedItems = Array.isArray(state.pinnedItems) ? state.pinnedItems : [];
          state.pinnedItems = state.pinnedItems.filter(item => {
            const itemUrl = getPinnedItemUrl(item);
            if (itemUrl && itemUrl === savedUrl) return false;
            const itemUpdateId = getPinnedItemUpdateId(item);
            if (savedUpdateId && itemUpdateId != null && String(itemUpdateId) === savedUpdateId) return false;
            return true;
          });
          state.pinnedItems.unshift(savedItem);
        } else {
          const removeUrl = String(unpinUrl || '').trim();
          const removeUpdateId = pinnedItemByUpdateId ? getPinnedItemUpdateId(pinnedItemByUpdateId) : null;
          const normalizedRemoveUpdateId = removeUpdateId != null && removeUpdateId !== ''
            ? String(removeUpdateId)
            : savedUpdateId;

          state.pinnedItems = Array.isArray(state.pinnedItems) ? state.pinnedItems : [];
          state.pinnedItems = state.pinnedItems.filter(item => {
            const itemUrl = getPinnedItemUrl(item);
            if (removeUrl && itemUrl === removeUrl) return false;
            if (normalizedUrl && itemUrl === normalizedUrl) return false;
            const itemUpdateId = getPinnedItemUpdateId(item);
            if (normalizedRemoveUpdateId && itemUpdateId != null && String(itemUpdateId) === normalizedRemoveUpdateId) return false;
            return true;
          });
        }

        rebuildPinnedIndexes(state.pinnedItems);
        context.broadcastWorkspacePins();

        const isPinnedNow = savedUpdateId
          ? state.pinnedUpdateIds.has(String(savedUpdateId))
          : state.pinnedUrls.has(savedUrl);

        const activityTitle = (savedItem && savedItem.update_title)
          || (pinnedItemByUpdateId && pinnedItemByUpdateId.update_title)
          || title
          || metadata.title
          || 'Untitled update';
        const activityAuthority = (savedItem && savedItem.update_authority)
          || (pinnedItemByUpdateId && pinnedItemByUpdateId.update_authority)
          || resolvedAuthority
          || 'Unknown';
        const activityPayload = {
          title: activityTitle,
          authority: activityAuthority,
          url: savedUrl || normalizedUrl,
          updateId: savedUpdateId || normalizedUpdateId
        };

        updatePinButton(normalizedUrl);
        if (unpinUrl !== normalizedUrl) {
          updatePinButton(unpinUrl);
        }
        await context.updateWorkspaceCounts({ skipFetch: true });

        if (isPinnedNow && !wasPinned) {
          context.showMessage('★ Saved to Profile Hub', 'success');
          recordProfileHubActivity('bookmark_saved', activityPayload);
          try {
            if (window.NotificationsModule && typeof window.NotificationsModule.refresh === 'function') {
              window.NotificationsModule.refresh({ silent: true });
            }
          } catch (error) {
            // ignore notification refresh issues
          }
        } else if (!isPinnedNow && wasPinned) {
          context.showMessage('Bookmark removed from Profile Hub', 'info');
          recordProfileHubActivity('bookmark_removed', activityPayload);
          try {
            if (window.NotificationsModule && typeof window.NotificationsModule.refresh === 'function') {
              window.NotificationsModule.refresh({ silent: true });
            }
          } catch (error) {
            // ignore notification refresh issues
          }
        }
        return true;
      } catch (error) {
        console.error('Pin toggle error:', error);
        context.showMessage('Failed to update pin status', 'error');
        return false;
      }
    }

    function updatePinButton(url) {
      const pinBtn = document.querySelector(`[data-url="${url}"] .pin-btn`);
      if (pinBtn) {
        const isPinned = state.pinnedUrls.has(url);
        pinBtn.textContent = isPinned ? 'Pinned' : 'Pin';
        pinBtn.classList.toggle('pinned', isPinned);
        pinBtn.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
        if (isPinned) {
          pinBtn.dataset.state = 'pinned';
        } else {
          delete pinBtn.dataset.state;
        }
        pinBtn.title = isPinned ? 'Unpin this update' : 'Pin this update';
      }
    }

    function showPinnedItems() {
      console.log('📌 Opening bookmarks view');

      const modal = context.createModal('Bookmarks');
      const toolbar = document.createElement('div');
      toolbar.className = 'pinned-toolbar';
      toolbar.style.display = 'flex';
      toolbar.style.flexWrap = 'wrap';
      toolbar.style.alignItems = 'center';
      toolbar.style.justifyContent = 'space-between';
      toolbar.style.gap = '10px';
      toolbar.style.marginBottom = '12px';

      const listContainer = document.createElement('div');
      listContainer.className = 'pinned-items-list';

      const footer = document.createElement('div');
      footer.className = 'modal-footer';

      if (window.FilterModule && typeof window.FilterModule.applyFilter === 'function') {
        const viewButton = document.createElement('button');
        viewButton.className = 'btn btn-primary';
        viewButton.textContent = 'View in Intelligence Feed';
        viewButton.onclick = () => {
          context.closeModal();
          window.FilterModule.applyFilter('pinned');
        };
        footer.appendChild(viewButton);
      }

      const kanbanButton = document.createElement('button');
      kanbanButton.className = 'btn btn-secondary';
      kanbanButton.textContent = 'Open Change Board';
      kanbanButton.onclick = () => {
        window.location.href = '/kanban';
      };
      footer.appendChild(kanbanButton);

      const hubButton = document.createElement('button');
      hubButton.className = 'btn btn-secondary';
      hubButton.textContent = 'Open Profile Hub';
      hubButton.onclick = () => {
        window.location.href = '/profile-hub';
      };
      footer.appendChild(hubButton);

      const closeButton = document.createElement('button');
      closeButton.className = 'button-small';
      closeButton.textContent = 'Close';
      closeButton.onclick = context.closeModal;
      footer.appendChild(closeButton);

      modal.content.appendChild(toolbar);
      modal.content.appendChild(listContainer);
      modal.content.appendChild(footer);

      function getFilteredPinnedItems() {
        const allPinned = Array.isArray(state.pinnedItems) ? state.pinnedItems : [];
        if (state.selectedBookmarkCollectionId === 'all') return allPinned;
        const selected = context.normalizeCollectionId(state.selectedBookmarkCollectionId) || 'personal';
        return allPinned.filter(item => context.getPinnedItemCollectionId(item) === selected);
      }

      function renderToolbarMeta() {
        const existing = toolbar.querySelector('.pinned-toolbar-meta');
        if (existing) existing.remove();

        const meta = document.createElement('div');
        meta.className = 'pinned-toolbar-meta';
        meta.style.width = '100%';
        meta.style.fontSize = '12px';
        meta.style.color = '#6b7280';

        const totalCount = Array.isArray(state.pinnedItems) ? state.pinnedItems.length : 0;
        const visibleCount = getFilteredPinnedItems().length;

        if (state.selectedBookmarkCollectionId === 'all') {
          meta.textContent = totalCount + ' bookmarked updates';
        } else {
          meta.textContent = visibleCount + ' bookmarked updates in ' + context.getBookmarkCollectionName(state.selectedBookmarkCollectionId);
        }

        toolbar.appendChild(meta);
      }

      function renderToolbar() {
        toolbar.innerHTML = '';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = '8px';

        const label = document.createElement('span');
        label.textContent = 'Collection:';
        label.style.fontWeight = '600';
        left.appendChild(label);

        const select = document.createElement('select');
        select.className = 'form-select';
        select.style.minWidth = '220px';

        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All collections';
        select.appendChild(allOption);

        context.ensureBookmarkCollections(state.bookmarkCollections).forEach(collection => {
          const option = document.createElement('option');
          option.value = collection.id;
          option.textContent = collection.name;
          select.appendChild(option);
        });

        select.value = state.selectedBookmarkCollectionId;
        select.onchange = () => {
          state.selectedBookmarkCollectionId = select.value;
          renderPinnedList();
          renderToolbarMeta();
        };

        left.appendChild(select);
        toolbar.appendChild(left);

        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.alignItems = 'center';
        right.style.gap = '8px';

        const newButton = document.createElement('button');
        newButton.className = 'btn-small';
        newButton.textContent = 'New collection';
        newButton.onclick = async () => {
          const name = prompt('New collection name:');
          if (!name) return;
          const created = await context.createBookmarkCollection(name);
          if (!created) return;
          state.selectedBookmarkCollectionId = created.id;
          renderToolbar();
          renderPinnedList();
        };
        right.appendChild(newButton);

        const currentCollection = state.bookmarkCollections.find(collection => collection.id === state.selectedBookmarkCollectionId);
        if (state.selectedBookmarkCollectionId !== 'all' && currentCollection && !currentCollection.isSystem) {
          const renameButton = document.createElement('button');
          renameButton.className = 'btn-small';
          renameButton.textContent = 'Rename';
          renameButton.onclick = async () => {
            const nextName = prompt('Rename collection:', currentCollection.name);
            if (!nextName) return;
            const updated = await context.renameBookmarkCollection(currentCollection.id, nextName);
            if (updated) renderToolbar();
          };
          right.appendChild(renameButton);

          const deleteButton = document.createElement('button');
          deleteButton.className = 'btn-small btn-danger';
          deleteButton.textContent = 'Delete';
          deleteButton.onclick = async () => {
            if (!confirm('Delete this collection? Bookmarks will move to Personal.')) return;
            const deleted = await context.deleteBookmarkCollection(currentCollection.id);
            if (!deleted) return;
            state.selectedBookmarkCollectionId = 'personal';
            if (typeof context.loadWorkspaceData === 'function') {
              await context.loadWorkspaceData();
            }
            renderToolbar();
            renderPinnedList();
          };
          right.appendChild(deleteButton);
        }

        toolbar.appendChild(right);
        renderToolbarMeta();
      }

      function renderPinnedList() {
        listContainer.innerHTML = '';

        if (!Array.isArray(state.pinnedItems) || state.pinnedItems.length === 0) {
          const emptyState = document.createElement('div');
          emptyState.className = 'empty-state';
          emptyState.textContent = 'No bookmarks yet. Star an update to save it here.';
          listContainer.appendChild(emptyState);
          return;
        }

        const visibleItems = getFilteredPinnedItems();
        if (visibleItems.length === 0) {
          const emptyState = document.createElement('div');
          emptyState.className = 'empty-state';
          emptyState.textContent = 'No bookmarks in this collection yet.';
          listContainer.appendChild(emptyState);
          return;
        }

        visibleItems.forEach(item => {
          const metadata = item.metadata || {};
          const card = document.createElement('div');
          card.className = 'pinned-item-card';

          const titleRow = document.createElement('div');
          titleRow.className = 'pinned-item-header';

          const titleLink = document.createElement('a');
          titleLink.className = 'pinned-item-title';
          titleLink.textContent = item.update_title || 'Untitled update';
          const updateId = metadata.updateId || metadata.update_id || item.update_id || item.updateId;
          if (updateId != null && String(updateId).trim()) {
            titleLink.href = '/update/' + encodeURIComponent(String(updateId).trim());
            titleLink.target = '_blank';
            titleLink.rel = 'noopener';
          } else if (item.update_url) {
            titleLink.href = item.update_url;
            titleLink.target = '_blank';
            titleLink.rel = 'noopener';
          } else {
            titleLink.href = '#';
            titleLink.onclick = event => event.preventDefault();
          }
          titleRow.appendChild(titleLink);

          if (item.update_authority) {
            const authorityBadge = document.createElement('span');
            authorityBadge.className = 'pinned-item-authority';
            authorityBadge.textContent = item.update_authority;
            titleRow.appendChild(authorityBadge);
          }

          card.appendChild(titleRow);

          const collectionRow = document.createElement('div');
          collectionRow.style.display = 'flex';
          collectionRow.style.alignItems = 'center';
          collectionRow.style.justifyContent = 'space-between';
          collectionRow.style.gap = '10px';
          collectionRow.style.marginTop = '8px';

          const collectionLabel = document.createElement('span');
          collectionLabel.style.fontSize = '12px';
          collectionLabel.style.color = '#6b7280';
          collectionLabel.textContent = 'Saved in ' + context.getBookmarkCollectionName(context.getPinnedItemCollectionId(item));
          collectionRow.appendChild(collectionLabel);

          const moveSelect = document.createElement('select');
          moveSelect.className = 'form-select';
          moveSelect.style.maxWidth = '220px';
          context.ensureBookmarkCollections(state.bookmarkCollections).forEach(collection => {
            const option = document.createElement('option');
            option.value = collection.id;
            option.textContent = collection.name;
            moveSelect.appendChild(option);
          });
          moveSelect.value = context.getPinnedItemCollectionId(item);
          moveSelect.onchange = async () => {
            const next = moveSelect.value;
            moveSelect.disabled = true;
            const ok = await context.updatePinnedItemCollection(item.update_url, next);
            moveSelect.disabled = false;
            if (!ok) {
              moveSelect.value = context.getPinnedItemCollectionId(item);
              return;
            }
            metadata.collectionId = next;
            collectionLabel.textContent = 'Saved in ' + context.getBookmarkCollectionName(next);
            renderToolbarMeta();
            if (state.selectedBookmarkCollectionId !== 'all' && next !== state.selectedBookmarkCollectionId) {
              renderPinnedList();
            }
          };
          collectionRow.appendChild(moveSelect);

          card.appendChild(collectionRow);

          const topicRow = document.createElement('div');
          topicRow.style.display = 'flex';
          topicRow.style.alignItems = 'center';
          topicRow.style.justifyContent = 'space-between';
          topicRow.style.gap = '10px';
          topicRow.style.marginTop = '8px';

          const topicLabel = document.createElement('span');
          topicLabel.style.fontSize = '12px';
          topicLabel.style.color = '#6b7280';
          const currentTopicArea = context.getPinnedItemTopicArea(item);
          topicLabel.textContent = 'Topic: ' + (currentTopicArea || 'Uncategorised');
          topicRow.appendChild(topicLabel);

          const topicSelect = document.createElement('select');
          topicSelect.className = 'form-select';
          topicSelect.style.maxWidth = '220px';

          const emptyTopic = document.createElement('option');
          emptyTopic.value = '';
          emptyTopic.textContent = 'Uncategorised';
          topicSelect.appendChild(emptyTopic);

          const topicChoices = constants.DEFAULT_TOPIC_AREAS.slice();
          if (currentTopicArea && !topicChoices.some(topic => context.normalizeTopicArea(topic) === context.normalizeTopicArea(currentTopicArea))) {
            topicChoices.unshift(currentTopicArea);
          }

          topicChoices.forEach(topic => {
            const value = context.normalizeTopicArea(topic);
            if (!value) return;
            const option = document.createElement('option');
            option.value = value;
            option.textContent = topic;
            topicSelect.appendChild(option);
          });

          const customTopic = document.createElement('option');
          customTopic.value = '__custom__';
          customTopic.textContent = 'Custom…';
          topicSelect.appendChild(customTopic);

          topicSelect.value = currentTopicArea || '';
          topicSelect.onchange = async () => {
            const previous = context.getPinnedItemTopicArea(item);
            let next = topicSelect.value;
            if (next === '__custom__') {
              const custom = prompt('Topic area:', previous || '');
              if (custom == null) {
                topicSelect.value = previous || '';
                return;
              }
              next = String(custom).trim();
            }
            topicSelect.disabled = true;
            const ok = await context.updatePinnedItemTopicArea(item.update_url, next);
            topicSelect.disabled = false;
            if (!ok) {
              topicSelect.value = previous || '';
              return;
            }
            topicLabel.textContent = 'Topic: ' + (context.normalizeTopicArea(next) || 'Uncategorised');
          };

          topicRow.appendChild(topicSelect);
          card.appendChild(topicRow);

          if (Array.isArray(item.sectors) && item.sectors.length > 0) {
            const sectorsWrap = document.createElement('div');
            sectorsWrap.className = 'pinned-item-sectors';
            item.sectors.forEach(sector => {
              const badge = document.createElement('span');
              badge.className = 'pinned-sector-badge';
              badge.textContent = sector;
              sectorsWrap.appendChild(badge);
            });
            card.appendChild(sectorsWrap);
          }

          if (metadata.summary) {
            const summary = document.createElement('p');
            summary.className = 'pinned-item-summary';
            summary.textContent = metadata.summary;
            card.appendChild(summary);
          }

          const actions = document.createElement('div');
          actions.className = 'pinned-item-actions';

          const openButton = document.createElement('button');
          openButton.className = 'btn-small';
          openButton.textContent = 'Open Update';
          openButton.onclick = () => {
            if (item.update_url) {
              window.open(item.update_url, '_blank', 'noopener');
            }
          };
          actions.appendChild(openButton);

          const actionButton = document.createElement('button');
          actionButton.className = 'btn-small';
          actionButton.textContent = 'Create Action';
          actionButton.onclick = async () => {
            actionButton.disabled = true;
            const previousText = actionButton.textContent;
            actionButton.textContent = 'Creating...';
            const created = await createKanbanActionFromPinnedItem(item);
            actionButton.disabled = false;
            actionButton.textContent = previousText;
            if (!created) return;
            context.showMessage('Action created in Regulatory Change Management', 'success');
            const deepLink = buildKanbanDeepLink(created, getPreferredKanbanTemplateId());
            if (window.location && String(window.location.pathname || '').startsWith('/kanban')) {
              context.closeModal();
              window.location.href = deepLink;
              return;
            }
            if (confirm('Open the new action on the Change Board now?')) {
              window.location.href = deepLink;
            }
          };
          actions.appendChild(actionButton);

          const actionContext = {
            sectors: item.sectors || [],
            summary: metadata.summary || '',
            published: metadata.published || '',
            personas: Array.isArray(metadata.personas) ? metadata.personas : [],
            metadata
          };

          const unpinButton = document.createElement('button');
          unpinButton.className = 'btn-small btn-danger';
          unpinButton.textContent = 'Unpin';
          unpinButton.onclick = async () => {
            unpinButton.disabled = true;
            unpinButton.textContent = 'Unpinning...';
            const success = await togglePin(item.update_url, item.update_title, item.update_authority, actionContext);
            if (!success) {
              unpinButton.disabled = false;
              unpinButton.textContent = 'Unpin';
              return;
            }
            renderToolbarMeta();
            renderPinnedList();
          };
          actions.appendChild(unpinButton);

          card.appendChild(actions);
          listContainer.appendChild(card);
        });
      }

      renderToolbar();
      renderPinnedList();
      document.body.appendChild(modal.overlay);

      context.loadBookmarkCollections()
        .then(() => {
          renderToolbar();
          renderPinnedList();
        })
        .catch(() => {});
    }

    context.define('normalizePinnedItem', normalizePinnedItem);
    context.define('getPinnedItemUpdateId', getPinnedItemUpdateId);
    context.define('getPinnedItemUrl', getPinnedItemUrl);
    context.define('rebuildPinnedIndexes', rebuildPinnedIndexes);
    context.define('deriveAuthorityFromUrl', deriveAuthorityFromUrl);
    context.define('getPreferredKanbanTemplateId', getPreferredKanbanTemplateId);
    context.define('buildKanbanDeepLink', buildKanbanDeepLink);
    context.define('createKanbanActionFromPinnedItem', createKanbanActionFromPinnedItem);
    context.expose('togglePin', togglePin);
    context.define('updatePinButton', updatePinButton);
    context.expose('showPinnedItems', showPinnedItems);
  });
})();
