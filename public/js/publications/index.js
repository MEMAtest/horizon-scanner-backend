/**
 * FCA Publications Dashboard
 * Main entry point
 */

import { PublicationsDashboard } from './dashboard-core.js'

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[publications] Initializing dashboard...')
  window.publicationsDashboard = new PublicationsDashboard()
})
