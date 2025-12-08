/**
 * Firm Personas API Routes
 * Handles persona selection and management
 */

const firmPersonaService = require('../../services/firmPersonaService')
const { resolveUserId } = require('../../middleware/authMiddleware')

function registerFirmPersonaRoutes(router) {
  /**
   * GET /api/personas/presets
   * Get all available persona presets
   */
  router.get('/personas/presets', (req, res) => {
    try {
      const presets = firmPersonaService.getPresets()
      res.json({
        success: true,
        presets
      })
    } catch (error) {
      console.error('Error getting persona presets:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to get persona presets'
      })
    }
  })

  /**
   * GET /api/personas/current
   * Get the current user's active persona
   */
  router.get('/personas/current', async (req, res) => {
    try {
      // Must be authenticated
      if (!req.user || !req.isAuthenticated) {
        return res.json({
          success: true,
          persona: null,
          message: 'Not authenticated'
        })
      }

      const persona = await firmPersonaService.getUserPersona(req.user.id)

      res.json({
        success: true,
        persona: persona ? {
          id: persona.id,
          name: persona.name,
          description: persona.description,
          icon: persona.icon,
          color: persona.color,
          sectors: persona.sectors,
          regulators: persona.regulators
        } : null
      })
    } catch (error) {
      console.error('Error getting current persona:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to get current persona'
      })
    }
  })

  /**
   * POST /api/personas/select
   * Select a persona for the current user
   */
  router.post('/personas/select', async (req, res) => {
    try {
      // Must be authenticated
      if (!req.user || !req.isAuthenticated) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required to select a persona'
        })
      }

      const { personaId, customConfig } = req.body

      if (!personaId) {
        return res.status(400).json({
          success: false,
          error: 'personaId is required'
        })
      }

      const persona = await firmPersonaService.setUserPersona(
        req.user.id,
        personaId,
        customConfig || {}
      )

      res.json({
        success: true,
        message: `Persona set to ${persona.name}`,
        persona: {
          id: persona.id,
          name: persona.name,
          description: persona.description,
          icon: persona.icon,
          color: persona.color
        }
      })
    } catch (error) {
      console.error('Error selecting persona:', error.message)
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to select persona'
      })
    }
  })

  /**
   * DELETE /api/personas/current
   * Clear the current user's persona selection
   */
  router.delete('/personas/current', async (req, res) => {
    try {
      if (!req.user || !req.isAuthenticated) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      await firmPersonaService.clearUserPersona(req.user.id)

      res.json({
        success: true,
        message: 'Persona cleared'
      })
    } catch (error) {
      console.error('Error clearing persona:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to clear persona'
      })
    }
  })

  /**
   * GET /api/personas/:personaId
   * Get details of a specific persona preset
   */
  router.get('/personas/:personaId', (req, res) => {
    try {
      const { personaId } = req.params
      const persona = firmPersonaService.getPreset(personaId)

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: 'Persona not found'
        })
      }

      res.json({
        success: true,
        persona
      })
    } catch (error) {
      console.error('Error getting persona:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to get persona'
      })
    }
  })
}

module.exports = registerFirmPersonaRoutes
