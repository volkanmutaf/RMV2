'use client'

import { useState, useEffect } from 'react'
import { Transaction, Vehicle, Customer, VehicleStatus } from '@/generated/prisma'

interface TransactionWithRelations extends Transaction {
    vehicle: Vehicle
    customer: Customer
}

interface ArchiveTableProps {
    transactions: TransactionWithRelations[]
}

export default function ArchiveTable({ transactions: initialTransactions }: ArchiveTableProps) {
    const [transactions, setTransactions] = useState<TransactionWithRelations[]>(initialTransactions)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [sortBy, setSortBy] = useState('archivedAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [showUnarchiveConfirm, setShowUnarchiveConfirm] = useState(false)
    const [transactionToUnarchive, setTransactionToUnarchive] = useState<string | null>(null)
    const [showSuccessNotification, setShowSuccessNotification] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    // Update transactions when prop changes
    useEffect(() => {
        setTransactions(initialTransactions)
    }, [initialTransactions])

    const statusOptions = [
        { value: '', label: 'Select Status' },
        { value: 'AWAITING_STAMP', label: 'Awaiting Stamp' },
        { value: 'DEPOSIT', label: 'Deposit' },
        { value: 'INSPECTED', label: 'Inspected' },
        { value: 'OUT_OF_STATE', label: 'Out of State' },
        { value: 'PICKED_UP', label: 'Picked up' },
        { value: 'READY_FOR_INSPECTION', label: 'Ready For Inspection' },
        { value: 'READY_FOR_PICKUP', label: 'Ready for pick up' },
        { value: 'READY_FOR_REGISTRATION', label: 'Ready For Registration' },
        { value: 'REGISTERED', label: 'Registered' },
        { value: 'RE_INSPECTION', label: 'Re-inspection' },
        { value: 'TITLE_PENDING', label: 'Title Pending' },
        { value: 'TITLE_REQUESTED', label: 'Title Requested' },
        { value: 'TRANSFER_PLATE', label: 'Transfer Plate' }
    ]

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortOrder('desc')
        }
    }

    const getStatusColorClasses = (status: string) => {
        switch (status) {
            case 'REGISTERED':
                return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm'
            case 'PICKED_UP':
                return 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 shadow-sm'
            case 'INSPECTED':
                return 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200 shadow-sm'
            case 'TRANSFER_PLATE':
                return 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200 shadow-sm'
            case 'RE_INSPECTION':
                return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200 shadow-sm'
            case 'READY_FOR_PICKUP':
                return 'bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 border-teal-200 shadow-sm'
            case 'TITLE_PENDING':
                return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border-gray-300 shadow-sm'
            case 'AWAITING_STAMP':
                return 'bg-gradient-to-r from-pink-50 to-pink-100 text-pink-700 border-pink-200 shadow-sm'
            case 'TITLE_REQUESTED':
                return 'bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200 shadow-sm'
            case 'DEPOSIT':
                return 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 border-slate-200 shadow-sm'
            case 'READY_FOR_INSPECTION':
                return 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200 shadow-sm'
            case 'READY_FOR_REGISTRATION':
                return 'bg-gradient-to-r from-lime-50 to-lime-100 text-lime-700 border-lime-200 shadow-sm'
            case 'OUT_OF_STATE':
                return 'bg-gradient-to-r from-fuchsia-50 to-fuchsia-100 text-fuchsia-700 border-fuchsia-200 shadow-sm'
            default:
                return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200 shadow-sm'
        }
    }

    const formatDate = (date: Date | string | null) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        })
    }

    const calculateDaysSince = (date: Date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const transactionDate = new Date(date)
        transactionDate.setHours(0, 0, 0, 0)
        const diffTime = today.getTime() - transactionDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const formatVehicle = (vehicle: Vehicle) => {
        return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
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

            // Remove from local state
            setTransactions(prev => prev.filter(t => t.id !== transactionId))

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

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = searchTerm === '' ||
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

        return matchesSearch && matchesStatus
    })

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, filterStatus])

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
                aValue = a.customer.name.toLowerCase()
                bValue = b.customer.name.toLowerCase()
                break
            case 'vehicle':
                aValue = formatVehicle(a.vehicle).toLowerCase()
                bValue = formatVehicle(b.vehicle).toLowerCase()
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

    // Pagination Logic
    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Customer, VIN, Vehicle..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="no-status">No Status</option>
                            {statusOptions.filter(opt => opt.value !== '').map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setFilterStatus('')
                            }}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                    <div className="flex items-end justify-end">
                        <div className="bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                            <span className="text-xs text-slate-500 mr-2">Total Archived:</span>
                            <span className="text-sm font-bold text-slate-800">{transactions.length}</span>
                        </div>
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
                                        Date
                                        {sortBy === 'date' && (
                                            <span className="text-blue-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                                    Days
                                </th>
                                <th
                                    className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                                    onClick={() => handleSort('customer')}
                                >
                                    <div className="flex items-center gap-1">
                                        Customer
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
                                        Vehicle
                                        {sortBy === 'vehicle' && (
                                            <span className="text-blue-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                                    VIN
                                </th>
                                <th
                                    className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Status
                                        {sortBy === 'status' && (
                                            <span className="text-blue-300">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                                    Plate
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                                    Note
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                                    Contact
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                                    Ref
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentTransactions.map((transaction, index) => (
                                    <tr key={transaction.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="text-xs text-gray-900 font-medium">
                                                {formatDate(transaction.archivedAt)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="text-xs text-gray-900 font-medium">
                                                {formatDate(transaction.date)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="text-xs text-gray-900 font-medium">
                                                {(() => {
                                                    const days = calculateDaysSince(transaction.date)
                                                    if (days === 0) {
                                                        return <span className="text-green-600 font-semibold">Today</span>
                                                    } else if (days === 1) {
                                                        return <span className="text-blue-600 font-semibold">1 day</span>
                                                    } else if (days < 0) {
                                                        return <span className="text-gray-500">{Math.abs(days)} days ahead</span>
                                                    } else {
                                                        return <span className="text-gray-700">{days} days</span>
                                                    }
                                                })()}
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
                                            <div className="text-xs font-mono text-gray-600">
                                                {transaction.vehicle.vin || '-'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${getStatusColorClasses(transaction.status || '')}`}>
                                                {transaction.status ?
                                                    statusOptions.find(opt => opt.value === transaction.status)?.label ||
                                                    transaction.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                                                    : '-'
                                                }
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="text-xs font-semibold text-gray-900">
                                                {transaction.plate || '-'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap relative">
                                            {transaction.note ? (
                                                <>
                                                    <button
                                                        onMouseEnter={() => setHoveredNoteId(transaction.id)}
                                                        onMouseLeave={() => setHoveredNoteId(null)}
                                                        className="text-xs px-3 py-1 rounded transition-colors cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold"
                                                    >
                                                        📝 Note
                                                    </button>
                                                    {hoveredNoteId === transaction.id && (
                                                        <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-white border-2 border-blue-300 rounded-lg shadow-xl p-3">
                                                            <div className="text-xs font-semibold text-blue-600 mb-2">
                                                                📝 Note Preview:
                                                            </div>
                                                            <div className="text-xs text-gray-800 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                                {transaction.note}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
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
                                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                                                title="Unarchive this transaction"
                                            >
                                                📤 Unarchive
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
                                {searchTerm || filterStatus ? 'No matching archived records found' : 'No archived records found'}
                            </p>
                            <p className="text-gray-400 text-sm mb-4">
                                {searchTerm || filterStatus
                                    ? 'Try adjusting your search criteria or filters'
                                    : 'Archived transactions will appear here'
                                }
                            </p>
                            {(searchTerm || filterStatus) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('')
                                        setFilterStatus('')
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {/* Pagination Controls */}
                {sortedTransactions.length > 0 && (
                    <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow-md">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, sortedTransactions.length)}</span> of{' '}
                                    <span className="font-medium">{sortedTransactions.length}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNumber = i + 1
                                        // Logic to show limited page numbers (start, end, current, and surrounds)
                                        if (
                                            pageNumber === 1 ||
                                            pageNumber === totalPages ||
                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNumber
                                                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                        }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            )
                                        } else if (
                                            pageNumber === currentPage - 2 ||
                                            pageNumber === currentPage + 2
                                        ) {
                                            return (
                                                <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                                    ...
                                                </span>
                                            )
                                        }
                                        return null
                                    })}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
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
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${successMessage.includes('Error')
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
