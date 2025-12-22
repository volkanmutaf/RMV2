'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  date: string
  payment: string
  tax: number | null
  status: string | null
  plate: string | null
  note: string | null
  ref: string | null
  archived: boolean
  archivedAt: string | null
  vehicle: {
    id: string
    year: string
    make: string
    model: string
    color: string
    vin: string | null
  }
  customer: {
    id: string
    name: string
    contact: string | null
  }
}

export default function ArchivePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [sortBy, setSortBy] = useState('archivedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showUnarchiveConfirm, setShowUnarchiveConfirm] = useState(false)
  const [transactionToUnarchive, setTransactionToUnarchive] = useState<string | null>(null)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatVehicle = (vehicle: any) => {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.color})`
  }

  const handleUnarchive = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/archive`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to unarchive transaction')
      }
      
      setSuccessMessage('Transaction unarchived successfully!')
      setShowSuccessNotification(true)
      
      // Refresh the data
      fetchArchivedTransactions()
      
    } catch (error) {
      console.error('Error unarchiving transaction:', error)
      setSuccessMessage('Error unarchiving transaction. Please try again.')
      setShowSuccessNotification(true)
    }
  }

  const confirmUnarchive = (transactionId: string) => {
    setTransactionToUnarchive(transactionId)
    setShowUnarchiveConfirm(true)
  }

  const executeUnarchive = () => {
    if (transactionToUnarchive) {
      handleUnarchive(transactionToUnarchive)
      setShowUnarchiveConfirm(false)
      setTransactionToUnarchive(null)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatVehicle(transaction.vehicle).toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.ref?.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesStatus = true
    if (filterStatus === 'no-status') {
      matchesStatus = !transaction.status
    } else if (filterStatus !== '') {
      matchesStatus = transaction.status === filterStatus
    }
    
    let matchesPayment = true
    if (filterPayment !== '') {
      matchesPayment = transaction.payment === filterPayment
    }
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
        break
      case 'archivedAt':
        aValue = new Date(a.archivedAt || '').getTime()
        bValue = new Date(b.archivedAt || '').getTime()
        break
      case 'customer':
        aValue = a.customer.name
        bValue = b.customer.name
        break
      case 'vehicle':
        aValue = formatVehicle(a.vehicle)
        bValue = formatVehicle(b.vehicle)
        break
      case 'payment':
        aValue = a.payment
        bValue = b.payment
        break
      case 'status':
        aValue = a.status || ''
        bValue = b.status || ''
        break
      default:
        aValue = a[sortBy as keyof Transaction] || ''
        bValue = b[sortBy as keyof Transaction] || ''
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

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
              <div className="mb-4 sm:mb-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  📁 Archive
                </h1>
                <p className="text-sm text-slate-300">Archived Transactions</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-slate-600/50 backdrop-blur-sm rounded-lg px-3 py-1">
                  <div className="text-xs text-slate-300">Total</div>
                  <div className="text-lg font-bold text-white">{transactions.length}</div>
                </div>
                <div className="bg-slate-600/50 backdrop-blur-sm rounded-lg px-3 py-1">
                  <div className="text-xs text-slate-300">Filtered</div>
                  <div className="text-sm font-semibold text-blue-300">{filteredTransactions.length}</div>
                </div>
                <button
                  onClick={() => window.open('/', '_blank')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  ➕ Add New
                </button>
                <button
                  onClick={() => window.close()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  ← Back to Main
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Customer, VIN, Vehicle..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="no-status">No Status</option>
              <option value="REGISTERED">Registered</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="INSPECTED">Inspected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('')
                setFilterPayment('')
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gradient-to-r from-slate-700 to-slate-600 shadow-md">
              <tr>
                <th 
                  className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                  onClick={() => handleSort('archivedAt')}
                >
                  <div className="flex items-center gap-1">
                    Archived Date
                    {sortBy === 'archivedAt' && (
                      <span className="text-blue-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    📅 Date
                    {sortBy === 'date' && (
                      <span className="text-blue-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                  onClick={() => handleSort('customer')}
                >
                  <div className="flex items-center gap-1">
                    👤 Customer
                    {sortBy === 'customer' && (
                      <span className="text-blue-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                  onClick={() => handleSort('vehicle')}
                >
                  <div className="flex items-center gap-1">
                    🚗 Vehicle
                    {sortBy === 'vehicle' && (
                      <span className="text-blue-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                  🔢 VIN
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                  onClick={() => handleSort('payment')}
                >
                  <div className="flex items-center gap-1">
                    💰 Payment
                    {sortBy === 'payment' && (
                      <span className="text-blue-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                  💵 Tax
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    📋 Status
                    {sortBy === 'status' && (
                      <span className="text-blue-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                  🏷️ Plate
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                  📝 Note
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                  📞 Contact
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                  🔗 Ref
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedTransactions.map((transaction, index) => (
                <tr key={transaction.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900 font-medium">
                      {transaction.archivedAt ? formatDate(transaction.archivedAt) : '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900 font-medium">
                      {formatDate(transaction.date)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900 font-medium">
                      {transaction.customer.name}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {formatVehicle(transaction.vehicle)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-600 font-mono">
                      {transaction.vehicle.vin || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.payment}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.tax ? `$${transaction.tax.toFixed(2)}` : '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.status || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.plate || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.note || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-600 font-mono">
                      {transaction.customer.contact || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.ref || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => confirmUnarchive(transaction.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                      title="Unarchive this transaction"
                    >
                      📤
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-gray-600 text-xl font-semibold mb-2">
                {searchTerm || filterStatus || filterPayment ? 'No matching archived records found' : 'No archived records found'}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {searchTerm || filterStatus || filterPayment 
                  ? 'Try adjusting your search criteria or filters' 
                  : 'Archived transactions will appear here'
                }
              </p>
              {(searchTerm || filterStatus || filterPayment) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterStatus('')
                    setFilterPayment('')
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Unarchive Confirmation Modal */}
      {showUnarchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-4 text-green-500">📤</div>
              <h3 className="text-lg font-semibold mb-2 text-green-600">Unarchive Transaction</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to unarchive this transaction? It will be moved back to the main table.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUnarchiveConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeUnarchive}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Unarchive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Notification Modal */}
      {showSuccessNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className={`text-4xl mb-4 ${successMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {successMessage.includes('Error') ? '❌' : '✅'}
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${successMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {successMessage.includes('Error') ? 'Error' : 'Success'}
              </h3>
              <p className="text-gray-700 mb-4">{successMessage}</p>
              <button
                onClick={() => setShowSuccessNotification(false)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  successMessage.includes('Error') 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
