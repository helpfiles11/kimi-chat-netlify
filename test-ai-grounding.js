/**
 * Simple integration test for AI Grounding API
 * Run with: node test-ai-grounding.js
 */

async function testAIGrounding() {
  console.log('🧪 Testing AI Grounding API...')
  
  const testCases = [
    {
      name: 'Basic query',
      request: {
        query: 'What is the capital of France?'
      }
    },
    {
      name: 'Complex query with research',
      request: {
        query: 'What are the main differences between machine learning and deep learning?',
        enable_research: true,
        enable_citations: true
      }
    },
    {
      name: 'Query with entities',
      request: {
        query: 'Who is the current CEO of Apple?',
        enable_entities: true,
        enable_citations: true
      }
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`)
    console.log(`🔍 Query: ${testCase.request.query}`)
    
    try {
      const response = await fetch('http://localhost:3000/api/tools/ai-grounding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.request)
      })

      console.log(`📊 Response status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Success!`)
        console.log(`🤖 Answer: ${data.data.results.answer.substring(0, 200)}...`)
        console.log(`📚 Sources: ${data.data.results.sources.length}`)
        console.log(`⏱️  Response time: ${data.data.response_time}ms`)
        console.log(`💰 Cost estimate: $${data.data.cost_estimate}`)
      } else {
        const error = await response.text()
        console.log(`❌ Error: ${error}`)
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`)
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('\n✨ Test completed!')
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAIGrounding().catch(console.error)
}

module.exports = { testAIGrounding }