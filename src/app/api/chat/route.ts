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
  // Check if API key is properly configured at runtime
  if (!process.env.MOONSHOT_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'MOONSHOT_API_KEY environment variable is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Extract the messages array from the request body
  // Format: [{role:'user', content:'hello'}, {role:'assistant', content:'hi there'}]
  const { messages } = await req.json()

  // Call the Kimi API to get a chat completion
  const response = await openai.chat.completions.create({
    model: 'kimi-k2-0711-preview',       // Kimi model - you can change this to other Kimi models
    stream: true,                        // Enable streaming for real-time responses
    messages,                           // Pass the conversation history to the AI
  })

  // Convert the response to a readable stream using Vercel AI SDK
  // This allows the frontend to receive the response word-by-word as the AI generates it
  // Type assertion to fix compatibility between OpenAI v4 and AI SDK v3
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = OpenAIStream(response as any)

  // Return a streaming response that the frontend can consume
  return new StreamingTextResponse(stream)
}