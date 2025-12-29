function getEventsSection() {
  return `        // Close modals on escape key
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            KanbanPage.closeAddItemModal();
            KanbanPage.closeItemDetail();
            KanbanPage.closeLinkPolicyModal();
            KanbanPage.closeLinkDossierModal();
            KanbanPage.closeUnlinkConfirmModal();
          }
        });

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
          overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
              KanbanPage.closeAddItemModal();
              KanbanPage.closeItemDetail();
            }
          });
        });

        // Close unlink confirm modal on overlay click (dynamic modal)
        document.addEventListener('click', function(e) {
          if (e.target.id === 'unlink-confirm-modal') {
            KanbanPage.closeUnlinkConfirmModal();
          }
        });

        // Close dropdowns on outside click
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.single-select-dropdown') && !e.target.closest('.multi-select-dropdown')) {
            document.querySelectorAll('.single-select-dropdown.active, .multi-select-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });
          }
        });
`
}

module.exports = { getEventsSection }
