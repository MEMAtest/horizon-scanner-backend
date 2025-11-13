#!/usr/bin/env node
// Test script for Groq API - reliable free alternative
require('dotenv').config()

const axios = require('axios')

async function testGroqAPI() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('   TESTING GROQ API (FREE ALTERNATIVE)')
  console.log('═══════════════════════════════════════════════════════════════\n')

  // Use Groq API key from environment
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not found in environment variables')
    console.error('   Please add GROQ_API_KEY to your .env file')
    process.exit(1)
  }

  try {
    console.log('📊 Step 1: Testing Groq API with free key...\n')

    const testPrompt = `Analyze this regulatory update and respond with JSON only:

Headline: Bank of England Speech on Financial Stability
Content: The Deputy Governor delivered remarks on maintaining financial stability through enhanced capital requirements.

Respond in this JSON format:
{
  "impact": "Brief summary for financial services executives",
  "contentType": "Speech",
  "impactLevel": "Moderate",
  "urgency": "Medium",
  "businessImpactScore": 5
}`

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an expert regulatory intelligence analyst. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: testPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    console.log('✅ Groq API Request successful!\n')
    console.log('Response:', JSON.stringify(response.data, null, 2))
    console.log()

    const aiMessage = response.data.choices?.[0]?.message?.content
    if (aiMessage) {
      console.log('═══════════════════════════════════════════════════════════════')
      console.log('📊 AI Response:\n')
      console.log(aiMessage)
      console.log()

      try {
        const parsed = JSON.parse(aiMessage)
        console.log('✅ Response is valid JSON')
        console.log('Parsed:', JSON.stringify(parsed, null, 2))
      } catch (e) {
        console.log('⚠️  Response is not pure JSON, extracting...')
        // Try to extract JSON from markdown code blocks
        const jsonMatch = aiMessage.match(/```json\n([\s\S]*?)\n```/) || aiMessage.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const extracted = jsonMatch[1] || jsonMatch[0]
          const parsed = JSON.parse(extracted)
          console.log('✅ Extracted JSON:', JSON.stringify(parsed, null, 2))
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════')
    console.log('✅ GROQ API: WORKING')
    console.log('   This is a reliable free alternative to OpenRouter')
    console.log('═══════════════════════════════════════════════════════════════\n')

    console.log('💡 Next Steps:')
    console.log('   1. Add this key to .env as GROQ_API_KEY')
    console.log('   2. System will automatically use Groq for AI analysis')
    console.log('   3. Re-run backfill to get proper AI summaries\n')

    process.exit(0)
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('❌ GROQ API TEST FAILED')
    console.error('═══════════════════════════════════════════════════════════════\n')

    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Error:', JSON.stringify(error.response.data, null, 2))
    } else {
      console.error('Error:', error.message)
    }

    process.exit(1)
  }
}

testGroqAPI()
