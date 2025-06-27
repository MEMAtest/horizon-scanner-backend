// src/components/FilterPanel/FilterPanel.js
const SearchBox = require('../SearchBox');
const ExportButtons = require('../ExportButtons');

function render() {
    return `
    <div class="controls-container">
        ${SearchBox.render()}
        ${ExportButtons.render()}
    </div>
    <div class="filters">
        <div class="filter-group" id="categoryFilter"><h4>Category</h4><div class="checkbox-group"></div><div class="filter-actions"></div></div>
        <div class="filter-group" id="authorityFilter"><h4>Authority</h4><div class="checkbox-group"></div><div class="filter-actions"></div></div>
        <div class="filter-group" id="impactFilter"><h4>Impact Level</h4><div class="checkbox-group"></div><div class="filter-actions"></div></div>
        <div class="filter-group" id="urgencyFilter"><h4>Urgency</h4><div class="checkbox-group"></div><div class="filter-actions"></div></div>
    </div>`;
}

module.exports = { render };
