function getDragDropSection() {
  return `          // Drag and Drop
          handleDragStart: function(event, itemId) {
            state.draggedItemId = itemId;
            event.target.classList.add('dragging');
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', itemId);
          },

          handleDragEnd: function(event) {
            event.target.classList.remove('dragging');
            state.draggedItemId = null;
            // Remove all drag-over states
            document.querySelectorAll('.kanban-column.drag-over').forEach(col => {
              col.classList.remove('drag-over');
            });
          },

          handleDragOver: function(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            const column = event.target.closest('.kanban-column');
            if (column && !column.classList.contains('drag-over')) {
              document.querySelectorAll('.kanban-column.drag-over').forEach(col => {
                col.classList.remove('drag-over');
              });
              column.classList.add('drag-over');
            }
          },

          handleDragLeave: function(event) {
            const column = event.target.closest('.kanban-column');
            if (column && !column.contains(event.relatedTarget)) {
              column.classList.remove('drag-over');
            }
          },

          handleDrop: async function(event, newStage) {
            event.preventDefault();
            const column = event.target.closest('.kanban-column');
            if (column) {
              column.classList.remove('drag-over');
            }

            const itemId = event.dataTransfer.getData('text/plain');
            if (!itemId || !newStage) return;

            try {
              const response = await fetch('/api/regulatory-changes/' + itemId + '/advance', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify({ stage: newStage })
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Item moved to ' + newStage, 'success');
                // Reload the page to get fresh data
                window.location.reload();
              } else {
                this.showToast('Failed to move item: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Kanban] Drop error:', error);
              this.showToast('Failed to move item', 'error');
            }
          },

`
}

module.exports = { getDragDropSection }
