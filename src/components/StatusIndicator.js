// src/components/StatusIndicator.js
function render() {
    // Client-side JS will control the status text and color
    return `
    <div class="status-indicator-container">
        <div id="systemStatusIndicator" class="indicator-dot"></div>
        <span id="systemStatusText">Checking status...</span>
    </div>`;
}

module.exports = { render };
