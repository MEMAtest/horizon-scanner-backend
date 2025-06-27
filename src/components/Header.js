// src/components/Header.js
const StatusIndicator = require('./StatusIndicator');

function render({ title, subtitle }) {
    return `
    <div class="header">
        <div class="header-content">
            <h1 class="title">${title}</h1>
            <p class="subtitle">${subtitle}</p>
        </div>
        ${StatusIndicator.render()}
    </div>`;
}

module.exports = { render };
