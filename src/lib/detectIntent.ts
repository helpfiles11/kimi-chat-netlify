/**
 * Client-side intent detection for instant tool calls
 * Detects tool usage intent from streaming AI responses and triggers tool execution
 */

export interface ToolCall {
  name: string
  arguments: Record<string, unknown>
  id?: string
}

interface IntentPattern {
  name: string
  trigger: RegExp
  extractor: (text: string) => Record<string, unknown> | null
}

const TOOL_PATTERNS: IntentPattern[] = [
  // WebSearch patterns
  {
    name: 'WebSearch',
    trigger: /\b(search|look up|google|find|query|research)\b.*?\b(for|about|regarding|information)\b/i,
    extractor: (text: string) => {
      // Detect if detailed content analysis is needed
      const needsScraping = /\b(purpose|what is|what does|content|analyze|summary|details|meaning|about)\b/i.test(text) ||
                            /\.(com|org|net|app|io)\b/i.test(text) || // URLs mentioned
                            /\bsite\b/i.test(text) ||
                            /\bwebsite\b/i.test(text);

      // Extract quoted phrases first
      const quoted = text.match(/[""]([^""]+)[""]/);
      if (quoted) return {
        query: quoted[1],
        max_results: 3,
        scrape_first: needsScraping
      };

      // Extract after "for/about/regarding/information"
      const afterFor = text.match(/\b(?:for|about|regarding|information\s+(?:about|on))\s+([^.!?]+)/i);
      if (afterFor) return {
        query: afterFor[1].trim(),
        max_results: 3,
        scrape_first: needsScraping
      };

      // Special case for website/URL analysis
      const urlMatch = text.match(/\b(?:find|search|look up|analyze|check)\b.*?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);
      if (urlMatch) {
        return {
          query: `site:${urlMatch[1]} OR ${urlMatch[1]}`,
          max_results: 3,
          scrape_first: true  // Always scrape for URL analysis
        };
      }

      // Special case for comet queries
      const cometMatch = text.match(/\b(?:comet|asteroid)\s+([^.!?]+)/i);
      if (cometMatch) {
        return {
          query: `comet ${cometMatch[1].trim()}`,
          max_results: 3,
          scrape_first: needsScraping
        };
      }

      // Extract object names (like "3I Atlas", "Borisov", etc.)
      const objectMatch = text.match(/\b([A-Z0-9]+[\/\-\s][A-Za-z0-9]+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      if (objectMatch) {
        return {
          query: objectMatch[1].trim(),
          max_results: 3,
          scrape_first: needsScraping
        };
      }

      return null;
    }
  },

  // Calculator patterns
  {
    name: 'Calculator',
    trigger: /\b(calculate|compute|solve|evaluate)\b/i,
    extractor: (text: string) => {
      // Look for mathematical expressions
      const mathExpression = text.match(/(?:calculate|compute|solve|evaluate)\s+([^.!?]+)/i);
      if (mathExpression) {
        return {
          expression: mathExpression[1].trim(),
          operation: 'evaluate'
        };
      }
      return null;
    }
  },

  // CodeRunner patterns
  {
    name: 'CodeRunner',
    trigger: /\b(run|execute|code)\b.*?\b(python|javascript|js)\b/i,
    extractor: (text: string) => {
      const codeBlock = text.match(/```(\w+)?\s*([\s\S]*?)```/);
      if (codeBlock) {
        const language = codeBlock[1] || 'javascript';
        return {
          code: codeBlock[2].trim(),
          language: language.toLowerCase()
        };
      }
      return null;
    }
  }
];

/**
 * Detect tool usage intent from AI response text
 */
export function detectIntent(text: string): ToolCall | null {
  for (const pattern of TOOL_PATTERNS) {
    if (pattern.trigger.test(text)) {
      const args = pattern.extractor(text);
      if (args) {
        return {
          name: pattern.name,
          arguments: args,
          id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }
    }
  }

  return null;
}

/**
 * Check if we've already called this tool to prevent duplicates
 */
export function shouldCallTool(toolCall: ToolCall, alreadyCalled: Set<string>): boolean {
  const key = `${toolCall.name}_${JSON.stringify(toolCall.arguments)}`;
  if (alreadyCalled.has(key)) return false;

  alreadyCalled.add(key);
  return true;
}

/**
 * Enhanced intent detection with context awareness
 */
export function detectIntentWithContext(
  currentChunk: string,
  fullResponse: string,
  _conversationContext: string[]
): ToolCall[] {
  const tools: ToolCall[] = [];

  // Check current chunk for immediate intent
  const immediateIntent = detectIntent(currentChunk);
  if (immediateIntent) {
    tools.push(immediateIntent);
  }

  // Check full response for complete patterns
  const fullIntent = detectIntent(fullResponse);
  if (fullIntent && fullIntent.name !== immediateIntent?.name) {
    tools.push(fullIntent);
  }

  return tools;
}