function applyEventsMixin(klass) {
  Object.assign(klass.prototype, {
    attachEventListeners() {
      const {
        assembleBtn,
        confirmBtn,
        cancelBtn,
        assembleModal,
        previewQuickButtons,
        refreshPreviewBtn,
        printBtn,
        refreshBtn,
        previewStartInput,
        previewEndInput,
        annotationFilterEl,
        addAnnotationBtn,
        cancelAnnotationBtn,
        annotationModal,
        annotationForm,
        quickNoteContentInput,
        quickNoteRecipientInput,
        quickNoteFirmInput,
        quickNoteSenderInput,
        quickNoteCopyBtn,
        quickNoteCancelBtn,
        quickNoteModal,
        quickNoteForm,
        quickNoteSaveBtn
      } = this.dom

      this.registerQuickNoteGlobal()

      const triggerAssemble = async () => {
        this.showModal()
        await this.loadPreview()
      }

      if (assembleBtn) {
        assembleBtn.addEventListener('click', triggerAssemble)
      }

      if (typeof window !== 'undefined') {
        window.assembleBriefing = async (...args) => {
          try {
            await triggerAssemble(...args)
          } catch (error) {
            console.error('assembleBriefing failed:', error)
            this.showToast('Unable to open assemble workflow. Please try again.', 'error')
          }
        }
        const assembleQueue = window.__weeklyBriefingQueues?.assembleBriefing
        if (Array.isArray(assembleQueue) && assembleQueue.length) {
          const pending = assembleQueue.splice(0)
          pending.forEach(args => {
            try {
              window.assembleBriefing(...args)
            } catch (error) {
              console.warn('Flushing queued assembleBriefing call failed:', error)
            }
          })
        }
      }

      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => this.triggerRun())
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.hideModal())
      }

      if (assembleModal) {
        assembleModal.addEventListener('click', event => {
          if (event.target === assembleModal) {
            this.hideModal()
          }
        })
      }

      if (printBtn) {
        printBtn.addEventListener('click', () => {
          if (this.state.current) {
            window.print()
          }
        })
      }

      const runRefresh = async () => {
        if (assembleBtn) assembleBtn.disabled = true
        if (refreshBtn) refreshBtn.disabled = true
        try {
          await this.loadLatestBriefing()
          try {
            await this.refreshAnnotationsFromServer()
          } catch (error) {
            console.warn('Annotation refresh failed:', error.message)
          }
          await this.loadMetrics()
          this.showToast('Latest briefing refreshed.', 'success')
        } catch (error) {
          console.error(error)
          this.showToast('Refresh failed. Please retry shortly.', 'error')
        } finally {
          if (assembleBtn) assembleBtn.disabled = false
          if (refreshBtn) refreshBtn.disabled = false
        }
      }

      if (refreshBtn) {
        refreshBtn.addEventListener('click', runRefresh)
      }

      if (typeof window !== 'undefined') {
        window.refreshData = async (...args) => {
          await runRefresh(...args)
        }
        const refreshQueue = window.__weeklyBriefingQueues?.refreshData
        if (Array.isArray(refreshQueue) && refreshQueue.length) {
          const pending = refreshQueue.splice(0)
          pending.forEach(args => {
            try {
              window.refreshData(...args)
            } catch (error) {
              console.warn('Flushing queued refreshData call failed:', error)
            }
          })
        }
      }

      if (refreshPreviewBtn) {
        refreshPreviewBtn.addEventListener('click', () => {
          this.loadPreview()
        })
      }

      if (previewQuickButtons && previewQuickButtons.length) {
        previewQuickButtons.forEach(button => {
          button.addEventListener('click', () => {
            const days = Number(button.dataset.previewRange || '7')
            const end = new Date()
            const start = new Date()
            start.setDate(start.getDate() - days + 1)
            if (previewStartInput) previewStartInput.value = this.toInputDate(start.toISOString())
            if (previewEndInput) previewEndInput.value = this.toInputDate(end.toISOString())
            this.loadPreview({ start: previewStartInput?.value, end: previewEndInput?.value })
          })
        })
      }

      if (annotationFilterEl) {
        annotationFilterEl.addEventListener('change', () => {
          this.state.annotationFilter = annotationFilterEl.value || 'all'
          this.renderAnnotations()
        })
      }

      if (addAnnotationBtn) {
        addAnnotationBtn.addEventListener('click', () => {
          this.populateAnnotationUpdateOptions()
          this.openAnnotationModal()
        })
      }

      if (cancelAnnotationBtn) {
        cancelAnnotationBtn.addEventListener('click', event => {
          event.preventDefault()
          this.closeAnnotationModal()
        })
      }

      if (annotationModal) {
        annotationModal.addEventListener('click', event => {
          if (event.target === annotationModal) {
            this.closeAnnotationModal()
          }
        })
      }

      if (annotationForm) {
        annotationForm.addEventListener('submit', async event => {
          event.preventDefault()
          const formData = new FormData(annotationForm)
          const dueDate = formData.get('due_date')
          const body = {
            update_id: formData.get('update_id'),
            visibility: formData.get('visibility') || 'team',
            status: formData.get('status') || 'analyzing',
            content: formData.get('content') || '',
            tags: (formData.get('tags') || '')
              .split(',')
              .map(tag => tag.trim())
              .filter(Boolean),
            assigned_to: (formData.get('assigned_to') || '')
              .split(',')
              .map(value => value.trim())
              .filter(Boolean),
            linked_resources: (formData.get('linked_resources') || '')
              .split(',')
              .map(value => value.trim())
              .filter(Boolean),
            due_date: dueDate || null
          }

          if (!body.update_id || !body.content) {
            this.showToast('Update ID and content are required.', 'error')
            return
          }

          try {
            const response = await fetch('/api/annotations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            })
            if (!response.ok) throw new Error('Failed to save annotation')
            const payload = await response.json()
            if (!payload.success) throw new Error(payload.error || 'Unable to save annotation')
            this.showToast('Annotation captured.', 'success')
            this.closeAnnotationModal()
            await this.refreshAnnotationsFromServer()
          } catch (error) {
            console.error(error)
            this.showToast(error.message || 'Unable to save annotation', 'error', false)
          }
        })
      }

      if (quickNoteCopyBtn && quickNoteContentInput) {
        quickNoteCopyBtn.addEventListener('click', async () => {
          const text = this.cleanText(quickNoteContentInput.value)
          if (!text) {
            this.showToast('Nothing to copy yet.', 'error')
            return
          }
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(text)
            } else {
              const helper = document.createElement('textarea')
              helper.value = text
              helper.setAttribute('readonly', '')
              helper.style.position = 'absolute'
              helper.style.left = '-9999px'
              document.body.appendChild(helper)
              helper.select()
              document.execCommand('copy')
              document.body.removeChild(helper)
            }
            this.showToast('Quick note copied to clipboard.', 'success')
          } catch (error) {
            console.warn('Clipboard copy failed:', error)
            this.showToast('Unable to copy note.', 'error', false)
          }
        })
      }

      if (quickNoteCancelBtn) {
        quickNoteCancelBtn.addEventListener('click', () => {
          this.closeQuickNoteComposer()
        })
      }

      if (quickNoteModal) {
        quickNoteModal.addEventListener('click', event => {
          if (event.target === quickNoteModal) {
            this.closeQuickNoteComposer()
          }
        })
      }

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && quickNoteModal && quickNoteModal.classList.contains('visible')) {
          this.closeQuickNoteComposer()
        }
      })

      if (quickNoteForm && quickNoteContentInput) {
        quickNoteForm.addEventListener('submit', async event => {
          event.preventDefault()
          if (!this.quickNoteState.activeUpdateId) {
            this.showToast('Select an update before saving a quick note.', 'error')
            return
          }
          const content = this.cleanText(quickNoteContentInput.value)
          if (!content) {
            this.showToast('Add some content to the quick note.', 'error')
            return
          }
          this.syncQuickNoteDefaultsFromInputs()
          const recipient = this.quickNoteState.defaults.recipient
          const firm = this.quickNoteState.defaults.firm
          const sender = this.quickNoteState.defaults.sender || 'Horizon Scanner Team'
          const linkedResources = this.quickNoteState.base && this.quickNoteState.base.url ? [this.quickNoteState.base.url] : []
          const payload = {
            update_id: this.quickNoteState.activeUpdateId,
            visibility: 'team',
            status: 'reviewed',
            content,
            origin_page: 'weekly-briefing',
            action_type: 'quick-note',
            annotation_type: 'quick-note',
            tags: ['quick-note'],
            linked_resources: linkedResources,
            context: {
              type: 'quick-note',
              recipient,
              firm,
              sender,
              generated_at: new Date().toISOString(),
              impact: this.quickNoteState.base?.impact || '',
              urgency: this.quickNoteState.base?.urgency || '',
              regulatory_area: this.quickNoteState.base?.regulatoryArea || ''
            }
          }
          if (sender) {
            payload.author = sender
          }
          let buttonDisabled = false
          if (quickNoteSaveBtn) {
            quickNoteSaveBtn.disabled = true
            quickNoteSaveBtn.textContent = 'Saving...'
            buttonDisabled = true
          }
          try {
            const response = await fetch('/api/annotations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            if (!response.ok) {
              throw new Error('Failed to save quick note')
            }
            const result = await response.json()
            if (!result.success) {
              throw new Error(result.error || 'Failed to save quick note')
            }
            this.saveQuickNoteDefaults(this.quickNoteState.defaults)
            this.closeQuickNoteComposer()
            this.showToast('Quick note saved to annotations.', 'success')
            try {
              await this.refreshAnnotationsFromServer()
            } catch (error) {
              console.warn('Unable to refresh annotations:', error)
            }
          } catch (error) {
            console.error('Quick note save failed:', error)
            this.showToast(error.message || 'Unable to save quick note.', 'error', false)
          } finally {
            if (buttonDisabled && quickNoteSaveBtn) {
              quickNoteSaveBtn.disabled = false
              quickNoteSaveBtn.textContent = 'Save Quick Note'
            }
          }
        })
      }

      // Tab switching functionality
      this.initTabSwitching()

      // Snapshot stats click handlers
      this.initSnapshotStatsHandlers()
    },

    initTabSwitching() {
      const tabButtons = document.querySelectorAll('.tab-navigation .tab')
      const tabPanes = document.querySelectorAll('.tab-pane')

      if (!tabButtons.length || !tabPanes.length) {
        console.log('[WeeklyBriefing] No tabs found, skipping tab initialization')
        return
      }

      console.log('[WeeklyBriefing] Initializing tab switching')

      tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault()
          const targetTab = button.getAttribute('data-tab')

          // Update buttons
          tabButtons.forEach(btn => {
            btn.classList.remove('active')
            btn.setAttribute('aria-selected', 'false')
          })
          button.classList.add('active')
          button.setAttribute('aria-selected', 'true')

          // Update panes
          tabPanes.forEach(pane => {
            pane.classList.remove('active')
          })
          const targetPane = document.querySelector(`[data-tab="${targetTab}"].tab-pane`)
          if (targetPane) {
            targetPane.classList.add('active')
          }

          console.log(`[WeeklyBriefing] Switched to tab: ${targetTab}`)
        })
      })
    },

    initSnapshotStatsHandlers() {
      const statItems = document.querySelectorAll('.stat-item-clickable')

      if (!statItems.length) {
        console.log('[WeeklyBriefing] No clickable stats found')
        return
      }

      console.log(`[WeeklyBriefing] Initializing ${statItems.length} clickable stats`)

      statItems.forEach(item => {
        const clickHandler = () => {
          const filter = item.getAttribute('data-filter')
          if (filter) {
            this.openUpdatesFilterModal(filter)
          }
        }

        item.addEventListener('click', clickHandler)
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            clickHandler()
          }
        })
      })
    },

    openUpdatesFilterModal(filter) {
      console.log(`[WeeklyBriefing] Opening filtered updates modal: ${filter}`)

      if (!this.state.current || !this.state.current.dataset) {
        this.showToast('No briefing data available', 'warning')
        return
      }

      const allUpdates = this.state.current.dataset.currentUpdates || []
      const filteredUpdates = this.filterUpdatesByImpact(allUpdates, filter)

      const filterLabels = {
        'all': 'All Updates',
        'high-impact': 'High Impact Updates',
        'moderate': 'Moderate Impact Updates',
        'informational': 'Informational Updates'
      }

      const title = filterLabels[filter] || 'Updates'

      this.showUpdatesListModal(filteredUpdates, title)
    },

    filterUpdatesByImpact(updates, filter) {
      if (!Array.isArray(updates)) return []
      if (filter === 'all') return updates

      return updates.filter(update => {
        const impact = (update.impact_level || update.impact || '').toString().toLowerCase()

        if (filter === 'high-impact') {
          return impact.includes('significant') || impact.includes('high')
        } else if (filter === 'moderate') {
          return impact.includes('moderate') || impact.includes('medium')
        } else if (filter === 'informational') {
          return impact.includes('informational') || impact.includes('low') || !impact
        }

        return false
      })
    },

    showUpdatesListModal(updates, title) {
      // Create modal HTML
      const modalHtml = `
        <div class="modal-overlay" id="updatesListModal">
          <div class="modal updates-list-modal">
            <div class="modal-header">
              <h2>${this.escapeHtml(title)}</h2>
              <button class="modal-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="modal-body">
              ${updates.length === 0 ? `
                <div class="empty-state">No updates found for this filter</div>
              ` : `
                <div class="updates-list">
                  ${updates.map((update, index) => `
                    <div class="update-list-item">
                      <div class="update-list-number">${index + 1}</div>
                      <div class="update-list-content">
                        <div class="update-list-authority">${this.escapeHtml(update.authority || 'Unknown')}</div>
                        <div class="update-list-title">${this.escapeHtml(update.title || 'Untitled')}</div>
                        <div class="update-list-meta">
                          <span>${this.escapeHtml(this.formatDate(update.published_date))}</span>
                          ${update.impact_level ? `<span class="impact-badge">${this.escapeHtml(update.impact_level)}</span>` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary modal-close-btn">Close</button>
            </div>
          </div>
        </div>
      `

      // Remove existing modal if any
      const existingModal = document.getElementById('updatesListModal')
      if (existingModal) {
        existingModal.remove()
      }

      // Add to DOM
      document.body.insertAdjacentHTML('beforeend', modalHtml)

      // Add event listeners
      const modal = document.getElementById('updatesListModal')
      const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn')

      closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          modal.remove()
        })
      })

      // Close on overlay click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })

      // Close on Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          modal.remove()
          document.removeEventListener('keydown', escapeHandler)
        }
      }
      document.addEventListener('keydown', escapeHandler)
    }
  })
}

export { applyEventsMixin }
