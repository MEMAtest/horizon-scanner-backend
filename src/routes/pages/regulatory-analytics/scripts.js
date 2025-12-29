function getRegulatoryAnalyticsScripts({
  monthlyChartData,
  topAuthorities,
  impactDistribution,
  safeUpdates,
  sectorBurden,
  impactTrends,
  authorityComparison
}) {
  return `
      <script>
        const analyticsData = {
          monthlyChartData: ${JSON.stringify(monthlyChartData)},
          topAuthorities: ${JSON.stringify(topAuthorities)},
          impactDistribution: ${JSON.stringify(impactDistribution)},
          rawUpdates: ${JSON.stringify(safeUpdates.slice(0, 500).map(u => ({
            title: u.title,
            authority: u.authority,
            sector: u.sector,
            impact_level: u.impact_level,
            published_date: u.published_date,
            source_url: u.source_url
          })))}
        };

        // Chart.js color palette (matching Enforcement page)
        const chartColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];

        // Monthly Trend Chart (Mixed: Line + Bar)
        const monthlyCtx = document.getElementById('monthlyTrendChart').getContext('2d');
        const monthlyLabels = analyticsData.monthlyChartData.map(d => {
          const [year, month] = d.month.split('-');
          return new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        });

        new Chart(monthlyCtx, {
          type: 'bar',
          data: {
            labels: monthlyLabels,
            datasets: [
              {
                type: 'line',
                label: 'Total Publications',
                data: analyticsData.monthlyChartData.map(d => d.total),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.35,
                fill: true,
                yAxisID: 'y'
              },
              {
                type: 'bar',
                label: 'High Impact',
                data: analyticsData.monthlyChartData.map(d => d.high),
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderColor: '#ef4444',
                borderWidth: 1,
                borderRadius: 6,
                yAxisID: 'y'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
              legend: {
                position: 'top',
                align: 'end',
                labels: { usePointStyle: true, padding: 20 }
              },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#64748b' }
              },
              y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { color: '#64748b' }
              }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const monthData = analyticsData.monthlyChartData[index];
                showDrilldown('month', monthData.month, monthData);
              }
            }
          }
        });

        // Authority Chart (Horizontal Bar)
        const authorityCtx = document.getElementById('authorityChart').getContext('2d');
        const authData = analyticsData.topAuthorities.slice(0, 8);

        new Chart(authorityCtx, {
          type: 'bar',
          data: {
            labels: authData.map(a => a.name),
            datasets: [{
              label: 'Publications',
              data: authData.map(a => a.total),
              backgroundColor: chartColors.map(c => c + 'cc'),
              borderColor: chartColors,
              borderWidth: 1,
              borderRadius: 6
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { color: '#64748b' }
              },
              y: {
                grid: { display: false },
                ticks: { color: '#1e293b' }
              }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const authority = authData[index];
                showDrilldown('authority', authority.name, authority);
              }
            }
          }
        });

        // Impact Distribution Chart (Doughnut)
        const impactCtx = document.getElementById('impactChart').getContext('2d');
        const impactData = [
          analyticsData.impactDistribution.high,
          analyticsData.impactDistribution.medium,
          analyticsData.impactDistribution.low
        ];
        const impactTotal = impactData.reduce((a, b) => a + b, 0);

        new Chart(impactCtx, {
          type: 'doughnut',
          data: {
            labels: ['High Impact', 'Medium Impact', 'Low Impact'],
            datasets: [{
              data: impactData,
              backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(34, 197, 94, 0.8)'
              ],
              borderColor: ['#ef4444', '#f59e0b', '#22c55e'],
              borderWidth: 2,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { usePointStyle: true, padding: 20 }
              },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const percentage = ((value / impactTotal) * 100).toFixed(1);
                    return context.label + ': ' + value + ' (' + percentage + '%)';
                  }
                }
              }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const impactLabels = ['high', 'medium', 'low'];
                const impactLevel = impactLabels[index];
                showDrilldown('impact', impactLevel, { count: impactData[index] });
              }
            }
          }
        });

        // NEW: Sector Burden Chart
        const sectorBurdenCtx = document.getElementById('sectorBurdenChart').getContext('2d');
        const sectorBurdenData = ${JSON.stringify(sectorBurden)};
        new Chart(sectorBurdenCtx, {
          type: 'bar',
          data: {
            labels: sectorBurdenData.map(s => s.name),
            datasets: [{
              label: 'Avg Publications/Month',
              data: sectorBurdenData.map(s => s.avgPerMonth),
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              borderColor: '#6366f1',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                callbacks: {
                  label: function(context) {
                    const sector = sectorBurdenData[context.dataIndex];
                    return [
                      'Avg/Month: ' + sector.avgPerMonth,
                      'Total: ' + sector.total,
                      'Market Share: ' + sector.percentOfTotal + '%'
                    ];
                  }
                }
              }
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Avg Publications/Month' } }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const sector = sectorBurdenData[elements[0].index];
                drillDownSector(sector.name);
              }
            }
          }
        });

        // NEW: Impact Trends Chart
        const impactTrendsCtx = document.getElementById('impactTrendsChart').getContext('2d');
        const impactTrendsData = ${JSON.stringify(impactTrends)};
        new Chart(impactTrendsCtx, {
          type: 'line',
          data: {
            labels: impactTrendsData.map(t => t.month),
            datasets: [
              {
                label: 'High Impact %',
                data: impactTrendsData.map(t => t.highPercentage),
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
              },
              {
                label: 'Severity Score',
                data: impactTrendsData.map(t => t.severityScore * 20), // Scale for visibility
                borderColor: '#ea580c',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                callbacks: {
                  label: function(context) {
                    if (context.datasetIndex === 0) {
                      return 'High Impact: ' + context.parsed.y + '%';
                    } else {
                      return 'Severity Score: ' + (context.parsed.y / 20).toFixed(2);
                    }
                  }
                }
              }
            },
            scales: {
              y: { beginAtZero: true, max: 100 }
            }
          }
        });

        // NEW: Authority Comparison Chart
        const authCompCtx = document.getElementById('authorityComparisonChart').getContext('2d');
        const authCompData = ${JSON.stringify(authorityComparison)};
        new Chart(authCompCtx, {
          type: 'bar',
          data: {
            labels: authCompData.map(a => a.name),
            datasets: [
              {
                label: 'Total Publications',
                data: authCompData.map(a => a.total),
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: '#6366f1',
                borderWidth: 2
              },
              {
                label: 'Recent (30d)',
                data: authCompData.map(a => a.recent),
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: '#10b981',
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                callbacks: {
                  afterLabel: function(context) {
                    const auth = authCompData[context.dataIndex];
                    return 'Trend: ' + auth.trend + ' | Velocity: ' + auth.velocity;
                  }
                }
              }
            },
            scales: {
              y: { beginAtZero: true }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const auth = authCompData[elements[0].index];
                drillDownAuthority(auth.name);
              }
            }
          }
        });

        // NEW: Drill-down functions for new widgets
        function drillDownSector(sectorName) {
          const filtered = analyticsData.rawUpdates.filter(u => u.sector === sectorName);
          showDrilldown('sector', sectorName, { count: filtered.length });
        }

        function drillDownAuthority(authorityName) {
          showDrilldown('authority', authorityName, {});
        }

        function drillDownPair(sector, authority) {
          const modal = document.getElementById('drilldownModal');
          const title = document.getElementById('drilldownTitle');
          const content = document.getElementById('drilldownContent');

          const filtered = analyticsData.rawUpdates.filter(u =>
            u.sector === sector && u.authority === authority
          );

          title.textContent = sector + ' × ' + authority + ' (' + filtered.length + ' publications)';

          if (filtered.length === 0) {
            content.innerHTML = '<div class="drilldown-empty">No publications found</div>';
          } else {
            content.innerHTML = filtered.slice(0, 50).map(update => {
              const date = update.published_date ? new Date(update.published_date).toLocaleDateString('en-GB') : 'Unknown';
              return '<div class="drilldown-item">' +
                '<div class="drilldown-item-title">' + escapeHtml(update.title || 'Untitled') + '</div>' +
                '<div class="drilldown-item-meta">' +
                  '<span>' + escapeHtml(update.authority || 'Unknown') + '</span>' +
                  '<span>' + date + '</span>' +
                  '<span>' + escapeHtml(update.impact_level || 'Unknown') + '</span>' +
                  (update.source_url ? '<a href="' + escapeHtml(update.source_url) + '" target="_blank">View</a>' : '') +
                '</div>' +
              '</div>';
            }).join('');
          }

          modal.classList.add('active');
        }

        // Drilldown modal functions
        function showDrilldown(type, value, data) {
          const modal = document.getElementById('drilldownModal');
          const title = document.getElementById('drilldownTitle');
          const content = document.getElementById('drilldownContent');

          // Filter updates based on type
          let filteredUpdates = [];
          let titleText = '';

          if (type === 'month') {
            titleText = 'Publications for ' + formatMonth(value);
            const [year, month] = value.split('-');
            filteredUpdates = analyticsData.rawUpdates.filter(u => {
              if (!u.published_date) return false;
              const d = new Date(u.published_date);
              return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
            });
          } else if (type === 'authority') {
            titleText = 'Publications by ' + value;
            filteredUpdates = analyticsData.rawUpdates.filter(u => u.authority === value);
          } else if (type === 'sector') {
            titleText = 'Publications in ' + value + ' Sector';
            filteredUpdates = analyticsData.rawUpdates.filter(u => u.sector === value);
          } else if (type === 'impact') {
            const displayLevel = value.charAt(0).toUpperCase() + value.slice(1);
            titleText = displayLevel + ' Impact Publications';
            filteredUpdates = analyticsData.rawUpdates.filter(u => {
              const level = normalizeImpactLevel(u.impact_level);
              return level === value;
            });
          }

          title.textContent = titleText + ' (' + filteredUpdates.length + ')';

          if (filteredUpdates.length === 0) {
            content.innerHTML = '<div class="drilldown-empty">No publications found</div>';
          } else {
            content.innerHTML = filteredUpdates.slice(0, 50).map(update => {
              const date = update.published_date ? new Date(update.published_date).toLocaleDateString('en-GB') : 'Unknown date';
              return '<div class="drilldown-item">' +
                '<div class="drilldown-item-title">' + escapeHtml(update.title) + '</div>' +
                '<div class="drilldown-item-meta">' +
                  '<span>' + escapeHtml(update.authority || 'Unknown') + '</span>' +
                  '<span>' + date + '</span>' +
                  '<span>' + escapeHtml(update.sector || 'General') + '</span>' +
                  (update.source_url ? '<a href="' + escapeHtml(update.source_url) + '" target="_blank">View Source</a>' : '') +
                '</div>' +
              '</div>';
            }).join('');

            if (filteredUpdates.length > 50) {
              content.innerHTML += '<div class="drilldown-empty">Showing 50 of ' + filteredUpdates.length + ' publications</div>';
            }
          }

          modal.classList.add('active');
        }

        function closeDrilldown() {
          document.getElementById('drilldownModal').classList.remove('active');
        }

        function normalizeImpactLevel(rawImpact) {
          if (!rawImpact) return 'medium';
          const impact = String(rawImpact).toLowerCase().trim();
          if (['high', 'significant', 'critical', 'severe'].includes(impact)) return 'high';
          if (['low', 'informational', 'minor', 'negligible'].includes(impact)) return 'low';
          return 'medium';
        }

        function formatMonth(monthStr) {
          const [year, month] = monthStr.split('-');
          return new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        }

        function escapeHtml(str) {
          if (!str) return '';
          const div = document.createElement('div');
          div.textContent = str;
          return div.innerHTML;
        }

        // Export functionality
        function exportData(type) {
          const endpoints = {
            csv: '/api/analytics/export/csv',
            excel: '/api/analytics/export/excel',
            summary: '/api/analytics/export/summary'
          };

          const url = endpoints[type];
          if (!url) return;

          // Show loading state on button
          const btn = event.target.closest('.export-btn');
          const originalText = btn.innerHTML;
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> Exporting...';
          btn.disabled = true;

          // Trigger download
          const link = document.createElement('a');
          link.href = url;
          link.click();

          // Reset button after delay
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
          }, 2000);
        }
      </script>
`
}

module.exports = { getRegulatoryAnalyticsScripts }
