'use client'
import React, { useRef, useState } from 'react'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: 'local' | 'server'
  content?: string // For local files
  file_id?: string // For server-uploaded files
  created_at: string
}

interface EnhancedFileUploadProps {
  onFileContent: (content: string, filename: string) => void
  onServerFileUpload?: (fileData: UploadedFile) => void
  disabled?: boolean
  uploadMode?: 'local' | 'server' | 'both'
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
  'application/x-yaml': ['.yml', '.yaml'],
  'text/csv': ['.csv'],
  'application/pdf': ['.pdf']
}

const MAX_LOCAL_FILE_SIZE = 1024 * 1024 // 1MB for local processing
const MAX_SERVER_FILE_SIZE = 100 * 1024 * 1024 // 100MB for server upload

export default function EnhancedFileUpload({
  onFileContent,
  onServerFileUpload,
  disabled = false,
  uploadMode = 'both'
}: EnhancedFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadType, setUploadType] = useState<'local' | 'server'>('local')

  const validateFile = (file: File, forServer: boolean = false): string | null => {
    const maxSize = forServer ? MAX_SERVER_FILE_SIZE : MAX_LOCAL_FILE_SIZE

    if (file.size > maxSize) {
      return `File too large. Maximum size is ${maxSize / 1024 / 1024}MB ${forServer ? 'for server upload' : 'for local processing'}`
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const isSupported = Object.values(SUPPORTED_TYPES).some(exts =>
      exts.includes(extension)
    )

    if (!isSupported) {
      return 'Unsupported file type. Please use text, markdown, code, or PDF files.'
    }

    return null
  }

  const processLocalFile = async (file: File) => {
    const validationError = validateFile(file, false)
    if (validationError) {
      setError(validationError)
      return false
    }

    try {
      const content = await file.text()
      if (content.length > 50000) {
        setError('File content too long. Maximum 50,000 characters for local processing.')
        return false
      }

      onFileContent(content, file.name)
      return true
    } catch {
      setError('Failed to read file content locally.')
      return false
    }
  }

  const processServerFile = async (file: File) => {
    const validationError = validateFile(file, true)
    if (validationError) {
      setError(validationError)
      return false
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        const uploadedFile: UploadedFile = {
          id: result.data.file_id,
          name: result.data.filename,
          size: result.data.bytes,
          type: 'server',
          file_id: result.data.file_id,
          created_at: result.data.created_at
        }

        onServerFileUpload?.(uploadedFile)
        return true
      } else {
        setError(result.error || 'Failed to upload file to server')
        return false
      }
    } catch {
      setError('Network error during server upload')
      return false
    }
  }

  const processFile = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      let success = false

      if (uploadType === 'local') {
        success = await processLocalFile(file)
      } else if (uploadType === 'server') {
        success = await processServerFile(file)
      }

      if (success) {
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
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
      await processFile(files[0])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
  }

  const openFileDialog = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const supportedExtensions = Object.values(SUPPORTED_TYPES).flat().join(', ')

  return (
    <div className="space-y-3">
      {/* Upload mode selector */}
      {uploadMode === 'both' && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload mode:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUploadType('local')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                uploadType === 'local'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              disabled={disabled || uploading}
            >
              Local (1MB, immediate)
            </button>
            <button
              type="button"
              onClick={() => setUploadType('server')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                uploadType === 'server'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              disabled={disabled || uploading}
            >
              Server (100MB, persistent)
            </button>
          </div>
        </div>
      )}

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
              <p className="text-sm">
                {uploadType === 'server' ? 'Uploading to server...' : 'Reading file...'}
              </p>
            </div>
          ) : (
            <>
              <div className="text-gray-500 dark:text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium">Drop a file here or click to browse</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {uploadType === 'local'
                    ? `Local: ${supportedExtensions}, Max 1MB`
                    : `Server: ${supportedExtensions}, Max 100MB`
                  }
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {uploadType === 'server' && 'Files uploaded to server are persistent across sessions'}
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