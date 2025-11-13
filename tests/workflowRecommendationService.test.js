const workflowRecommendationService = require('../src/services/workflowRecommendationService')

describe('workflowRecommendationService', () => {
  it('returns tailored workflows for payments profile', () => {
    const recommendations = workflowRecommendationService.buildRecommendations({
      profile: {
        serviceType: 'payments',
        personas: ['operations', 'executive']
      },
      behaviourScores: [
        { entityType: 'authority', entityId: 'PSR', weight: 4 },
        { entityType: 'theme', entityId: 'payments', weight: 3 }
      ],
      streams: {
        high: [
          { authority: 'FCA', ai_tags: ['payments'] }
        ]
      }
    })

    expect(Array.isArray(recommendations)).toBe(true)
    expect(recommendations[0]).toMatchObject({
      id: 'payments-incident-response'
    })
  })

  it('falls back to general workflow when profile empty', () => {
    const recommendations = workflowRecommendationService.buildRecommendations({
      profile: null,
      behaviourScores: [],
      streams: {}
    })

    expect(recommendations).toHaveLength(1)
    expect(recommendations[0].id).toBe('general-monitoring-digest')
  })
})
