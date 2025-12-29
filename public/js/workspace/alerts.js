(function() {
  const registry = window.__WorkspaceModuleRegistry = window.__WorkspaceModuleRegistry || [];

  registry.push(function applyWorkspaceAlerts(context) {
    const state = context.state;

    async function showCustomAlerts() {
      console.log('🔔 Opening custom alerts');

      const modal = context.createModal('Custom Alerts');

      const alertsContainer = document.createElement('div');
      alertsContainer.innerHTML = `
                <button onclick="WorkspaceModule.createNewAlert()" class="btn btn-primary" style="margin-bottom: 1rem;">
                    Create New Alert
                </button>
            `;

      if (state.customAlerts.length > 0) {
        const alertsList = document.createElement('div');
        alertsList.className = 'alerts-list';

        state.customAlerts.forEach(alert => {
          const alertItem = document.createElement('div');
          alertItem.className = 'alert-item';
          alertItem.innerHTML = `
                        <div class="alert-info">
                            <div class="alert-name">${alert.alertName || alert.alert_name}</div>
                            <div class="alert-status">
                                <span class="${alert.isActive ? 'active' : 'inactive'}">
                                    ${alert.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div class="alert-actions">
                            <button onclick="WorkspaceModule.toggleAlert('${alert.id}', ${!alert.isActive})" 
                                    class="btn-small">
                                ${alert.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button onclick="WorkspaceModule.deleteAlert('${alert.id}')" 
                                    class="btn-small btn-danger">Delete</button>
                        </div>
                    `;
          alertsList.appendChild(alertItem);
        });

        alertsContainer.appendChild(alertsList);
      } else {
        alertsContainer.innerHTML += '<p>No custom alerts configured.</p>';
      }

      modal.content.appendChild(alertsContainer);
      document.body.appendChild(modal.overlay);
    }

    function createNewAlert() {
      const modal = context.createModal('Create Custom Alert');

      modal.content.innerHTML = `
                <div class="form-group">
                    <label>Alert Name:</label>
                    <input type="text" id="alertName" class="form-input" placeholder="e.g., FCA Enforcement Actions">
                </div>
                <div class="form-group">
                    <label>Keywords (comma-separated):</label>
                    <input type="text" id="alertKeywords" class="form-input" placeholder="e.g., fine, penalty, enforcement">
                </div>
                <div class="form-group">
                    <label>Authorities:</label>
                    <select id="alertAuthority" class="form-input">
                        <option value="">All Authorities</option>
                        <option value="FCA">FCA</option>
                        <option value="BoE">Bank of England</option>
                        <option value="PRA">PRA</option>
                        <option value="TPR">TPR</option>
                        <option value="FATF">FATF</option> <!-- Add this -->
    <option value="TPR">TPR</option>
    <option value="SFO">SFO</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Minimum Impact Level:</label>
                    <select id="alertImpact" class="form-input">
                        <option value="">Any Impact</option>
                        <option value="Significant">Significant</option>
                        <option value="Moderate">Moderate</option>
                    </select>
                </div>
                <button onclick="WorkspaceModule.submitNewAlert()" class="btn btn-primary">Create Alert</button>
            `;

      document.body.appendChild(modal.overlay);
    }

    async function submitNewAlert() {
      const alertName = document.getElementById('alertName').value.trim();
      const keywords = document.getElementById('alertKeywords').value.split(',').map(k => k.trim()).filter(k => k);
      const authority = document.getElementById('alertAuthority').value;
      const impact = document.getElementById('alertImpact').value;

      if (!alertName) {
        context.showMessage('Please enter an alert name', 'warning');
        return;
      }

      try {
        const response = await fetch('/api/workspace/alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alertName,
            alertConditions: {
              keywords,
              authorities: authority ? [authority] : [],
              impact: impact ? [impact] : []
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          state.customAlerts.push(data.alert);
          context.closeModal();
          context.updateWorkspaceCounts();
          context.showMessage('Alert created successfully', 'success');
        }
      } catch (error) {
        console.error('Error creating alert:', error);
        context.showMessage('Failed to create alert', 'error');
      }
    }

    async function toggleAlert(alertId, isActive) {
      try {
        const response = await fetch(`/api/workspace/alert/${alertId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive })
        });

        if (response.ok) {
          const alert = state.customAlerts.find(a => a.id == alertId);
          if (alert) alert.isActive = isActive;
          showCustomAlerts(); // Refresh modal
          context.showMessage(`Alert ${isActive ? 'enabled' : 'disabled'}`, 'success');
        }
      } catch (error) {
        console.error('Error toggling alert:', error);
        context.showMessage('Failed to update alert', 'error');
      }
    }

    async function deleteAlert(alertId) {
      if (!confirm('Delete this alert?')) return;

      try {
        const response = await fetch(`/api/workspace/alert/${alertId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          state.customAlerts = state.customAlerts.filter(a => a.id != alertId);
          showCustomAlerts(); // Refresh modal
          context.updateWorkspaceCounts();
          context.showMessage('Alert deleted', 'success');
        }
      } catch (error) {
        console.error('Error deleting alert:', error);
        context.showMessage('Failed to delete alert', 'error');
      }
    }

    context.expose('showCustomAlerts', showCustomAlerts);
    context.expose('createNewAlert', createNewAlert);
    context.expose('submitNewAlert', submitNewAlert);
    context.expose('toggleAlert', toggleAlert);
    context.expose('deleteAlert', deleteAlert);
  });
})();
