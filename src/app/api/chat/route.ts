/**
 * Chat API Route Handler
 *
 * This is a Next.js API Route that handles chat requests from our frontend.
 * It acts as a proxy between our frontend and the Kimi AI API.
 *
 * Why do we need this backend API route?
 * 1. Security: We keep the API key secret on the server, not exposed to the browser
 * 2. CORS: Avoids cross-origin issues when calling external APIs from the browser
 * 3. Streaming: Enables real-time streaming of AI responses to the frontend
 */

import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

/**
 * Create OpenAI client configured for Kimi API
 *
 * Kimi (by Moonshot AI) uses an OpenAI-compatible API, so we can use the OpenAI SDK
 * by just changing the baseURL to point to Kimi's servers.
 */
const openai = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY || 'dummy-key-for-build', // API key from environment variables (keep secret!)
  baseURL: 'https://api.moonshot.ai/v1', // Kimi's API endpoint (different from OpenAI's)
})

/**
 * POST handler for chat requests
 *
 * This function runs on the server when the frontend sends a POST request to /api/chat
 *
 * Flow:
 * 1. Frontend sends POST request with message history
 * 2. We extract the messages from the request body
 * 3. Send messages to Kimi API for completion
 * 4. Stream the response back to the frontend in real-time
 */
export async function POST(req: Request) {
  try {
    // Check if API key is properly configured at runtime
    if (!process.env.MOONSHOT_API_KEY) {
      console.error('MOONSHOT_API_KEY is not configured')
      return new Response(
        JSON.stringify({ error: 'MOONSHOT_API_KEY environment variable is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Extract and validate request body with size limits for security
    const body = await req.json()
    const { messages, model, context } = body

    // Security: Validate request body size and structure
    if (JSON.stringify(body).length > 100000) { // 100KB limit
      console.error('Request body too large:', JSON.stringify(body).length)
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Security: Validate model is in allowed list
    const allowedModels = [
      'moonshot-v1-auto',
      'kimi-k2-instruct',
      'kimi-k2-base',
      'kimi-k2-0905',
      'moonshot-v1-128k',
      'moonshot-v1-32k',
      'moonshot-v1-8k'
    ]
    const selectedModel = allowedModels.includes(model) ? model : 'moonshot-v1-auto'

    // Security: Validate messages structure and content
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages format:', messages)
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Security: Validate each message structure and sanitize content
    for (const message of messages) {
      if (!message || typeof message !== 'object' || !message.role || !message.content) {
        console.error('Invalid message structure:', message)
        return new Response(
          JSON.stringify({ error: 'Invalid message structure' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Limit message content length
      if (typeof message.content === 'string' && message.content.length > 50000) {
        console.error('Message content too long:', message.content.length)
        return new Response(
          JSON.stringify({ error: 'Message content too long' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Security: Limit context length
    if (context && typeof context === 'string' && context.length > 10000) {
      console.error('Context too long:', context.length)
      return new Response(
        JSON.stringify({ error: 'Context too long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Prepare messages with context if provided
    const contextualMessages = [...messages]

    // If context is provided, add it as a system message at the beginning
    if (context && context.trim()) {
      const systemMessage = {
        role: 'system' as const,
        content: `Additional context: ${context.trim()}`
      }

      // Check if there's already a system message and merge with it, or add new one
      const existingSystemIndex = contextualMessages.findIndex(msg => msg.role === 'system')
      if (existingSystemIndex >= 0) {
        // Merge with existing system message
        contextualMessages[existingSystemIndex].content += `\n\n${systemMessage.content}`
      } else {
        // Add as new system message at the beginning
        contextualMessages.unshift(systemMessage)
      }
    }

    console.log('Sending request to Kimi API with', contextualMessages.length, 'messages using model:', selectedModel)
    if (context) {
      console.log('Context provided:', context.slice(0, 100) + (context.length > 100 ? '...' : ''))
    }

    // Call the Kimi API to get a chat completion
    const response = await openai.chat.completions.create({
      model: selectedModel,               // Use the selected model from frontend
      stream: true,                       // Enable streaming for real-time responses
      messages: contextualMessages,       // Pass the conversation history with context to the AI
    })

    console.log('Received response from Kimi API, creating stream')

    // Convert the response to a readable stream using Vercel AI SDK
    // This allows the frontend to receive the response word-by-word as the AI generates it
    // Type assertion to fix compatibility between OpenAI v4 and AI SDK v3
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = OpenAIStream(response as any)

    // Return a streaming response that the frontend can consume
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}