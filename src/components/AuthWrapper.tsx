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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors duration-200">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Access Required</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded transition-colors duration-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                isLoading || !password.trim()
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600'
              }`}
            >
              {isLoading ? 'Authenticating...' : 'Access Chat'}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>This protects your API usage from unauthorized access.</p>
          </div>
        </div>
      </div>
    )
  }

  // Return the protected content if authenticated
  return <>{children}</>
}