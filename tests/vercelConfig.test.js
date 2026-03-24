const vercelConfig = require('../vercel.json')

describe('vercel.json configuration', () => {
  describe('Function maxDuration', () => {
    it('api/index.js has 120s maxDuration for synchronous briefing generation', () => {
      expect(vercelConfig.functions['api/index.js'].maxDuration).toBe(120)
    })

    it('smart-briefing cron has 120s maxDuration', () => {
      expect(vercelConfig.functions['api/cron/smart-briefing.js'].maxDuration).toBe(120)
    })
  })

  describe('Cron schedules', () => {
    it('smart-briefing runs Friday 3pm UTC', () => {
      const entry = vercelConfig.crons.find(c => c.path === '/api/cron/smart-briefing')
      expect(entry).toBeDefined()
      expect(entry.schedule).toBe('0 15 * * 5')
    })

    it('weekly-newsletter runs Friday 5pm UTC', () => {
      const entry = vercelConfig.crons.find(c => c.path === '/api/cron/weekly-newsletter')
      expect(entry).toBeDefined()
      expect(entry.schedule).toBe('0 17 * * 5')
    })

    it('smart-briefing runs 2 hours before weekly-newsletter', () => {
      const briefing = vercelConfig.crons.find(c => c.path === '/api/cron/smart-briefing')
      const newsletter = vercelConfig.crons.find(c => c.path === '/api/cron/weekly-newsletter')

      // Parse cron hours (field index 1)
      const briefingHour = parseInt(briefing.schedule.split(' ')[1])
      const newsletterHour = parseInt(newsletter.schedule.split(' ')[1])

      expect(newsletterHour - briefingHour).toBe(2)
    })

    it('both crons run on the same day (Friday = 5)', () => {
      const briefing = vercelConfig.crons.find(c => c.path === '/api/cron/smart-briefing')
      const newsletter = vercelConfig.crons.find(c => c.path === '/api/cron/weekly-newsletter')

      // Parse cron day-of-week (field index 4)
      const briefingDay = briefing.schedule.split(' ')[4]
      const newsletterDay = newsletter.schedule.split(' ')[4]

      expect(briefingDay).toBe('5')
      expect(newsletterDay).toBe('5')
    })
  })
})
