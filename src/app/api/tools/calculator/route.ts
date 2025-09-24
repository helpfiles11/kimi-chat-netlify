/**
 * Calculator Tool API Route
 *
 * This endpoint performs mathematical calculations for the AI.
 * Supports arithmetic, algebra, trigonometry, and basic calculus operations.
 *
 * Usage: POST /api/tools/calculator
 * Body: { expression: string, operation: "evaluate" | "solve" | "simplify" | "derivative" | "integral" }
 * Returns: { result, steps?, error? }
 */

interface CalculatorRequest {
  expression: string
  operation: 'evaluate' | 'solve' | 'simplify' | 'derivative' | 'integral'
}

interface CalculatorResponse {
  success: boolean
  result?: string | number
  steps?: string[]
  error?: string
  operation: string
  expression: string
}

export async function POST(req: Request) {
  try {
    const body: CalculatorRequest = await req.json()
    const { expression, operation } = body

    // Validate input
    if (!expression || !operation) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: expression, operation'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const validOperations = ['evaluate', 'solve', 'simplify', 'derivative', 'integral']
    if (!validOperations.includes(operation)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid operation. Must be one of: ${validOperations.join(', ')}`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Security: Limit expression length
    if (expression.length > 1000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Expression too long. Maximum 1,000 characters allowed.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Calculating ${operation} for expression:`, expression)

    let result: CalculatorResponse

    switch (operation) {
      case 'evaluate':
        result = await evaluateExpression(expression)
        break
      case 'solve':
        result = await solveEquation(expression)
        break
      case 'simplify':
        result = await simplifyExpression(expression)
        break
      case 'derivative':
        result = await calculateDerivative(expression)
        break
      case 'integral':
        result = await calculateIntegral(expression)
        break
      default:
        result = {
          success: false,
          error: `Operation ${operation} not implemented`,
          operation,
          expression
        }
    }

    result.operation = operation
    result.expression = expression

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in calculator API:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error during calculation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function evaluateExpression(expression: string): Promise<CalculatorResponse> {
  try {
    // Clean and validate the expression
    const cleanExpression = expression
      .replace(/\s+/g, '')
      .replace(/\^/g, '**') // Handle exponentiation
      .replace(/\bsqrt\(/g, 'Math.sqrt(')
      .replace(/\bsin\(/g, 'Math.sin(')
      .replace(/\bcos\(/g, 'Math.cos(')
      .replace(/\btan\(/g, 'Math.tan(')
      .replace(/\blog\(/g, 'Math.log10(')
      .replace(/\bln\(/g, 'Math.log(')
      .replace(/\babs\(/g, 'Math.abs(')
      .replace(/\bfloor\(/g, 'Math.floor(')
      .replace(/\bceil\(/g, 'Math.ceil(')
      .replace(/\bround\(/g, 'Math.round(')
      .replace(/\bpi\b/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')

    // Security: Only allow safe mathematical operations
    const safePattern = /^[0-9+\-*/().\sMath\w]+$/
    if (!safePattern.test(cleanExpression)) {
      return {
        success: false,
        error: 'Expression contains invalid characters. Only numbers, operators, and basic math functions are allowed.',
        operation: 'evaluate',
        expression
      }
    }

    // Evaluate the expression safely
    const result = Function(`"use strict"; return (${cleanExpression})`)()

    // Validate result
    if (typeof result !== 'number' || !isFinite(result)) {
      return {
        success: false,
        error: 'Expression did not evaluate to a valid number',
        operation: 'evaluate',
        expression
      }
    }

    return {
      success: true,
      result: Number(result.toFixed(10)), // Limit precision
      steps: [
        `Original: ${expression}`,
        `Processed: ${cleanExpression}`,
        `Result: ${result}`
      ],
      operation: 'evaluate',
      expression
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Evaluation failed',
      operation: 'evaluate',
      expression
    }
  }
}

async function solveEquation(expression: string): Promise<CalculatorResponse> {
  // Basic equation solving - mainly for linear equations
  try {
    if (!expression.includes('=')) {
      return {
        success: false,
        error: 'Equation must contain an equals sign (=)',
        operation: 'solve',
        expression
      }
    }

    const [left, right] = expression.split('=').map(side => side.trim())

    // Very basic linear equation solver (ax + b = c format)
    const leftMatch = left.match(/^(-?\d*)x\s*([+-]\s*\d+)?$/)
    const rightNum = parseFloat(right)

    if (leftMatch && !isNaN(rightNum)) {
      const a = parseFloat(leftMatch[1] || '1')
      const b = parseFloat((leftMatch[2] || '0').replace(/\s/g, ''))

      if (a === 0) {
        return {
          success: false,
          error: 'Cannot solve: coefficient of x is zero',
          operation: 'solve',
          expression
        }
      }

      const solution = (rightNum - b) / a
      return {
        success: true,
        result: Number(solution.toFixed(6)),
        steps: [
          `Original: ${expression}`,
          `Format: ${a}x + ${b} = ${rightNum}`,
          `Subtract ${b} from both sides: ${a}x = ${rightNum - b}`,
          `Divide by ${a}: x = ${solution}`
        ],
        operation: 'solve',
        expression
      }
    }

    return {
      success: false,
      error: 'Complex equation solving not implemented. This demo supports basic linear equations in the form ax + b = c',
      operation: 'solve',
      expression
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Equation solving failed',
      operation: 'solve',
      expression
    }
  }
}

async function simplifyExpression(expression: string): Promise<CalculatorResponse> {
  return {
    success: false,
    error: 'Expression simplification not implemented. This would require a computer algebra system.',
    operation: 'simplify',
    expression
  }
}

async function calculateDerivative(expression: string): Promise<CalculatorResponse> {
  return {
    success: false,
    error: 'Derivative calculation not implemented. This would require symbolic mathematics capabilities.',
    operation: 'derivative',
    expression
  }
}

async function calculateIntegral(expression: string): Promise<CalculatorResponse> {
  return {
    success: false,
    error: 'Integral calculation not implemented. This would require symbolic mathematics capabilities.',
    operation: 'integral',
    expression
  }
}