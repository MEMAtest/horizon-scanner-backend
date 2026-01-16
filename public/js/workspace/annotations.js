(function() {
  const registry = window.__WorkspaceModuleRegistry = window.__WorkspaceModuleRegistry || [];

  registry.push(function applyWorkspaceAnnotations(context) {
    const state = context.state;

    function buildAnnotationGroups(list) {
      const groups = {
        flagged: [],
        action_required: [],
        assigned: [],
        note: [],
        triage: [],
        resolved: [],
        others: [],
        total: list.length
      };

      list.forEach(annotation => {
        const status = String(annotation.status || '').toLowerCase();
        if (groups[status]) {
          groups[status].push(annotation);
        } else if (status === 'action required') {
          groups.action_required.push(annotation);
        } else if (status === 'resolved' || status === 'complete') {
          groups.resolved.push(annotation);
        } else if (status === 'triage' || status === 'review') {
          groups.triage.push(annotation);
        } else {
          groups.others.push(annotation);
        }
      });

      return groups;
    }

    function getAnnotationSummary() {
      const summary = {
        total: state.annotationGroups.total || state.annotations.length,
        flagged: (state.annotationGroups.flagged || []).length,
        tasks: (state.annotationGroups.action_required || []).length,
        assignments: (state.annotationGroups.assigned || []).length,
        notes: (state.annotationGroups.note || []).length
      };

      return summary;
    }

    function updateAnnotationBadge(summary) {
      const metrics = summary || getAnnotationSummary();
      const countEl = document.getElementById('annotationCount');
      if (countEl) {
        countEl.textContent = metrics.total || 0;
      }
      const metaEl = document.getElementById('annotationMeta');
      if (metaEl) {
        if (!metrics.total) {
          metaEl.textContent = 'Notes & actions';
        } else {
          metaEl.textContent = (metrics.tasks || 0) + ' tasks • ' + (metrics.flagged || 0) + ' briefs';
        }
      }
    }

    function findAnnotation(noteId) {
      return state.annotations.find(item => item.note_id === noteId);
    }

    async function loadAnnotations() {
      try {
        const params = new URLSearchParams({
          status: 'flagged,action_required,assigned,note,triage'
        });
        const response = await fetch('/api/annotations?' + params.toString());
        if (response.ok) {
          const data = await response.json();
          state.annotations = Array.isArray(data.annotations) ? data.annotations : [];
          state.annotationGroups = buildAnnotationGroups(state.annotations);
          updateAnnotationBadge();
          if (state.annotationModalContent) {
            renderAnnotationSections(state.annotationModalContent);
          }
        }
      } catch (error) {
        console.error('Error loading annotations:', error);
      }
    }

    async function refreshAnnotations() {
      await loadAnnotations();
    }

    function renderAnnotationSections(container) {
      if (!container) return;

      const summary = getAnnotationSummary();
      const categories = [
        { key: 'flagged', title: 'Flagged for Brief', icon: '🚩' },
        { key: 'action_required', title: 'Tasks', icon: '✅' },
        { key: 'assigned', title: 'Assignments', icon: '👥' },
        { key: 'note', title: 'Notes', icon: '📝' },
        { key: 'triage', title: 'In Triage', icon: '🔍' }
      ];

      const summaryHtml = [
        '<div class="annotation-summary">',
        '  <strong>' + (summary.total || 0) + ' saved items</strong>',
        '  <span>' + (summary.tasks || 0) + ' tasks • ' + (summary.flagged || 0) + ' briefs • ' + (summary.assignments || 0) + ' assignments</span>',
        '</div>'
      ].join('\n');

      const sections = categories.map(category => {
        const items = state.annotationGroups[category.key] || [];
        if (!items.length) {
          return '';
        }

        const itemsHtml = items.map(annotation => {
          const noteId = annotation.note_id;
          const contextData = annotation.context || {};
          const headline = contextData.headline || annotation.content || 'Untitled';
          const url = contextData.url;
          const authority = contextData.authority;
          const dueDate = annotation.due_date || contextData.due_date || contextData.dueDate;
          const content = annotation.content;
          const created = context.formatDateTime(annotation.created_at || annotation.createdAt);
          const actions = [];

          if (url) {
            actions.push('<button class="annotation-btn primary" data-action="open" data-note="' + noteId + '">Open Source</button>');
          }
          if (String(annotation.status || '').toLowerCase() === 'action_required') {
            actions.push('<button class="annotation-btn primary" data-action="complete" data-note="' + noteId + '">Mark Complete</button>');
          } else if (String(annotation.status || '').toLowerCase() === 'flagged') {
            actions.push('<button class="annotation-btn primary" data-action="complete" data-note="' + noteId + '">Mark Reviewed</button>');
          }
          actions.push('<button class="annotation-btn danger" data-action="delete" data-note="' + noteId + '">Remove</button>');

          const metaParts = [];
          if (authority) metaParts.push('<span>🏛️ ' + escapeHtml(authority) + '</span>');
          metaParts.push('<span>🕒 ' + escapeHtml(created) + '</span>');

          // Handle due date with overdue indicator
          if (dueDate) {
            const dueDateObj = new Date(dueDate);
            const now = new Date();
            const isOverdue = dueDateObj < now;
            const formattedDue = dueDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            if (isOverdue) {
              metaParts.push('<span style="color: #dc2626; font-weight: 600;">⚠️ OVERDUE: ' + escapeHtml(formattedDue) + '</span>');
            } else {
              metaParts.push('<span>📅 Due ' + escapeHtml(formattedDue) + '</span>');
            }
          }

          // Add overdue class if needed
          const isOverdue = dueDate && new Date(dueDate) < new Date();
          const itemClass = isOverdue ? 'annotation-item annotation-overdue' : 'annotation-item';

          return [
            '<div class="' + itemClass + '" data-annotation-id="' + noteId + '">',
            '  <div class="annotation-title">' + escapeHtml(headline) + '</div>',
            '  <div class="annotation-content">' + escapeHtml(content || 'No notes captured') + '</div>',
            '  <div class="annotation-meta">' + metaParts.join('') + '</div>',
            '  <div class="annotation-actions">' + actions.join('') + '</div>',
            '</div>'
          ].join('\n');
        }).join('\n');

        return [
          '<section class="annotation-section" data-category="' + category.key + '">',
          '  <h4>' + category.icon + ' ' + category.title + '</h4>',
          itemsHtml,
          '</section>'
        ].join('\n');
      }).filter(Boolean).join('\n');

      const panelContent = sections || '<div class="annotation-empty">No saved actions yet.</div>';
      container.innerHTML = summaryHtml + panelContent;

      const actionButtons = container.querySelectorAll('.annotation-actions button');
      actionButtons.forEach(button => {
        const noteId = button.getAttribute('data-note');
        const action = button.getAttribute('data-action');
        if (!noteId || !action) return;

        if (action === 'open') {
          button.addEventListener('click', () => openAnnotation(noteId));
        } else if (action === 'complete') {
          button.addEventListener('click', () => completeAnnotation(noteId));
        } else if (action === 'delete') {
          button.addEventListener('click', () => deleteAnnotation(noteId));
        }
      });
    }

    async function showAnnotations() {
      console.log('🗂️ Opening annotations');
      await loadAnnotations();
      const modal = context.createModal('Workspace Actions');
      state.annotationModalContent = modal.content;
      renderAnnotationSections(state.annotationModalContent);
      document.body.appendChild(modal.overlay);
    }

    function openAnnotation(noteId) {
      const annotation = findAnnotation(noteId);
      if (!annotation) {
        context.showMessage('Saved item not found', 'warning');
        return;
      }
      const contextData = annotation.context || {};
      const url = contextData.url;
      if (url) {
        window.open(url, '_blank', 'noopener');
      } else {
        context.showMessage('No source link available for this item', 'warning');
      }
    }

    async function completeAnnotation(noteId) {
      const annotation = findAnnotation(noteId);
      if (!annotation) {
        context.showMessage('Saved item not found', 'warning');
        return;
      }
      try {
        const response = await fetch('/api/annotations/' + noteId, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'resolved' })
        });
        if (!response.ok) {
          throw new Error('Failed to update annotation');
        }
        context.showMessage('Marked as complete', 'success');
        await loadAnnotations();
      } catch (error) {
        console.error('Annotation update error:', error);
        context.showMessage('Failed to update annotation', 'error');
      }
    }

    async function deleteAnnotation(noteId) {
      const annotation = findAnnotation(noteId);
      if (!annotation) {
        context.showMessage('Saved item not found', 'warning');
        return;
      }
      if (!confirm('Remove this saved item?')) return;
      try {
        const response = await fetch('/api/annotations/' + noteId, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error('Failed to delete annotation');
        }
        context.showMessage('Saved item removed', 'success');
        await loadAnnotations();
      } catch (error) {
        console.error('Annotation deletion error:', error);
        context.showMessage('Failed to delete annotation', 'error');
      }
    }

    context.define('buildAnnotationGroups', buildAnnotationGroups);
    context.define('getAnnotationSummary', getAnnotationSummary);
    context.define('updateAnnotationBadge', updateAnnotationBadge);
    context.define('findAnnotation', findAnnotation);
    context.define('loadAnnotations', loadAnnotations);
    context.expose('refreshAnnotations', refreshAnnotations);
    context.define('renderAnnotationSections', renderAnnotationSections);
    context.expose('showAnnotations', showAnnotations);
    context.expose('openAnnotation', openAnnotation);
    context.expose('completeAnnotation', completeAnnotation);
    context.expose('deleteAnnotation', deleteAnnotation);
  });
})();
