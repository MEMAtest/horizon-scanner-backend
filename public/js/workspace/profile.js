(function() {
  const registry = window.__WorkspaceModuleRegistry = window.__WorkspaceModuleRegistry || [];

  registry.push(function applyWorkspaceProfile(context) {
    const state = context.state;

    function showFirmProfile() {
      const modal = context.createModal('Firm Profile Settings');

      const sectors = context.getAvailableSectors();
      const profileSectors = state.firmProfile
        ? (state.firmProfile.primarySectors || state.firmProfile.primary_sectors || [])
        : [];
      const currentSectors = profileSectors.map(context.normalizeSector);
      const firmNameValue = state.firmProfile ? (state.firmProfile.firmName || state.firmProfile.firm_name || '') : '';
      const firmSizeValue = state.firmProfile ? (state.firmProfile.firmSize || state.firmProfile.firm_size || 'Medium') : 'Medium';

      modal.content.innerHTML = [
        '<div class="form-group">',
        '  <label>Firm Name:</label>',
        '  <input type="text" id="firmName" class="form-input" value="' + firmNameValue + '" placeholder="Enter your firm name">',
        '</div>',
        '<div class="form-group">',
        '  <label>Firm Size:</label>',
        '  <select id="firmSize" class="form-input">',
        '    <option value="Small" ' + (firmSizeValue === 'Small' ? 'selected' : '') + '>Small</option>',
        '    <option value="Medium" ' + (firmSizeValue === 'Medium' ? 'selected' : '') + '>Medium</option>',
        '    <option value="Large" ' + (firmSizeValue === 'Large' ? 'selected' : '') + '>Large</option>',
        '  </select>',
        '</div>',
        '<div class="form-group">',
        '  <label>Primary Sectors (select all that apply):</label>',
        '  <div class="sectors-grid">',
        sectors.map(sector => {
          const normalized = context.normalizeSector(sector);
          const isChecked = currentSectors.includes(normalized) ? 'checked' : '';
          return [
            '    <label class="checkbox-label">',
            '      <input type="checkbox" name="sectors" value="' + normalized + '" ' + isChecked + '>',
            '      ' + normalized,
            '    </label>'
          ].join('\n');
        }).join('\n'),
        '  </div>',
        '</div>',
        '<div class="button-group">',
        '  <button onclick="WorkspaceModule.saveFirmProfile()" class="btn btn-primary">Save Profile</button>',
        '  <button onclick="WorkspaceModule.clearFirmProfile()" class="btn btn-danger">Clear Profile</button>',
        '</div>'
      ].join('\n');

      document.body.appendChild(modal.overlay);
    }

    async function saveFirmProfile() {
      const firmName = document.getElementById('firmName').value.trim();
      const firmSize = document.getElementById('firmSize').value;
      const sectorCheckboxes = document.querySelectorAll('input[name="sectors"]:checked');
      const primarySectors = Array.from(new Set(Array.from(sectorCheckboxes)
        .map(cb => context.normalizeSector(cb.value))
        .filter(Boolean)));

      if (!firmName) {
        context.showMessage('Please enter a firm name', 'warning');
        return;
      }

      if (primarySectors.length === 0) {
        context.showMessage('Please select at least one sector', 'warning');
        return;
      }

      try {
        const response = await fetch('/api/firm-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firmName,
            firmSize,
            primarySectors
          })
        });

        if (response.ok) {
          const data = await response.json();
          context.setAliasMap(data.sectorAliasMap);
          if (Array.isArray(data.availableSectors)) {
            context.setAvailableSectors(data.availableSectors);
          }
          state.firmProfile = data.profile;
          if (state.firmProfile && Array.isArray(state.firmProfile.primarySectors)) {
            state.firmProfile.primarySectors = state.firmProfile.primarySectors.map(context.normalizeSector).filter(Boolean);
          }
          context.closeModal();
          displayFirmProfileBadge();
          context.showMessage('Firm profile saved successfully', 'success');

          // Reload updates to apply new relevance scoring
          if (window.location.pathname === '/dashboard') {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error saving firm profile:', error);
        context.showMessage('Failed to save firm profile', 'error');
      }
    }

    async function clearFirmProfile() {
      if (!confirm('Clear your firm profile? This will reset relevance scoring.')) return;

      try {
        const response = await fetch('/api/firm-profile', {
          method: 'DELETE'
        });

        if (response.ok) {
          context.setAliasMap({});
          context.setAvailableSectors([]);
          state.firmProfile = null;
          context.closeModal();
          removeFirmProfileBadge();
          context.showMessage('Firm profile cleared', 'success');

          // Reload to reset relevance
          if (window.location.pathname === '/dashboard') {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error clearing firm profile:', error);
        context.showMessage('Failed to clear firm profile', 'error');
      }
    }

    function displayFirmProfileBadge() {
      if (!state.firmProfile) return;

      const existingBadge = document.getElementById('firmProfileBadge');
      if (existingBadge) existingBadge.remove();

      const badge = document.createElement('div');
      badge.id = 'firmProfileBadge';
      badge.className = 'firm-profile-badge';
      badge.innerHTML = `
                <span class="firm-name">${state.firmProfile.firmName || state.firmProfile.firm_name}</span>
                <span class="sector-count">${(state.firmProfile.primarySectors || state.firmProfile.primary_sectors || []).length} sectors</span>
                <button onclick="WorkspaceModule.showFirmProfile()" class="edit-btn">Edit</button>
            `;

      const header = document.querySelector('.header-controls');
      if (header) {
        header.appendChild(badge);
      }
    }

    function removeFirmProfileBadge() {
      const badge = document.getElementById('firmProfileBadge');
      if (badge) badge.remove();
    }

    context.expose('showFirmProfile', showFirmProfile);
    context.expose('saveFirmProfile', saveFirmProfile);
    context.expose('clearFirmProfile', clearFirmProfile);
    context.define('displayFirmProfileBadge', displayFirmProfileBadge);
    context.define('removeFirmProfileBadge', removeFirmProfileBadge);
  });
})();
