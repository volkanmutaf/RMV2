'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Deal {
  id: string
  dealNumber: string
  type: 'DEPOSIT' | 'DEAL'
  amount: number | null
  insurance: string | null
  readByAdmin: boolean
  createdBy: {
    id: string
    username: string
    name: string
  }
  createdAt: string
  updatedAt: string
  vehicle: {
    year: string
    make: string
    model: string
    vin: string | null
  } | null
}

interface UserSession {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'EDITOR' | 'VIEWER'
}

export default function DealsPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingAmount, setEditingAmount] = useState<{[key: string]: string}>({})
  const [editingDeal, setEditingDeal] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{dealNumber: string, type: string, insurance: string}>({dealNumber: '', type: '', insurance: ''})
  const [searchTerm, setSearchTerm] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const isAdmin = currentUser?.role === 'ADMIN'
  
  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data || !data.user || (data.user.role !== 'ADMIN' && data.user.role !== 'MANAGER')) {
          router.push('/')
          return
        }
        setCurrentUser(data.user)
        
        // Fetch deals
        fetch('/api/deals')
          .then(res => res.json())
          .then(data => {
            setDeals(data)
            // Count unread deals before they are marked as read
            const unread = data.filter((deal: Deal) => !deal.readByAdmin).length
            setUnreadCount(unread)
            setLoading(false)
          })
          .catch(err => {
            console.error('Error fetching deals:', err)
            setLoading(false)
          })
      })
      .catch(() => {
        router.push('/')
      })
  }, [router])
  
  const handleAmountChange = async (dealId: string, newAmount: string) => {
    try {
      const amount = newAmount === '' ? null : parseFloat(newAmount)
      
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update amount')
      }
      
      const updatedDeal = await response.json()
      setDeals(prev => prev.map(d => d.id === dealId ? updatedDeal : d))
      setEditingAmount(prev => {
        const updated = {...prev}
        delete updated[dealId]
        return updated
      })
    } catch (error) {
      console.error('Failed to update amount:', error)
      alert('Failed to update amount')
    }
  }

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal.id)
    setEditForm({
      dealNumber: deal.dealNumber,
      type: deal.type,
      insurance: deal.insurance || ''
    })
  }

  const handleSaveEdit = async (dealId: string) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update deal')
      }
      
      const updatedDeal = await response.json()
      setDeals(prev => prev.map(d => d.id === dealId ? updatedDeal : d))
      setEditingDeal(null)
      setEditForm({dealNumber: '', type: '', insurance: ''})
    } catch (error) {
      console.error('Failed to update deal:', error)
      alert('Failed to update deal')
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete deal')
      }
      
      setDeals(prev => prev.filter(d => d.id !== dealId))
    } catch (error) {
      console.error('Failed to delete deal:', error)
      alert('Failed to delete deal')
    }
  }
  
  // Filter deals based on search term
  const filteredDeals = deals.filter(deal => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      deal.dealNumber.toLowerCase().includes(search) ||
      deal.createdBy.name.toLowerCase().includes(search) ||
      deal.type.toLowerCase().includes(search) ||
      (deal.insurance && deal.insurance.toLowerCase().includes(search)) ||
      (deal.vehicle && (
        deal.vehicle.year.toLowerCase().includes(search) ||
        deal.vehicle.make.toLowerCase().includes(search) ||
        deal.vehicle.model.toLowerCase().includes(search) ||
        (deal.vehicle.vin && deal.vehicle.vin.toLowerCase().includes(search))
      ))
    )
  })
  
  // Group deals by user
  const dealsByUser: {[key: string]: Deal[]} = {}
  filteredDeals.forEach(deal => {
    const userName = deal.createdBy.name
    if (!dealsByUser[userName]) {
      dealsByUser[userName] = []
    }
    dealsByUser[userName].push(deal)
  })

  // Calculate totals for each user
  const calculateTotals = (userDeals: Deal[]) => {
    const total = userDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0)
    const depositTotal = userDeals
      .filter(d => d.type === 'DEPOSIT')
      .reduce((sum, deal) => sum + (deal.amount || 0), 0)
    const dealTotal = userDeals
      .filter(d => d.type === 'DEAL')
      .reduce((sum, deal) => sum + (deal.amount || 0), 0)
    return { total, depositTotal, dealTotal }
  }

  // Calculate grand total
  const grandTotal = filteredDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0)
  const grandDepositTotal = filteredDeals
    .filter(d => d.type === 'DEPOSIT')
    .reduce((sum, deal) => sum + (deal.amount || 0), 0)
  const grandDealTotal = filteredDeals
    .filter(d => d.type === 'DEAL')
    .reduce((sum, deal) => sum + (deal.amount || 0), 0)
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading deals...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg cursor-pointer"
              >
                ← Back to Main
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">📊 Deals Report</h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                    {unreadCount} New
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Search by deal number, user name, type, vehicle, insurance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500 shadow-sm"
            />
          </div>
        </div>
        
        {Object.keys(dealsByUser).length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-xl font-semibold">No deals found</p>
            <p className="text-gray-400 text-sm mt-2">Deals will appear here when added.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Cards - Vertical Layout */}
            {Object.entries(dealsByUser).map(([userName, userDeals]) => {
              const totals = calculateTotals(userDeals)
              return (
                <div key={userName} className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
                  {/* User Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 border-b-2 border-blue-700">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-white">
                        👤 {userName}
                      </h2>
                      <div className="text-white text-sm font-semibold">
                        {userDeals.length} {userDeals.length === 1 ? 'Deal' : 'Deals'}
                      </div>
                    </div>
                  </div>

                  {/* Deals List */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {userDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50 relative"
                        >
                          {isAdmin && (
                            <div className="absolute top-2 right-2 flex gap-2">
                              {editingDeal === deal.id ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(deal.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                                  >
                                    ✓ Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingDeal(null)
                                      setEditForm({dealNumber: '', type: '', insurance: ''})
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                                  >
                                    ✕ Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditDeal(deal)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDeal(deal.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                                  >
                                    🗑️ Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Deal Number & Type */}
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-gray-500 uppercase">Deal #</div>
                              {editingDeal === deal.id ? (
                                <>
                                  <input
                                    type="text"
                                    value={editForm.dealNumber}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                                      setEditForm({...editForm, dealNumber: value})
                                    }}
                                    className="w-full px-2 py-1 border-2 border-blue-300 rounded text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0000"
                                    maxLength={4}
                                  />
                                  <select
                                    value={editForm.type}
                                    onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                                    className="w-full px-2 py-1 border-2 border-blue-300 rounded text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="DEPOSIT">DEPOSIT</option>
                                    <option value="DEAL">DEAL</option>
                                  </select>
                                </>
                              ) : (
                                <>
                                  <div className="text-lg font-bold text-gray-900">{deal.dealNumber}</div>
                                  <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      deal.type === 'DEPOSIT' 
                                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                        : 'bg-green-100 text-green-800 border border-green-300'
                                    }`}>
                                      {deal.type}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Vehicle Info */}
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-gray-500 uppercase">Vehicle</div>
                              {deal.vehicle ? (
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {deal.vehicle.year} {deal.vehicle.make} {deal.vehicle.model}
                                  </div>
                                  {deal.vehicle.vin && (
                                    <div className="text-xs text-gray-500 font-mono mt-1">
                                      VIN: {deal.vehicle.vin}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-sm">No vehicle matched</span>
                              )}
                            </div>

                            {/* Insurance */}
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-gray-500 uppercase">Insurance</div>
                              {editingDeal === deal.id ? (
                                <input
                                  type="text"
                                  value={editForm.insurance}
                                  onChange={(e) => setEditForm({...editForm, insurance: e.target.value})}
                                  className="w-full px-2 py-1 border-2 border-blue-300 rounded text-sm font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Insurance info..."
                                />
                              ) : (
                                deal.insurance ? (
                                  <div className="text-sm font-medium text-gray-900 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                                    {deal.insurance}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic text-sm">Not provided</span>
                                )
                              )}
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-gray-500 uppercase">Amount</div>
                              {editingAmount[deal.id] !== undefined ? (
                                <input
                                  type="number"
                                  value={editingAmount[deal.id]}
                                  onChange={(e) => setEditingAmount(prev => ({
                                    ...prev,
                                    [deal.id]: e.target.value
                                  }))}
                                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0.00"
                                  step="0.01"
                                  autoFocus
                                  onBlur={() => {
                                    handleAmountChange(deal.id, editingAmount[deal.id])
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAmountChange(deal.id, editingAmount[deal.id])
                                    } else if (e.key === 'Escape') {
                                      setEditingAmount(prev => {
                                        const updated = {...prev}
                                        delete updated[deal.id]
                                        return updated
                                      })
                                    }
                                  }}
                                />
                              ) : (
                                <div
                                  className="cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors text-sm font-semibold text-gray-700"
                                  onClick={() => {
                                    setEditingAmount(prev => ({
                                      ...prev,
                                      [deal.id]: deal.amount?.toString() || ''
                                    }))
                                  }}
                                >
                                  {deal.amount !== null ? `$${deal.amount.toFixed(2)}` : 'Click to add amount'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Created At */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-xs text-gray-500">
                              Created: {new Date(deal.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* User Totals */}
                    <div className="mt-6 pt-4 border-t-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Deposit Total</div>
                          <div className="text-2xl font-bold text-blue-600">${totals.depositTotal.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Deal Total</div>
                          <div className="text-2xl font-bold text-green-600">${totals.dealTotal.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Grand Total</div>
                          <div className="text-2xl font-bold text-gray-900">${totals.total.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Grand Total Summary */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-xl p-6 border-2 border-indigo-700">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">📊 Grand Total Summary</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center border border-white/30">
                  <div className="text-sm font-semibold text-white/90 uppercase mb-2">Total Deposits</div>
                  <div className="text-3xl font-bold text-white">${grandDepositTotal.toFixed(2)}</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center border border-white/30">
                  <div className="text-sm font-semibold text-white/90 uppercase mb-2">Total Deals</div>
                  <div className="text-3xl font-bold text-white">${grandDealTotal.toFixed(2)}</div>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center border-2 border-white/50">
                  <div className="text-sm font-semibold text-white uppercase mb-2">Grand Total</div>
                  <div className="text-4xl font-bold text-white">${grandTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
