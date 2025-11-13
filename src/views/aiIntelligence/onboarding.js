function getProfileOnboardingScripts({ profile, behaviour } = {}) {
  const config = {
    serviceOptions: ['payments', 'retail_banking', 'wealth_management', 'insurance', 'fintech', 'other'],
    regionOptions: ['UK', 'EU', 'US', 'APAC', 'Global'],
    personaOptions: ['executive', 'analyst', 'operations', 'product', 'legal'],
    goalOptions: [
      'stay_ahead_of_mandates',
      'monitor_enforcement',
      'prepare_workflows',
      'brief_executives',
      'track_deadlines'
    ]
  }

  const configJson = JSON.stringify(config).replace(/</g, '\\u003c')

  return `
    <script>
      (function() {
        const config = ${configJson};
        const root = document.querySelector('[data-onboarding-root]');
        if (!root) return;

        const defaultProfile = (() => {
          try {
            const raw = root.getAttribute('data-default-profile') || '{}';
            return JSON.parse(raw);
          } catch (error) {
            return {};
          }
        })();

        const activeProfile = (window.intelligenceProfile && window.intelligenceProfile.profile) || defaultProfile || {};

        const state = {
          step: 0,
          serviceType: activeProfile.serviceType || '',
          companySize: activeProfile.companySize || '',
          regions: new Set(Array.isArray(activeProfile.regions) ? activeProfile.regions : []),
          personas: new Set(Array.isArray(activeProfile.personas) ? activeProfile.personas.map(v => String(v).toLowerCase()) : []),
          goals: new Set(Array.isArray(activeProfile.goals) ? activeProfile.goals.map(v => String(v).toLowerCase()) : []),
          submitting: false
        };

        const steps = Array.from(root.querySelectorAll('.onboarding-step'));
        const summaryEl = root.querySelector('[data-onboarding-summary]');
        const errorEl = root.querySelector('[data-onboarding-error]');
        const nextBtn = root.querySelector('[data-onboarding-next]');
        const prevBtn = root.querySelector('[data-onboarding-prev]');
        const completeBtn = root.querySelector('[data-onboarding-complete]');

        function shouldShowOnboarding() {
          if (!activeProfile || !activeProfile.serviceType) return true;
          if (!Array.isArray(activeProfile.personas) || !activeProfile.personas.length) return true;
          if (activeProfile.source === 'generated-default') return true;
          return false;
        }

        function setStep(index) {
          state.step = Math.max(0, Math.min(index, steps.length - 1));
          steps.forEach(step => {
            const isActive = Number(step.getAttribute('data-step-index')) === state.step;
            step.classList.toggle('is-active', isActive);
          });
          prevBtn.style.display = state.step === 0 ? 'none' : 'inline-flex';
          nextBtn.style.display = state.step === steps.length - 1 ? 'none' : 'inline-flex';
          completeBtn.style.display = state.step === steps.length - 1 ? 'inline-flex' : 'none';
          updateNavigationState();
        }

        function updateOptionStates() {
          const groups = root.querySelectorAll('[data-option-group]');
          groups.forEach(group => {
            const groupName = group.getAttribute('data-option-group');
            const mode = group.getAttribute('data-option-mode') || 'single';
            const options = group.querySelectorAll('.onboarding-option');
            options.forEach(option => {
              const value = option.getAttribute('data-option-value');
              let isSelected = false;
              if (mode === 'toggle') {
                if (groupName === 'regions') {
                  isSelected = state.regions.has(value);
                } else if (groupName === 'personas') {
                  isSelected = state.personas.has(value);
                } else if (groupName === 'goals') {
                  isSelected = state.goals.has(value);
                }
              } else {
                if (groupName === 'serviceType') {
                  isSelected = state.serviceType === value;
                } else if (groupName === 'companySize') {
                  isSelected = state.companySize === value;
                }
              }
              option.classList.toggle('is-selected', isSelected);
              option.setAttribute('aria-pressed', isSelected);
            });
          });
        }

        function updateSummary() {
          if (!summaryEl) return;
          const serviceLabel = state.serviceType ? formatLabel(state.serviceType) : 'No service selected';
          const companyLabel = state.companySize ? formatSize(state.companySize) : 'Any size';
          const regionLabel = state.regions.size ? Array.from(state.regions).join(', ') : 'All regions';
          const personasLabel = state.personas.size ? Array.from(state.personas).map(formatLabel).join(', ') : 'No personas yet';
          summaryEl.innerHTML = [
            '<strong>Summary:</strong>',
            serviceLabel,
            '•',
            companyLabel,
            '• Regions:',
            regionLabel,
            '• Personas:',
            personasLabel
          ].join(' ');
        }

        function updateNavigationState() {
          const valid = validateStep(state.step);
          if (nextBtn) nextBtn.disabled = !valid;
          if (completeBtn) completeBtn.disabled = state.step === steps.length - 1 && !valid;
        }

        function validateStep(stepIndex) {
          if (state.submitting) return false;
          if (stepIndex === 0) {
            return Boolean(state.serviceType);
          }
          if (stepIndex === 2) {
            return state.personas.size > 0;
          }
          return true;
        }

        function formatLabel(value) {
          if (!value) return '';
          return value
            .split(/[_\\s-]+/)
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        }

        function formatSize(value) {
          switch (value) {
            case 'micro':
              return '0–50 employees';
            case 'mid':
              return '51–500 employees';
            case 'enterprise':
              return '500+ employees';
            default:
              return 'Any size';
          }
        }

        function toggleRoot(shouldOpen) {
          root.classList.toggle('is-visible', shouldOpen);
          document.body.classList.toggle('profile-onboarding-open', shouldOpen);
          if (shouldOpen) {
            setStep(0);
            updateOptionStates();
            updateSummary();
            clearError();
          }
        }

        function clearError() {
          if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('is-visible');
          }
        }

        function showError(message) {
          if (!errorEl) return;
          errorEl.textContent = message || 'Something went wrong. Please try again.';
          errorEl.classList.add('is-visible');
        }

        function handleOptionSelection(optionEl) {
          if (!optionEl) return;
          const container = optionEl.closest('[data-option-group]');
          if (!container) return;
          const groupName = container.getAttribute('data-option-group');
          const mode = container.getAttribute('data-option-mode') || 'single';
          const value = optionEl.getAttribute('data-option-value');
          if (!value) return;

          if (mode === 'toggle') {
            if (groupName === 'regions') {
              if (state.regions.has(value)) state.regions.delete(value)
              else state.regions.add(value)
            } else if (groupName === 'personas') {
              if (state.personas.has(value)) state.personas.delete(value)
              else state.personas.add(value)
            } else if (groupName === 'goals') {
              if (state.goals.has(value)) state.goals.delete(value)
              else state.goals.add(value)
            }
          } else {
            if (groupName === 'serviceType') {
              state.serviceType = value
            } else if (groupName === 'companySize') {
              state.companySize = value
            }
          }
          updateOptionStates();
          updateSummary();
          updateNavigationState();
        }

        function serializeState() {
          return {
            serviceType: state.serviceType || 'general_financial_services',
            companySize: state.companySize || null,
            regions: Array.from(state.regions),
            personas: Array.from(state.personas),
            goals: Array.from(state.goals)
          }
        }

        async function submitProfile() {
          if (state.submitting) return;
          if (!validateStep(state.step)) {
            showError('Check the selections before saving.');
            return;
          }
          clearError();
          state.submitting = true;
          updateNavigationState();
          completeBtn.classList.add('is-loading');
          try {
            const payload = serializeState();
            const response = await fetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!response.ok) {
              throw new Error('Profile update failed');
            }
            toggleRoot(false);
            window.location.reload();
          } catch (error) {
            showError('Unable to save profile. Please try again.');
          } finally {
            state.submitting = false;
            updateNavigationState();
            completeBtn.classList.remove('is-loading');
          }
        }

        root.addEventListener('click', event => {
          const option = event.target.closest('.onboarding-option');
          if (option) {
            event.preventDefault();
            handleOptionSelection(option);
            return;
          }

          if (event.target.matches('[data-onboarding-close]')) {
            event.preventDefault();
            toggleRoot(false);
            return;
          }

          if (event.target.matches('[data-onboarding-prev]')) {
            event.preventDefault();
            setStep(state.step - 1);
            return;
          }

          if (event.target.matches('[data-onboarding-next]')) {
            event.preventDefault();
            if (validateStep(state.step)) {
              setStep(state.step + 1);
            }
            return;
          }

          if (event.target.matches('[data-onboarding-complete]')) {
            event.preventDefault();
            submitProfile();
          }
        });

        window.ProfileOnboarding = window.ProfileOnboarding || {
          open() {
            toggleRoot(true);
          },
          close() {
            toggleRoot(false);
          },
          save: submitProfile
        };

        const profileLaunchers = document.querySelectorAll('[data-action="open-profile"]');
        profileLaunchers.forEach(button => {
          button.addEventListener('click', event => {
            event.preventDefault();
            window.ProfileOnboarding.open();
          });
        });

        updateOptionStates();
        updateSummary();
        setStep(0);

        if (shouldShowOnboarding()) {
          toggleRoot(true);
        }
      })();
    </script>
  `
}

module.exports = { getProfileOnboardingScripts }
