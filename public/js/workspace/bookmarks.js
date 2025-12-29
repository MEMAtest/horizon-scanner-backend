(function() {
  const registry = window.__WorkspaceModuleRegistry = window.__WorkspaceModuleRegistry || [];

  registry.push(function applyWorkspaceBookmarks(context) {
    const state = context.state;

    function normalizeCollectionId(value) {
      return value == null ? '' : String(value).trim();
    }

    function normalizeBookmarkCollection(entry) {
      if (!entry || typeof entry !== 'object') return null;
      const id = normalizeCollectionId(entry.id);
      const name = entry.name == null ? '' : String(entry.name).trim();
      if (!id || !name) return null;
      return {
        id,
        name,
        isSystem: entry.isSystem === true || entry.is_system === true
      };
    }

    function ensureBookmarkCollections(list) {
      const normalized = Array.isArray(list)
        ? list.map(normalizeBookmarkCollection).filter(Boolean)
        : [];

      const defaults = [
        { id: 'personal', name: 'Personal', isSystem: true },
        { id: 'professional', name: 'Professional', isSystem: true }
      ];

      const byId = new Map();
      normalized.forEach(entry => byId.set(entry.id, entry));
      defaults.forEach(entry => {
        if (!byId.has(entry.id)) {
          byId.set(entry.id, entry);
        }
      });

      const ordered = [];
      defaults.forEach(entry => ordered.push(byId.get(entry.id)));
      for (const [id, value] of byId.entries()) {
        if (id === 'personal' || id === 'professional') continue;
        ordered.push(value);
      }

      return ordered.filter(Boolean);
    }

    function getPinnedItemCollectionId(item) {
      const metadata = item && item.metadata && typeof item.metadata === 'object'
        ? item.metadata
        : {};
      const id = normalizeCollectionId(metadata.collectionId || metadata.collection_id);
      return id || 'personal';
    }

    function getPinnedItemTopicArea(item) {
      const metadata = item && item.metadata && typeof item.metadata === 'object'
        ? item.metadata
        : {};
      const raw = metadata.topicArea || metadata.topic_area || metadata.topic || '';
      return context.normalizeTopicArea(raw);
    }

    function getBookmarkCollectionName(collectionId) {
      const target = normalizeCollectionId(collectionId);
      const found = state.bookmarkCollections.find(collection => collection.id === target);
      return found ? found.name : 'Personal';
    }

    async function loadBookmarkCollections() {
      try {
        const response = await fetch('/api/workspace/bookmark-collections');
        if (response.ok) {
          const data = await response.json();
          state.bookmarkCollections = ensureBookmarkCollections(data.collections);
        } else {
          state.bookmarkCollections = ensureBookmarkCollections([]);
        }
      } catch (error) {
        console.error('Error loading bookmark collections:', error);
        state.bookmarkCollections = ensureBookmarkCollections([]);
      }

      if (state.selectedBookmarkCollectionId !== 'all') {
        const target = normalizeCollectionId(state.selectedBookmarkCollectionId) || 'personal';
        if (!state.bookmarkCollections.some(collection => collection.id === target)) {
          state.selectedBookmarkCollectionId = state.bookmarkCollections.some(collection => collection.id === 'personal')
            ? 'personal'
            : (state.bookmarkCollections[0] ? state.bookmarkCollections[0].id : 'personal');
        }
      }
    }

    async function createBookmarkCollection(name) {
      const collectionName = name == null ? '' : String(name).trim();
      if (!collectionName) return null;
      try {
        const response = await fetch('/api/workspace/bookmark-collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: collectionName })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to create collection');
        }
        await loadBookmarkCollections();
        return data.collection || null;
      } catch (error) {
        console.error('Create collection error:', error);
        context.showMessage(error.message || 'Failed to create collection', 'error');
        return null;
      }
    }

    async function renameBookmarkCollection(collectionId, name) {
      const id = normalizeCollectionId(collectionId);
      const nextName = name == null ? '' : String(name).trim();
      if (!id || !nextName) return null;
      try {
        const response = await fetch('/api/workspace/bookmark-collections/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nextName })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to rename collection');
        }
        await loadBookmarkCollections();
        return data.collection || null;
      } catch (error) {
        console.error('Rename collection error:', error);
        context.showMessage(error.message || 'Failed to rename collection', 'error');
        return null;
      }
    }

    async function deleteBookmarkCollection(collectionId) {
      const id = normalizeCollectionId(collectionId);
      if (!id) return false;
      try {
        const response = await fetch('/api/workspace/bookmark-collections/' + encodeURIComponent(id), {
          method: 'DELETE'
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to delete collection');
        }
        await loadBookmarkCollections();
        return true;
      } catch (error) {
        console.error('Delete collection error:', error);
        context.showMessage(error.message || 'Failed to delete collection', 'error');
        return false;
      }
    }

    async function updatePinnedItemCollection(updateUrl, collectionId) {
      const url = String(updateUrl || '').trim();
      const nextCollectionId = normalizeCollectionId(collectionId);
      if (!url || !nextCollectionId) return false;

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

        state.pinnedItems = Array.isArray(state.pinnedItems)
          ? state.pinnedItems.map(item => {
            if (!item || String(item.update_url || '') !== url) return item;
            const metadata = item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {};
            metadata.collectionId = nextCollectionId;
            delete metadata.collection_id;
            return { ...item, metadata };
          })
          : [];

        context.broadcastWorkspacePins();
        return true;
      } catch (error) {
        console.error('Update pinned item collection error:', error);
        context.showMessage(error.message || 'Failed to move bookmark', 'error');
        return false;
      }
    }

    async function updatePinnedItemTopicArea(updateUrl, topicArea) {
      const url = String(updateUrl || '').trim();
      if (!url) return false;
      const nextTopicArea = context.normalizeTopicArea(topicArea);

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

        state.pinnedItems = Array.isArray(state.pinnedItems)
          ? state.pinnedItems.map(item => {
            if (!item || String(item.update_url || '') !== url) return item;
            const metadata = item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {};
            if (nextTopicArea) {
              metadata.topicArea = nextTopicArea;
            } else {
              delete metadata.topicArea;
              delete metadata.topic_area;
              delete metadata.topic;
            }
            return { ...item, metadata };
          })
          : [];

        context.broadcastWorkspacePins();
        return true;
      } catch (error) {
        console.error('Update pinned item topic error:', error);
        context.showMessage(error.message || 'Failed to update topic', 'error');
        return false;
      }
    }

    context.define('normalizeCollectionId', normalizeCollectionId);
    context.define('normalizeBookmarkCollection', normalizeBookmarkCollection);
    context.define('ensureBookmarkCollections', ensureBookmarkCollections);
    context.define('getPinnedItemCollectionId', getPinnedItemCollectionId);
    context.define('getPinnedItemTopicArea', getPinnedItemTopicArea);
    context.define('getBookmarkCollectionName', getBookmarkCollectionName);
    context.define('loadBookmarkCollections', loadBookmarkCollections);
    context.define('createBookmarkCollection', createBookmarkCollection);
    context.define('renameBookmarkCollection', renameBookmarkCollection);
    context.define('deleteBookmarkCollection', deleteBookmarkCollection);
    context.define('updatePinnedItemCollection', updatePinnedItemCollection);
    context.define('updatePinnedItemTopicArea', updatePinnedItemTopicArea);
  });
})();
