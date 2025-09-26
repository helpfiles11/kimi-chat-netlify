/**
 * WebScrape Tool API Route
 *
 * Extracts actual page content from URLs for detailed analysis
 * Complements WebSearch by providing full page content when needed
 *
 * Usage: POST /api/tools/webscrape
 * Body: { url: string, max_length?: number }
 * Returns: { success: boolean, content?: string, title?: string, error?: string }
 */

import {
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
  validateStringField,
  validateNumericField,
  ApiLogger,
  fetchWithTimeout
} from '../../../../lib/api-utils'

interface WebScrapeRequest {
  url: string
  max_length?: number
}

interface ScrapeResult {
  title: string
  content: string
  url: string
  word_count: number
  scraped_at: string
}

export async function POST(req: Request) {
  const logger = new ApiLogger('WebScrape Tool')

  let targetUrl = ''

  try {
    const body = await req.json()

    // Validate request structure
    const bodyValidation = validateRequestBody(body, ['url'])
    if (bodyValidation) return bodyValidation

    const { url, max_length = 5000 } = body as WebScrapeRequest
    targetUrl = url

    // Validate URL field
    const urlValidation = validateStringField(url, 'url', 1, 2000)
    if (urlValidation) return urlValidation

    // Basic URL format validation
    try {
      const parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return createErrorResponse('Invalid URL: Only HTTP and HTTPS protocols are supported', 400)
      }
    } catch {
      return createErrorResponse('Invalid URL format', 400)
    }

    // Validate max_length
    const lengthValidation = validateNumericField(max_length, 'max_length', 100, 20000)
    if (lengthValidation) return lengthValidation

    logger.logSuccess(`Scraping content from: ${url}`)

    try {
      // Fetch the webpage with proper headers to avoid blocking
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KimiChat-Bot/1.0; +https://kimichatapp.netlify.app/)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      }, 15000) // 15 second timeout for page loading

      if (!response.ok) {
        return createErrorResponse(
          `Failed to fetch webpage: ${response.status} ${response.statusText}`,
          response.status >= 400 && response.status < 500 ? 400 : 500
        )
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) {
        return createErrorResponse(
          `Unsupported content type: ${contentType}. Only HTML pages can be scraped.`,
          400
        )
      }

      const html = await response.text()

      // Extract title
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
      const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : 'No title found'

      // Clean and extract text content
      let content = html
        // Remove script and style tags with their content
        .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
        .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
        .replace(/<noscript[^>]*>.*?<\/noscript>/gis, ' ')
        // Remove HTML comments
        .replace(/<!--.*?-->/gs, ' ')
        // Remove other non-content tags
        .replace(/<(head|header|nav|footer|aside|svg)[^>]*>.*?<\/\1>/gis, ' ')
        // Remove all remaining HTML tags
        .replace(/<[^>]+>/g, ' ')
        // Decode HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .trim()

      // Truncate if too long
      if (content.length > max_length) {
        content = content.substring(0, max_length) + '...'
      }

      // Basic validation
      if (content.length < 50) {
        return createErrorResponse(
          'Page content too short or failed to extract meaningful text',
          400
        )
      }

      const wordCount = content.split(/\s+/).length

      const result: ScrapeResult = {
        title: title.substring(0, 200), // Limit title length
        content,
        url: targetUrl,
        word_count: wordCount,
        scraped_at: new Date().toISOString()
      }

      logger.logSuccess(`Successfully scraped ${wordCount} words from: ${url}`)

      return createSuccessResponse({
        ...result,
        scrape_provider: 'Built-in Web Scraper',
        content_length: content.length
      })

    } catch (fetchError) {
      console.error('Web scraping error:', fetchError)

      // Provide helpful error messages for common issues
      if (fetchError instanceof Error) {
        if (fetchError.message.includes('timeout')) {
          return createErrorResponse('Website took too long to respond (timeout after 15s)', 408)
        }
        if (fetchError.message.includes('network') || fetchError.message.includes('ENOTFOUND')) {
          return createErrorResponse('Unable to reach the website. Check if the URL is correct and the site is online.', 404)
        }
        if (fetchError.message.includes('certificate') || fetchError.message.includes('SSL')) {
          return createErrorResponse('SSL/Certificate error. The website may have security issues.', 400)
        }
      }

      return createErrorResponse(
        'Failed to scrape webpage content',
        500,
        fetchError instanceof Error ? fetchError.message : 'Unknown scraping error'
      )
    }

  } catch (error) {
    logger.logError(error, `URL: "${targetUrl}"`)
    return createErrorResponse(
      'Internal server error during web scraping',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}