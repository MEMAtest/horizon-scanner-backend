// src/pages/DashboardPage.js

const renderHeader = () => `
    <div class="header">
        <h1 class="title">Regulatory Horizon Scanner</h1>
        <p class="subtitle">AI-powered monitoring of UK financial regulatory updates.</p>
    </div>`

const renderAnalytics = () => `
    <div class="analytics-grid">
        <div class="chart-card">
            <h3>Monthly Activity</h3>
            <canvas id="monthlyActivityChart"></canvas>
        </div>
        <div class="chart-card">
            <h3>Sector Distribution</h3>
            <canvas id="sectorDistributionChart"></canvas>
        </div>
        <div class="chart-card">
            <h3>Authority Activity</h3>
            <canvas id="authorityActivityChart"></canvas>
        </div>
    </div>`

const renderControls = () => `
    <div class="controls">
        <div class="control-group">
            <label for="searchInput">Search</label>
            <input type="text" id="searchInput" placeholder="Search all fields...">
        </div>
        <div class="control-group">
            <label for="startDate">Start Date</label>
            <input type="date" id="startDate">
        </div>
        <div class="control-group">
            <label for="endDate">End Date</label>
            <input type="date" id="endDate">
        </div>
        <div class="control-group">
            <label for="sortSelect">Sort By</label>
            <select id="sortSelect">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="impact">High Impact</option>
                <option value="urgency">High Urgency</option>
            </select>
        </div>
        <div class="control-group">
            <label>Actions</label>
            <div>
                <button id="exportCsvBtn" class="btn btn-secondary">Export CSV</button>
                <button id="exportJsonBtn" class="btn btn-secondary">Export JSON</button>
            </div>
        </div>
    </div>`

const renderFilters = () => `
    <div class="filters">
        <div class="filter-group" id="categoryFilter">
            <h4>Category</h4>
            <div class="checkbox-group"></div>
            <div class="filter-actions"></div>
        </div>
        <div class="filter-group" id="authorityFilter">
            <h4>Authority</h4>
            <div class="checkbox-group"></div>
            <div class="filter-actions"></div>
        </div>
        <div class="filter-group" id="impactFilter">
            <h4>Impact Level</h4>
            <div class="checkbox-group"></div>
            <div class="filter-actions"></div>
        </div>
        <div class="filter-group" id="urgencyFilter">
            <h4>Urgency</h4>
            <div class="checkbox-group"></div>
            <div class="filter-actions"></div>
        </div>
    </div>`

