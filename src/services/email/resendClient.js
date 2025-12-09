// src/services/email/resendClient.js
// Lightweight Resend client for transactional emails.

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

async function sendEmail({ from, to, subject, html, text }) {
  if (!Array.isArray(to) || to.length === 0) {
    throw new Error('Resend: at least one recipient is required')
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Resend: RESEND_API_KEY is not configured')
  }

  // Use resend.dev for testing, or configured domain for production
  const sender = from || process.env.DIGEST_FROM_EMAIL || 'RegCanary <onboarding@resend.dev>'

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: sender,
      to,
      subject,
      html,
      text,
      headers: {
        'X-Entity-Ref-ID': `digest-${Date.now()}`,
        'List-Unsubscribe': '<mailto:unsubscribe@regcanary.com>'
      },
      tags: [
        {
          name: 'category',
          value: 'daily-digest'
        }
      ]
    })
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    const message = `Resend request failed with status ${response.status}: ${errorBody}`
    throw new Error(message)
  }

  return response.json()
}

module.exports = {
  sendEmail
}
