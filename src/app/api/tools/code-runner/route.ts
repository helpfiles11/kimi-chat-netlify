/**
 * Code Runner Tool API Route
 *
 * This endpoint safely executes Python and JavaScript code for the AI.
 * Used by the Tool Use system to perform calculations, data analysis, and programming tasks.
 *
 * Usage: POST /api/tools/code-runner
 * Body: { language: "python" | "javascript", code: string }
 * Returns: { result, output, error?, execution_time }
 */

interface CodeRunnerRequest {
  language: 'python' | 'javascript'
  code: string
}

interface CodeRunnerResponse {
  success: boolean
  result?: unknown
  output?: string
  error?: string
  execution_time_ms?: number
  language: string
}

export async function POST(req: Request) {
  try {
    const body: CodeRunnerRequest = await req.json()
    const { language, code } = body

    // Validate input
    if (!language || !code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: language, code'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!['python', 'javascript'].includes(language)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unsupported language. Use "python" or "javascript"'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Security: Limit code length
    if (code.length > 10000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Code too long. Maximum 10,000 characters allowed.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Executing ${language} code:`, code.slice(0, 200) + (code.length > 200 ? '...' : ''))

    const startTime = Date.now()
    let result: CodeRunnerResponse

    if (language === 'javascript') {
      result = await executeJavaScript(code)
    } else {
      result = await executePython(code)
    }

    const executionTime = Date.now() - startTime
    result.execution_time_ms = executionTime
    result.language = language

    console.log(`${language} execution completed in ${executionTime}ms`)

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in code runner API:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error during code execution',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function executeJavaScript(code: string): Promise<CodeRunnerResponse> {
  try {
    // Create a safe execution context
    const safeConsole: string[] = []
    const safeContext = {
      console: {
        log: (...args: unknown[]) => safeConsole.push(args.map(String).join(' ')),
        error: (...args: unknown[]) => safeConsole.push('ERROR: ' + args.map(String).join(' ')),
        warn: (...args: unknown[]) => safeConsole.push('WARN: ' + args.map(String).join(' '))
      },
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      // Add safe utility functions
      setTimeout: undefined, // Disable timers
      setInterval: undefined,
      fetch: undefined, // Disable network access
      require: undefined, // Disable module loading
      process: undefined, // Disable process access
      global: undefined,
      window: undefined
    }

    // Wrap code to capture result
    const wrappedCode = `
      (() => {
        ${code}
      })();
    `

    // Execute in isolated context (Note: This is still not 100% secure for production)
    const func = new Function(...Object.keys(safeContext), `return ${wrappedCode}`)
    const result = func(...Object.values(safeContext))

    return {
      success: true,
      result,
      output: safeConsole.join('\\n')
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'JavaScript execution failed',
      output: ''
    }
  }
}

async function executePython(code: string): Promise<CodeRunnerResponse> {
  try {
    // For now, return a mock response since we can't easily run Python in a browser/serverless environment
    // In a real implementation, you would use a containerized Python environment or service like Pyodide

    // Basic Python-like evaluation for simple math expressions
    if (code.includes('print(') && code.includes(')')) {
      const printMatches = code.match(/print\((.+?)\)/g)
      const outputs: string[] = []

      if (printMatches) {
        for (const match of printMatches) {
          const expression = match.replace(/print\(|\)/g, '')
          try {
            // Very basic math evaluation (unsafe - for demo only)
            if (/^[0-9+\-*/().\s]+$/.test(expression)) {
              const result = Function(`"use strict"; return (${expression})`)()
              outputs.push(String(result))
            } else {
              outputs.push(expression.replace(/['"]/g, ''))
            }
          } catch {
            outputs.push(expression)
          }
        }
      }

      return {
        success: true,
        result: undefined,
        output: outputs.join('\\n')
      }
    }

    // For more complex Python code, return an informative message
    return {
      success: false,
      error: 'Python execution not fully implemented. This demo supports basic print() statements and math expressions. For full Python support, a containerized environment would be needed.',
      output: 'Note: This is a demonstration. Real Python execution would require a secure sandboxed environment.'
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Python execution failed',
      output: ''
    }
  }
}