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

    // Security: Validate model is in allowed list - OFFICIAL from Moonshot API /v1/models
    // Ordered by performance: Best K2 models first, then latest, then other models
    const allowedModels = [
      'kimi-k2-turbo-preview',
      'kimi-k2-0905-preview',
      'kimi-latest',
      'kimi-thinking-preview',
      'moonshot-v1-auto',
      'moonshot-v1-32k-vision-preview',
      'moonshot-v1-128k',
      'moonshot-v1-32k',
      'moonshot-v1-8k',
      // Additional models from API response but not in UI (for completeness)
      'kimi-k2-0711-preview',
      'moonshot-v1-8k-vision-preview',
      'moonshot-v1-128k-vision-preview'
    ]
    const selectedModel = allowedModels.includes(model) ? model : 'kimi-k2-turbo-preview'

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

    // Try non-streaming first to see if tools are called
    // Important: Avoid mixing Partial Mode with streaming when tools are involved
    let completion

    try {
      completion = await openai.chat.completions.create({
        model: selectedModel,               // Use the selected model from frontend
        stream: false,                      // Start with non-streaming to handle tool calls properly
        messages: contextualMessages,       // Pass the conversation history with context to the AI
        tools: tools,                       // Enable tool calling capabilities
        temperature: 0.7,                   // Balanced creativity for tool usage
        // Explicitly avoid response_format=json_object when using tools to prevent Partial Mode conflicts
      })

      console.log('Received response from Kimi API')
      const message = completion.choices[0].message

      // Check if the model wants to call tools (standard OpenAI format)
      let toolCallsToExecute = message.tool_calls || []

      // Also check if tool calls are embedded in the content as text (Moonshot Partial Mode behavior)
      // The models might be using Partial Mode to generate tool call JSON
      if (toolCallsToExecute.length === 0 && message.content) {
        console.log('Checking content for tool calls (potential Partial Mode):', message.content.slice(0, 200) + '...')

        // Try different patterns to extract tool calls
        let extractedToolCalls = []

        // Pattern 1: Complete JSON object
        let toolCallMatch = message.content.match(/\{"tool_calls":\s*\[([\s\S]*?)\]\}/)
        if (toolCallMatch) {
          try {
            const toolCallsData = JSON.parse(`{"tool_calls":[${toolCallMatch[1]}]}`)
            extractedToolCalls = toolCallsData.tool_calls || []
          } catch (parseError) {
            console.log('Pattern 1 failed:', parseError)
          }
        }

        // Pattern 2: Just the array part
        if (extractedToolCalls.length === 0) {
          toolCallMatch = message.content.match(/\[\s*\{\s*"id":\s*"[^"]*",\s*"type":\s*"function"[\s\S]*?\]\s*\}/)
          if (toolCallMatch) {
            try {
              const toolCallsArray = JSON.parse(toolCallMatch[0].replace(/\}\s*$/, ''))
              extractedToolCalls = Array.isArray(toolCallsArray) ? toolCallsArray : [toolCallsArray]
            } catch (parseError) {
              console.log('Pattern 2 failed:', parseError)
            }
          }
        }

        // Pattern 3: Individual tool call objects
        if (extractedToolCalls.length === 0) {
          const individualMatches = message.content.match(/\{\s*"id":\s*"[^"]*",\s*"type":\s*"function",\s*"function":\s*\{[\s\S]*?\}\s*\}/g)
          if (individualMatches) {
            for (const match of individualMatches) {
              try {
                const toolCall = JSON.parse(match)
                extractedToolCalls.push(toolCall)
              } catch (parseError) {
                console.log('Individual tool call parse failed:', parseError)
              }
            }
          }
        }

        // Special handling for incomplete tool calls (Partial Mode scenario)
        if (extractedToolCalls.length === 0 && message.content) {
          // Check for incomplete tool call patterns that might need completion
          // Pattern matches: "text:{"tool_calls":[" or just "{"tool_calls":["
          const partialToolCallPattern = /\{"tool_calls":\s*\[.*$/
          if (partialToolCallPattern.test(message.content)) {
            console.log('Detected partial tool call pattern - attempting Partial Mode completion')

            // Find where the tool call JSON starts
            const jsonStartIndex = message.content.indexOf('{"tool_calls":')
            const prefixText = message.content.substring(0, jsonStartIndex)
            const partialJson = message.content.substring(jsonStartIndex)

            console.log('Prefix text:', prefixText)
            console.log('Partial JSON:', partialJson.slice(0, 100) + '...')

            // Try a completion request to get the full tool call using Partial Mode
            try {
              const completionRequest = await openai.chat.completions.create({
                model: selectedModel,
                stream: false,
                messages: [
                  ...contextualMessages,
                  {
                    role: 'assistant',
                    content: partialJson,
                    partial: true
                  }
                ],
                tools: tools,
                temperature: 0.7
              })

              const completedMessage = completionRequest.choices[0].message
              if (completedMessage.tool_calls && completedMessage.tool_calls.length > 0) {
                console.log('Successfully completed partial tool call via Partial Mode')
                toolCallsToExecute = completedMessage.tool_calls
                // Keep the prefix text for user display (API doesn't include leading text)
                message.content = prefixText.trim()
              } else if (completedMessage.content) {
                console.log('Partial completion returned content, attempting to parse')
                console.log('Completion content:', completedMessage.content.slice(0, 200) + '...')

                // Important: API response doesn't include leading text, need to manually concatenate
                try {
                  const fullJson = partialJson + completedMessage.content
                  console.log('Full JSON to parse:', fullJson.slice(0, 200) + '...')

                  const completedData = JSON.parse(fullJson)
                  if (completedData.tool_calls && completedData.tool_calls.length > 0) {
                    console.log('Successfully parsed completed tool calls')
                    toolCallsToExecute = completedData.tool_calls
                    // Keep only the prefix text for user display
                    message.content = prefixText.trim()
                  }
                } catch (parseError) {
                  console.log('Failed to parse completed JSON:', parseError)
                  // If JSON parsing fails, try to extract tool calls from the completion content directly
                  try {
                    // The completion might return just the array part: [{"id":"..."}]
                    const toolCallsMatch = completedMessage.content.match(/\[[\s\S]*\]/)
                    if (toolCallsMatch) {
                      const toolCallsArray = JSON.parse(toolCallsMatch[0])
                      if (Array.isArray(toolCallsArray) && toolCallsArray.length > 0) {
                        console.log('Extracted tool calls from completion array')
                        toolCallsToExecute = toolCallsArray
                        message.content = prefixText.trim()
                      }
                    }
                  } catch (arrayParseError) {
                    console.log('Failed to parse as array:', arrayParseError)
                  }
                }
              }
            } catch (partialError) {
              console.log('Partial Mode completion failed:', partialError)
            }
          }
        }

        if (extractedToolCalls.length > 0) {
          console.log('Found tool calls in content field:', extractedToolCalls)
          toolCallsToExecute = extractedToolCalls
          // Clean up the content by removing tool call patterns
          message.content = message.content
            .replace(/\{"tool_calls":\s*\[([\s\S]*?)\]\}/, '')
            .replace(/\[\s*\{\s*"id":\s*"[^"]*",\s*"type":\s*"function"[\s\S]*?\]\s*\}/, '')
            .replace(/\{\s*"id":\s*"[^"]*",\s*"type":\s*"function",\s*"function":\s*\{[\s\S]*?\}\s*\}/g, '')
            .trim()
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stream = OpenAIStream(finalCompletion as any)
        return new StreamingTextResponse(stream)

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = OpenAIStream(streamingResponse as any)
      return new StreamingTextResponse(stream)
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