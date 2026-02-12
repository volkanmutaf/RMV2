'use client'

import { useState, useEffect } from 'react'
import ArchiveTable from '@/components/ArchiveTable'
import { Transaction, Vehicle, Customer } from '@/generated/prisma'

interface TransactionWithRelations extends Transaction {
  vehicle: Vehicle
  customer: Customer
}

export default function ArchivePage() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArchivedTransactions()
  }, [])

  const fetchArchivedTransactions = async () => {
    try {
      const response = await fetch('/api/transactions/archived')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching archived transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading archived transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-2 sm:px-4 py-2 sm:py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-lg border border-slate-600 overflow-hidden">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  ← Back
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    📁 Archive
                  </h1>
                  <p className="text-sm text-slate-300">Archived Transactions</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-slate-600/50 backdrop-blur-sm rounded-lg px-3 py-1">
                  <div className="text-xs text-slate-300">Total</div>
                  <div className="text-lg font-bold text-white">{transactions.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ArchiveTable transactions={transactions} />

    </div>
  )
}
