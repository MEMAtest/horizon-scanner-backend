// Smart Briefing Annotation Service
// Uses PostgreSQL via dbService for persistent storage (works on Vercel serverless)

const dbService = require('./dbService')

class AnnotationService {
  async listAnnotations(filters = {}) {
    return dbService.listAnnotations(filters)
  }

  async addAnnotation(note) {
    return dbService.addAnnotation(note)
  }

  async updateAnnotation(noteId, updates = {}) {
    return dbService.updateAnnotation(noteId, updates)
  }

  async deleteAnnotation(noteId) {
    return dbService.deleteAnnotation(noteId)
  }

  async getAnnotation(noteId) {
    return dbService.getAnnotation(noteId)
  }

  // Get annotations with upcoming due dates
  async getUpcomingDueAnnotations(daysAhead = 7) {
    return dbService.getUpcomingDueAnnotations(daysAhead)
  }

  // Get overdue annotations
  async getOverdueAnnotations() {
    return dbService.getOverdueAnnotations()
  }
}

module.exports = new AnnotationService()
