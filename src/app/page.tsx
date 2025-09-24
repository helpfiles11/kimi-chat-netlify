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
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat' // This points to our backend API route at src/app/api/chat/route.ts
  })

  return (
    <main className="mx-auto max-w-2xl p-6">
      {/* App title */}
      <h1 className="text-2xl font-bold mb-4">Kimi on Netlify</h1>

      {/* Chat messages container */}
      <div className="border rounded p-4 h-96 overflow-y-auto mb-4 bg-gray-50">
        {/*
          Render all messages in the conversation.
          Each message has:
          - id: unique identifier
          - role: 'user' or 'assistant'
          - content: the actual text content
        */}
        {messages.map(m => (
          <div key={m.id} className="mb-2">
            {/* Show who is speaking (user or assistant) */}
            <span className="font-semibold">{m.role}:</span>
            {/* Show the message content, preserving line breaks with whitespace-pre-wrap */}
            <span className="ml-2 whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
      </div>

      {/* Chat input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Text input for typing messages */}
        <input
          value={input} // Controlled by useChat hook
          onChange={handleInputChange} // Updates input state in useChat hook
          placeholder="Ask Kimi…"
          className="flex-1 border rounded px-3 py-2"
        />
        {/* Submit button - when clicked, handleSubmit sends the message to our API */}
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
      </form>
    </main>
  )
}
