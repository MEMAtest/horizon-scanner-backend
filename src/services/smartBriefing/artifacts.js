const crypto = require('crypto')

function applyArtifactMethods(ServiceClass) {
  ServiceClass.prototype.computeHash = function(payload) {
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(payload))
    return hash.digest('hex')
  }

  ServiceClass.prototype.findCachedBriefing = async function(datasetHash) {
    const briefings = await this.listBriefings(50)
    for (const item of briefings) {
      if (item.metadata?.datasetHash === datasetHash) {
        const briefing = await this.getBriefing(item.id)
        if (briefing) {
          return briefing
        }
      }
    }
    return null
  }

  ServiceClass.prototype.generateArtifacts = async function(dataset) {
    if (!this.apiKey) {
      const apiName = this.useGroq ? 'GROQ_API_KEY' : 'OPENROUTER_API_KEY'
      console.warn(`${apiName} not configured. Falling back to template artifacts.`)
      return {
        artifacts: this.createFallbackArtifacts(dataset),
        usageMetrics: {
          totalTokens: 0,
          requests: []
        }
      }
    }

    const payload = this.buildPromptPayload(dataset)
    const runSequentially = this.useGroq

    let results
    if (runSequentially) {
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
      results = []

      try {
        results.push(await this.callOpenRouter({
          system: this.buildNarrativeSystemPrompt(dataset),
          user: this.buildNarrativeUserPrompt(payload),
          temperature: 0.7
        }))
        await delay(20000)
      } catch (error) {
        console.error('Narrative generation failed:', error.message)
        results.push({
          content: this.buildFallbackNarrative(dataset),
          usage: null,
          model: 'fallback'
        })
      }

      try {
        results.push(await this.callOpenRouter({
          system: this.buildChangeDetectionSystemPrompt(),
          user: this.buildChangeDetectionUserPrompt(payload),
          temperature: 0.2,
          expectJson: true
        }))
        await delay(20000)
      } catch (error) {
        console.error('Change detection generation failed:', error.message)
        results.push({
          content: this.buildFallbackChangeDetection(dataset),
          usage: null,
          model: 'fallback'
        })
      }

      try {
        results.push(await this.callOpenRouter({
          system: this.buildOnePagerSystemPrompt(dataset),
          user: this.buildOnePagerUserPrompt(payload),
          temperature: 0.6
        }))
        await delay(20000)
      } catch (error) {
        console.error('One-pager generation failed:', error.message)
        results.push({
          content: this.buildFallbackOnePager(dataset),
          usage: null,
          model: 'fallback'
        })
      }

      try {
        results.push(await this.callOpenRouter({
          system: this.buildTeamBriefingSystemPrompt(dataset),
          user: this.buildTeamBriefingUserPrompt(payload),
          temperature: 0.6
        }))
      } catch (error) {
        console.error('Team briefing generation failed:', error.message)
        results.push({
          content: this.buildFallbackTeamBriefing(dataset),
          usage: null,
          model: 'fallback'
        })
      }
    } else {
      results = await Promise.all([
        this.callOpenRouter({
          system: this.buildNarrativeSystemPrompt(dataset),
          user: this.buildNarrativeUserPrompt(payload),
          temperature: 0.7
        }).catch(error => {
          console.error('Narrative generation failed:', error.message)
          return {
            content: this.buildFallbackNarrative(dataset),
            usage: null,
            model: 'fallback'
          }
        }),
        this.callOpenRouter({
          system: this.buildChangeDetectionSystemPrompt(),
          user: this.buildChangeDetectionUserPrompt(payload),
          temperature: 0.2,
          expectJson: true
        }).catch(error => {
          console.error('Change detection generation failed:', error.message)
          return {
            content: this.buildFallbackChangeDetection(dataset),
            usage: null,
            model: 'fallback'
          }
        }),
        this.callOpenRouter({
          system: this.buildOnePagerSystemPrompt(dataset),
          user: this.buildOnePagerUserPrompt(payload),
          temperature: 0.6
        }).catch(error => {
          console.error('One-pager generation failed:', error.message)
          return {
            content: this.buildFallbackOnePager(dataset),
            usage: null,
            model: 'fallback'
          }
        }),
        this.callOpenRouter({
          system: this.buildTeamBriefingSystemPrompt(dataset),
          user: this.buildTeamBriefingUserPrompt(payload),
          temperature: 0.6
        }).catch(error => {
          console.error('Team briefing generation failed:', error.message)
          return {
            content: this.buildFallbackTeamBriefing(dataset),
            usage: null,
            model: 'fallback'
          }
        })
      ])
    }

    const usageRecords = results
      .map((result, index) => ({
        artifact: ['narrative', 'changeDetection', 'onePager', 'teamBriefing'][index],
        usage: result.usage,
        model: result.model
      }))
      .filter(entry => entry.usage)

    const totalTokens = usageRecords.reduce((sum, entry) => sum + (entry.usage.total_tokens || 0), 0)

    return {
      artifacts: {
        narrative: results[0].content,
        changeDetection: results[1].content,
        onePager: results[2].content,
        teamBriefing: results[3].content
      },
      usageMetrics: {
        totalTokens,
        requests: usageRecords
      }
    }
  }
}

module.exports = applyArtifactMethods
