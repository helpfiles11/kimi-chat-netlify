/**
 * Models API Route - Debug endpoint to fetch available models
 *
 * This endpoint fetches the list of available models from Moonshot API
 * for debugging and optimization purposes.
 *
 * Usage: GET /api/models
 * Returns: List of available Moonshot AI models with metadata
 */

export async function GET() {
  // Security: Only allow in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MODELS_ENDPOINT !== 'true') {
    return new Response(
      JSON.stringify({ error: 'Models endpoint disabled in production' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }
  try {
    // Check if API key is properly configured
    if (!process.env.MOONSHOT_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'MOONSHOT_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching available models from Moonshot API...')

    // Fetch models from Moonshot API
    const response = await fetch('https://api.moonshot.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Failed to fetch models:', response.status, response.statusText)
      const errorText = await response.text()
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch models from Moonshot API',
          status: response.status,
          details: errorText
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const models = await response.json()
    console.log('Successfully fetched models:', models)

    // Return the models list
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        data: models
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800' // Cache for 30 minutes - models don't change often
        }
      }
    )

  } catch (error) {
    console.error('Error in models API:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error while fetching models',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}