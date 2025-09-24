'use client'
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
export default function Chat() {
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
    <main className="mx-auto max-w-6xl p-6">
      {/* App title */}
      <h1 className="text-2xl font-bold mb-4">Kimi on Netlify</h1>

      {/* Error display */}
      {error && (
        <div className="border border-red-300 rounded p-4 mb-4 bg-red-50 text-red-700">
          <strong>Error:</strong> {error.message || 'An error occurred while sending your message.'}
        </div>
      )}

      {/* Chat messages container */}
      <div className="border rounded-lg p-6 h-[600px] overflow-y-auto mb-4 bg-gray-50 shadow-inner">
        {/*
          Render all messages in the conversation.
          Each message has:
          - id: unique identifier
          - role: 'user' or 'assistant'
          - content: the actual text content
        */}
        {messages.length === 0 && (
          <div className="text-gray-500 text-center">
            Start a conversation with Kimi AI...
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`mb-4 p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-white mr-8'}`}>
            {/* Show who is speaking (user or assistant) */}
            <div className="font-semibold text-sm text-gray-600 mb-1">
              {m.role === 'user' ? 'You' : 'Kimi AI'}
            </div>
            {/* Show the message content, preserving line breaks with whitespace-pre-wrap */}
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{m.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="mb-4 p-3 rounded-lg bg-white mr-8">
            <div className="font-semibold text-sm text-gray-600 mb-1">Kimi AI</div>
            <div className="text-gray-500 italic">Thinking...</div>
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
          className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none text-lg"
          disabled={isLoading}
        />
        {/* Submit button - when clicked, handleSubmit sends the message to our API */}
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`px-6 py-3 rounded-lg text-white font-semibold transition-colors ${
            isLoading || !input.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </main>
  )
}
