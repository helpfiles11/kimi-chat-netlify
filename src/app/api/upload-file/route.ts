/**
 * File Upload API Route for Moonshot
 *
 * This endpoint uploads files directly to Moonshot API for persistent storage
 * and allows AI to reference files by ID across sessions.
 *
 * Usage: POST /api/upload-file
 * Body: FormData with file
 * Returns: { file_id, filename, purpose, status }
 */

export async function POST(req: Request) {
  try {
    // Check if API key is configured
    if (!process.env.MOONSHOT_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'MOONSHOT_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get the uploaded file from form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate file size (Moonshot typically has limits)
    const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB - adjust based on API limits
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: 'File too large',
          max_size: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
          file_size: `${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate file type - common document and code types
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'text/javascript',
      'application/javascript',
      'text/html',
      'text/css',
      'application/pdf',
      'text/csv',
      'application/xml',
      'text/xml'
    ]

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|md|js|ts|jsx|tsx|py|java|cpp|c|h|css|html|json|xml|yml|yaml|csv)$/i)) {
      return new Response(
        JSON.stringify({
          error: 'Unsupported file type',
          allowed_types: allowedTypes,
          file_type: file.type
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Uploading file to Moonshot API:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Create FormData for Moonshot API
    const moonshotFormData = new FormData()
    moonshotFormData.append('file', file)
    moonshotFormData.append('purpose', 'file-extract') // Common purpose for document processing

    // Upload to Moonshot API
    const response = await fetch('https://api.moonshot.ai/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: moonshotFormData
    })

    if (!response.ok) {
      console.error('Moonshot file upload failed:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)

      return new Response(
        JSON.stringify({
          error: 'Failed to upload file to Moonshot API',
          status: response.status,
          details: errorText
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('Moonshot file upload successful:', result)

    // Return standardized response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          file_id: result.id,
          filename: result.filename || file.name,
          purpose: result.purpose || 'file-extract',
          status: result.status || 'uploaded',
          bytes: result.bytes || file.size,
          created_at: result.created_at || new Date().toISOString(),
          object: result.object
        },
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in file upload API:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error during file upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}