function getAiIntelligenceRegistryScript() {
  return `        window.RegCanaryIntelligence = {
          regenerateSummary() {
            showToast('Regeneration is coming soon – using latest summary for now.', 'info');
          },
          exportOnePager() {
            window.open('/ai-intelligence/export/one-pager.pdf', '_blank', 'noopener');
          },
          openWorkflowBuilder(prefill) {
            openWorkflowBuilderModal(prefill || {});
          },
          refreshSnapshot() {
            refreshAfterPinToggle();
          },
          showRiskExplain() {
            const components = Array.isArray(snapshot?.riskPulse?.components)
              ? snapshot.riskPulse.components
              : [];
            if (!components.length) {
              showToast('Risk score breakdown is not available right now.', 'info');
              return;
            }
            const lines = components
              .map(component => component.label + ': ' + Number(component.score || 0).toFixed(1) + ' (' + Math.round((component.weight || 0) * 100) + '%)')
              .join('\\n');
            alert('Signal score components:\\n' + lines);
          },
          startWorkflow(workflowId) {
            if (!workflowId) {
              showToast('Missing workflow identifier', 'error');
              return;
            }
            recordTelemetryEvent({
              eventType: 'workflow_start',
              workflowTemplateId: workflowId
            })
              .then(() => showToast('Workflow launched', 'success'))
              .catch(() => showToast('Unable to launch workflow', 'error'));
          },
          completeWorkflow(workflowId) {
            if (!workflowId) {
              showToast('Missing workflow identifier', 'error');
              return;
            }
            recordTelemetryEvent({
              eventType: 'workflow_complete',
              workflowTemplateId: workflowId
            })
              .then(() => showToast('Workflow marked complete', 'success'))
              .catch(() => showToast('Unable to record completion', 'error'));
          },
          createAnnotation(update) {
            if (!update) return;
            fetch('/api/annotations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                update_id: update.updateId || update.id,
                author: 'intelligence-center',
                visibility: 'team',
                status: 'triage',
                content: '',
                origin_page: 'intelligence_center',
                persona: update.personas ? update.personas[0] : null,
                context: {
                  url: update.url,
                  authority: update.authority,
                  headline: update.headline,
                  summary: update.summary,
                  published: update.publishedAt
                }
              })
            })
              .then(res => {
                if (!res.ok) throw new Error('Failed to create annotation');
                return res.json();
              })
              .then(() => showToast('Annotation created', 'success'))
              .catch(() => showToast('Unable to create annotation', 'error'));
          }
        };

        document.addEventListener('DOMContentLoaded', () => {
          initialisePersonaTabs(state.activePersona);
          initialisePinnedStates();
          attachCardActions();
          attachWorkflowActions();
        });
      })();
`
}

module.exports = { getAiIntelligenceRegistryScript }
