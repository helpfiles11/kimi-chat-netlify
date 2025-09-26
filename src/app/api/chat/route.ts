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
import { ALL_ALLOWED_MODELS, getDefaultModel } from '../../../lib/models'

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
  console.log('🚀 CHAT API CALLED - Enhanced Tool Calling Version')
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

    // Security: Validate model using centralized configuration
    const selectedModel = ALL_ALLOWED_MODELS.includes(model) ? model : getDefaultModel().id

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

    // Define available tools for AI to use - Format based on official Moonshot AI documentation
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "WebSearch",
          description: "Search the web for current information, news, facts, and real-time data",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query to find information on the web"
              },
              max_results: {
                type: "number",
                description: "Maximum number of search results to return (default: 5)"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "AIGrounding",
          description: "Get AI-generated answers with verifiable web sources using Brave's AI Grounding API. Provides direct answers with citations for complex questions requiring research.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Question or query that needs a comprehensive, researched answer with sources"
              },
              enable_research: {
                type: "boolean",
                description: "Allow multiple searches for complex queries (default: false)"
              },
              enable_citations: {
                type: "boolean",
                description: "Include citations and sources in the response (default: true)"
              },
              enable_entities: {
                type: "boolean",
                description: "Enable entity extraction for better context (default: false)"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "CodeRunner",
          description: "A code executor that supports running Python and JavaScript code",
          parameters: {
            type: "object",
            properties: {
              language: {
                type: "string",
                enum: ["python", "javascript"],
                description: "Programming language to execute"
              },
              code: {
                type: "string",
                description: "The code is written here"
              }
            },
            required: ["language", "code"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "Calculator",
          description: "Perform mathematical calculations including arithmetic, algebra, trigonometry, and statistical operations.",
          parameters: {
            type: "object",
            properties: {
              expression: {
                type: "string",
                description: "Mathematical expression to evaluate (e.g., '2 + 2', 'sqrt(16)', 'sin(pi/2)')"
              },
              operation: {
                type: "string",
                enum: ["evaluate", "solve", "simplify", "derivative", "integral"],
                description: "Type of mathematical operation to perform"
              }
            },
            required: ["expression", "operation"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "TextAnalyzer",
          description: "Analyze text for sentiment, keywords, readability, word count, and other linguistic metrics.",
          parameters: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "Text to analyze"
              },
              analysis_type: {
                type: "string",
                enum: ["sentiment", "keywords", "readability", "statistics", "language_detection"],
                description: "Type of text analysis to perform"
              }
            },
            required: ["text", "analysis_type"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "DataProcessor",
          description: "Process and analyze structured data like CSV, JSON, or tabular data with filtering, sorting, and statistical analysis.",
          parameters: {
            type: "object",
            properties: {
              data: {
                type: "string",
                description: "Data to process (CSV, JSON, or structured text)"
              },
              operation: {
                type: "string",
                enum: ["parse", "filter", "sort", "aggregate", "statistics", "visualize"],
                description: "Data processing operation to perform"
              },
              parameters: {
                type: "object",
                description: "Additional parameters for the operation (filters, sort keys, etc.)"
              }
            },
            required: ["data", "operation"]
          }
        }
      }
    ]

    console.log('Sending request to Kimi API with', contextualMessages.length, 'messages using model:', selectedModel)
    console.log('Tools configured:', tools.length, 'tools available')
    if (context) {
      console.log('Context provided:', context.slice(0, 100) + (context.length > 100 ? '...' : ''))
    }

    // Hybrid approach: Try native tool calling first, fallback to streaming
    // This provides the best of both worlds - native tools when possible, streaming when needed
    let completion

    try {
      completion = await openai.chat.completions.create({
        model: selectedModel,               // Use the selected model from frontend
        stream: false,                      // Start with non-streaming for tool detection
        messages: contextualMessages,       // Pass the conversation history with context to the AI
        tools: tools,                       // Enable tool calling capabilities
        temperature: 0.6,                   // Optimal for K2 models (per Moonshot recommendations)
        tool_choice: "auto",                // Let model decide when to use tools
      })

      console.log('Received response from Kimi API')
      const message = completion.choices[0].message

      // Streamlined tool call detection - prioritize native format
      let toolCallsToExecute = message.tool_calls || []

      // Fallback: Check for tool calls embedded in content (Moonshot sometimes does this)
      if (toolCallsToExecute.length === 0 && message.content) {
        console.log('Checking content for embedded tool calls:', message.content.slice(0, 200) + '...')

        // Simplified pattern matching - look for complete tool call JSON
        const toolCallPattern = /\{"tool_calls":\s*\[([\s\S]*?)\]\}/
        const toolCallMatch = message.content.match(toolCallPattern)

        if (toolCallMatch) {
          try {
            const toolCallsData = JSON.parse(`{"tool_calls":[${toolCallMatch[1]}]}`)
            toolCallsToExecute = toolCallsData.tool_calls || []
            console.log('Extracted tool calls from content:', toolCallsToExecute)

            // Clean up the content by removing the tool call JSON
            message.content = message.content.replace(toolCallPattern, '').trim()
          } catch (parseError) {
            console.log('Failed to parse embedded tool calls:', parseError)
            // Skip tool execution if parsing fails - let client-side detection handle it
          }
        }

        // If content contains partial tool calls, clean it for display
        if (message.content.includes('{"tool_calls":')) {
          const jsonStart = message.content.indexOf('{"tool_calls":')
          const prefixText = message.content.substring(0, jsonStart).trim()
          message.content = prefixText || 'Processing tool request...'
        }
      }

      // Execute tools if found
      if (toolCallsToExecute.length > 0) {
        console.log('Tool calls detected:', toolCallsToExecute)

        // Execute each tool call
        const toolMessages = []

        for (const toolCall of toolCallsToExecute) {
          if (!toolCall.function || !toolCall.function.name) {
            console.log('Invalid tool call structure:', toolCall)
            continue
          }

          const { name, arguments: args } = toolCall.function
          console.log(`Executing tool: ${name} with arguments:`, args)

          let toolResult

          try {
            switch (name) {
              case 'WebSearch': {
                const params = JSON.parse(args)
                const searchResponse = await fetch(`${req.url.split('/api/chat')[0]}/api/tools/websearch`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(params)
                })
                toolResult = await searchResponse.json()
                break
              }

              case 'CodeRunner': {
                const params = JSON.parse(args)
                const codeResponse = await fetch(`${req.url.split('/api/chat')[0]}/api/tools/code-runner`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(params)
                })
                toolResult = await codeResponse.json()
                break
              }

              case 'Calculator': {
                const params = JSON.parse(args)
                const calcResponse = await fetch(`${req.url.split('/api/chat')[0]}/api/tools/calculator`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(params)
                })
                toolResult = await calcResponse.json()
                break
              }

              case 'AIGrounding': {
                const params = JSON.parse(args)
                const groundingResponse = await fetch(`${req.url.split('/api/chat')[0]}/api/tools/ai-grounding`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(params)
                })
                toolResult = await groundingResponse.json()
                break
              }

              default:
                toolResult = { error: `Unknown tool: ${name}` }
            }

            console.log(`Tool ${name} executed successfully:`, toolResult)

          } catch (error) {
            console.error(`Error executing tool ${name}:`, error)
            toolResult = {
              error: `Failed to execute ${name}`,
              details: error instanceof Error ? error.message : 'Unknown error'
            }
          }

          // Add tool result message
          toolMessages.push({
            role: 'tool' as const,
            tool_call_id: toolCall.id || `${name}-${Date.now()}`,
            content: JSON.stringify(toolResult)
          })
        }

        // Add the assistant's tool call message and tool results to conversation
        const updatedMessages = [
          ...contextualMessages,
          message,
          ...toolMessages
        ]

        // Get final response from model with tool results
        const finalCompletion = await openai.chat.completions.create({
          model: selectedModel,
          stream: true,
          messages: updatedMessages,
          tools: tools,
          temperature: 0.7
        })

        console.log('Tool execution completed, streaming final response')
        // Create stream with better error handling for Moonshot AI compatibility
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stream = OpenAIStream(finalCompletion as any, {
            onFinal: (completion) => {
              console.log('Final completion:', completion?.slice(0, 100))
            }
          })
          return new StreamingTextResponse(stream)
        } catch (streamError) {
          console.error('OpenAIStream error, falling back to simple stream:', streamError)

          // Fallback to manual streaming if OpenAIStream fails
          const encoder = new TextEncoder()
          const readable = new ReadableStream({
            start(controller) {
              // Handle both completion response and stream types
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const content = (finalCompletion as any)?.choices?.[0]?.message?.content || 'Response completed'
              controller.enqueue(encoder.encode(content))
              controller.close()
            }
          })
          return new StreamingTextResponse(readable)
        }

      } else {
        // No tools called, convert to streaming response
        console.log('No tools called, providing direct response')

        // Create a simple readable stream from the completion
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
          start(controller) {
            const content = message.content || ''
            controller.enqueue(encoder.encode(content))
            controller.close()
          }
        })

        return new StreamingTextResponse(readable)
      }

    } catch (error) {
      console.error('Error in tool calling flow, falling back to streaming:', error)

      // Fallback to streaming without tool calling
      const streamingResponse = await openai.chat.completions.create({
        model: selectedModel,
        stream: true,
        messages: contextualMessages,
        tools: tools,
        temperature: 0.7
      })

      // Handle fallback streaming with better error handling
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stream = OpenAIStream(streamingResponse as any, {
          onFinal: (completion) => {
            console.log('Fallback stream completed:', completion?.slice(0, 100))
          }
        })
        return new StreamingTextResponse(stream)
      } catch (streamError) {
        console.error('Fallback OpenAIStream error:', streamError)

        // Ultimate fallback - return error message as stream
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('I apologize, but there was an issue with the streaming response. Please try again.'))
            controller.close()
          }
        })
        return new StreamingTextResponse(readable)
      }
    }
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