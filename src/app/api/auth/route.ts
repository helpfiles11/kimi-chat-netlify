/**
 * Authentication API Route
 *
 * Provides simple password-based authentication for the chat application.
 * This prevents unauthorized users from accessing your Kimi AI tokens on Netlify.
 *
 * Security Features:
 * - Password stored in environment variables (server-side only)
 * - Session-based authentication (no persistent tokens)
 * - Rate limiting friendly (simple password check)
 * - No sensitive data in responses
 *
 * Environment Variables Required:
 * - AUTH_PASSWORD: The password users must enter to access the chat
 */

export async function POST(req: Request) {
  try {
    // Extract password from request body
    const { password } = await req.json()

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get the authentication password from environment variables
    const authPassword = process.env.AUTH_PASSWORD

    if (!authPassword) {
      console.error('AUTH_PASSWORD environment variable is not configured')
      return new Response(
        JSON.stringify({ error: 'Authentication is not properly configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate the provided password
    if (password === authPassword) {
      // Authentication successful
      console.log('Authentication successful')
      return new Response(
        JSON.stringify({ success: true, message: 'Authentication successful' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      // Authentication failed
      console.log('Authentication failed: Invalid password')
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in authentication API:', error)
    return new Response(
      JSON.stringify({
        error: 'Authentication error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}