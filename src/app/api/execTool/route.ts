/**
 * Tool Execution API Route
 * Fast execution of individual tools triggered by client-side intent detection
 * No Partial Mode completion - just direct tool execution
 */

interface ToolRequest {
  name: string
  arguments: Record<string, unknown>
  id: string
  msgId?: string
}

export async function POST(req: Request) {
  try {
    const { name, arguments: args, id, msgId }: ToolRequest = await req.json()

    // Basic security validation
    if (!name || !args || !id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: name, arguments, id'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate tool name against allowed tools
    const allowedTools = ['WebSearch', 'Calculator', 'CodeRunner']
    if (!allowedTools.includes(name)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Tool ${name} not allowed. Allowed tools: ${allowedTools.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`Executing tool: ${name} with args:`, args)

    let result: unknown = null
    let success = true
    let error: string | undefined

    const startTime = Date.now()

    // Route to appropriate tool
    switch (name) {
      case 'WebSearch': {
        try {
          const searchResponse = await fetch(new URL('/api/tools/websearch', req.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          })

          if (searchResponse.ok) {
            result = await searchResponse.json()
          } else {
            throw new Error(`WebSearch failed: ${searchResponse.status}`)
          }
        } catch (err) {
          success = false
          error = `WebSearch error: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
        break
      }

      case 'Calculator': {
        try {
          const calcResponse = await fetch(new URL('/api/tools/calculator', req.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          })

          if (calcResponse.ok) {
            result = await calcResponse.json()
          } else {
            throw new Error(`Calculator failed: ${calcResponse.status}`)
          }
        } catch (err) {
          success = false
          error = `Calculator error: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
        break
      }

      case 'CodeRunner': {
        try {
          const codeResponse = await fetch(new URL('/api/tools/code-runner', req.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          })

          if (codeResponse.ok) {
            result = await codeResponse.json()
          } else {
            throw new Error(`CodeRunner failed: ${codeResponse.status}`)
          }
        } catch (err) {
          success = false
          error = `CodeRunner error: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
        break
      }

      case 'WebScrape': {
        try {
          const scrapeResponse = await fetch(new URL('/api/tools/webscrape', req.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          })

          if (scrapeResponse.ok) {
            const data = await scrapeResponse.json()
            result = data
          } else {
            const errorText = await scrapeResponse.text()
            success = false
            error = `WebScrape API error: ${scrapeResponse.status} ${errorText}`
          }
        } catch (err) {
          success = false
          error = `WebScrape execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
        break
      }

      default:
        success = false
        error = `Unknown tool: ${name}`
    }

    const executionTime = Date.now() - startTime
    console.log(`Tool ${name} executed in ${executionTime}ms, success: ${success}`)

    return new Response(JSON.stringify({
      success,
      result,
      error,
      toolCall: {
        id,
        name,
        arguments: args
      },
      executionTime,
      msgId
    }), {
      status: success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in execTool API:', error)
    return new Response(JSON.stringify({
      success: false,
      error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}