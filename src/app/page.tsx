'use client'
import React, { useState, useEffect } from 'react'
// In AI SDK v3, useChat is available from 'ai/react'
import { useChat } from 'ai/react'
import CopyButton from '../components/CopyButton'

/**
 * Main Chat Component
 *
 * This is the heart of our chat application. It renders a simple chat interface
 * that connects to the Kimi AI API through our backend API route.
 *
 * How it works:
 * 1. Uses the 'useChat' hook from Vercel's AI SDK to manage chat state
 * 2. The hook automatically handles message history, streaming responses, and form submission
 * 3. When user submits a message, it sends a POST request to '/api/chat' (our backend route)
 * 4. The backend streams the AI response back, which is automatically handled by useChat
 * 5. The UI updates in real-time as the AI types its response
 */
// Available Kimi AI models - using verified API model IDs (2024)
const KIMI_MODELS = [
  {
    id: 'moonshot-v1-auto',
    name: 'Auto-Select',
    description: 'Automatically selects the best model for your task',
    badge: 'Smart'
  },
  {
    id: 'moonshot-v1-128k',
    name: 'Moonshot V1 (128K)',
    description: 'Large context model with 128K token support, best for long documents',
    badge: 'Large Context'
  },
  {
    id: 'moonshot-v1-32k',
    name: 'Moonshot V1 (32K)',
    description: 'Extended context model with 32K token support',
    badge: 'Extended'
  },
  {
    id: 'moonshot-v1-8k',
    name: 'Moonshot V1 (8K)',
    description: 'Standard model with 8K context, optimized for speed',
    badge: 'Fast'
  },
  {
    id: 'kimi-k2-0711-preview',
    name: 'Kimi K2 Preview',
    description: 'Latest Kimi K2 preview model with enhanced capabilities',
    badge: 'Preview'
  }
]

