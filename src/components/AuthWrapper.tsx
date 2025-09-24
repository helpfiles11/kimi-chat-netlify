'use client'
import React, { useState, useEffect } from 'react'

interface AuthWrapperProps {
  children: React.ReactNode
}

/**
 * Authentication Wrapper Component
 *
 * Provides simple password protection for the chat application.
 * The password is stored in environment variables and validated on both
 * client and server sides for security.
 *
 * Features:
 * - Session-based authentication (persists until browser close)
 * - Clean login interface
 * - Automatic redirect after successful authentication
 * - Protects API endpoints from unauthorized access
 */
export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on component mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('kimi-auth')
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  /**
   * Handle login form submission
   * Validates password against server endpoint and stores auth status
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        // Authentication successful
        sessionStorage.setItem('kimi-auth', 'authenticated')
        setIsAuthenticated(true)
      } else {
        // Authentication failed
        const data = await response.json()
        setError(data.error || 'Invalid password')
      }
    } catch {
      setError('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
      setPassword('')
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Access Required</h2>
            <p className="mt-2 text-gray-600">
              Enter password to access Kimi Chat
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                isLoading || !password.trim()
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? 'Authenticating...' : 'Access Chat'}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <p>This protects your API usage from unauthorized access.</p>
          </div>
        </div>
      </div>
    )
  }

  // Return the protected content if authenticated
  return <>{children}</>
}