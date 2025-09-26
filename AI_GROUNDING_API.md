# Brave AI Grounding API Integration

This document describes the Brave AI Grounding API integration in the Kimi Chat Application, providing AI-generated answers with verifiable web sources.

## Overview

The Brave AI Grounding API is an advanced alternative to traditional web search that provides:
- **AI-generated answers** with direct responses to questions
- **Verifiable sources** with citations and references
- **Research capabilities** for complex queries requiring multiple searches
- **Cost efficiency** through single API calls instead of search + scrape combinations

## API Endpoint

```
POST /api/tools/ai-grounding
```

## Request Format

### Basic Request
```json
{
  "query": "What is the capital of France?"
}
```

### Advanced Request
```json
{
  "query": "What are the main differences between machine learning and deep learning?",
  "enable_research": true,
  "enable_citations": true,
  "enable_entities": false,
  "stream": false,
  "country": "US",
  "language": "en",
  "max_tokens": 2000
}
```

### Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | The question or query to answer (1-1000 characters) |
| `enable_research` | boolean | false | Allow multiple searches for complex queries |
| `enable_citations` | boolean | true | Include citations and sources in the response |
| `enable_entities` | boolean | false | Enable entity extraction for better context |
| `stream` | boolean | false | Stream response or return all at once |
| `country` | string | "US" | Country backend for search results |
| `language` | string | "en" | Language for the response |
| `max_tokens` | number | 2000 | Maximum tokens in the response |

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "results": {
      "answer": "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines... [1] The field encompasses various subfields including machine learning... [2]",
      "sources": [
        {
          "title": "Introduction to Artificial Intelligence",
          "url": "https://example.com/ai-introduction",
          "snippet": "AI is the simulation of human intelligence processes by machines...",
          "relevance_score": 0.9
        },
        {
          "title": "Machine Learning vs AI",
          "url": "https://example.com/ml-vs-ai",
          "snippet": "Machine learning is a subset of artificial intelligence...",
          "relevance_score": 0.8
        }
      ],
      "metadata": {
        "searches_conducted": 2,
        "total_tokens": 450,
        "estimated_cost": 0.012,
        "model_used": "brave",
        "response_time": 3200,
        "has_citations": true
      }
    },
    "query": "What is artificial intelligence?",
    "service": "Brave AI Grounding API",
    "response_time": 3200,
    "cost_estimate": 0.012
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Query has too many words. Maximum 1000 characters allowed.",
  "status": 400,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Response Fields

### Main Response (`data.results`)
- **`answer`**: The AI-generated answer to the query
- **`sources`**: Array of source objects with citations
- **`metadata`**: Detailed information about the request

### Metadata Fields
- **`searches_conducted`**: Number of web searches performed
- **`total_tokens`**: Total tokens used (input + output)
- **`estimated_cost`**: Estimated cost in USD
- **`model_used`**: Model identifier (always "brave")
- **`response_time`**: Response time in milliseconds
- **`has_citations`**: Whether citations are included

### Source Object
- **`title`**: Title of the source
- **`url`**: URL of the source
- **`snippet`**: Relevant excerpt from the source
- **`relevance_score`**: Relevance score (0.0-1.0)

## Error Handling

The API provides comprehensive error handling with specific error codes:

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid API key |
| 402 | Payment Required | API quota exceeded |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Configuration

### Environment Variables
```bash
# Brave Search API Key (same key works for AI Grounding)
BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here
```

### API Key Requirements
- Get your API key from: https://brave.com/search/api/
- Same API key works for both Web Search and AI Grounding APIs
- AI Grounding may require additional subscription tier

## Usage Examples

### Basic Usage
```javascript
const response = await fetch('/api/tools/ai-grounding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "What is quantum computing?"
  })
})

const data = await response.json()
console.log(data.data.results.answer)
```

### Advanced Usage with Research
```javascript
const response = await fetch('/api/tools/ai-grounding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Compare renewable energy sources: solar, wind, and hydroelectric",
    enable_research: true,
    enable_citations: true,
    enable_entities: true
  })
})

const data = await response.json()
console.log(`Answer: ${data.data.results.answer}`)
console.log(`Sources: ${data.data.results.sources.length}`)
console.log(`Cost: $${data.data.cost_estimate}`)
```

## Integration with Chat System

The AI Grounding API is integrated into the chat system as a tool that can be called by the AI model:

```json
{
  "tool_calls": [{
    "function": {
      "name": "AIGrounding",
      "arguments": "{\"query\": \"What are the latest developments in AI?\", \"enable_research\": true}"
    }
  }]
}
```

## Comparison with Web Search

| Feature | Web Search | AI Grounding |
|---------|------------|--------------|
| **Response Type** | Search results list | Direct answer |
| **Sources** | Multiple URLs | Citations with snippets |
| **Research Mode** | Single search | Multiple searches |
| **Cost** | Lower per request | Higher but more comprehensive |
| **Best For** | Simple queries | Complex questions needing synthesis |
| **Speed** | Faster | Slower (but more thorough) |

## Performance Characteristics

- **Response Time**: 2-30 seconds depending on complexity
- **Research Queries**: Up to 53 searches, 1000 pages analyzed, 300 seconds for p99
- **Rate Limiting**: 2 requests per second default
- **Token Usage**: Varies by query complexity (50-2000+ tokens)

## Best Practices

1. **Use for Complex Questions**: AI Grounding excels at questions requiring synthesis of multiple sources
2. **Enable Research for Broad Topics**: Use `enable_research: true` for complex or broad queries
3. **Monitor Costs**: Check `cost_estimate` in responses to track usage
4. **Handle Timeouts**: Set appropriate timeouts (30+ seconds) for research queries
5. **Fallback Strategy**: Consider falling back to Web Search for simple queries

## Testing

Run the integration test:
```bash
node test-ai-grounding.js
```

Run unit tests:
```bash
npm test src/app/api/tools/ai-grounding/route.test.ts
```

## Troubleshooting

### Common Issues

1. **429 Rate Limit**: Wait and retry, or contact Brave for higher limits
2. **401 Authentication**: Verify API key is correct and has AI Grounding access
3. **402 Payment Required**: Check subscription status and usage limits
4. **Timeout Errors**: Increase timeout for complex research queries
5. **Invalid Response**: Check query length (max 1000 characters)

### Debug Mode

Set environment variable for detailed logging:
```bash
NODE_ENV=development
```

This enables:
- Raw API response logging
- Detailed error messages
- Performance metrics

## Security Considerations

- API keys are stored server-side only
- Request validation prevents injection attacks
- Rate limiting protects against abuse
- Input sanitization on all parameters
- Timeout protection against hanging requests

## Future Enhancements

- Streaming response support
- Custom citation formatting
- Multi-language support improvements
- Advanced entity extraction
- Integration with other AI models
- Caching for frequently asked questions