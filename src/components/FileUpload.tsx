'use client'
import React, { useRef, useState } from 'react'

interface FileUploadProps {
  onFileContent: (content: string, filename: string) => void
  disabled?: boolean
}

const SUPPORTED_TYPES = {
  'text/plain': ['.txt'],
  'text/markdown': ['.md', '.markdown'],
  'application/json': ['.json'],
  'text/javascript': ['.js', '.jsx', '.ts', '.tsx'],
  'text/x-python': ['.py'],
  'text/x-java': ['.java'],
  'text/x-c': ['.c', '.h'],
  'text/x-c++': ['.cpp', '.cc', '.cxx', '.hpp'],
  'text/css': ['.css'],
  'text/html': ['.html', '.htm'],
  'text/xml': ['.xml'],
  'application/x-yaml': ['.yml', '.yaml']
}

const MAX_FILE_SIZE = 1024 * 1024 // 1MB

export default function FileUpload({ onFileContent, disabled = false }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const isSupported = Object.values(SUPPORTED_TYPES).some(exts =>
      exts.includes(extension)
    )

    if (!isSupported) {
      return 'Unsupported file type. Please use text, markdown, or code files.'
    }

    return null
  }

  const processFile = async (file: File) => {
    setUploading(true)
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setUploading(false)
      return
    }

    try {
      const content = await file.text()
      if (content.length > 50000) { // Same limit as context
        setError('File content too long. Maximum 50,000 characters.')
        return
      }

      onFileContent(content, file.name)
    } catch (err) {
      setError('Failed to read file. Please try again.')
      console.error('File read error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || uploading) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await processFile(files[0]) // Process first file only
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const supportedExtensions = Object.values(SUPPORTED_TYPES).flat().join(', ')

  return (
    <div className="space-y-2">
      {/* File upload area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
          ${dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${uploading ? 'pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={supportedExtensions}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />

        <div className="space-y-2">
          {uploading ? (
            <div className="text-blue-600 dark:text-blue-400">
              <div className="w-5 h-5 mx-auto mb-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Reading file...</p>
            </div>
          ) : (
            <>
              <div className="text-gray-500 dark:text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium">Drop a file here or click to browse</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Supports: {supportedExtensions}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Max size: 1MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
}