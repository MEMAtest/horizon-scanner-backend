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

function renderModals() {
  return [
    renderAssembleModal(),
    renderAnnotationModal(),
    renderQuickNoteModal()
  ].join('\n')
}

module.exports = {
  renderModals
}
