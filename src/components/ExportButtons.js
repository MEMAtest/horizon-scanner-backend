// src/components/ExportButtons.js
function render() {
  return `
    <div class="export-controls">
        <div class="control-group"><label>Actions</label><div>
            <button id="exportCsvBtn" class="btn btn-secondary">Export CSV</button>
            <button id="exportJsonBtn" class="btn btn-secondary">Export JSON</button>
        </div></div>
    </div>`
}
module.exports = { render }
