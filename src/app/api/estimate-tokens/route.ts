/**
 * Token Estimation API Route
 *
 * This endpoint estimates token count for messages before sending to chat API.
 * Helps users understand costs and optimize their requests.
 *
 * Usage: POST /api/estimate-tokens
 * Body: { model, messages }
 * Returns: { total_tokens, estimated_cost }
 */

interface TokenEstimateRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
}

interface TokenEstimateResponse {
  total_tokens: number
  estimated_cost?: number
  model: string
}

export async function POST(req: Request) {
  try {
    // Check if API key is configured
    if (!process.env.MOONSHOT_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'MOONSHOT_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request
    const body: TokenEstimateRequest = await req.json()
    const { model, messages } = body

    // Validate request structure
    if (!model || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format. Required: model, messages' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate messages structure
    for (const message of messages) {
      if (!message.role || !message.content || typeof message.content !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid message format. Each message needs role and content' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log('Estimating tokens for model:', model, 'with', messages.length, 'messages')

    // Call Moonshot token estimation API
    const response = await fetch('https://api.moonshot.ai/v1/tokenizers/estimate-token-count', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    })

    if (!response.ok) {
      console.error('Token estimation failed:', response.status, response.statusText)
      const errorText = await response.text()
      return new Response(
        JSON.stringify({
          error: 'Failed to estimate tokens',
          status: response.status,
          details: errorText
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('Token estimation result:', result)

    // Extract token count from response
    const totalTokens = result.data?.total_tokens || 0

    // Rough cost estimation (these are approximate rates - actual pricing may vary)
    // Based on typical pricing: ~$0.002 per 1K tokens for input, ~$0.006 per 1K tokens for output
    // Using conservative estimate of $0.004 per 1K tokens average
    const estimatedCostUSD = (totalTokens / 1000) * 0.004

    const responseData: TokenEstimateResponse = {
      total_tokens: totalTokens,
      estimated_cost: estimatedCostUSD,
      model
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache' // Token counts can vary
        }
      }
    )

  } catch (error) {
    console.error('Error in token estimation API:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error while estimating tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}