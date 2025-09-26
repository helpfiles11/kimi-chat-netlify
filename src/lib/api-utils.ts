/**
 * API Utilities for consistent error handling and logging
 */

/**
 * Standard API error response structure
 */
export interface ApiError {
  error: string
  details?: string
  status?: number
  timestamp?: string
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: string
): Response {
  const errorResponse: ApiError = {
    error,
    details,
    status,
    timestamp: new Date().toISOString()
  }

  return new Response(
    JSON.stringify(errorResponse),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): Response {
  const response = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }

  return new Response(
    JSON.stringify(response),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

/**
 * Validate environment variable and return error response if missing
 */
export function validateEnvVar(
  varName: string,
  value: string | undefined
): Response | null {
  if (!value) {
    console.error(`Environment variable ${varName} is not configured`)
    return createErrorResponse(
      `${varName} environment variable is not configured`,
      500
    )
  }
  return null
}

/**
 * Validate request body structure
 */
export function validateRequestBody(
  body: unknown,
  requiredFields: string[]
): Response | null {
  if (!body || typeof body !== 'object' || body === null) {
    return createErrorResponse('Invalid request body: Expected JSON object', 400)
  }

  const bodyObj = body as Record<string, unknown>

  for (const field of requiredFields) {
    if (!(field in bodyObj) || bodyObj[field] === undefined || bodyObj[field] === null) {
      return createErrorResponse(`Missing required field: ${field}`, 400)
    }
  }

  return null
}

/**
 * Validate string field constraints
 */
export function validateStringField(
  value: unknown,
  fieldName: string,
  minLength?: number,
  maxLength?: number
): Response | null {
  if (typeof value !== 'string') {
    return createErrorResponse(`${fieldName} must be a string`, 400)
  }

  const trimmedValue = value.trim()

  if (minLength && trimmedValue.length < minLength) {
    return createErrorResponse(`${fieldName} must be at least ${minLength} characters`, 400)
  }

  if (maxLength && trimmedValue.length > maxLength) {
    return createErrorResponse(`${fieldName} must be at most ${maxLength} characters`, 400)
  }

  return null
}

/**
 * Validate numeric field constraints
 */
export function validateNumericField(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): Response | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return createErrorResponse(`${fieldName} must be a valid number`, 400)
  }

  if (min !== undefined && value < min) {
    return createErrorResponse(`${fieldName} must be at least ${min}`, 400)
  }

  if (max !== undefined && value > max) {
    return createErrorResponse(`${fieldName} must be at most ${max}`, 400)
  }

  return null
}

/**
 * Validate boolean field
 */
export function validateBooleanField(
  value: unknown,
  fieldName: string
): Response | null {
  if (typeof value !== 'boolean') {
    return createErrorResponse(`${fieldName} must be a boolean (true/false)`, 400)
  }

  return null
}

/**
 * Log API request with timing
 */
export class ApiLogger {
  private startTime: number
  private endpoint: string

  constructor(endpoint: string) {
    this.startTime = Date.now()
    this.endpoint = endpoint
    console.log(`🚀 API Request: ${endpoint}`)
  }

  logSuccess(details?: string) {
    const duration = Date.now() - this.startTime
    console.log(`✅ API Success: ${this.endpoint} (${duration}ms)${details ? ` - ${details}` : ''}`)
  }

  logError(error: unknown, details?: string) {
    const duration = Date.now() - this.startTime
    console.error(`❌ API Error: ${this.endpoint} (${duration}ms)`, error, details)
  }

  logWarning(message: string) {
    const duration = Date.now() - this.startTime
    console.warn(`⚠️ API Warning: ${this.endpoint} (${duration}ms) - ${message}`)
  }
}

/**
 * Handle external API errors with specific messaging
 */
export function handleExternalApiError(
  apiName: string,
  response: Response,
  errorText?: string
): never {
  switch (response.status) {
    case 401:
      throw new Error(`${apiName} authentication failed: Check API key validity`)
    case 429:
      const resetTime = response.headers.get('X-RateLimit-Reset') || 'Try again later'
      throw new Error(`${apiName} rate limit exceeded: ${resetTime}`)
    case 400:
      throw new Error(`${apiName} request error: Invalid parameters - ${errorText}`)
    case 403:
      throw new Error(`${apiName} access forbidden: Subscription or API key issue`)
    case 500:
    case 502:
    case 503:
      throw new Error(`${apiName} server error: ${response.status} - Service temporarily unavailable`)
    default:
      throw new Error(`${apiName} error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(
  text: string,
  fallback: T,
  description: string = 'JSON'
): T {
  try {
    return JSON.parse(text)
  } catch (error) {
    console.warn(`Failed to parse ${description}:`, error)
    return fallback
  }
}

/**
 * Timeout wrapper for fetch requests
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}