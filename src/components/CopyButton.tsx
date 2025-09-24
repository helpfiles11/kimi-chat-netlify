'use client'
import React, { useState } from 'react'

interface CopyButtonProps {
  text: string
  className?: string
}

/**
 * Copy Button Component
 *
 * Ultra-lightweight copy button using native clipboard API.
 * No external dependencies - uses CSS for icons and native browser functionality.
 *
 * Features:
 * - Native clipboard API for secure copying
 * - Visual feedback with temporary state change
 * - Accessible with proper ARIA labels
 * - CSS-only icons (no icon library needed)
 */
export default function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
      // Fallback for older browsers or security restrictions
      fallbackCopy(text)
    }
  }

  // Fallback copy method for browsers that don't support clipboard API
  const fallbackCopy = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Fallback copy failed:', err)
    }

    document.body.removeChild(textArea)
  }

  return (
    <button
      onClick={handleCopy}
      className={`
        inline-flex items-center justify-center p-2 rounded-md text-sm
        transition-colors duration-200 border border-transparent
        hover:bg-gray-100 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${copied
          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
          : 'text-gray-500 dark:text-gray-400'
        }
        ${className}
      `}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
    >
      {copied ? (
        // Checkmark icon (CSS only)
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
        </svg>
      ) : (
        // Copy icon (CSS only)
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
        </svg>
      )}
      {copied && (
        <span className="ml-1 text-xs font-medium">Copied!</span>
      )}
    </button>
  )
}