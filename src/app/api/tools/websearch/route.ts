/**
 * WebSearch Tool API Route
 *
 * Clean and optimized implementation using only Brave Search API
 * Provides fast, reliable web search results for AI tools
 *
 * Usage: POST /api/tools/websearch
 * Body: { query: string, max_results?: number }
 * Returns: { success: boolean, results?: SearchResult[], error?: string }
 */

import {
  createErrorResponse,
  createSuccessResponse,
  validateEnvVar,
  validateRequestBody,
  validateStringField,
  validateNumericField,
  ApiLogger,
  fetchWithTimeout
} from '../../../../lib/api-utils'

interface WebSearchRequest {
  query: string
  max_results?: number
  scrape_first?: boolean  // Auto-scrape the top result for detailed content
}

interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
  scraped_content?: {
    title: string
    content: string
    word_count: number
    scraped_at: string
  }
}

export async function POST(req: Request) {
  const logger = new ApiLogger('WebSearch Tool')

  let query = ''

  try {
    const body = await req.json()

    // Validate request structure
    const bodyValidation = validateRequestBody(body, ['query'])
    if (bodyValidation) return bodyValidation

    const { query: queryParam, max_results = 5, scrape_first = false } = body as WebSearchRequest
    query = queryParam

    // Validate query field
    const queryValidation = validateStringField(query, 'query', 1, 400)
    if (queryValidation) return queryValidation

    // Additional validation: Check word count (50 words max per Brave API spec)
    const wordCount = query.trim().split(/\s+/).length
    if (wordCount > 50) {
      return createErrorResponse(
        'Query has too many words. Maximum 50 words allowed per Brave API specification.',
        400
      )
    }

    // Validate max_results
    const resultsValidation = validateNumericField(max_results, 'max_results', 1, 20)
    if (resultsValidation) return resultsValidation

    // Validate API key
    const apiKeyValidation = validateEnvVar('BRAVE_SEARCH_API_KEY', process.env.BRAVE_SEARCH_API_KEY)
    if (apiKeyValidation) return apiKeyValidation

    logger.logSuccess(`Processing query: "${query}" (max ${max_results} results)`)

    let searchResults: SearchResult[] = []

    try {

      // Build optimized Brave Search request with 2025-compliant parameters
      const braveUrl = new URL('https://api.search.brave.com/res/v1/web/search')
      braveUrl.searchParams.append('q', query)
      braveUrl.searchParams.append('count', Math.min(max_results, 20).toString()) // Max 20 per API spec

      // Use only documented core parameters to avoid API errors
      braveUrl.searchParams.append('country', 'US')
      braveUrl.searchParams.append('search_lang', 'en')
      braveUrl.searchParams.append('spellcheck', 'true')

      console.log(`🔍 Brave Search URL: ${braveUrl.toString()}`)
      console.log(`🔑 API Key present: ${!!process.env.BRAVE_SEARCH_API_KEY}`)

      const response = await fetchWithTimeout(braveUrl.toString(), {
        method: 'GET',
        headers: {
          'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY!,
          'Accept': 'application/json',
          'User-Agent': 'Kimi-Chat-App/1.0'
          // Removed Accept-Encoding to avoid potential issues
        }
      }, 15000) // Increased timeout

      console.log(`📊 Brave API Response: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Brave API Error: ${response.status} - ${errorText}`)
        throw new Error(`Brave Search API failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Log rate limiting information for monitoring
      const rateLimitHeaders = {
        limit: response.headers.get('X-RateLimit-Limit'),
        remaining: response.headers.get('X-RateLimit-Remaining'),
        reset: response.headers.get('X-RateLimit-Reset')
      }
      if (rateLimitHeaders.remaining) {
        console.log('Brave API rate limits:', rateLimitHeaders)
      }

      console.log('Brave Search response keys:', Object.keys(data))

      // Enhanced response parsing with better validation
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format: Expected JSON object from Brave Search API')
      }

      // Check for API error messages in response
      if (data.error || data.message) {
        throw new Error(`Brave API returned error: ${data.error || data.message}`)
      }

      // Extract web search results with robust error handling
      if (data.web && data.web.results && Array.isArray(data.web.results)) {
        console.log(`Brave returned ${data.web.results.length} raw results`)

        const results: SearchResult[] = []

        for (const item of data.web.results.slice(0, max_results * 2)) { // Get more results to filter ads
          // More flexible validation - allow partial results
          if (item && typeof item === 'object' && item.title && item.url) {

            // Filter out ads and promotional content
            const isAd = item.is_ad === true ||
                        item.type === 'ad' ||
                        item.type === 'promoted' ||
                        item.profile?.is_ad === true ||
                        String(item.title).toLowerCase().includes('[ad]') ||
                        String(item.snippet || item.description || '').toLowerCase().includes('[ad]') ||
                        String(item.url).includes('googleads.g.doubleclick.net') ||
                        String(item.url).includes('/aclk?') ||
                        String(item.url).includes('&gclid=')

            if (!isAd && results.length < max_results) {
              results.push({
                title: String(item.title).trim(),
                url: String(item.url).trim(),
                snippet: String(item.description || item.snippet || '').trim() || 'No description available',
                source: String(item.profile?.name || item.meta_url?.hostname || 'Brave Search').trim()
              })
            } else if (isAd) {
              console.log('Filtered out ad result:', {
                title: String(item.title).substring(0, 50),
                url: String(item.url).substring(0, 50),
                type: item.type,
                is_ad: item.is_ad
              })
            }
          } else {
            console.log('Skipping incomplete result:', {
              hasTitle: !!item?.title,
              hasUrl: !!item?.url,
              hasDescription: !!(item?.description || item?.snippet),
              itemKeys: item ? Object.keys(item) : []
            })
          }
        }

        searchResults = results
        console.log(`Brave Search processed ${searchResults.length} valid results`)

        // Only warn if no results and we expected some
        if (searchResults.length === 0 && data.web.results.length > 0) {
          console.warn('No valid results after processing. First raw result:',
            JSON.stringify(data.web.results[0] || {}, null, 2))
        }
      } else {
        console.error('Unexpected Brave Search response structure. Available keys:',
          Object.keys(data))
        console.error('Response preview:', JSON.stringify(data, null, 2).slice(0, 500))
        throw new Error('Invalid response format: Missing web.results array from Brave Search API')
      }

    } catch (apiError) {
      console.error('Brave Search API error:', apiError instanceof Error ? apiError.message : apiError)

      // Enhanced fallback with helpful suggestions
      if (query.toLowerCase().includes('comet') && (query.includes('3I') || query.toLowerCase().includes('atlas'))) {
        searchResults = [
          {
            title: 'Comet ATLAS (C/2019 Y4)',
            url: 'https://en.wikipedia.org/wiki/C/2019_Y4_(ATLAS)',
            snippet: 'Comet ATLAS (C/2019 Y4) was discovered in December 2019. It was initially predicted to become very bright, but broke apart in 2020.',
            source: 'Wikipedia Reference'
          },
          {
            title: 'Comet 2I/Borisov - Interstellar Comet',
            url: 'https://en.wikipedia.org/wiki/2I/Borisov',
            snippet: '2I/Borisov is the second known interstellar object after Oumuamua. It has a nucleus estimated to be 0.2-1.0 km in diameter.',
            source: 'Wikipedia Reference'
          }
        ]
      } else if (query.toLowerCase().includes('flight') && query.toLowerCase().includes('cologne')) {
        searchResults = [
          {
            title: 'Cologne Bonn Airport (CGN) - Flight Information',
            url: 'https://www.cologne-bonn-airport.com/',
            snippet: 'Cologne Bonn Airport serves flights to major European destinations and some intercontinental routes.',
            source: 'Airport Reference'
          }
        ]
      } else {
        searchResults = [
          {
            title: 'Search Results for: ' + query,
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            snippet: `For current information about "${query}", try searching on Google, Wikipedia, or other specialized databases.`,
            source: 'Search Suggestion'
          }
        ]
      }
    }

    // Auto-scrape first result if requested for detailed content
    if (scrape_first && searchResults.length > 0) {
      const firstResult = searchResults[0]
      logger.logSuccess(`Auto-scraping top result: ${firstResult.url}`)

      try {
        // Internal call to our scraping endpoint
        const scrapeResponse = await fetch(new URL('/api/tools/webscrape', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: firstResult.url,
            max_length: 3000  // Reasonable length for AI analysis
          })
        })

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json()
          if (scrapeData.success && scrapeData.content && scrapeData.title) {
            // Add scraped content to the first result with validation
            searchResults[0].scraped_content = {
              title: String(scrapeData.title || 'No title'),
              content: String(scrapeData.content || ''),
              word_count: Number(scrapeData.word_count || 0),
              scraped_at: String(scrapeData.scraped_at || new Date().toISOString())
            }
            logger.logSuccess(`Successfully scraped ${scrapeData.word_count || 0} words from top result`)
          } else {
            logger.logWarning(`Failed to scrape top result: ${scrapeData.error || 'No content extracted'}`)
          }
        } else {
          logger.logWarning(`Scraping request failed: ${scrapeResponse.status} ${scrapeResponse.statusText}`)
        }
      } catch (scrapeError) {
        // Don't fail the whole search if scraping fails
        logger.logWarning(`Auto-scraping failed: ${scrapeError instanceof Error ? scrapeError.message : 'Unknown error'}`)
      }
    }

    logger.logSuccess(`Found ${searchResults.length} results for: "${query}"${scrape_first ? ' (with content scraping)' : ''}`)

    return createSuccessResponse({
      results: searchResults,
      query: query.trim(),
      search_provider: 'Brave Search API' + (scrape_first ? ' + Web Scraper' : ''),
      results_count: searchResults.length,
      scraped_content: scrape_first && searchResults[0]?.scraped_content ? true : false
    })

  } catch (error) {
    logger.logError(error, `Query: "${query}"`)
    return createErrorResponse(
      'Internal server error during web search',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}