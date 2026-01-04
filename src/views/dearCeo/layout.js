/**
 * Dear CEO Letters Page Layout
 *
 * Premium analysis page for FCA Dear CEO letters and PRA Supervisory Statements
 */

const { getDearCeoIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../icons')

function getDearCeoStyles() {
  const canaryStyles = getCanaryAnimationStyles()
  return `
    <link rel="stylesheet" href="/css/dear-ceo/index.css">
    <style>${canaryStyles}</style>
  `
}

function renderDearCeoHeader() {
  const pageIcon = wrapIconInContainer(getDearCeoIcon())
  return `
    <header class="page-header">
      <div class="header-title">
        ${pageIcon}
        <div>
          <h1>Dear CEO Letters & Supervisory Statements</h1>
          <p class="page-subtitle">
            Premium analysis of FCA Dear CEO letters and PRA Supervisory Statements - critical communications requiring board attention
          </p>
        </div>
      </div>
      <div class="header-meta">
        <div class="meta-item status">
          <span class="meta-label">Status</span>
          <span class="meta-value">
            <span class="status-dot"></span>
            <span>Active</span>
          </span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Letters</span>
          <span class="meta-value" id="header-letter-count">-</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Coverage</span>
          <span class="meta-value">5 Years</span>
        </div>
      </div>
    </header>
  `
}

function getDearCeoScripts() {
  return `
    <script>
      let selectedLetterId = null;
      let lettersData = [];
      let trendsData = null;

      // Initialize page
      document.addEventListener('DOMContentLoaded', async () => {
        await loadSummary();
        await loadLetters();
        await loadTrends();
      });

      async function loadSummary() {
        try {
          const response = await fetch('/api/dear-ceo/summary');
          const data = await response.json();

          if (data.success) {
            document.getElementById('total-letters').textContent = data.summary.totalLetters;
            document.getElementById('fca-count').textContent = data.summary.byAuthority.FCA || 0;
            document.getElementById('pra-count').textContent = data.summary.byAuthority.PRA || 0;
            document.getElementById('header-letter-count').textContent = data.summary.totalLetters;

            // Top theme
            if (data.summary.topThemes.length > 0) {
              document.getElementById('top-theme').textContent = data.summary.topThemes[0].name;
            }
          }
        } catch (error) {
          console.error('Error loading summary:', error);
        }
      }

      async function loadLetters(filters = {}) {
        const listEl = document.getElementById('letters-list');
        listEl.innerHTML = '<div class="loading-spinner">Loading letters...</div>';

        try {
          const params = new URLSearchParams(filters);
          const response = await fetch('/api/dear-ceo/letters?' + params);
          const data = await response.json();

          if (data.success) {
            lettersData = data.letters;
            renderLettersList(data.letters);
          }
        } catch (error) {
          console.error('Error loading letters:', error);
          listEl.innerHTML = '<div class="loading-spinner">Error loading letters</div>';
        }
      }

      function renderLettersList(letters) {
        const listEl = document.getElementById('letters-list');

        if (letters.length === 0) {
          listEl.innerHTML = '<div style="padding: 40px; text-align: center; color: #6b7280;">No letters found</div>';
          return;
        }

        listEl.innerHTML = letters.map(letter => \`
          <div class="letter-item" data-id="\${letter.id}" onclick="selectLetter('\${letter.id}')">
            <div class="letter-header">
              <span class="letter-authority \${letter.authority === 'PRA' ? 'pra' : ''}">\${letter.authority}</span>
              <span class="letter-date">\${formatDate(letter.published_date)}</span>
            </div>
            <div class="letter-title">\${letter.headline}</div>
            <div class="letter-themes">
              \${(letter.themes || []).slice(0, 3).map(t => \`<span class="theme-tag">\${t}</span>\`).join('')}
            </div>
          </div>
        \`).join('');
      }

      async function loadTrends() {
        try {
          const response = await fetch('/api/dear-ceo/themes?years=5&groupBy=quarter');
          const data = await response.json();

          if (data.success) {
            trendsData = data.trends;
            renderTrends(data.trends);
          }
        } catch (error) {
          console.error('Error loading trends:', error);
        }
      }

      function renderTrends(trends) {
        const container = document.getElementById('trends-container');

        const themeStatus = Object.entries(trends.themeStatus)
          .filter(([_, v]) => v.status !== 'insufficient_data' && v.status !== 'low')
          .sort((a, b) => b[1].recentAverage - a[1].recentAverage)
          .slice(0, 8);

        container.innerHTML = themeStatus.map(([key, status]) => \`
          <div class="trend-item">
            <span class="trend-name">\${status.name}</span>
            <span class="trend-status \${status.status}">\${status.status}</span>
          </div>
        \`).join('');
      }

      async function selectLetter(id) {
        selectedLetterId = id;

        // Update selection UI
        document.querySelectorAll('.letter-item').forEach(el => {
          el.classList.toggle('selected', el.dataset.id === id);
        });

        // Open modal with analysis
        await openAnalysisModal(id);
      }

      async function openAnalysisModal(id) {
        const modal = document.getElementById('analysis-modal');
        const modalBody = document.getElementById('modal-body');

        modal.classList.add('active');
        modalBody.innerHTML = '<div class="loading-spinner">Generating analysis...</div>';

        try {
          const response = await fetch(\`/api/dear-ceo/analysis/\${id}\`);
          const data = await response.json();

          if (data.success) {
            renderAnalysis(data.analysis);
            // Load saved action statuses after rendering
            setTimeout(() => loadActionStatuses(), 100);
          } else {
            modalBody.innerHTML = '<div style="padding: 40px; text-align: center; color: #dc2626;">Error loading analysis</div>';
          }
        } catch (error) {
          console.error('Error loading analysis:', error);
          modalBody.innerHTML = '<div style="padding: 40px; text-align: center; color: #dc2626;">Error loading analysis</div>';
        }
      }

      function renderAnalysis(analysis) {
        const modalHeader = document.getElementById('modal-header-content');
        const modalBody = document.getElementById('modal-body');

        // Update header with metadata
        modalHeader.innerHTML = \`
          <h2>\${analysis.headline}</h2>
          <div class="modal-meta">
            <span class="letter-authority \${analysis.authority === 'PRA' ? 'pra' : ''}">\${analysis.authority}</span>
            <span class="modal-meta-divider"></span>
            <span class="modal-meta-item">\${analysis.documentDate || formatDate(analysis.publishedDate)}</span>
            \${analysis.urgency ? \`
              <span class="modal-meta-divider"></span>
              <span class="complexity-badge \${analysis.urgency.color}">\${analysis.urgency.level} Priority</span>
            \` : ''}
          </div>
        \`;

        modalBody.innerHTML = \`
          <!-- Executive Summary -->
          <div class="executive-summary">
            <p>\${analysis.executiveSummary}</p>
          </div>

          <!-- FCA/PRA Objectives (AI-generated) -->
          \${analysis.fcaObjectives && analysis.fcaObjectives.primaryGoal ? \`
            <div class="analysis-section">
              <h3>What the Regulator is Trying to Achieve</h3>
              <div class="objectives-box">
                <div class="objective-item primary">
                  <span class="objective-label">Primary Goal</span>
                  <p class="objective-value">\${analysis.fcaObjectives.primaryGoal}</p>
                </div>
                \${analysis.fcaObjectives.regulatoryContext ? \`
                  <div class="objective-item context">
                    <span class="objective-label">Why Now</span>
                    <p class="objective-value">\${analysis.fcaObjectives.regulatoryContext}</p>
                  </div>
                \` : ''}
                \${analysis.fcaObjectives.secondaryGoals && analysis.fcaObjectives.secondaryGoals.length > 0 ? \`
                  <div class="objective-item secondary">
                    <span class="objective-label">Also Addresses</span>
                    <ul class="objective-list">\${analysis.fcaObjectives.secondaryGoals.map(g => \`<li>\${g}</li>\`).join('')}</ul>
                  </div>
                \` : ''}
              </div>
            </div>
          \` : ''}

          <!-- Key Themes -->
          <div class="analysis-section">
            <h3>Key Regulatory Themes</h3>
            <div class="themes-grid">
              \${(analysis.themes || []).map(t => \`
                <div class="theme-item">
                  <span>\${typeof t === 'string' ? t : t.name}</span>
                  \${typeof t === 'object' && t.relevance ? \`<span class="theme-relevance">\${Math.round(t.relevance * 100)}%</span>\` : ''}
                </div>
              \`).join('')}
            </div>
          </div>

          <!-- Who It Applies To -->
          <div class="analysis-section">
            <h3>Who This Affects</h3>
            \${analysis.whoThisAffects ? \`
              <div class="applicability-box enhanced">
                \${analysis.whoThisAffects.industries ? \`
                  <div class="applicability-item">
                    <span class="applicability-label">Industries</span>
                    <span class="applicability-value">\${analysis.whoThisAffects.industries.join(', ')}</span>
                  </div>
                \` : ''}
                \${analysis.whoThisAffects.firmTypes ? \`
                  <div class="applicability-item">
                    <span class="applicability-label">Firm Types</span>
                    <span class="applicability-value">\${analysis.whoThisAffects.firmTypes.join(', ')}</span>
                  </div>
                \` : ''}
                \${analysis.whoThisAffects.firmSizes ? \`
                  <div class="firm-size-grid">
                    \${analysis.whoThisAffects.firmSizes.small ? \`
                      <div class="firm-size-item">
                        <span class="size-label">Small Firms</span>
                        <span class="size-value">\${analysis.whoThisAffects.firmSizes.small}</span>
                      </div>
                    \` : ''}
                    \${analysis.whoThisAffects.firmSizes.medium ? \`
                      <div class="firm-size-item">
                        <span class="size-label">Medium Firms</span>
                        <span class="size-value">\${analysis.whoThisAffects.firmSizes.medium}</span>
                      </div>
                    \` : ''}
                    \${analysis.whoThisAffects.firmSizes.large ? \`
                      <div class="firm-size-item">
                        <span class="size-label">Large Firms</span>
                        <span class="size-value">\${analysis.whoThisAffects.firmSizes.large}</span>
                      </div>
                    \` : ''}
                  </div>
                \` : ''}
              </div>
            \` : \`
              <div class="applicability-box">
                <div class="applicability-item">
                  <span class="applicability-label">Firm Types</span>
                  <span class="applicability-value">\${analysis.applicability?.firmTypes?.join(', ') || 'All regulated firms'}</span>
                </div>
                <div class="applicability-item">
                  <span class="applicability-label">Sectors</span>
                  <span class="applicability-value">\${analysis.applicability?.sectors?.length > 0 ? analysis.applicability.sectors.join(', ') : 'All regulated sectors'}</span>
                </div>
              </div>
            \`}
          </div>

          <!-- Compliance Checklist (AI-generated with tracking) -->
          \${analysis.complianceChecklist && analysis.complianceChecklist.length > 0 ? \`
            <div class="analysis-section">
              <h3>Compliance Checklist</h3>
              <div class="compliance-checklist">
                \${analysis.complianceChecklist.map(item => \`
                  <div class="checklist-item" data-action-id="\${item.id}">
                    <label class="checklist-checkbox">
                      <input type="checkbox" onchange="toggleActionStatus('\${item.id}', this.checked)" />
                      <span class="checkmark"></span>
                    </label>
                    <div class="checklist-content">
                      <div class="checklist-action">\${item.action}</div>
                      <div class="checklist-meta">
                        <span class="checklist-owner">\${item.owner}</span>
                        \${item.deadline ? \`<span class="checklist-deadline">Due: \${item.deadline}</span>\` : ''}
                        <span class="checklist-priority priority-\${item.priority.toLowerCase()}">\${item.priority}</span>
                      </div>
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>
          \` : (analysis.actionItems && analysis.actionItems.length > 0 ? \`
            <div class="analysis-section">
              <h3>Required Actions</h3>
              <div class="action-list">
                \${analysis.actionItems.slice(0, 6).map(action => \`
                  <div class="action-item">
                    <div class="action-header">
                      <span class="action-priority">\${action.priority}</span>
                      <span class="complexity-badge \${(action.complexity || 'medium').toLowerCase()}">\${action.complexity || 'Medium'}</span>
                    </div>
                    <div class="action-text">\${action.action}</div>
                    \${action.deadline ? \`<div class="action-meta"><span class="action-deadline">Deadline: \${action.deadline}</span></div>\` : ''}
                  </div>
                \`).join('')}
              </div>
            </div>
          \` : '')}

          <!-- Preparation Steps (AI-generated) -->
          \${analysis.preparationSteps && (analysis.preparationSteps.immediate?.length > 0 || analysis.preparationSteps.shortTerm?.length > 0) ? \`
            <div class="analysis-section">
              <h3>How to Prepare</h3>
              <div class="preparation-steps">
                \${analysis.preparationSteps.immediate?.length > 0 ? \`
                  <div class="prep-category">
                    <h4>Immediate (This Week)</h4>
                    <ul>\${analysis.preparationSteps.immediate.map(s => \`<li>\${s}</li>\`).join('')}</ul>
                  </div>
                \` : ''}
                \${analysis.preparationSteps.shortTerm?.length > 0 ? \`
                  <div class="prep-category">
                    <h4>Short-Term (This Month)</h4>
                    <ul>\${analysis.preparationSteps.shortTerm.map(s => \`<li>\${s}</li>\`).join('')}</ul>
                  </div>
                \` : ''}
                \${analysis.preparationSteps.mediumTerm?.length > 0 ? \`
                  <div class="prep-category">
                    <h4>Medium-Term (This Quarter)</h4>
                    <ul>\${analysis.preparationSteps.mediumTerm.map(s => \`<li>\${s}</li>\`).join('')}</ul>
                  </div>
                \` : ''}
              </div>
            </div>
          \` : ''}

          <!-- Risk Assessment (AI-generated) -->
          \${analysis.riskAssessment && analysis.riskAssessment.nonComplianceRisk ? \`
            <div class="analysis-section">
              <h3>Risk Assessment</h3>
              <div class="risk-assessment">
                <div class="risk-item risk-\${analysis.riskAssessment.nonComplianceRisk.toLowerCase()}">
                  <span class="risk-label">Non-Compliance Risk</span>
                  <span class="risk-value">\${analysis.riskAssessment.nonComplianceRisk}</span>
                </div>
                \${analysis.riskAssessment.enforcementLikelihood ? \`
                  <div class="risk-detail">
                    <span class="risk-label">Enforcement</span>
                    <span class="risk-text">\${analysis.riskAssessment.enforcementLikelihood}</span>
                  </div>
                \` : ''}
                \${analysis.riskAssessment.reputationalImpact ? \`
                  <div class="risk-detail">
                    <span class="risk-label">Reputational</span>
                    <span class="risk-text">\${analysis.riskAssessment.reputationalImpact}</span>
                  </div>
                \` : ''}
              </div>
            </div>
          \` : ''}

          <!-- Complexity Areas (fallback) -->
          \${analysis.complexityAreas && analysis.complexityAreas.length > 0 && !analysis.preparationSteps ? \`
            <div class="analysis-section">
              <h3>Where Expert Support May Help</h3>
              \${analysis.complexityAreas.map(area => \`
                <div class="complexity-area">
                  <div class="complexity-area-header">
                    <span class="complexity-area-name">\${area.area}</span>
                  </div>
                  <div class="complexity-area-description">\${area.description}</div>
                  <div class="complexity-support">Consider: \${area.supportNeeded}</div>
                </div>
              \`).join('')}
            </div>
          \` : ''}

          <!-- Timeline -->
          \${analysis.timeline && analysis.timeline.length > 0 ? \`
            <div class="analysis-section">
              <h3>Timeline & Key Dates</h3>
              <div class="timeline">
                \${analysis.timeline.map(item => \`
                  <div class="timeline-item \${item.type}">
                    <div class="timeline-date">\${formatDate(item.date)}</div>
                    <div class="timeline-milestone">\${item.milestone}</div>
                  </div>
                \`).join('')}
              </div>
            </div>
          \` : ''}

          <!-- Key Quotes -->
          \${analysis.keyQuotes && analysis.keyQuotes.length > 0 ? \`
            <div class="analysis-section">
              <h3>Key Statements</h3>
              <div class="quotes-list">
                \${analysis.keyQuotes.map(quote => \`
                  <blockquote style="margin: 0 0 12px 0; padding: 12px 16px; background: #f9fafb; border-left: 3px solid #3b82f6; border-radius: 0 8px 8px 0; font-style: italic; color: #4b5563;">
                    "\${quote}"
                  </blockquote>
                \`).join('')}
              </div>
            </div>
          \` : ''}

          <!-- Related Letters -->
          \${analysis.relatedLetters && analysis.relatedLetters.length > 0 ? \`
            <div class="analysis-section">
              <h3>Related Communications</h3>
              <div class="related-letters">
                \${analysis.relatedLetters.slice(0, 3).map(letter => \`
                  <a href="#" class="related-letter-item" onclick="event.preventDefault(); selectLetter('\${letter.id}');">
                    <span class="related-letter-title">\${letter.headline}</span>
                    <span class="related-letter-date">\${formatDate(letter.publishedDate)}</span>
                  </a>
                \`).join('')}
              </div>
            </div>
          \` : ''}

          <!-- Footer Actions -->
          <div class="modal-footer">
            <div>
              \${analysis.stats ? \`
                <span style="font-size: 12px; color: #6b7280;">
                  \${analysis.stats.themeCount} themes &bull; \${analysis.stats.actionCount} actions \${analysis.stats.hasDeadlines ? '&bull; Has deadlines' : ''}
                </span>
              \` : ''}
            </div>
            <a href="\${analysis.url}" target="_blank" class="view-original-btn">
              View Original
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        \`;
      }

      function closeModal() {
        document.getElementById('analysis-modal').classList.remove('active');
      }

      let currentSearchQuery = '';
      let currentAuthorityFilter = '';

      function filterByAuthority(authority) {
        currentAuthorityFilter = authority;
        applyFilters();
      }

      function searchLetters(query) {
        currentSearchQuery = query.toLowerCase().trim();
        applyFilters();
      }

      function applyFilters() {
        let filteredLetters = lettersData;

        // Apply authority filter
        if (currentAuthorityFilter) {
          filteredLetters = filteredLetters.filter(l => l.authority === currentAuthorityFilter);
        }

        // Apply search filter
        if (currentSearchQuery) {
          filteredLetters = filteredLetters.filter(l => {
            const headline = (l.headline || '').toLowerCase();
            const themes = (l.themes || []).join(' ').toLowerCase();
            return headline.includes(currentSearchQuery) || themes.includes(currentSearchQuery);
          });
        }

        renderLettersList(filteredLetters);
      }

      function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      // Tab switching
      let allActions = [];
      let currentTab = 'letters';

      function switchTab(tabName) {
        currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.toggle('active', content.id === tabName + '-tab');
        });

        // Load actions when switching to actions tab
        if (tabName === 'actions' && allActions.length === 0) {
          loadActions();
        }
      }

      // Load all actions from efficient API endpoint
      async function loadActions() {
        const actionsListEl = document.getElementById('actions-list');
        actionsListEl.innerHTML = '<div class="loading-spinner">Loading actions...</div>';

        try {
          const response = await fetch('/api/dear-ceo/actions');
          const data = await response.json();

          if (!data.success) {
            throw new Error('Failed to load actions');
          }

          const savedStatuses = JSON.parse(localStorage.getItem('dearCeoActionStatus') || '{}');

          allActions = data.actions.map(action => ({
            ...action,
            completed: savedStatuses[action.id]?.completed || false
          }));

          if (allActions.length === 0) {
            actionsListEl.innerHTML = '<div class="no-actions">No actions found. Actions are extracted from Dear CEO letter analysis.</div>';
            return;
          }

          renderActions();
          updateActionsSummary();
          updatePendingBadge();

        } catch (error) {
          console.error('Error loading actions:', error);
          actionsListEl.innerHTML = '<div style="padding: 40px; text-align: center; color: #dc2626;">Error loading actions</div>';
        }
      }

      function renderActions() {
        const actionsListEl = document.getElementById('actions-list');
        const statusFilter = document.getElementById('actions-status-filter').value;
        const priorityFilter = document.getElementById('actions-priority-filter').value;

        // Filter actions
        let filteredActions = allActions.filter(action => {
          if (statusFilter === 'pending' && action.completed) return false;
          if (statusFilter === 'completed' && !action.completed) return false;
          if (priorityFilter !== 'all' && action.priority !== priorityFilter) return false;
          return true;
        });

        if (filteredActions.length === 0) {
          actionsListEl.innerHTML = '<div class="no-actions">No actions match the current filters</div>';
          return;
        }

        // Group by letter
        const groupedByLetter = {};
        filteredActions.forEach(action => {
          if (!groupedByLetter[action.letterId]) {
            groupedByLetter[action.letterId] = {
              headline: action.letterHeadline,
              date: action.letterDate,
              authority: action.authority,
              actions: []
            };
          }
          groupedByLetter[action.letterId].actions.push(action);
        });

        actionsListEl.innerHTML = Object.entries(groupedByLetter).map(([letterId, letterData]) => \`
          <div class="action-group">
            <div class="action-group-header" onclick="selectLetter('\${letterId}')">
              <div class="action-group-title">
                <span class="letter-authority \${letterData.authority === 'PRA' ? 'pra' : ''}">\${letterData.authority}</span>
                <span class="action-group-headline">\${letterData.headline}</span>
              </div>
              <span class="action-group-date">\${formatDate(letterData.date)}</span>
            </div>
            <div class="action-group-items">
              \${letterData.actions.map(action => \`
                <div class="action-item-row \${action.completed ? 'completed' : ''}" data-action-id="\${action.id}">
                  <label class="action-checkbox">
                    <input type="checkbox" \${action.completed ? 'checked' : ''} onchange="toggleGlobalActionStatus('\${action.id}', this.checked)" />
                    <span class="checkmark"></span>
                  </label>
                  <div class="action-content">
                    <div class="action-text">\${action.action}</div>
                    <div class="action-meta">
                      <span class="action-owner">\${action.owner}</span>
                      \${action.deadline ? \`<span class="action-deadline">Due: \${action.deadline}</span>\` : ''}
                      <span class="action-priority priority-\${action.priority.toLowerCase()}">\${action.priority}</span>
                    </div>
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>
        \`).join('');
      }

      function filterActions() {
        renderActions();
      }

      function toggleGlobalActionStatus(actionId, completed) {
        // Update in allActions array
        const action = allActions.find(a => a.id === actionId);
        if (action) {
          action.completed = completed;
        }

        // Update localStorage
        const storageKey = 'dearCeoActionStatus';
        let actionStatuses = {};
        try {
          actionStatuses = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (e) {
          actionStatuses = {};
        }

        actionStatuses[actionId] = {
          completed: completed,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(actionStatuses));

        // Update UI
        const row = document.querySelector(\`.action-item-row[data-action-id="\${actionId}"]\`);
        if (row) {
          row.classList.toggle('completed', completed);
        }

        updateActionsSummary();
        updatePendingBadge();
      }

      function updateActionsSummary() {
        const total = allActions.length;
        const completed = allActions.filter(a => a.completed).length;
        const pending = total - completed;

        document.getElementById('total-actions-count').textContent = total;
        document.getElementById('pending-actions-count').textContent = pending;
        document.getElementById('completed-actions-count').textContent = completed;
      }

      function updatePendingBadge() {
        const pending = allActions.filter(a => !a.completed).length;
        const badge = document.getElementById('pending-actions-badge');
        if (pending > 0) {
          badge.textContent = pending;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }

      // Action status tracking with localStorage
      function toggleActionStatus(actionId, completed) {
        const storageKey = 'dearCeoActionStatus';
        let actionStatuses = {};

        try {
          actionStatuses = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (e) {
          actionStatuses = {};
        }

        actionStatuses[actionId] = {
          completed: completed,
          updatedAt: new Date().toISOString()
        };

        localStorage.setItem(storageKey, JSON.stringify(actionStatuses));

        // Update the checklist item UI
        const checklistItem = document.querySelector(\`[data-action-id="\${actionId}"]\`);
        if (checklistItem) {
          checklistItem.classList.toggle('completed', completed);
        }

        console.log(\`Action \${actionId} marked as \${completed ? 'completed' : 'pending'}\`);
      }

      // Load saved action statuses when modal opens
      function loadActionStatuses() {
        const storageKey = 'dearCeoActionStatus';
        let actionStatuses = {};

        try {
          actionStatuses = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (e) {
          return;
        }

        // Apply saved statuses to checkboxes
        for (const [actionId, status] of Object.entries(actionStatuses)) {
          const checkbox = document.querySelector(\`[data-action-id="\${actionId}"] input[type="checkbox"]\`);
          if (checkbox) {
            checkbox.checked = status.completed;
            const checklistItem = checkbox.closest('.checklist-item');
            if (checklistItem) {
              checklistItem.classList.toggle('completed', status.completed);
            }
          }
        }
      }

      // Close modal on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
      });
    </script>
  `
}

function renderDearCeoPage({
  sidebar,
  commonStyles,
  commonClientScripts
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dear CEO Letters - RegCanary</title>
        ${commonStyles}
        ${getDearCeoStyles()}
      </head>
      <body>
        <div class="app-container">
          ${sidebar}
          <main class="main-content">
            ${renderDearCeoHeader()}

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value" id="total-letters">-</div>
                <div class="stat-label">Total Letters</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="fca-count">-</div>
                <div class="stat-label">FCA Letters</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="pra-count">-</div>
                <div class="stat-label">PRA Statements</div>
              </div>
              <div class="stat-card">
                <div class="stat-value" id="top-theme">-</div>
                <div class="stat-label">Top Theme</div>
              </div>
            </div>

            <!-- Tab Navigation -->
            <div class="tab-navigation">
              <button class="tab-btn active" data-tab="letters" onclick="switchTab('letters')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                Letters
              </button>
              <button class="tab-btn" data-tab="actions" onclick="switchTab('actions')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Actions
                <span class="action-badge" id="pending-actions-badge" style="display: none;">0</span>
              </button>
            </div>

            <!-- Letters Tab Content -->
            <div class="tab-content active" id="letters-tab">
              <div class="content-grid">
                <div class="letters-section">
                  <div class="section-header">
                    <h2>All Letters</h2>
                    <div class="filter-group">
                      <div class="search-box">
                        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" id="letters-search" class="search-input" placeholder="Search letters..." oninput="searchLetters(this.value)">
                      </div>
                      <select class="filter-select" onchange="filterByAuthority(this.value)">
                        <option value="">All Regulators</option>
                        <option value="FCA">FCA Only</option>
                        <option value="PRA">PRA Only</option>
                      </select>
                    </div>
                  </div>
                  <div class="letters-list" id="letters-list">
                    <div class="loading-spinner">Loading letters...</div>
                  </div>
                </div>

                <div class="trends-section">
                  <h2>Theme Trends (5 Years)</h2>
                  <div id="trends-container">
                    <div class="loading-spinner">Loading trends...</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions Tab Content -->
            <div class="tab-content" id="actions-tab">
              <div class="actions-dashboard">
                <div class="actions-header">
                  <h2>Action Tracker</h2>
                  <div class="actions-filters">
                    <select class="filter-select" id="actions-status-filter" onchange="filterActions()">
                      <option value="all">All Actions</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                    <select class="filter-select" id="actions-priority-filter" onchange="filterActions()">
                      <option value="all">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                    </select>
                  </div>
                </div>

                <div class="actions-summary" id="actions-summary">
                  <div class="summary-stat">
                    <span class="summary-value" id="total-actions-count">0</span>
                    <span class="summary-label">Total Actions</span>
                  </div>
                  <div class="summary-stat pending">
                    <span class="summary-value" id="pending-actions-count">0</span>
                    <span class="summary-label">Pending</span>
                  </div>
                  <div class="summary-stat completed">
                    <span class="summary-value" id="completed-actions-count">0</span>
                    <span class="summary-label">Completed</span>
                  </div>
                </div>

                <div class="actions-list" id="actions-list">
                  <div class="loading-spinner">Loading actions...</div>
                </div>
              </div>
            </div>
          </main>
        </div>

        <!-- Analysis Modal -->
        <div class="modal-overlay" id="analysis-modal" onclick="if(event.target === this) closeModal()">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-header-content" id="modal-header-content">
                <h2>Letter Analysis</h2>
                <div class="modal-meta">
                  <span class="modal-meta-item">Loading...</span>
                </div>
              </div>
              <button class="modal-close" onclick="closeModal()" aria-label="Close modal">&times;</button>
            </div>
            <div class="modal-body" id="modal-body">
              <div class="loading-spinner">Generating premium analysis...</div>
            </div>
          </div>
        </div>

        ${commonClientScripts}
        ${getDearCeoScripts()}
      </body>
    </html>
  `
}

module.exports = {
  renderDearCeoPage
}
