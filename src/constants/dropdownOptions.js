/**
 * Centralized dropdown options for the RegCanary platform
 * These are shared across Watch Lists, Kanban, Policies, and Dossiers
 */

const AUTHORITIES = [
  { value: 'FCA', label: 'FCA (Financial Conduct Authority)' },
  { value: 'PRA', label: 'PRA (Prudential Regulation Authority)' },
  { value: 'Bank of England', label: 'Bank of England' },
  { value: 'ECB', label: 'ECB (European Central Bank)' },
  { value: 'EBA', label: 'EBA (European Banking Authority)' },
  { value: 'ESMA', label: 'ESMA (European Securities and Markets Authority)' },
  { value: 'EIOPA', label: 'EIOPA (European Insurance and Occupational Pensions Authority)' },
  { value: 'HM Treasury', label: 'HM Treasury' },
  { value: 'ICO', label: 'ICO (Information Commissioner\'s Office)' },
  { value: 'CMA', label: 'CMA (Competition and Markets Authority)' },
  { value: 'SEC', label: 'SEC (Securities and Exchange Commission)' },
  { value: 'CFTC', label: 'CFTC (Commodity Futures Trading Commission)' },
  { value: 'FINRA', label: 'FINRA (Financial Industry Regulatory Authority)' },
  { value: 'OCC', label: 'OCC (Office of the Comptroller of the Currency)' },
  { value: 'FDIC', label: 'FDIC (Federal Deposit Insurance Corporation)' }
]

