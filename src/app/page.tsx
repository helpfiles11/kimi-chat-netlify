'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
// In AI SDK v3, useChat is available from 'ai/react'
import { useChat } from 'ai/react'
import CopyButton from '../components/CopyButton'
import FileUpload from '../components/FileUpload'
import UsageInfo from '../components/UsageInfo'
import { detectIntent, shouldCallTool, type ToolCall } from '../lib/detectIntent'
import { KIMI_MODELS, getBadgeStyles } from '../lib/models'

/**
 * Main Chat Component
 *
 * This is the heart of our chat application. It renders a simple chat interface
 * that connects to the Kimi AI API through our backend API route.
 *
 * How it works:
 * 1. Uses the 'useChat' hook from the AI SDK to manage chat state
 * 2. The hook automatically handles message history, streaming responses, and form submission
 * 3. When user submits a message, it sends a POST request to '/api/chat' (our backend route)
 * 4. The backend streams the AI response back, which is automatically handled by useChat
 * 5. The UI updates in real-time as the AI types its response
 */
// Models now imported from centralized configuration

export default function Chat() {
  // Model selection state
  const [selectedModel, setSelectedModel] = useState(KIMI_MODELS[0].id)

  // Context state - provides additional context/instructions to the AI
  const [context, setContext] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, content: string}>>([])

  // Token estimation state
  const [tokenEstimate, setTokenEstimate] = useState<{total_tokens: number, estimated_cost?: number} | null>(null)
  const [estimatingTokens, setEstimatingTokens] = useState(false)

  // Tool execution tracking
  const [executingTools, setExecutingTools] = useState<Set<string>>(new Set())
  const [toolResults, setToolResults] = useState<Map<string, unknown>>(new Map())
  const [sessionTokens, setSessionTokens] = useState(0)
  const alreadyCalledTools = useRef<Set<string>>(new Set())
  const currentResponse = useRef<string>('')

  // Handler for file upload
  const handleFileUpload = (content: string, filename: string) => {
    const fileInfo = { name: filename, content }
    setUploadedFiles(prev => {
      // Remove existing file with same name
      const filtered = prev.filter(f => f.name !== filename)
      return [...filtered, fileInfo]
    })

    // Add file content to context with clear labeling
    const fileContext = `\n\n--- File: ${filename} ---\n${content}\n--- End of ${filename} ---`
    setContext(prev => prev + fileContext)
  }

  // Execute tool based on detected intent
  const executeTool = useCallback(async (toolCall: ToolCall, msgId?: string) => {
    const toolKey = `${toolCall.name}_${JSON.stringify(toolCall.arguments)}`

    if (!shouldCallTool(toolCall, alreadyCalledTools.current)) {
      console.log(`Tool ${toolCall.name} already called, skipping`)
      return
    }

    console.log(`Executing tool: ${toolCall.name}`, toolCall.arguments)

    setExecutingTools(prev => new Set(prev).add(toolKey))

    try {
      const response = await fetch('/api/execTool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: toolCall.name,
          arguments: toolCall.arguments,
          id: toolCall.id,
          msgId
        })
      })

      const result = await response.json()

      if (result.success) {
        setToolResults(prev => new Map(prev).set(toolKey, result))
        console.log(`Tool ${toolCall.name} completed:`, result)
      } else {
        console.error(`Tool ${toolCall.name} failed:`, result.error)
      }
    } catch (error) {
      console.error(`Error executing tool ${toolCall.name}:`, error)
    } finally {
      setExecutingTools(prev => {
        const newSet = new Set(prev)
        newSet.delete(toolKey)
        return newSet
      })
    }
  }, [])

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
      // Reset session token counter before reload
      setSessionTokens(0)
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
      // Reset tracking for next message
      currentResponse.current = ''
      alreadyCalledTools.current.clear()
    },
    onResponse: (response) => {
      console.log('Chat response received:', response.status)
      if (!response.ok) {
        console.error('Chat response not ok:', response.status, response.statusText)
      }
    },
    experimental_onFunctionCall: async (toolCall) => {
      // This is for standard function calling, but we're using client-side intent detection instead
      console.log('Function call detected (standard):', toolCall)
      return undefined // Let the UI handle display
    }
  })

  // Streaming intent detection - monitor AI responses for tool usage
  useEffect(() => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]

    // Only process assistant messages
    if (lastMessage.role !== 'assistant' || !lastMessage.content) return

    const currentContent = lastMessage.content
    const newChunk = currentContent.slice(currentResponse.current.length)

    if (newChunk.length > 0) {
      // Update our tracking
      currentResponse.current = currentContent

      // Detect intent in the new chunk
      const toolIntent = detectIntent(newChunk)

      if (toolIntent) {
        console.log('Intent detected in streaming response:', toolIntent)
        // Execute tool immediately while AI is still "typing"
        executeTool(toolIntent, lastMessage.id)
      }

      // Also check full response for complete patterns
      const fullIntent = detectIntent(currentContent)
      if (fullIntent && fullIntent.name !== toolIntent?.name) {
        console.log('Full response intent detected:', fullIntent)
        executeTool(fullIntent, lastMessage.id)
      }

    }
  }, [messages, executeTool])

  // Clean message content for display (remove tool calls JSON)
  const cleanMessageContent = useCallback((content: string): string => {
    return content
      .replace(/\{"tool_calls":\s*\[([\s\S]*?)\]\}/g, '')
      .replace(/\[\s*\{\s*"id":\s*"[^"]*",\s*"type":\s*"function"[\s\S]*?\]/g, '')
      .replace(/\{\s*"id":\s*"[^"]*",\s*"type":\s*"function",\s*"function":\s*\{[\s\S]*?\}\s*\}/g, '')
      .trim()
  }, [])

  // Token estimation function
  const estimateTokens = useCallback(async (newMessage: string) => {
    if (!newMessage.trim()) {
      setTokenEstimate(null)
      return
    }

    setEstimatingTokens(true)
    setTokenEstimate(null)

    try {
      // Prepare messages for estimation (same as chat API)
      const contextualMessages = [...messages]

      // Add context if provided
      if (context && context.trim()) {
        const systemMessage = {
          id: `system-${Date.now()}`,
          role: 'system' as const,
          content: `Additional context: ${context.trim()}`
        }
        const existingSystemIndex = contextualMessages.findIndex(msg => msg.role === 'system')
        if (existingSystemIndex >= 0) {
          contextualMessages[existingSystemIndex].content += `\n\n${systemMessage.content}`
        } else {
          contextualMessages.unshift(systemMessage)
        }
      }

      // Add the new user message
      contextualMessages.push({
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'user' as const,
        content: newMessage.trim()
      })

      const response = await fetch('/api/estimate-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: contextualMessages
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTokenEstimate(result.data)
          // Add estimated tokens to session counter
          setSessionTokens(prev => prev + result.data.total_tokens)
          // Store in localStorage for UsageInfo component
          localStorage.setItem('lastTokenEstimate', JSON.stringify(result.data))
        }
      }
    } catch (error) {
      console.error('Token estimation failed:', error)
    } finally {
      setEstimatingTokens(false)
    }
  }, [messages, context, selectedModel])

  // Debounced token estimation when input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim()) {
        estimateTokens(input)
      } else {
        setTokenEstimate(null)
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [input, estimateTokens])

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
                <span className={`absolute right-10 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs rounded font-medium ${getBadgeStyles(selectedModelData.badge, selectedModelData.promotion)}`}>
                  {selectedModelData.badge}{selectedModelData.promotion ? ' 🎉' : ''}
                </span>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Usage and Balance Information */}
      <UsageInfo className="mb-4" sessionTokens={sessionTokens} />

      {/* Context Input Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional Context
          </label>
          <div className="flex items-center gap-3">
            {uploadedFiles.length > 0 && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
              </span>
            )}
            <span className={`text-xs transition-colors duration-200 ${
              context.length > 9000 ? 'text-red-500 dark:text-red-400' :
              context.length > 8000 ? 'text-orange-500 dark:text-orange-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {context.length}/10,000 characters
            </span>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="mb-3">
          <FileUpload
            onFileContent={handleFileUpload}
            disabled={isLoading}
          />
        </div>

        {/* Context Textarea */}
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value.slice(0, 10000))}
          placeholder="Type additional context, or upload files above..."
          className="w-full h-24 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none resize-none transition-colors duration-200"
          disabled={isLoading}
        />

        {/* Context Actions */}
        {(context || uploadedFiles.length > 0) && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-green-600 dark:text-green-400">
              ✓ Context will be included with your messages
            </span>
            <div className="flex gap-2">
              {uploadedFiles.length > 0 && (
                <button
                  onClick={() => {
                    setUploadedFiles([])
                    // Remove file content from context (basic implementation)
                    const contextLines = context.split('\n')
                    const filteredLines = contextLines.filter(line =>
                      !line.startsWith('--- File:') && !line.startsWith('--- End of')
                    )
                    setContext(filteredLines.join('\n').trim())
                  }}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200"
                  disabled={isLoading}
                >
                  Clear Files
                </button>
              )}
              <button
                onClick={() => {
                  setContext('')
                  setUploadedFiles([])
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
                disabled={isLoading}
              >
                Clear All
              </button>
            </div>
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
            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
              {m.role === 'assistant' ? cleanMessageContent(m.content) : m.content}
            </div>

            {/* Tool execution results */}
            {m.role === 'assistant' && Array.from(toolResults.entries()).some(([, result]) =>
              (result as {msgId?: string}).msgId === m.id
            ) && (
              <div className="mt-3 space-y-2">
                {Array.from(toolResults.entries())
                  .filter(([, result]) => (result as {msgId?: string}).msgId === m.id)
                  .map(([toolKey, result]) => {
                    const toolResult = result as {
                      msgId?: string
                      toolCall: { name: string; arguments: Record<string, unknown> }
                      success: boolean
                      result?: { data?: { results?: Array<{ title: string; url: string; snippet: string; source: string }> } }
                      error?: string
                      executionTime: number
                    }
                    return (
                      <div key={toolKey} className="p-3 bg-gray-50 dark:bg-gray-600 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Tool: {toolResult.toolCall.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {toolResult.executionTime}ms
                        </span>
                      </div>
                      {toolResult.success ? (
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {toolResult.toolCall.name === 'WebSearch' && toolResult.result?.data?.results && (
                            <div>
                              <p className="mb-2"><strong>Search Results:</strong></p>
                              {toolResult.result.data.results.slice(0, 3).map((res, idx: number) => (
                                <div key={idx} className="mb-2 p-2 bg-white dark:bg-gray-700 rounded">
                                  <a
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                                  >
                                    {res.title}
                                  </a>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{res.snippet}</div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{res.url}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-red-600 dark:text-red-400">
                          Error: {toolResult.error}
                        </div>
                      )}
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Show executing tools */}
            {m.role === 'assistant' && executingTools.size > 0 && (
              <div className="mt-3 space-y-2">
                {Array.from(executingTools).map(toolKey => (
                  <div key={toolKey} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        Executing {toolKey.split('_')[0]}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="mb-4 p-3 rounded-lg bg-white dark:bg-gray-700 mr-8 transition-colors duration-200">
            <div className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-1">Kimi AI</div>
            <div className="text-gray-500 dark:text-gray-400 italic">Thinking...</div>
          </div>
        )}
      </div>

      {/* Token estimation display */}
      {(estimatingTokens || tokenEstimate) && (
        <div className="mb-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between text-sm">
            {estimatingTokens ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 dark:text-blue-300">Estimating tokens...</span>
              </div>
            ) : tokenEstimate ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-4">
                  <span className="text-blue-700 dark:text-blue-300">
                    <strong>{tokenEstimate.total_tokens.toLocaleString()}</strong> tokens
                  </span>
                  {tokenEstimate.estimated_cost && (
                    <span className="text-blue-600 dark:text-blue-400">
                      ≈ <strong>${tokenEstimate.estimated_cost.toFixed(4)}</strong>
                    </span>
                  )}
                </div>
                <span className="text-xs text-blue-500 dark:text-blue-400">
                  Estimated cost for this request
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}

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
