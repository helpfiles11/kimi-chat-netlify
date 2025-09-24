'use client'
import React, { useState, useEffect } from 'react'

interface BalanceData {
  available_balance: number
  voucher_balance: number
  cash_balance: number
  status_text: string
  last_updated: string
}

interface TokenEstimate {
  total_tokens: number
  estimated_cost?: number
  model: string
}

interface UsageInfoProps {
  className?: string
}

export default function UsageInfo({ className = '' }: UsageInfoProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/balance')
      const result = await response.json()

      if (result.success) {
        setBalance(result.data)
      } else {
        setError(result.error || 'Failed to fetch balance')
      }
    } catch (err) {
      setError('Network error while fetching balance')
      console.error('Balance fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch balance on component mount
  useEffect(() => {
    fetchBalance()
  }, [])

  // Auto-refresh balance every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchBalance, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount)
  }

  const getBalanceColor = (balance: number) => {
    if (balance <= 0) return 'text-red-600 dark:text-red-400'
    if (balance < 1) return 'text-orange-600 dark:text-orange-400'
    if (balance < 5) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  if (loading && !balance) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading balance...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          <button
            onClick={fetchBalance}
            className="text-xs text-red-600 dark:text-red-400 hover:underline"
            disabled={loading}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!balance) return null

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border space-y-2 ${className}`}>
      {/* Balance Information */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Balance</span>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Available</span>
          <span className={`font-semibold ${getBalanceColor(balance.available_balance)}`}>
            {formatCurrency(balance.available_balance)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Voucher</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {formatCurrency(balance.voucher_balance)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400">Cash</span>
          <span className={`font-medium ${balance.cash_balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {formatCurrency(balance.cash_balance)}
          </span>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className={`text-xs font-medium ${getBalanceColor(balance.available_balance)}`}>
          {balance.status_text}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Updated: {new Date(balance.last_updated).toLocaleTimeString()}
        </span>
      </div>

    </div>
  )
}

// Export function to update token estimate from parent components
export const updateTokenEstimate = (estimate: TokenEstimate) => {
  // This would be handled by a global state management solution in a real app
  // For now, we'll pass it as props or use local storage
  localStorage.setItem('lastTokenEstimate', JSON.stringify(estimate))
}