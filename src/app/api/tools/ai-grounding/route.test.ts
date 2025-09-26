/**
 * Tests for Brave AI Grounding API Route
 */

import { POST } from './route'

// Mock the API utilities
jest.mock('../../../../lib/api-utils', () => ({
  createErrorResponse: jest.fn((error, status, details) => ({
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error, details, status, timestamp: new Date().toISOString() })
  })),
  createSuccessResponse: jest.fn((data, status, message) => ({
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, data, message, timestamp: new Date().toISOString() })
  })),
  validateEnvVar: jest.fn((varName, value) => value ? null : { status: 500, body: 'API key missing' }),
  validateRequestBody: jest.fn((body, requiredFields) => {
    if (!body || typeof body !== 'object') {
      return { status: 400, body: 'Invalid request body' }
    }
    for (const field of requiredFields) {
      if (!(field in body) || body[field] === undefined || body[field] === null) {
        return { status: 400, body: `Missing required field: ${field}` }
      }
    }
    return null
  }),
  validateStringField: jest.fn((value, fieldName, minLength, maxLength) => {
    if (typeof value !== 'string') {
      return { status: 400, body: `${fieldName} must be a string` }
    }
    const trimmedValue = value.trim()
    if (minLength && trimmedValue.length < minLength) {
      return { status: 400, body: `${fieldName} must be at least ${minLength} characters` }
    }
    if (maxLength && trimmedValue.length > maxLength) {
      return { status: 400, body: `${fieldName} must be at most ${maxLength} characters` }
    }
    return null
  }),
  validateBooleanField: jest.fn((value, fieldName) => {
    if (typeof value !== 'boolean') {
      return { status: 400, body: `${fieldName} must be a boolean (true/false)` }
    }
    return null
  }),
  validateNumericField: jest.fn((value, fieldName, min, max) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return { status: 400, body: `${fieldName} must be a valid number` }
    }
    if (min !== undefined && value < min) {
      return { status: 400, body: `${fieldName} must be at least ${min}` }
    }
    if (max !== undefined && value > max) {
      return { status: 400, body: `${fieldName} must be at most ${max}` }
    }
    return null
  }),
  ApiLogger: jest.fn().mockImplementation(() => ({
    logSuccess: jest.fn(),
    logError: jest.fn(),
    logWarning: jest.fn()
  })),
  handleExternalApiError: jest.fn(),
  fetchWithTimeout: jest.fn()
}))

// Mock fetch for the AI Grounding API
const mockFetch = jest.fn()
global.fetch = mockFetch as typeof fetch

describe('AI Grounding API Route', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, BRAVE_SEARCH_API_KEY: 'test-api-key' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Request Validation', () => {
    it('should return error for missing query', async () => {
      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should return error for invalid query type', async () => {
      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 123 })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should return error for empty query', async () => {
      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '' })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should return error for query exceeding max length', async () => {
      const longQuery = 'a'.repeat(1001)
      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: longQuery })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should return error for invalid boolean fields', async () => {
      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'test query',
          enable_research: 'not-a-boolean'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should return error for missing API key', async () => {
      delete process.env.BRAVE_SEARCH_API_KEY
      
      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test query' })
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })

  describe('Successful Requests', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        json: async () => ({
          id: 'test-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'brave',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'Test AI-generated answer with [1] citation'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 50,
            completion_tokens: 150,
            total_tokens: 200
          },
          metadata: {
            searches: 1,
            cost: 0.005,
            tokens_input: 50,
            tokens_output: 150
          }
        })
      })
    })

    it('should process basic query successfully', async () => {
      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'What is the capital of France?' })
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const responseData = JSON.parse(response.body as string)
      expect(responseData.success).toBe(true)
      expect(responseData.data.results.answer).toContain('Test AI-generated answer')
      expect(responseData.data.results.sources).toHaveLength(1)
      expect(responseData.data.results.metadata.searches_conducted).toBe(1)
    })

    it('should handle query with all optional parameters', async () => {
      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What is artificial intelligence?',
          enable_research: true,
          enable_citations: true,
          enable_entities: true,
          stream: false,
          country: 'US',
          language: 'en',
          max_tokens: 1000
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const responseData = JSON.parse(response.body as string)
      expect(responseData.success).toBe(true)
      expect(responseData.data.service).toBe('Brave AI Grounding API')
    })

    it('should handle streaming response', async () => {
      // Mock streaming response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'text/event-stream'
        }),
        body: {
          getReader: () => ({
            read: async () => {
              // Simulate streaming chunks
              const chunks = [
                { done: false, value: new TextEncoder().encode('data: {"id":"test","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"Hello"}}]}\n\n') },
                { done: false, value: new TextEncoder().encode('data: {"id":"test","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":" world"}}]}\n\n') },
                { done: false, value: new TextEncoder().encode('data: {"id":"test","object":"chat.completion.chunk","choices":[{"index":0,"finish_reason":"stop"}]}\n\n') },
                { done: true, value: undefined }
              ]
              return chunks.shift() || { done: true, value: undefined }
            }
          })
        }
      })

      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'test streaming',
          stream: true 
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle API rate limit error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded'
      })

      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test query' })
      })

      const response = await POST(request)
      expect(response.status).toBe(429)
    })

    it('should handle authentication error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key'
      })

      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test query' })
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should handle payment required error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 402,
        statusText: 'Payment Required',
        text: async () => 'Quota exceeded'
      })

      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test query' })
      })

      const response = await POST(request)
      expect(response.status).toBe(402)
    })

    it('should handle timeout error', async () => {
      mockFetch.mockRejectedValue(new Error('Request timeout after 30000ms'))

      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test query' })
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        json: async () => ({ invalid: 'response' })
      })

      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test query' })
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        json: async () => ({
          id: 'test-response-id',
          object: 'chat.completion',
          created: 1234567890,
          model: 'brave',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a comprehensive answer to your question about AI. [1] It includes multiple sources and citations. [2] The answer is grounded in real web sources.'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 75,
            completion_tokens: 225,
            total_tokens: 300
          },
          metadata: {
            searches: 2,
            cost: 0.008,
            tokens_input: 75,
            tokens_output: 225
          }
        })
      })
    })

    it('should return properly formatted response', async () => {
      const request = new Request('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'What is artificial intelligence?',
          enable_citations: true 
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const responseData = JSON.parse(response.body as string)
      
      // Check top-level structure
      expect(responseData.success).toBe(true)
      expect(responseData.data.query).toBe('What is artificial intelligence?')
      expect(responseData.data.service).toBe('Brave AI Grounding API')
      expect(responseData.data.response_time).toBeGreaterThan(0)
      
      // Check results structure
      const results = responseData.data.results
      expect(results.answer).toContain('comprehensive answer')
      expect(results.sources).toBeInstanceOf(Array)
      expect(results.sources.length).toBeGreaterThan(0)
      
      // Check metadata
      expect(results.metadata).toMatchObject({
        searches_conducted: 2,
        total_tokens: 300,
        estimated_cost: 0.008,
        model_used: 'brave',
        response_time: expect.any(Number),
        has_citations: true
      })
    })
  })
})