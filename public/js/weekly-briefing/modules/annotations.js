function applyAnnotationsMixin(klass) {
  Object.assign(klass.prototype, {
    populateAnnotationUpdateOptions() {
      const optionsEl = this.dom.annotationUpdateOptions
      if (!optionsEl) return
      optionsEl.innerHTML = ''
      const pool = Array.isArray(this.state.current?.dataset?.highlightUpdates) && this.state.current.dataset.highlightUpdates.length > 0
        ? this.state.current.dataset.highlightUpdates
        : this.state.current?.dataset?.currentUpdates
      if (!Array.isArray(pool)) return
      const fragment = document.createDocumentFragment()
      pool.forEach(update => {
        if (!update || !update.id) return
        const option = document.createElement('option')
        option.value = update.id
        const title = update.title ? update.title.slice(0, 60) : 'Untitled update'
        option.label = `${update.id} - ${title}`
        fragment.appendChild(option)
      })
      optionsEl.appendChild(fragment)
    },

    openAnnotationModal() {
      if (!this.dom.annotationModal || !this.dom.annotationForm) return
      this.dom.annotationForm.reset()
      this.dom.annotationModal.classList.add('visible')
    },

    closeAnnotationModal() {
      if (!this.dom.annotationModal) return
      this.dom.annotationModal.classList.remove('visible')
    },

    async refreshAnnotationsFromServer() {
      const pool = Array.isArray(this.state.current?.dataset?.highlightUpdates) && this.state.current.dataset.highlightUpdates.length > 0
        ? this.state.current.dataset.highlightUpdates
        : this.state.current?.dataset?.currentUpdates
      if (!Array.isArray(pool)) return
      const ids = pool.map(update => update.id).filter(Boolean)
      if (ids.length === 0) {
        this.state.annotations = []
        this.renderAnnotations()
        return
      }
      const visibility = Array.isArray(this.state.annotationVisibility) && this.state.annotationVisibility.length > 0
        ? this.state.annotationVisibility.join(',')
        : ''
      const url = `/api/annotations?updateId=${encodeURIComponent(ids.join(','))}&visibility=${encodeURIComponent(visibility)}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load annotations')
      const payload = await response.json()
      if (payload.success && Array.isArray(payload.annotations)) {
        this.state.annotations = payload.annotations
        this.renderAnnotations()
      }
    }
  })
}

export { applyAnnotationsMixin }
