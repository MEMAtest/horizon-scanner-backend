function getAiIntelligenceWorkflowScript() {
  return `        async function recordTelemetryEvent(payload) {
          try {
            const response = await fetch('/api/intelligence/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Telemetry error');
            return response.json();
          } catch (error) {
            console.warn('Telemetry dispatch failed:', error);
            throw error;
          }
        }

        async function createWorkflow(payload) {
          const response = await fetch('/api/workflows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Unable to create workflow');
          }
          return response.json();
        }

        async function updateWorkflowStatus(workflowId, status) {
          const response = await fetch('/api/workflows/' + workflowId + '/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Unable to update workflow');
          }
          return response.json();
        }

        const workflowBuilder = initWorkflowBuilder();

        function initWorkflowBuilder() {
          const root = document.querySelector('[data-workflow-builder]');
          if (!root) return null;
          const form = root.querySelector('[data-workflow-form]');
          const sourceList = root.querySelector('[data-workflow-source-list]');
          const ratingInput = form.querySelector('input[name="rating"]');
          const ratingLabel = form.querySelector('[data-workflow-rating-value]');
          const personaContainer = form.querySelector('[data-workflow-personas]');
          const policyToggle = form.querySelector('[data-policy-toggle]');
          const policyField = root.querySelector('[data-policy-reference-field]');
          const streamsData = safeParse(root.getAttribute('data-streams')) || {};
          const knownUpdates = [].concat(streamsData.high || [], streamsData.medium || []);

          function populateSources() {
            if (!sourceList) return;
            sourceList.innerHTML = '';
            knownUpdates.slice(0, 8).forEach(update => {
              const label = document.createElement('label');
              label.className = 'workflow-source-option';
              const checkbox = document.createElement('input');
              checkbox.type = 'checkbox';
              checkbox.value = update.updateId || update.id || update.headline || update.authority || '';
              checkbox.dataset.label = update.headline || update.authority || 'Regulatory update';
              if (update.url) checkbox.dataset.url = update.url;
              const text = document.createElement('span');
              text.textContent = (update.authority ? update.authority + ' — ' : '') + (update.headline || 'Untitled update');
              label.appendChild(checkbox);
              label.appendChild(text);
              sourceList.appendChild(label);
            });
          }

          populateSources();

          ratingInput.addEventListener('input', () => (ratingLabel.textContent = ratingInput.value));
          policyToggle.addEventListener('change', () => {
            policyField.style.display = policyToggle.checked ? 'block' : 'none';
          });
          policyField.style.display = 'none';

          root.addEventListener('click', event => {
            if (event.target.matches('[data-workflow-builder-close]')) {
              close();
            }
          });

          document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && root.classList.contains('is-visible')) {
              close();
            }
          });

          form.addEventListener('submit', async event => {
            event.preventDefault();
            const payload = gatherPayload(new FormData(form));
            try {
              await createWorkflow(payload);
              showToast('Workflow saved', 'success');
              close();
              window.RegCanaryIntelligence?.refreshSnapshot?.();
            } catch (error) {
              showToast(error.message || 'Unable to save workflow', 'error');
            }
          });

          function gatherPayload(formData) {
            const sources = [];
            sourceList.querySelectorAll('input[type="checkbox"]').forEach(input => {
              if (input.checked && input.dataset.label) {
                sources.push({ label: input.dataset.label, url: input.dataset.url || null });
              }
            });
            const extraLines = (formData.get('extraSources') || '').split(/\\n+/).map(line => line.trim()).filter(Boolean);
            extraLines.forEach(label => sources.push({ label, url: null }));

            const personas = Array.from(personaContainer.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value);

            return {
              title: formData.get('title') || '',
              summary: formData.get('summary') || '',
              rating: Number(formData.get('rating')) || 3,
              sources,
              personas,
              needsReview: formData.get('needsReview') === 'on',
              alignsPolicy: formData.get('alignsPolicy') === 'on',
              policyReference: formData.get('alignsPolicy') === 'on' ? (formData.get('policyReference') || '') : null
            };
          }

          function open(prefill = {}) {
            form.reset();
            ratingInput.value = prefill.rating || 3;
            ratingLabel.textContent = ratingInput.value;
            policyToggle.checked = Boolean(prefill.alignsPolicy);
            policyField.style.display = policyToggle.checked ? 'block' : 'none';
            personaContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
              input.checked = Array.isArray(prefill.personas) ? prefill.personas.includes(input.value) : false;
            });
            sourceList.querySelectorAll('input[type="checkbox"]').forEach(input => {
              input.checked = false;
            });
            if (Array.isArray(prefill.sources)) {
              sourceList.querySelectorAll('input[type="checkbox"]').forEach(input => {
                const label = input.dataset.label;
                if (prefill.sources.some(source => (source.label || '').trim() === label)) {
                  input.checked = true;
                }
              });
            }
            if (prefill.title) form.elements.title.value = prefill.title;
            if (prefill.description || prefill.summary) {
              form.elements.summary.value = prefill.description || prefill.summary;
            }
            root.classList.add('is-visible');
            document.body.classList.add('workflow-builder-open');
          }

          function close() {
            root.classList.remove('is-visible');
            document.body.classList.remove('workflow-builder-open');
          }

          return { open, close };
        }

        function openWorkflowBuilderModal(prefill) {
          if (!workflowBuilder) {
            showToast('Workflow builder unavailable', 'error');
            return;
          }
          workflowBuilder.open(prefill || {});
        }

        function attachWorkflowActions() {
          document.querySelectorAll('[data-action="start-workflow"]').forEach(button => {
            button.addEventListener('click', () => {
              const workflowId = button.dataset.workflowId;
              window.RegCanaryIntelligence?.startWorkflow(workflowId);
            });
          });

          document.querySelectorAll('[data-action="complete-workflow"]').forEach(button => {
            button.addEventListener('click', () => {
              const workflowId = button.dataset.workflowId;
              window.RegCanaryIntelligence?.completeWorkflow(workflowId);
            });
          });
        }

        document.addEventListener('click', event => {
          const builderBtn = event.target.closest('[data-action="open-workflow-builder"]');
          if (builderBtn) {
            const prefill = safeParse(builderBtn.getAttribute('data-workflow-prefill')) || {};
            openWorkflowBuilderModal(prefill);
            event.preventDefault();
            return;
          }

          const savedCompleteBtn = event.target.closest('[data-action="complete-saved-workflow"]');
          if (savedCompleteBtn) {
            const workflowId = savedCompleteBtn.dataset.workflowId;
            if (!workflowId) return;
            savedCompleteBtn.disabled = true;
            updateWorkflowStatus(workflowId, 'closed')
              .then(() => {
                showToast('Workflow closed', 'success');
                window.RegCanaryIntelligence?.refreshSnapshot?.();
              })
              .catch(error => {
                showToast(error.message || 'Unable to close workflow', 'error');
              })
              .finally(() => {
                savedCompleteBtn.disabled = false;
              });
          }
        });

`
}

module.exports = { getAiIntelligenceWorkflowScript }
