function showMessage(message, type) {
  const messageEl = document.createElement('div')
  messageEl.style.cssText = [
    'position: fixed',
    'top: 20px',
    'right: 20px',
    `background: ${type === 'success' ? '#10b981' : '#ef4444'}`,
    'color: white',
    'padding: 15px 20px',
    'border-radius: 8px',
    'z-index: 10001',
    'animation: slideIn 0.3s ease'
  ].join(';')
  messageEl.textContent = message
  document.body.appendChild(messageEl)
  setTimeout(() => messageEl.remove(), 3000)
}

export { showMessage }
