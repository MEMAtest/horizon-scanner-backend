function renderAssembleModal() {
  return `
    <div class="modal-backdrop" id="assembleModal">
      <div class="modal">
        <header>
          <h2>Assemble This Week</h2>
          <p class="modal-subtitle">Review the scope before triggering the Smart Briefing generation.</p>
        </header>
        <div class="modal-body preview-modal">
          <div class="preview-controls">
            <div class="preview-field">
              <span>Start date</span>
              <input type="date" id="previewStart" required>
            </div>
            <div class="preview-field">
              <span>End date</span>
              <input type="date" id="previewEnd" required>
            </div>
            <div class="preview-quick">
              <button type="button" class="preview-quick-btn" data-preview-range="7">Last 7 days</button>
              <button type="button" class="preview-quick-btn" data-preview-range="14">Last 14 days</button>
              <button type="button" class="preview-quick-btn" data-preview-range="30">Last 30 days</button>
            </div>
            <div class="preview-options">
              <label class="preview-checkbox">
                <input type="checkbox" id="previewForce" checked>
                <span>Force regenerate (ignore cache)</span>
              </label>
              <button type="button" class="btn btn-secondary preview-refresh" id="refreshPreview">Update Preview</button>
            </div>
          </div>
          <div class="preview-summary" id="previewSummary">
            <div class="empty-state">Loading weekly snapshot…</div>
          </div>
        </div>
        <footer>
          <button class="btn" id="cancelAssemble">Cancel</button>
          <button class="btn btn-primary" id="confirmAssemble">Generate Briefing</button>
        </footer>
      </div>
    </div>
  `
}

function renderAnnotationModal() {
  return `
    <div class="modal-backdrop" id="annotationModal">
      <div class="modal">
        <header>
          <h2>New Annotation</h2>
          <p class="modal-subtitle">Capture context for the team. Fields in bold are required.</p>
        </header>
        <form class="modal-body" id="annotationForm">
          <div class="form-grid">
            <label>
              <span class="form-label">Update ID *</span>
              <input list="annotationUpdateOptions" name="update_id" id="annotationUpdateId" required class="annotation-filter">
              <datalist id="annotationUpdateOptions"></datalist>
            </label>
            <label>
              <span class="form-label">Visibility</span>
              <select name="visibility" id="annotationVisibility" class="annotation-filter">
                <option value="team">Team</option>
                <option value="all">All</option>
                <option value="private">Private</option>
              </select>
            </label>
            <label>
              <span class="form-label">Status</span>
              <select name="status" id="annotationStatus" class="annotation-filter">
                <option value="analyzing">Needs analysis</option>
                <option value="assigned">Assigned</option>
                <option value="reviewed">Reviewed</option>
                <option value="n/a">Not applicable</option>
              </select>
            </label>
            <label>
              <span class="form-label">Content *</span>
              <textarea name="content" id="annotationContent" rows="5" required class="annotation-textarea"></textarea>
            </label>
            <label>
              <span class="form-label">Tags (comma separated)</span>
              <input type="text" name="tags" id="annotationTags" class="annotation-filter">
            </label>
            <label>
              <span class="form-label">Assign to (comma separated)</span>
              <input type="text" name="assigned_to" id="annotationAssigned" class="annotation-filter">
            </label>
            <label>
              <span class="form-label">Linked resources (comma separated URLs)</span>
              <input type="text" name="linked_resources" id="annotationResources" class="annotation-filter">
            </label>
          </div>
        </form>
        <footer>
          <button class="btn" id="cancelAnnotation">Cancel</button>
          <button class="btn btn-primary" id="saveAnnotation" form="annotationForm" type="submit">Save Annotation</button>
        </footer>
      </div>
    </div>
  `
}

function renderQuickNoteModal() {
  return `
    <div class="modal-backdrop" id="quickNoteModal">
      <div class="modal">
        <header>
          <h2>Compose Quick Note</h2>
          <p class="modal-subtitle">Use this template to brief clients or internal stakeholders on high-impact updates.</p>
        </header>
        <form class="modal-body quick-note-modal" id="quickNoteForm">
          <div class="quick-note-grid">
            <label>
              <span>Recipient name</span>
              <input type="text" id="quickNoteRecipient" placeholder="e.g. Brian" autocomplete="off">
            </label>
            <label>
              <span>Client or team</span>
              <input type="text" id="quickNoteFirm" placeholder="e.g. First Sentinel" autocomplete="off">
            </label>
            <label>
              <span>Sender</span>
              <input type="text" id="quickNoteSender" placeholder="Horizon Scanner Team" autocomplete="off">
            </label>
          </div>
          <label class="quick-note-label">Note preview</label>
          <textarea id="quickNoteContent" rows="12" required></textarea>
        </form>
        <footer>
          <div class="quick-note-actions">
            <button class="btn" id="cancelQuickNote" type="button">Cancel</button>
            <button class="btn btn-secondary" id="copyQuickNote" type="button">Copy</button>
            <button class="btn btn-primary" id="saveQuickNote" form="quickNoteForm" type="submit">Save Quick Note</button>
          </div>
        </footer>
      </div>
    </div>
  `
}

