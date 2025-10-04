import { NextRequest, NextResponse } from 'next/server'

// Azure AI Foundry configuration
const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT
const AZURE_AI_API_KEY = process.env.AZURE_AI_API_KEY
const AZURE_AI_MODEL = process.env.AZURE_AI_MODEL || 'HackathonAI'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('Chat API called with config:', {
      hasEndpoint: !!AZURE_AI_ENDPOINT,
      hasApiKey: !!AZURE_AI_API_KEY,
      model: AZURE_AI_MODEL,
      endpoint: AZURE_AI_ENDPOINT ? AZURE_AI_ENDPOINT.substring(0, 50) + '...' : 'undefined'
    })

    if (!AZURE_AI_ENDPOINT || !AZURE_AI_API_KEY) {
      console.error('Azure AI configuration missing')
      return NextResponse.json(
        { 
          error: 'Azure AI service not configured',
          message: 'I apologize, but the AI service is not properly configured. Please check the environment variables.'
        },
        { status: 500 }
      )
    }

    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { 
          error: 'Invalid message format',
          message: 'Please provide a valid message.'
        },
        { status: 400 }
      )
    }

    // Prepare the messages for Azure AI Foundry
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant integrated into a NASA Space App Challenge project. 
        You should be knowledgeable about space, weather, air quality, and environmental data.
        Provide concise, helpful responses while being friendly and engaging.
        Keep responses relatively brief since this is a chat interface.`
      },
      {
        role: 'user',
        content: message
      }
    ]

    // Make the request to Azure AI Foundry
    // Use the full endpoint URL as provided since it already includes the deployment path
    const response = await fetch(AZURE_AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_AI_API_KEY,
      },
      body: JSON.stringify({
        messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Azure AI API error:', {
        status: response.status,
        statusText: response.statusText,
        url: AZURE_AI_ENDPOINT,
        error: errorText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      return NextResponse.json(
        { 
          error: 'AI service error',
          message: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
          details: `HTTP ${response.status}: ${response.statusText}`,
          debug: errorText
        },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected Azure AI response format:', data)
      return NextResponse.json(
        { 
          error: 'Invalid response format',
          message: 'I received an unexpected response. Please try rephrasing your question.'
        },
        { status: 500 }
      )
    }

    const aiResponse = data.choices[0].message.content.trim()

    return NextResponse.json({
      message: aiResponse,
      success: true
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'I apologize, but something went wrong. Please try again later.'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Chat API is running',
      status: 'healthy',
      configured: !!(AZURE_AI_ENDPOINT && AZURE_AI_API_KEY)
    },
    { status: 200 }
  )
}