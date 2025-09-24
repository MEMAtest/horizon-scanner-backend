// src/components/SearchBox.js
function render() {
  return `
    <div class="search-controls">
        <div class="control-group"><label for="searchInput">Search</label><input type="text" id="searchInput" placeholder="Search all fields..."></div>
        <div class="control-group"><label for="startDate">Start Date</label><input type="date" id="startDate"></div>
        <div class="control-group"><label for="endDate">End Date</label><input type="date" id="endDate"></div>
        <div class="control-group"><label for="sortSelect">Sort By</label><select id="sortSelect">
            <option value="newest">Newest</option><option value="oldest">Oldest</option>
            <option value="impact">High Impact</option><option value="urgency">High Urgency</option>
        </select></div>
    </div>`
}
module.exports = { render }
