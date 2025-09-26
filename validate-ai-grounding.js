/**
 * Validation test for AI Grounding API
 * Tests the request/response structure and validation logic
 */

console.log('🔍 Validating AI Grounding API Implementation...\n')

// Test request validation
function validateRequest(body) {
  const errors = []
  
  if (!body || typeof body !== 'object') {
    errors.push('Request body must be a valid JSON object')
    return errors
  }
  
  if (!body.query || typeof body.query !== 'string') {
    errors.push('Query must be a string')
  } else {
    const trimmedQuery = body.query.trim()
    if (trimmedQuery.length < 1) {
      errors.push('Query must be at least 1 character long')
    }
    if (trimmedQuery.length > 1000) {
      errors.push('Query must be at most 1000 characters long')
    }
  }
  
  // Validate boolean fields
  const booleanFields = ['enable_research', 'enable_citations', 'enable_entities', 'stream']
  for (const field of booleanFields) {
    if (body[field] !== undefined && typeof body[field] !== 'boolean') {
      errors.push(`${field} must be a boolean (true/false)`)
    }
  }
  
  return errors
}

// Test response formatting
function formatResponse(answer, sources, metadata) {
  return {
    success: true,
    data: {
      results: {
        answer,
        sources: sources || [],
        metadata: {
          searches_conducted: metadata?.searches || 1,
          total_tokens: metadata?.total_tokens || 0,
          estimated_cost: metadata?.cost || 0,
          model_used: metadata?.model || 'brave',
          response_time: metadata?.response_time || 0,
          has_citations: (sources?.length || 0) > 0
        }
      },
      query: 'test query',
      service: 'Brave AI Grounding API',
      response_time: metadata?.response_time || 0,
      cost_estimate: metadata?.cost || 0
    },
    timestamp: new Date().toISOString()
  }
}

// Test cases
const testCases = [
  {
    name: 'Valid basic request',
    request: { query: 'What is the capital of France?' },
    expectedValid: true
  },
  {
    name: 'Valid advanced request',
    request: {
      query: 'What is artificial intelligence?',
      enable_research: true,
      enable_citations: true,
      enable_entities: true,
      stream: false,
      country: 'US',
      language: 'en',
      max_tokens: 1000
    },
    expectedValid: true
  },
  {
    name: 'Missing query',
    request: {},
    expectedValid: false
  },
  {
    name: 'Invalid query type',
    request: { query: 123 },
    expectedValid: false
  },
  {
    name: 'Empty query',
    request: { query: '' },
    expectedValid: false
  },
  {
    name: 'Query too long',
    request: { query: 'a'.repeat(1001) },
    expectedValid: false
  },
  {
    name: 'Invalid boolean field',
    request: { query: 'test', enable_research: 'not-boolean' },
    expectedValid: false
  }
]

console.log('🧪 Running validation tests...\n')

let passed = 0
let failed = 0

for (const testCase of testCases) {
  console.log(`Testing: ${testCase.name}`)
  console.log(`Request: ${JSON.stringify(testCase.request, null, 2)}`)
  
  const errors = validateRequest(testCase.request)
  const isValid = errors.length === 0
  
  if (isValid === testCase.expectedValid) {
    console.log(`✅ PASS - Validation: ${isValid ? 'Valid' : 'Invalid'}`)
    if (!isValid) {
      console.log(`   Errors: ${errors.join(', ')}`)
    }
    passed++
  } else {
    console.log(`❌ FAIL - Expected: ${testCase.expectedValid ? 'Valid' : 'Invalid'}, Got: ${isValid ? 'Valid' : 'Invalid'}`)
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.join(', ')}`)
    }
    failed++
  }
  
  console.log('')
}

console.log('📊 Test Results:')
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

console.log('\n🎯 Testing response formatting...')

const sampleResponse = formatResponse(
  'Paris is the capital and most populous city of France. [1] It is located in the north-central part of the country on the Seine River. [2]',
  [
    {
      title: 'Paris - Wikipedia',
      url: 'https://en.wikipedia.org/wiki/Paris',
      snippet: 'Paris is the capital and most populous city of France...',
      relevance_score: 0.95
    },
    {
      title: 'France Country Profile',
      url: 'https://example.com/france-profile',
      snippet: 'France is a country located in Western Europe...',
      relevance_score: 0.8
    }
  ],
  {
    searches: 1,
    total_tokens: 150,
    cost: 0.003,
    model: 'brave',
    response_time: 1200
  }
)

console.log('✅ Sample response structure:')
console.log(JSON.stringify(sampleResponse, null, 2))

console.log('\n✨ Validation completed!')

// Export for use in other tests
module.exports = { validateRequest, formatResponse }