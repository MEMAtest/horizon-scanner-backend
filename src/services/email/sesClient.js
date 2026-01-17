// src/services/email/sesClient.js
// Amazon SES client for transactional emails

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')

const AWS_REGION = process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-west-2'

let sesClient = null

function getClient() {
  if (!sesClient) {
    const config = { region: AWS_REGION }

    // Debug: log credential availability (not values)
    console.log('[SES] Region:', AWS_REGION)
    console.log('[SES] AWS_ACCESS_KEY_ID present:', !!process.env.AWS_ACCESS_KEY_ID)
    console.log('[SES] AWS_SECRET_ACCESS_KEY present:', !!process.env.AWS_SECRET_ACCESS_KEY)

    // Explicitly configure credentials if available in environment
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('[SES] Using explicit credentials from environment')
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    } else {
      console.log('[SES] No explicit credentials found, relying on default chain')
    }

    sesClient = new SESClient(config)
  }
  return sesClient
}

async function sendEmail({ from, to, subject, html, text }) {
  if (!Array.isArray(to) || to.length === 0) {
    throw new Error('SES: at least one recipient is required')
  }

  // Use configured sender or default
  const sender = from || process.env.DIGEST_FROM_EMAIL || 'RegCanary <alerts@regcanary.com>'

  const client = getClient()

  const params = {
    Source: sender,
    Destination: {
      ToAddresses: to
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: html,
          Charset: 'UTF-8'
        },
        ...(text && {
          Text: {
            Data: text,
            Charset: 'UTF-8'
          }
        })
      }
    }
  }

  try {
    const command = new SendEmailCommand(params)
    const response = await client.send(command)

    console.log(`✅ SES email sent: ${response.MessageId}`)
    return {
      id: response.MessageId,
      success: true
    }
  } catch (error) {
    console.error('❌ SES send failed:', error.message)
    throw error
  }
}

module.exports = {
  sendEmail,
  getClient
}