function renderWeeklyBriefingModal() {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return `
    <div class="modal-backdrop weekly-modal-backdrop" id="weeklyBriefingModal" style="display: none;">
      <div class="weekly-modal">
        <header class="weekly-modal__header">
          <div class="weekly-modal__title-row">
            <div class="weekly-modal__branding">
              <img src="/images/regcanary-sidebar-full.png" alt="RegCanary" class="weekly-modal__logo" />
            </div>
            <button class="weekly-modal__close" id="closeWeeklyBriefing" aria-label="Close">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="weekly-modal__meta">
            <h1 class="weekly-modal__title">Weekly Regulatory Briefing</h1>
            <span class="weekly-modal__date">${today}</span>
          </div>
          <nav class="weekly-modal__tabs">
            <button class="weekly-modal__tab active" data-tab="executive">Executive Summary</button>
            <button class="weekly-modal__tab" data-tab="narrative">Week's Narrative</button>
            <button class="weekly-modal__tab" data-tab="updates">Key Updates</button>
          </nav>
        </header>
        <div class="weekly-modal__content">
          <div class="weekly-modal__panel active" id="panel-executive">
            <div class="weekly-modal__loading">Loading executive summary...</div>
          </div>
          <div class="weekly-modal__panel" id="panel-narrative">
            <div class="weekly-modal__loading">Loading narrative...</div>
          </div>
          <div class="weekly-modal__panel" id="panel-updates">
            <div class="weekly-modal__loading">Loading key updates...</div>
          </div>
        </div>
        <footer class="weekly-modal__footer">
          <button class="btn btn-secondary" id="closeWeeklyBriefingFooter">Close</button>
          <button class="btn btn-primary" id="printWeeklyBriefing">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9V2h12v7" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="6" y="14" width="12" height="8" rx="1" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Print Report
          </button>
        </footer>
      </div>
    </div>
    <script>
      (function() {
        // Weekly Briefing Modal functionality
        function openWeeklyBriefingModal() {
          const modal = document.getElementById('weeklyBriefingModal');
          if (!modal) return;

          modal.style.display = 'flex';
          document.body.style.overflow = 'hidden';

          // Load content
          loadWeeklyBriefingContent();
        }

        function closeWeeklyBriefingModal() {
          const modal = document.getElementById('weeklyBriefingModal');
          if (!modal) return;

          modal.style.display = 'none';
          document.body.style.overflow = '';
        }

        async function loadWeeklyBriefingContent() {
          try {
            const response = await fetch('/api/weekly-briefing/current');
            if (!response.ok) throw new Error('Failed to load briefing');

            const data = await response.json();

            // Populate Executive Summary
            const execPanel = document.getElementById('panel-executive');
            if (execPanel && data.executive) {
              execPanel.innerHTML = data.executive;
            } else if (execPanel) {
              execPanel.innerHTML = '<div class="empty-state">No executive summary available. Generate a briefing first.</div>';
            }

            // Populate Narrative
            const narrativePanel = document.getElementById('panel-narrative');
            if (narrativePanel && data.narrative) {
              narrativePanel.innerHTML = '<div class="briefing-rich-text">' + data.narrative + '</div>';
            } else if (narrativePanel) {
              narrativePanel.innerHTML = '<div class="empty-state">No narrative available. Generate a briefing first.</div>';
            }

            // Populate Key Updates
            const updatesPanel = document.getElementById('panel-updates');
            if (updatesPanel && data.updates) {
              updatesPanel.innerHTML = '<div class="updates-grid">' + data.updates + '</div>';
            } else if (updatesPanel) {
              updatesPanel.innerHTML = '<div class="empty-state">No updates available.</div>';
            }
          } catch (error) {
            console.error('Error loading weekly briefing:', error);
            const panels = document.querySelectorAll('.weekly-modal__panel');
            panels.forEach(panel => {
              panel.innerHTML = '<div class="empty-state">Unable to load content. Please try again.</div>';
            });
          }
        }

        function switchTab(tabName) {
          // Update tab buttons
          document.querySelectorAll('.weekly-modal__tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
          });

          // Update panels
          document.querySelectorAll('.weekly-modal__panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === 'panel-' + tabName);
          });
        }

        function printWeeklyBriefing() {
          // Show all panels for printing
          const panels = document.querySelectorAll('.weekly-modal__panel');
          panels.forEach(panel => panel.classList.add('print-visible'));

          // Add print class to modal
          const modal = document.getElementById('weeklyBriefingModal');
          if (modal) modal.classList.add('printing');

          // Trigger print
          window.print();

          // Remove print classes after printing
          setTimeout(() => {
            panels.forEach(panel => panel.classList.remove('print-visible'));
            if (modal) modal.classList.remove('printing');
          }, 1000);
        }

        // Event listeners
        document.addEventListener('click', function(e) {
          // Close button
          if (e.target.closest('#closeWeeklyBriefing') || e.target.closest('#closeWeeklyBriefingFooter')) {
            closeWeeklyBriefingModal();
          }

          // Backdrop click
          if (e.target.classList.contains('weekly-modal-backdrop')) {
            closeWeeklyBriefingModal();
          }

          // Tab click
          const tab = e.target.closest('.weekly-modal__tab');
          if (tab) {
            switchTab(tab.dataset.tab);
          }

          // Print button
          if (e.target.closest('#printWeeklyBriefing')) {
            printWeeklyBriefing();
          }
        });

        // ESC key to close
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            closeWeeklyBriefingModal();
          }
        });

        // Expose to global scope
        window.openWeeklyBriefingModal = openWeeklyBriefingModal;
        window.closeWeeklyBriefingModal = closeWeeklyBriefingModal;
      })();
    </script>
  `
}

function renderModals() {
  return [
    renderAssembleModal(),
    renderAnnotationModal(),
    renderQuickNoteModal(),
    renderWeeklyBriefingModal()
  ].join('\n')
}

module.exports = {
  renderModals,
  renderWeeklyBriefingModal
}