// Utility function to get badge styling
const getBadgeStyles = (badge: string) => {
  const styles = {
    Smart: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'Large Context': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Extended: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    Fast: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    Preview: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    Latest: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  } as const
  return styles[badge as keyof typeof styles] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

export default function Chat() {
  // Model selection state
  const [selectedModel, setSelectedModel] = useState(KIMI_MODELS[0].id)

  // Context state - provides additional context/instructions to the AI
  const [context, setContext] = useState('')

  // Load context from localStorage on component mount
  useEffect(() => {
    const savedContext = localStorage.getItem('kimi-chat-context')
    if (savedContext) {
      setContext(savedContext)
    }
  }, [])

  // Save context to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kimi-chat-context', context)
  }, [context])

  // Utility functions for enhanced features
  const exportConversation = () => {
    const conversation = messages.map(m => `${m.role === 'user' ? 'You' : 'Kimi AI'}: ${m.content}`).join('\n\n')
    const blob = new Blob([conversation], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kimi-chat-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearConversation = () => {
    if (messages.length > 0 && confirm('Clear entire conversation? This cannot be undone.')) {
      window.location.reload()
    }
  }

  // useChat is a powerful hook that manages all chat logic for us:
  // - messages: Array of all chat messages (user and AI)
  // - input: Current text in the input field
  // - handleInputChange: Function to update the input field
  // - handleSubmit: Function that sends the message to our API when form is submitted
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error
  } = useChat({
    api: '/api/chat', // This points to our backend API route at src/app/api/chat/route.ts
    body: {
      model: selectedModel, // Send the selected model with each request
      context: context.trim() || undefined // Send context only if it's not empty
    },
    onError: (error) => {
      console.error('Chat error:', error)
    },
    onFinish: (message) => {
      console.log('Chat finished:', message)
    },
    onResponse: (response) => {
      console.log('Chat response received:', response.status)
      if (!response.ok) {
        console.error('Chat response not ok:', response.status, response.statusText)
      }
    }
  })

  return (
    <main className="mx-auto max-w-6xl p-6 min-h-screen transition-colors duration-200">
      {/* Header with title, stats, and model selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kimi on Netlify</h1>
          {messages.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{messages.length} messages</span>
              <button
                onClick={exportConversation}
                className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Export conversation"
              >
                Export
              </button>
              <button
                onClick={clearConversation}
                className="px-2 py-1 rounded text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Clear conversation"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Model selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Model:
          </label>
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoading}
              className="border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-w-[300px] transition-colors duration-200"
            >
              {KIMI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} • {model.description}
                </option>
              ))}
            </select>
            {/* Badge for selected model */}
            {(() => {
              const selectedModelData = KIMI_MODELS.find(m => m.id === selectedModel)
              if (!selectedModelData) return null
              return (
                <span className={`absolute right-10 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs rounded font-medium ${getBadgeStyles(selectedModelData.badge)}`}>
                  {selectedModelData.badge}
                </span>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Context Input Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional Context
          </label>
          <span className={`text-xs transition-colors duration-200 ${
            context.length > 9000 ? 'text-red-500 dark:text-red-400' :
            context.length > 8000 ? 'text-orange-500 dark:text-orange-400' :
            'text-gray-500 dark:text-gray-400'
          }`}>
            {context.length}/10,000 characters
          </span>
        </div>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value.slice(0, 10000))}
          placeholder="Provide additional context, documents, instructions, or background information for the AI..."
          className="w-full h-24 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none resize-none transition-colors duration-200"
          disabled={isLoading}
        />
        {context && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-green-600 dark:text-green-400">
              ✓ Context will be included with your messages
            </span>
            <button
              onClick={() => setContext('')}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
              disabled={isLoading}
            >
              Clear Context
            </button>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="border border-red-300 dark:border-red-600 rounded p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 transition-colors duration-200">
          <strong>Error:</strong> {error.message || 'An error occurred while sending your message.'}
        </div>
      )}

      {/* Chat messages container */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 h-[600px] overflow-y-auto mb-4 bg-gray-50 dark:bg-gray-800/50 shadow-inner transition-colors duration-200">
        {/*
          Render all messages in the conversation.
          Each message has:
          - id: unique identifier
          - role: 'user' or 'assistant'
          - content: the actual text content
        */}
        {messages.length === 0 && (
          <div className="text-gray-500 dark:text-gray-400 text-center">
            Start a conversation with Kimi AI...
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`group mb-4 p-3 rounded-lg transition-colors duration-200 ${m.role === 'user' ? 'bg-blue-100 dark:bg-blue-900/30 ml-8' : 'bg-white dark:bg-gray-700 mr-8'}`}>
            {/* Header with speaker name and copy button */}
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-sm text-gray-600 dark:text-gray-400">
                {m.role === 'user' ? 'You' : 'Kimi AI'}
              </div>
              {/* Copy button only for AI messages */}
              {m.role === 'assistant' && (
                <CopyButton
                  text={m.content}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              )}
            </div>
            {/* Show the message content, preserving line breaks with whitespace-pre-wrap */}
            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">{m.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="mb-4 p-3 rounded-lg bg-white dark:bg-gray-700 mr-8 transition-colors duration-200">
            <div className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-1">Kimi AI</div>
            <div className="text-gray-500 dark:text-gray-400 italic">Thinking...</div>
          </div>
        )}
      </div>

      {/* Chat input form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        {/* Text input for typing messages */}
        <input
          value={input} // Controlled by useChat hook
          onChange={handleInputChange} // Updates input state in useChat hook
          placeholder="Ask Kimi anything..."
          className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-lg transition-colors duration-200"
          disabled={isLoading}
        />
        {/* Submit button - when clicked, handleSubmit sends the message to our API */}
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`px-6 py-3 rounded-lg text-white font-semibold transition-colors duration-200 ${
            isLoading || !input.trim()
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-500'
          }`}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </main>
  )
}
