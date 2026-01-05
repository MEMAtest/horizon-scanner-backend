const axios = require('axios')

const DEFAULT_TIMEOUT_MS = 10000

async function sendMessage({ text, blocks } = {}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('Slack notifier: SLACK_WEBHOOK_URL is not configured')
    return { ok: false, error: 'missing_webhook' }
  }

  if (!text && !blocks) {
    return { ok: false, error: 'empty_payload' }
  }

  const payload = {
    text: text || ' ',
    ...(blocks ? { blocks } : {})
  }

  try {
    await axios.post(webhookUrl, payload, { timeout: DEFAULT_TIMEOUT_MS })
    return { ok: true }
  } catch (error) {
    console.error('Slack notifier error:', error.message)
    return { ok: false, error: error.message }
  }
}

module.exports = {
  sendMessage
}
