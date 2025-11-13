#!/usr/bin/env node
// Test script to diagnose OpenRouter API authentication
require('dotenv').config()

const axios = require('axios')

async function testOpenRouterAPI() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('   TESTING OPENROUTER API AUTHENTICATION')
  console.log('═══════════════════════════════════════════════════════════════\n')

  try {
    // Step 1: Check if API key is loaded
    console.log('📊 Step 1: Checking environment variables...\n')

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('❌ OPENROUTER_API_KEY not found in environment')
      process.exit(1)
    }

    console.log(`✅ API Key found: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}`)
    console.log()

    // Step 2: Make a simple test request
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 2: Making test API request...\n')

    const testPrompt = 'Respond with JSON only: {"test": "success", "message": "API is working"}'

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3-8b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a test assistant. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: testPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://regcanary.ai',
          'X-Title': 'RegCanary Horizon Scanner'
        },
        timeout: 30000
      }
    )

    console.log('✅ API Request successful!\n')
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(response.data, null, 2))
    console.log()

    // Step 3: Extract the AI response
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 3: Analyzing response...\n')

    const aiMessage = response.data.choices?.[0]?.message?.content
    if (aiMessage) {
      console.log('AI Response:', aiMessage)
      console.log()

      try {
        const parsed = JSON.parse(aiMessage)
        console.log('✅ Response is valid JSON')
        console.log('Parsed:', JSON.stringify(parsed, null, 2))
      } catch (e) {
        console.log('⚠️  Response is not JSON, but that\'s okay for this test')
      }
    } else {
      console.log('❌ No message in response')
    }

    console.log('\n═══════════════════════════════════════════════════════════════')
    console.log('✅ OPENROUTER API AUTHENTICATION: WORKING')
    console.log('═══════════════════════════════════════════════════════════════\n')

    process.exit(0)
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('❌ OPENROUTER API TEST FAILED')
    console.error('═══════════════════════════════════════════════════════════════\n')

    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Status Text:', error.response.statusText)
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2))
      console.error()

      if (error.response.status === 401) {
        console.error('💡 DIAGNOSIS: Authentication failed')
        console.error('   - The API key may be invalid or expired')
        console.error('   - Check: https://openrouter.ai/settings/keys')
      } else if (error.response.status === 429) {
        console.error('💡 DIAGNOSIS: Rate limit exceeded')
        console.error('   - Wait a few minutes and try again')
      } else if (error.response.status === 400) {
        console.error('💡 DIAGNOSIS: Bad request')
        console.error('   - The request format may be incorrect')
        console.error('   - Check model name and request structure')
      }
    } else {
      console.error('Error:', error.message)
      console.error('Stack:', error.stack)
    }

    process.exit(1)
  }
}

testOpenRouterAPI()
