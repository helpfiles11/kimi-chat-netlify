/**
 * Balance API Route
 *
 * This endpoint checks the user's account balance from Moonshot API.
 * Helps users monitor their API usage and remaining credits.
 *
 * Usage: GET /api/balance
 * Returns: { available_balance, voucher_balance, cash_balance }
 */

interface BalanceResponse {
  available_balance: number
  voucher_balance: number
  cash_balance: number
  status_text: string
  last_updated: string
}

export async function GET() {
  try {
    // Check if API key is configured
    if (!process.env.MOONSHOT_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'MOONSHOT_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching account balance from Moonshot API...')

    // Call Moonshot balance API
    const response = await fetch('https://api.moonshot.ai/v1/users/me/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Balance check failed:', response.status, response.statusText)
      const errorText = await response.text()
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch balance',
          status: response.status,
          details: errorText
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('Balance check result:', result)

    // Extract balance data from response
    const balanceData = result.data || {}
    const {
      available_balance = 0,
      voucher_balance = 0,
      cash_balance = 0
    } = balanceData

    // Determine status text based on balance
    let statusText = 'Good'
    if (available_balance <= 0) {
      statusText = 'No credits available'
    } else if (available_balance < 1) {
      statusText = 'Low balance'
    } else if (available_balance < 5) {
      statusText = 'Running low'
    }

    const responseData: BalanceResponse = {
      available_balance,
      voucher_balance,
      cash_balance,
      status_text: statusText,
      last_updated: new Date().toISOString()
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
          'Cache-Control': 'public, max-age=60' // Cache for 1 minute - balance doesn't change frequently
        }
      }
    )

  } catch (error) {
    console.error('Error in balance API:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error while fetching balance',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}