const renderClientScript = () => `
    <script>
        let allUpdates = [];
        let charts = {};

        document.addEventListener('DOMContentLoaded', () => {
            init();
            addEventListeners();
        });

        async function init() {
            showToast('Loading dashboard...', 'info');
            const [dataRes, analyticsRes] = await Promise.all([
                fetch('/api/updates'),
                fetch('/api/analytics')
            ]);
            const data = await dataRes.json();
            const analytics = await analyticsRes.json();
            
            allUpdates = Object.values(data).flat().filter(u => u && (u.id || u.headline)); // Handle items with or without id
            renderAnalytics(analytics);
            populateFilters();
            applyFilters();
            showToast('Dashboard ready!', 'success');
        }

        function addEventListeners() {
            document.getElementById('searchInput').addEventListener('input', throttledFilter);
            document.getElementById('startDate').addEventListener('change', throttledFilter);
            document.getElementById('endDate').addEventListener('change', throttledFilter);
            document.getElementById('sortSelect').addEventListener('change', throttledFilter);
            document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
            document.getElementById('exportJsonBtn').addEventListener('click', exportJSON);
        }
        
        function populateFilters() {
            const categories = [...new Set(allUpdates.map(u => u.sector || 'General'))].sort();
            const authorities = [...new Set(allUpdates.map(u => u.authority))].sort();
            const impacts = ['Significant', 'Moderate', 'Informational'];
            const urgencies = ['High', 'Medium', 'Low'];
            createFilterGroup('categoryFilter', categories, 'category');
            createFilterGroup('authorityFilter', authorities, 'authority');
            createFilterGroup('impactFilter', impacts, 'impact');
            createFilterGroup('urgencyFilter', urgencies, 'urgency');
        }

        function createFilterGroup(elementId, items, groupName) {
            const container = document.querySelector(\`#\${elementId} .checkbox-group\`);
            if (!container) return;
            container.innerHTML = items.map(item => \`
                <label class="checkbox-item"><input type="checkbox" class="filter-checkbox" data-group="\${groupName}" value="\${item}"> \${item}</label>
            \`).join('');
            const actionsContainer = document.querySelector(\`#\${elementId} .filter-actions\`);
            actionsContainer.innerHTML = \`<button class="btn-link" data-action="selectAll" data-group="\${groupName}">All</button> / <button class="btn-link" data-action="clearAll" data-group="\${groupName}">None</button>\`;
            document.querySelectorAll(\`#\${elementId} [data-action]\`).forEach(btn => btn.addEventListener('click', (e) => handleFilterAction(e)));
            document.querySelectorAll(\`#\${elementId} .filter-checkbox\`).forEach(cb => cb.addEventListener('change', throttledFilter));
        }

        function handleFilterAction(e) {
            const { action, group } = e.target.dataset;
            document.querySelectorAll(\`input[data-group='\${group}']\`).forEach(cb => cb.checked = (action === 'selectAll'));
            throttledFilter();
        }
        
        let filterTimeout;
        function throttledFilter() { clearTimeout(filterTimeout); filterTimeout = setTimeout(applyFilters, 250); }

        function applyFilters() {
            const filters = getActiveFilters();
            let filtered = allUpdates.filter(update => {
                const searchVal = filters.search.toLowerCase();
                const matchSearch = !filters.search || Object.values(update).some(val => String(val).toLowerCase().includes(searchVal));
                const updateDate = new Date(update.created_at || update.fetchedDate);
                const matchDate = (!filters.startDate || updateDate >= filters.startDate) && (!filters.endDate || updateDate <= filters.endDate);
                const matchCategory = filters.category.size === 0 || filters.category.has(update.sector || 'General');
                const matchAuthority = filters.authority.size === 0 || filters.authority.has(update.authority);
                const matchImpact = filters.impact.size === 0 || filters.impact.has(update.impactLevel);
                const matchUrgency = filters.urgency.size === 0 || filters.urgency.has(update.urgency);
                return matchSearch && matchDate && matchCategory && matchAuthority && matchImpact && matchUrgency;
            });
            sortUpdates(filtered, filters.sort);
            renderUpdates(filtered);
            updateAnalytics(filtered);
        }
        
        function getActiveFilters() {
            const search = document.getElementById('searchInput').value;
            const startDate = document.getElementById('startDate').valueAsDate;
            const endDate = document.getElementById('endDate').valueAsDate;
            if (endDate) endDate.setHours(23, 59, 59, 999);
            const sort = document.getElementById('sortSelect').value;
            const filters = { search, startDate, endDate, sort };
            ['category', 'authority', 'impact', 'urgency'].forEach(group => {
                filters[group] = new Set(Array.from(document.querySelectorAll(\`input[data-group='\${group}']:checked\`)).map(cb => cb.value));
            });
            return filters;
        }

        function sortUpdates(updates, sortBy) {
            const urgencyMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
            const impactMap = { 'Significant': 3, 'Moderate': 2, 'Informational': 1 };
            updates.sort((a, b) => {
                const dateA = new Date(a.created_at || a.fetchedDate);
                const dateB = new Date(b.created_at || b.fetchedDate);
                switch (sortBy) {
                    case 'oldest': return dateA - dateB;
                    case 'impact': return (impactMap[b.impactLevel] || 0) - (impactMap[a.impactLevel] || 0) || dateB - dateA;
                    case 'urgency': return (urgencyMap[b.urgency] || 0) - (urgencyMap[a.urgency] || 0) || dateB - dateA;
                    default: return dateB - dateA;
                }
            });
        }
        
        function renderUpdates(updates) {
            const grid = document.getElementById('updatesGrid');
            grid.innerHTML = updates.length === 0 ? '<p>No updates match the current filters.</p>' : updates.map(update => \`
                <div class="update-card" id="update-\${update.id || update.headline}">
                    <h3>\${update.headline}</h3>
                    <div class="update-card-meta">
                        <span class="tag tag-authority">\${update.authority}</span>
                        <span class="tag tag-sector">\${update.sector}</span>
                        <span class="tag tag-\${(update.impactLevel || '').toLowerCase()}">\${update.impactLevel}</span>
                        <span class="tag tag-\${(update.urgency || '').toLowerCase()}">\${update.urgency}</span>
                    </div>
                    <p class="update-card-impact">\${update.impact}</p>
                    <div class="update-card-footer">
                        <a href="\${update.url}" target="_blank" class="btn btn-primary">Read More</a>
                        <small><strong>Date:</strong> \${new Date(update.created_at || update.fetchedDate).toLocaleDateString('en-GB')}</small>
                    </div>
                </div>\`).join('');
        }

        function renderAnalytics(data) {
            const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
            const doughnutOptions = { ...chartOptions, plugins: { legend: { display: true, position: 'bottom' } } };
            if(document.getElementById('monthlyActivityChart')) charts.monthly = new Chart(document.getElementById('monthlyActivityChart'), { type: 'bar', data: { labels: data.monthlyActivity.map(d=>d.month), datasets: [{ label: '# of Updates', data: data.monthlyActivity.map(d=>d.count), backgroundColor: '#c7d2fe' }] }, options: chartOptions });
            if(document.getElementById('sectorDistributionChart')) charts.sector = new Chart(document.getElementById('sectorDistributionChart'), { type: 'doughnut', data: { labels: data.sectorDistribution.map(d=>d.sector), datasets: [{ data: data.sectorDistribution.map(d=>d.count), backgroundColor: ['#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#312e81', '#3730a3'] }] }, options: doughnutOptions });
            if(document.getElementById('authorityActivityChart')) charts.authority = new Chart(document.getElementById('authorityActivityChart'), { type: 'bar', data: { labels: data.authorityActivity.map(d=>d.authority), datasets: [{ label: '# of Updates', data: data.authorityActivity.map(d=>d.count), backgroundColor: '#a5b4fc' }] }, options: chartOptions });
        }

        function updateAnalytics(filteredUpdates) {
            const sectorCounts = filteredUpdates.reduce((acc, u) => { acc[u.sector || 'General'] = (acc[u.sector || 'General'] || 0) + 1; return acc; }, {});
            if(charts.sector) {
                charts.sector.data.labels = Object.keys(sectorCounts);
                charts.sector.data.datasets[0].data = Object.values(sectorCounts);
                charts.sector.update();
            }
            
            const authorityCounts = filteredUpdates.reduce((acc, u) => { acc[u.authority] = (acc[u.authority] || 0) + 1; return acc; }, {});
            if(charts.authority) {
                charts.authority.data.labels = Object.keys(authorityCounts);
                charts.authority.data.datasets[0].data = Object.values(authorityCounts);
                charts.authority.update();
            }
        }
        
        function exportCSV() {
            const filtered = getFilteredData();
            if (filtered.length === 0) return showToast('No data to export', 'error');
            const headers = ['headline', 'impact', 'area', 'authority', 'impactLevel', 'urgency', 'sector', 'keyDates', 'url', 'fetchedDate'];
            const csvRows = [headers.join(','), ...filtered.map(row => headers.map(h => \`"\${(row[h] || '').toString().replace(/"/g, '""')}"\`).join(','))];
            downloadFile(csvRows.join('\\n'), 'text/csv', 'csv');
            showToast('CSV export started!', 'success');
        }

        function exportJSON() {
            const filtered = getFilteredData();
            if (filtered.length === 0) return showToast('No data to export', 'error');
            downloadFile(JSON.stringify(filtered, null, 2), 'application/json', 'json');
            showToast('JSON export started!', 'success');
        }

        function getFilteredData() {
            const filters = getActiveFilters();
            let filtered = allUpdates.filter(update => {
                const searchVal = filters.search.toLowerCase();
                const matchSearch = !filters.search || Object.values(update).some(val => String(val).toLowerCase().includes(searchVal));
                const updateDate = new Date(update.created_at || update.fetchedDate);
                const matchDate = (!filters.startDate || updateDate >= filters.startDate) && (!filters.endDate || updateDate <= filters.endDate);
                const matchCategory = filters.category.size === 0 || filters.category.has(update.sector || 'General');
                const matchAuthority = filters.authority.size === 0 || filters.authority.has(update.authority);
                const matchImpact = filters.impact.size === 0 || filters.impact.has(update.impactLevel);
                const matchUrgency = filters.urgency.size === 0 || filters.urgency.has(update.urgency);
                return matchSearch && matchDate && matchCategory && matchAuthority && matchImpact && matchUrgency;
            });
            sortUpdates(filtered, filters.sort);
            return filtered;
        }

        function downloadFile(content, mimeType, extension) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`regulatory_scanner_export_\${new Date().toISOString().slice(0,10)}.\${extension}\`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = 'toast show';
            if (type === 'error') toast.classList.add('error');
            setTimeout(() => { toast.className = 'toast'; }, 3000);
        }
    </script>
`

async function renderDashboardPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <title>RegCanary - Regulatory Intelligence Platform</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/components.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        ${renderHeader()}
        ${renderAnalytics()}
        ${renderControls()}
        ${renderFilters()}
        <div id="updatesGrid"></div>
        <div id="toast" class="toast"></div>
    </div>
    ${renderClientScript()}
</body>
</html>`
}

module.exports = { renderDashboardPage }
