function getAiIntelligenceSnapshotScript() {
  return `        function applySnapshotModel(newSnapshot) {
          if (!newSnapshot) return;
          snapshot = newSnapshot;
          window.intelligenceSnapshot = newSnapshot;

          const heroDate = document.querySelector('.hero-date');
          if (heroDate) {
            heroDate.textContent = formatDateDisplay(newSnapshot.snapshotDate);
          }

          const heroSection = document.querySelector('.hero-insight');
          if (heroSection) {
            heroSection.outerHTML = renderHeroHTML(newSnapshot.heroInsight || {}, newSnapshot.riskPulse || {});
          } else {
            const panel = document.querySelector('.hero-panel');
            if (panel) {
              panel.insertAdjacentHTML('afterend', renderHeroHTML(newSnapshot.heroInsight || {}, newSnapshot.riskPulse || {}));
            }
          }

          const riskPulseSection = document.querySelector('.risk-pulse');
          if (riskPulseSection) {
            riskPulseSection.outerHTML = renderRiskPulseHTML(newSnapshot);
          }

          const quickStatsSection = document.querySelector('.quick-stats');
          if (quickStatsSection) {
            quickStatsSection.innerHTML = buildQuickStatsHTML(newSnapshot.quickStats || {});
          }

          const streamsSection = document.querySelector('.streams-split');
          if (streamsSection) {
            streamsSection.outerHTML = renderStreamsHTML(
              newSnapshot.streams || {},
              newSnapshot.workspace || {},
              newSnapshot.timeline || [],
              newSnapshot.layoutConfig && newSnapshot.layoutConfig.showThemes === false ? [] : newSnapshot.themes || [],
              newSnapshot.recommendedWorkflows || []
            );
          }

          const workspaceSection = document.querySelector('.workspace-pulse');
          if (workspaceSection && !streamsSection) {
            workspaceSection.outerHTML = renderWorkspaceHTML(newSnapshot.workspace || {});
          }

          const personaSection = document.querySelector('.persona-intelligence');
          if (personaSection) {
            personaSection.outerHTML = renderPersonaHTML(newSnapshot.personas || {});
          }

          const timelineSection = document.querySelector('.intelligence-timeline');
          if (timelineSection) {
            timelineSection.outerHTML = renderTimelineHTML(newSnapshot.timeline || []);
          }

          const themesSection = document.querySelector('.emerging-themes');
          if (themesSection) {
            const themesMarkup = renderThemesHTML(newSnapshot.themes || []);
            themesSection.outerHTML = themesMarkup || '';
          }

          initialisePinnedStates();
          initialisePersonaTabs(state.activePersona);
          attachCardActions();
          attachWorkflowActions();
        }

        function setActivePersona(persona) {
          const tabs = document.querySelectorAll('.persona-tab');
          const panels = document.querySelectorAll('.persona-panel');

          tabs.forEach(tab => {
            const isActive = tab.dataset.persona === persona;
            tab.classList.toggle('active', isActive);
          });

          panels.forEach(panel => {
            const isActive = panel.dataset.personaPanel === persona;
            panel.classList.toggle('active', isActive);
          });

          state.activePersona = persona;
        }

        function initialisePersonaTabs(defaultPersona) {
          const tabs = document.querySelectorAll('.persona-tab');
          if (!tabs.length) return;

          tabs.forEach(tab => {
            tab.addEventListener('click', () => {
              setActivePersona(tab.dataset.persona);
            });
          });

          let targetPersona = defaultPersona;
          if (!targetPersona || !Array.from(tabs).some(tab => tab.dataset.persona === targetPersona)) {
            targetPersona = tabs[0]?.dataset.persona || 'executive';
          }
          setActivePersona(targetPersona);
        }

        function updatePinButtonState(button, pinned) {
          if (!button) return;
          const nextState = pinned ? 'true' : 'false';
          button.dataset.pinned = nextState;
          button.classList.toggle('is-pinned', pinned);
          button.textContent = pinned ? '★' : '☆';
          button.setAttribute('aria-pressed', nextState);
          button.setAttribute('title', pinned ? 'Unpin update' : 'Pin update');
        }

        function adjustPersonaPinnedCounts(personaList, delta) {
          if (!Array.isArray(personaList)) return;
          personaList.forEach(persona => {
            if (!persona) return;
            const key = String(persona).trim().toLowerCase();
            if (!key) return;
            const panel = document.querySelector('.persona-panel[data-persona-panel="' + key + '"]');
            if (!panel) return;
            const metrics = panel.querySelectorAll('.persona-metrics .metric-value');
            if (metrics.length < 2) return;
            const current = parseInt(metrics[1].textContent.replace(/[^0-9]/g, ''), 10) || 0;
            const next = Math.max(0, current + delta);
            metrics[1].textContent = next.toLocaleString('en-GB');
          });
        }

        function syncPersonaPinnedBadges(updateId, pinned) {
          if (!updateId) return;
          const updateKey = String(updateId || '');
          if (!updateKey) return;
          document
            .querySelectorAll('.persona-update[data-update-id="' + updateKey + '"]')
            .forEach(item => {
              const container = item.querySelector('.persona-update-tags') || (function() {
                if (!pinned) return null;
                const wrap = document.createElement('div');
                wrap.className = 'persona-update-tags';
                const textHolder = item.querySelector('div');
                if (textHolder) {
                  textHolder.appendChild(wrap);
                  return wrap;
                }
                return null;
              })();

              if (!container) return;

              const pinnedBadge = container.querySelector('.badge-pinned');
              if (pinned) {
                if (!pinnedBadge) {
                  const badge = document.createElement('span');
                  badge.className = 'persona-update-badge badge-pinned';
                  badge.textContent = 'Pinned';
                  container.appendChild(badge);
                }
              } else if (pinnedBadge) {
                pinnedBadge.remove();
                if (!container.querySelector('.persona-update-badge')) {
                  container.remove();
                }
              }
            });
        }

        function updateWorkspaceMetric(key, delta) {
          const valueEl = document.querySelector(
            '.workspace-card[data-workspace-card="' + key + '"] .workspace-value'
          );
          if (!valueEl) return;
          const current = parseInt(valueEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
          const next = Math.max(0, current + delta);
          valueEl.textContent = next.toLocaleString('en-GB');
        }

        function initialisePinnedStates() {
          document.querySelectorAll('.stream-card .pin-toggle').forEach(button => {
            updatePinButtonState(button, button.dataset.pinned === 'true');
          });
        }

`
}

module.exports = { getAiIntelligenceSnapshotScript }
