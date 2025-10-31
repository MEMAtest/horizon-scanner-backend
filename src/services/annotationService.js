// Smart Briefing Annotation Service
// Stores collaborative notes for weekly briefing workflow using JSON persistence.

const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

class AnnotationService {
  constructor() {
    this.storagePath = path.join(process.cwd(), 'data', 'annotations.json')
    this.initialized = false
  }

  async ensureStorage() {
    if (this.initialized) return

    try {
      await fs.access(this.storagePath)
    } catch (_) {
      await fs.mkdir(path.dirname(this.storagePath), { recursive: true })
      await fs.writeFile(this.storagePath, '[]', 'utf8')
    }

    this.initialized = true
  }

  async loadAnnotations() {
    await this.ensureStorage()
    try {
      const content = await fs.readFile(this.storagePath, 'utf8')
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        return parsed
      }
      return []
    } catch (error) {
      console.error('AnnotationService load failed:', error.message)
      return []
    }
  }

  async saveAnnotations(annotations) {
    await this.ensureStorage()
    await fs.writeFile(this.storagePath, JSON.stringify(annotations, null, 2), 'utf8')
  }

  async listAnnotations(filters = {}) {
    const annotations = await this.loadAnnotations()

    return annotations.filter(annotation => {
      if (annotation.deletedAt) {
        return false
      }

      if (filters.updateIds && filters.updateIds.length > 0) {
        if (!filters.updateIds.includes(annotation.update_id)) {
          return false
        }
      }

      if (filters.visibility && filters.visibility.length > 0) {
        if (!filters.visibility.includes(annotation.visibility)) {
          return false
        }
      }

      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(annotation.status)) {
          return false
        }
      }

      if (filters.since) {
        const since = new Date(filters.since)
        if (!Number.isNaN(since.getTime())) {
          const created = new Date(annotation.created_at || annotation.createdAt || 0)
          if (created < since) {
            return false
          }
        }
      }

      return true
    })
  }

  async addAnnotation(note) {
    const annotations = await this.loadAnnotations()

    const now = new Date().toISOString()
    const annotation = {
      note_id: crypto.randomUUID(),
      update_id: note.update_id,
      author: note.author || 'unknown',
      visibility: note.visibility || 'team',
      status: note.status || 'analyzing',
      content: note.content || '',
      tags: Array.isArray(note.tags) ? note.tags : [],
      assigned_to: Array.isArray(note.assigned_to) ? note.assigned_to : [],
      linked_resources: Array.isArray(note.linked_resources) ? note.linked_resources : [],
      origin_page: note.origin_page || null,
      action_type: note.action_type || null,
      annotation_type: typeof note.annotation_type === 'string' && note.annotation_type.trim()
        ? note.annotation_type.trim()
        : 'general',
      priority: note.priority || null,
      persona: note.persona || null,
      report_included: typeof note.report_included === 'boolean' ? note.report_included : false,
      context: note.context || null,
      created_at: now,
      updated_at: now
    }

    annotations.push(annotation)
    await this.saveAnnotations(annotations)
    return annotation
  }

  async updateAnnotation(noteId, updates = {}) {
    const annotations = await this.loadAnnotations()
    const index = annotations.findIndex(annotation => annotation.note_id === noteId)

    if (index === -1) {
      return null
    }

    const existing = annotations[index]
    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Normalise array fields when provided
    if (updates.tags) {
      updated.tags = Array.isArray(updates.tags) ? updates.tags : []
    }
    if (updates.assigned_to) {
      updated.assigned_to = Array.isArray(updates.assigned_to) ? updates.assigned_to : []
    }
    if (updates.linked_resources) {
      updated.linked_resources = Array.isArray(updates.linked_resources) ? updates.linked_resources : []
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'report_included')) {
      updated.report_included = Boolean(updates.report_included)
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'annotation_type')) {
      updated.annotation_type = typeof updates.annotation_type === 'string' && updates.annotation_type.trim()
        ? updates.annotation_type.trim()
        : (existing.annotation_type || 'general')
    }

    annotations[index] = updated
    await this.saveAnnotations(annotations)
    return updated
  }

  async deleteAnnotation(noteId) {
    const annotations = await this.loadAnnotations()
    const index = annotations.findIndex(annotation => annotation.note_id === noteId)

    if (index === -1) {
      return false
    }

    annotations[index] = {
      ...annotations[index],
      deletedAt: new Date().toISOString()
    }

    await this.saveAnnotations(annotations)
    return true
  }
}

module.exports = new AnnotationService()
