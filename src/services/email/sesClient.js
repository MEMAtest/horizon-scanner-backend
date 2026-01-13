// src/services/email/sesClient.js
// Amazon SES client for transactional emails

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')

const AWS_REGION = process.env.AWS_SES_REGION || 'eu-west-2'

let sesClient = null

function getClient() {
  if (!sesClient) {
    // AWS SDK will automatically use:
    // - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars, or
    // - IAM role if running on AWS infrastructure
    sesClient = new SESClient({ region: AWS_REGION })
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
