(function() {
  const registry = window.__WorkspaceModuleRegistry = window.__WorkspaceModuleRegistry || [];

  registry.push(function applyWorkspaceUi(context) {
    const state = context.state;

    function showMessage(message, type = 'info') {
      if (typeof window !== 'undefined' && typeof window.showMessage === 'function') {
        try {
          window.showMessage(message, type);
          return;
        } catch (error) {
          console.warn('WorkspaceModule notification bridge failed:', error);
        }
      }
      const level = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
      if (typeof console !== 'undefined' && console[level]) {
        console[level]('[Workspace]', message);
      }
    }

    function formatDateTime(value) {
      if (!value) return '—';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '—';
      return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    function createModal(title) {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
      };

      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button onclick="WorkspaceModule.closeModal()" class="close-btn">×</button>
                </div>
                <div class="modal-content"></div>
            `;

      overlay.appendChild(modal);

      return {
        overlay,
        content: modal.querySelector('.modal-content')
      };
    }

    function closeModal() {
      const modal = document.querySelector('.modal-overlay');
      if (modal) modal.remove();
      state.annotationModalContent = null;
    }

    async function exportData() {
      try {
        showMessage('Preparing export...', 'info');

        const response = await fetch('/api/export');
        const data = await response.json();

        if (data.success) {
          const blob = new Blob([JSON.stringify(data.data, null, 2)],
                                { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `regulatory-updates-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          showMessage('Data exported successfully', 'success');
        }
      } catch (error) {
        console.error('Export error:', error);
        showMessage('Export failed', 'error');
      }
    }

    context.define('showMessage', showMessage);
    context.define('formatDateTime', formatDateTime);
    context.define('createModal', createModal);
    context.expose('closeModal', closeModal);
    context.expose('exportData', exportData);
  });
})();