const SECTORS = [
  { value: 'Banking', label: 'Banking' },
  { value: 'Investment Management', label: 'Investment Management' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Payment Services', label: 'Payment Services' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'Credit Unions', label: 'Credit Unions' },
  { value: 'Pension Funds', label: 'Pension Funds' },
  { value: 'Real Estate Finance', label: 'Real Estate Finance' },
  { value: 'Consumer Credit', label: 'Consumer Credit' },
  { value: 'Capital Markets', label: 'Capital Markets' },
  { value: 'Private Equity', label: 'Private Equity' },
  { value: 'Hedge Funds', label: 'Hedge Funds' },
  { value: 'Cryptocurrency', label: 'Cryptocurrency' },
  { value: 'RegTech', label: 'RegTech' },
  { value: 'Wealth Management', label: 'Wealth Management' },
  { value: 'Corporate Finance', label: 'Corporate Finance' },
  { value: 'Retail Banking', label: 'Retail Banking' },
  { value: 'Commercial Banking', label: 'Commercial Banking' },
  { value: 'Asset Management', label: 'Asset Management' }
]

const POLICY_CATEGORIES = [
  { value: 'AML', label: 'AML (Anti-Money Laundering)' },
  { value: 'Sanctions', label: 'Sanctions' },
  { value: 'Consumer Protection', label: 'Consumer Protection' },
  { value: 'Data Privacy', label: 'Data Privacy' },
  { value: 'Conduct', label: 'Conduct' },
  { value: 'Operational', label: 'Operational' },
  { value: 'Risk Management', label: 'Risk Management' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Governance', label: 'Governance' },
  { value: 'Financial Crime', label: 'Financial Crime' },
  { value: 'Fraud Prevention', label: 'Fraud Prevention' },
  { value: 'Information Security', label: 'Information Security' }
]

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
]

const IMPACT_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

/**
 * Generate HTML for a multi-select dropdown with "Add new" capability
 * @param {string} name - Field name
 * @param {Array} options - Array of {value, label} objects
 * @param {Array} selectedValues - Currently selected values
 * @param {string} placeholder - Placeholder text
 * @returns {string} HTML string
 */
function generateMultiSelectDropdown(name, options, selectedValues = [], placeholder = 'Select options...') {
  const selectedSet = new Set(selectedValues)

  return `
    <div class="multi-select-dropdown" data-name="${name}">
      <div class="multi-select-trigger" onclick="toggleMultiSelect(this)">
        <div class="multi-select-selected">
          ${selectedValues.length > 0
            ? selectedValues.map(v => `<span class="selected-tag">${escapeHtml(v)}<button type="button" onclick="removeMultiSelectValue(event, '${name}', '${escapeHtml(v)}')">&times;</button></span>`).join('')
            : `<span class="placeholder">${placeholder}</span>`
          }
        </div>
        <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="multi-select-options">
        <div class="multi-select-search">
          <input type="text" placeholder="Search or add new..." onkeyup="filterMultiSelectOptions(this, '${name}')" onkeypress="handleMultiSelectEnter(event, '${name}')">
        </div>
        <div class="multi-select-list">
          ${options.map(opt => `
            <label class="multi-select-option ${selectedSet.has(opt.value) ? 'selected' : ''}">
              <input type="checkbox" value="${escapeHtml(opt.value)}" ${selectedSet.has(opt.value) ? 'checked' : ''} onchange="toggleMultiSelectOption(this, '${name}')">
              <span>${escapeHtml(opt.label)}</span>
            </label>
          `).join('')}
        </div>
        <div class="multi-select-add-new" style="display:none;">
          <button type="button" class="add-new-btn" onclick="addNewMultiSelectOption('${name}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add "<span class="new-value-preview"></span>"
          </button>
        </div>
      </div>
      <input type="hidden" name="${name}" value="${selectedValues.join(',')}">
    </div>
  `
}

/**
 * Generate HTML for a single-select dropdown with "Add new" capability
 * @param {string} name - Field name
 * @param {Array} options - Array of {value, label} objects
 * @param {string} selectedValue - Currently selected value
 * @param {string} placeholder - Placeholder text
 * @returns {string} HTML string
 */
function generateSingleSelectDropdown(name, options, selectedValue = '', placeholder = 'Select an option...') {
  return `
    <div class="single-select-dropdown" data-name="${name}">
      <div class="single-select-trigger" onclick="toggleSingleSelect(this)">
        <span class="single-select-value">${selectedValue ? escapeHtml(options.find(o => o.value === selectedValue)?.label || selectedValue) : `<span class="placeholder">${placeholder}</span>`}</span>
        <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="single-select-options">
        <div class="single-select-search">
          <input type="text" placeholder="Search or add new..." onkeyup="filterSingleSelectOptions(this, '${name}')" onkeypress="handleSingleSelectEnter(event, '${name}')">
        </div>
        <div class="single-select-list">
          <div class="single-select-option ${!selectedValue ? 'selected' : ''}" data-value="" onclick="selectSingleOption(this, '${name}')">
            <span class="placeholder">${placeholder}</span>
          </div>
          ${options.map(opt => `
            <div class="single-select-option ${selectedValue === opt.value ? 'selected' : ''}" data-value="${escapeHtml(opt.value)}" onclick="selectSingleOption(this, '${name}')">
              ${escapeHtml(opt.label)}
            </div>
          `).join('')}
        </div>
        <div class="single-select-add-new" style="display:none;">
          <button type="button" class="add-new-btn" onclick="addNewSingleSelectOption('${name}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add "<span class="new-value-preview"></span>"
          </button>
        </div>
      </div>
      <input type="hidden" name="${name}" value="${escapeHtml(selectedValue)}">
    </div>
  `
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Get dropdown styles to include in page
 */
function getDropdownStyles() {
  return `
    /* Multi-select dropdown styles */
    .multi-select-dropdown,
    .single-select-dropdown {
      position: relative;
      width: 100%;
    }

    .multi-select-trigger,
    .single-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      min-height: 42px;
      transition: all 0.2s;
    }

    .multi-select-trigger:hover,
    .single-select-trigger:hover {
      border-color: #cbd5e1;
    }

    .multi-select-dropdown.active .multi-select-trigger,
    .single-select-dropdown.active .single-select-trigger {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .multi-select-selected {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex: 1;
    }

    .selected-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #eff6ff;
      color: #1e40af;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
    }

    .selected-tag button {
      background: none;
      border: none;
      color: #1e40af;
      cursor: pointer;
      padding: 0;
      font-size: 16px;
      line-height: 1;
      opacity: 0.7;
    }

    .selected-tag button:hover {
      opacity: 1;
    }

    .placeholder {
      color: #94a3b8;
      font-size: 14px;
    }

    .dropdown-arrow {
      color: #64748b;
      flex-shrink: 0;
      transition: transform 0.2s;
    }

    .multi-select-dropdown.active .dropdown-arrow,
    .single-select-dropdown.active .dropdown-arrow {
      transform: rotate(180deg);
    }

    .multi-select-options,
    .single-select-options {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 100;
      max-height: 300px;
      overflow: hidden;
      display: none;
      flex-direction: column;
    }

    .multi-select-dropdown.active .multi-select-options,
    .single-select-dropdown.active .single-select-options {
      display: flex;
    }

    .multi-select-search,
    .single-select-search {
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .multi-select-search input,
    .single-select-search input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
    }

    .multi-select-search input:focus,
    .single-select-search input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .multi-select-list,
    .single-select-list {
      overflow-y: auto;
      max-height: 200px;
      padding: 4px;
    }

    .multi-select-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #1e293b;
      transition: background 0.15s;
    }

    .multi-select-option:hover {
      background: #f1f5f9;
    }

    .multi-select-option.selected {
      background: #eff6ff;
    }

    .multi-select-option input {
      width: 16px;
      height: 16px;
      accent-color: #3b82f6;
    }

    .single-select-option {
      padding: 10px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #1e293b;
      transition: background 0.15s;
    }

    .single-select-option:hover {
      background: #f1f5f9;
    }

    .single-select-option.selected {
      background: #eff6ff;
      color: #1e40af;
      font-weight: 500;
    }

    .multi-select-add-new,
    .single-select-add-new {
      padding: 8px;
      border-top: 1px solid #e2e8f0;
    }

    .add-new-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding: 10px 12px;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      color: #475569;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .add-new-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: #eff6ff;
    }

    .new-value-preview {
      font-weight: 600;
      color: #1e293b;
    }
  `
}

/**
 * Get dropdown JavaScript to include in page
 */
function getDropdownScripts() {
  return `
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.multi-select-dropdown') && !e.target.closest('.single-select-dropdown')) {
        document.querySelectorAll('.multi-select-dropdown.active, .single-select-dropdown.active').forEach(dd => {
          dd.classList.remove('active');
        });
      }
    });

    function toggleMultiSelect(trigger) {
      const dropdown = trigger.closest('.multi-select-dropdown');
      const wasActive = dropdown.classList.contains('active');

      // Close all other dropdowns
      document.querySelectorAll('.multi-select-dropdown.active, .single-select-dropdown.active').forEach(dd => {
        dd.classList.remove('active');
      });

      if (!wasActive) {
        dropdown.classList.add('active');
        dropdown.querySelector('.multi-select-search input').focus();
      }
    }

    function toggleSingleSelect(trigger) {
      const dropdown = trigger.closest('.single-select-dropdown');
      const wasActive = dropdown.classList.contains('active');

      // Close all other dropdowns
      document.querySelectorAll('.multi-select-dropdown.active, .single-select-dropdown.active').forEach(dd => {
        dd.classList.remove('active');
      });

      if (!wasActive) {
        dropdown.classList.add('active');
        dropdown.querySelector('.single-select-search input').focus();
      }
    }

    function filterMultiSelectOptions(input, name) {
      const dropdown = input.closest('.multi-select-dropdown');
      const value = input.value.toLowerCase().trim();
      const options = dropdown.querySelectorAll('.multi-select-option');
      const addNewSection = dropdown.querySelector('.multi-select-add-new');
      const preview = addNewSection.querySelector('.new-value-preview');
      let hasMatch = false;

      options.forEach(opt => {
        const text = opt.textContent.toLowerCase();
        const matches = text.includes(value);
        opt.style.display = matches ? '' : 'none';
        if (matches && value) hasMatch = true;
      });

      // Show "Add new" option if no exact match
      if (value && !hasMatch) {
        addNewSection.style.display = '';
        preview.textContent = input.value;
      } else {
        addNewSection.style.display = 'none';
      }
    }

    function filterSingleSelectOptions(input, name) {
      const dropdown = input.closest('.single-select-dropdown');
      const value = input.value.toLowerCase().trim();
      const options = dropdown.querySelectorAll('.single-select-option');
      const addNewSection = dropdown.querySelector('.single-select-add-new');
      const preview = addNewSection.querySelector('.new-value-preview');
      let hasExactMatch = false;

      options.forEach(opt => {
        const text = opt.textContent.toLowerCase();
        const matches = text.includes(value) || !value;
        opt.style.display = matches ? '' : 'none';
        if (opt.dataset.value && opt.dataset.value.toLowerCase() === value) hasExactMatch = true;
      });

      // Show "Add new" option if no exact match
      if (value && !hasExactMatch) {
        addNewSection.style.display = '';
        preview.textContent = input.value;
      } else {
        addNewSection.style.display = 'none';
      }
    }

    function handleMultiSelectEnter(event, name) {
      if (event.key === 'Enter') {
        event.preventDefault();
        const dropdown = event.target.closest('.multi-select-dropdown');
        const addNewSection = dropdown.querySelector('.multi-select-add-new');
        if (addNewSection.style.display !== 'none') {
          addNewMultiSelectOption(name);
        }
      }
    }

    function handleSingleSelectEnter(event, name) {
      if (event.key === 'Enter') {
        event.preventDefault();
        const dropdown = event.target.closest('.single-select-dropdown');
        const addNewSection = dropdown.querySelector('.single-select-add-new');
        if (addNewSection.style.display !== 'none') {
          addNewSingleSelectOption(name);
        }
      }
    }

    function toggleMultiSelectOption(checkbox, name) {
      const dropdown = checkbox.closest('.multi-select-dropdown');
      updateMultiSelectDisplay(dropdown);
    }

    function removeMultiSelectValue(event, name, value) {
      event.stopPropagation();
      const dropdown = document.querySelector('.multi-select-dropdown[data-name="' + name + '"]');
      const checkbox = dropdown.querySelector('input[type="checkbox"][value="' + value + '"]');
      if (checkbox) {
        checkbox.checked = false;
      }
      // Also remove custom values
      const customOption = dropdown.querySelector('.multi-select-option[data-custom="' + value + '"]');
      if (customOption) {
        customOption.remove();
      }
      updateMultiSelectDisplay(dropdown);
    }

    function updateMultiSelectDisplay(dropdown) {
      const selectedContainer = dropdown.querySelector('.multi-select-selected');
      const hiddenInput = dropdown.querySelector('input[type="hidden"]');
      const checkboxes = dropdown.querySelectorAll('.multi-select-list input[type="checkbox"]:checked');
      const name = dropdown.dataset.name;

      const values = Array.from(checkboxes).map(cb => cb.value);

      if (values.length > 0) {
        selectedContainer.innerHTML = values.map(v =>
          '<span class="selected-tag">' + escapeHtml(v) + '<button type="button" onclick="removeMultiSelectValue(event, \\'' + name + '\\', \\'' + escapeHtml(v) + '\\')">&times;</button></span>'
        ).join('');
      } else {
        selectedContainer.innerHTML = '<span class="placeholder">Select options...</span>';
      }

      hiddenInput.value = values.join(',');
    }

    function addNewMultiSelectOption(name) {
      const dropdown = document.querySelector('.multi-select-dropdown[data-name="' + name + '"]');
      const input = dropdown.querySelector('.multi-select-search input');
      const value = input.value.trim();

      if (!value) return;

      // Add new option to list
      const list = dropdown.querySelector('.multi-select-list');
      const newOption = document.createElement('label');
      newOption.className = 'multi-select-option selected';
      newOption.dataset.custom = value;
      newOption.innerHTML = '<input type="checkbox" value="' + escapeHtml(value) + '" checked onchange="toggleMultiSelectOption(this, \\'' + name + '\\')"><span>' + escapeHtml(value) + '</span>';
      list.appendChild(newOption);

      // Clear search and update display
      input.value = '';
      dropdown.querySelector('.multi-select-add-new').style.display = 'none';
      updateMultiSelectDisplay(dropdown);

      // Save to localStorage for persistence
      saveCustomOption(name, value);
    }

    function selectSingleOption(option, name) {
      const dropdown = option.closest('.single-select-dropdown');
      const value = option.dataset.value;
      const label = option.textContent.trim();

      // Update selected state
      dropdown.querySelectorAll('.single-select-option').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');

      // Update display
      const valueDisplay = dropdown.querySelector('.single-select-value');
      if (value) {
        valueDisplay.innerHTML = escapeHtml(label);
      } else {
        valueDisplay.innerHTML = '<span class="placeholder">Select an option...</span>';
      }

      // Update hidden input
      dropdown.querySelector('input[type="hidden"]').value = value;

      // Close dropdown
      dropdown.classList.remove('active');
    }

    function addNewSingleSelectOption(name) {
      const dropdown = document.querySelector('.single-select-dropdown[data-name="' + name + '"]');
      const input = dropdown.querySelector('.single-select-search input');
      const value = input.value.trim();

      if (!value) return;

      // Add new option to list
      const list = dropdown.querySelector('.single-select-list');
      const newOption = document.createElement('div');
      newOption.className = 'single-select-option';
      newOption.dataset.value = value;
      newOption.dataset.custom = 'true';
      newOption.textContent = value;
      newOption.onclick = function() { selectSingleOption(this, name); };
      list.appendChild(newOption);

      // Select the new option
      selectSingleOption(newOption, name);

      // Clear search
      input.value = '';
      dropdown.querySelector('.single-select-add-new').style.display = 'none';

      // Save to localStorage for persistence
      saveCustomOption(name, value);
    }

    function saveCustomOption(fieldName, value) {
      const key = 'customOptions_' + fieldName;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      if (!existing.includes(value)) {
        existing.push(value);
        localStorage.setItem(key, JSON.stringify(existing));
      }
    }

    function getCustomOptions(fieldName) {
      const key = 'customOptions_' + fieldName;
      return JSON.parse(localStorage.getItem(key) || '[]');
    }

    function escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  `
}

module.exports = {
  AUTHORITIES,
  SECTORS,
  POLICY_CATEGORIES,
  PRIORITY_LEVELS,
  IMPACT_LEVELS,
  generateMultiSelectDropdown,
  generateSingleSelectDropdown,
  getDropdownStyles,
  getDropdownScripts,
  escapeHtml
}
