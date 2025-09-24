'use client'
import React, { useState } from 'react'
// In AI SDK v3, useChat is available from 'ai/react'
import { useChat } from 'ai/react'

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
// Available Kimi AI models with descriptions
const KIMI_MODELS = [
  {
    id: 'moonshot-v1-auto',
    name: 'Moonshot V1 (Auto)',
    description: 'Automatically selects the most appropriate model for your task'
  },
  {
    id: 'kimi-k2-0711-preview',
    name: 'Kimi K2 (Preview)',
    description: 'Latest Kimi model with enhanced capabilities'
  },
  {
    id: 'moonshot-v1-8k',
    name: 'Moonshot V1 (8K)',
    description: 'Standard model with 8K context length'
  },
  {
    id: 'moonshot-v1-32k',
    name: 'Moonshot V1 (32K)',
    description: 'Extended context model with 32K token support'
  },
  {
    id: 'moonshot-v1-128k',
    name: 'Moonshot V1 (128K)',
    description: 'Large context model with 128K token support'
  }
]

export default function Chat() {
  // Model selection state
  const [selectedModel, setSelectedModel] = useState(KIMI_MODELS[0].id)

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
      model: selectedModel // Send the selected model with each request
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
      {/* Header with title and model selector */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kimi on Netlify</h1>

        {/* Model selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Model:
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading}
            className="border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed min-w-[250px] transition-colors duration-200"
          >
            {KIMI_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
        </div>
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
          <div key={m.id} className={`mb-4 p-3 rounded-lg transition-colors duration-200 ${m.role === 'user' ? 'bg-blue-100 dark:bg-blue-900/30 ml-8' : 'bg-white dark:bg-gray-700 mr-8'}`}>
            {/* Show who is speaking (user or assistant) */}
            <div className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-1">
              {m.role === 'user' ? 'You' : 'Kimi AI'}
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
