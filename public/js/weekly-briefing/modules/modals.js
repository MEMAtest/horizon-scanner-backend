function applyModalsMixin(klass) {
  Object.assign(klass.prototype, {
    showToast(message, type = 'info', autoHide = true) {
      const statusToast = this.dom.statusToast
      if (!statusToast) return
      statusToast.textContent = message
      statusToast.className = `status-banner ${type}`
      statusToast.style.display = 'block'
      if (autoHide) {
        setTimeout(() => {
          statusToast.style.display = 'none'
        }, 5000)
      }
    },

    hideModal() {
      if (!this.dom.assembleModal) return
      this.dom.assembleModal.classList.remove('visible')
      this.dom.confirmBtn.disabled = false
    },

    showModal() {
      if (!this.dom.assembleModal) return
      this.dom.assembleModal.classList.add('visible')
      if (this.dom.previewForceCheckbox) {
        this.dom.previewForceCheckbox.checked = true
      }
    }
  })
}

export { applyModalsMixin }
