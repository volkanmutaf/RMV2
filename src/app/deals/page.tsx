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
  const [editingAmount, setEditingAmount] = useState<{ [key: string]: string }>({})
  const [editingDeal, setEditingDeal] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ dealNumber: string, type: string, insurance: string }>({ dealNumber: '', type: '', insurance: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  // Admin or Manager can access
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'

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
        fetchDeals()
      })
      .catch(() => {
        router.push('/')
      })
  }, [router])

  const fetchDeals = () => {
    fetch('/api/deals')
      .then(res => res.json())
      .then(data => {
        setDeals(data)
        const unread = data.filter((deal: Deal) => !deal.readByAdmin).length
        setUnreadCount(unread)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching deals:', err)
        setLoading(false)
      })
  }

  const handleAmountChange = async (dealId: string, newAmount: string) => {
    try {
      const amount = newAmount === '' ? null : parseFloat(newAmount)

      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      if (!response.ok) throw new Error('Failed to update amount')

      const updatedDeal = await response.json()
      setDeals(prev => prev.map(d => d.id === dealId ? updatedDeal : d))
      setEditingAmount(prev => {
        const updated = { ...prev }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) throw new Error('Failed to update deal')

      const updatedDeal = await response.json()
      setDeals(prev => prev.map(d => d.id === dealId ? updatedDeal : d))
      setEditingDeal(null)
      setEditForm({ dealNumber: '', type: '', insurance: '' })
    } catch (error) {
      console.error('Failed to update deal:', error)
      alert('Failed to update deal')
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return

    try {
      const response = await fetch(`/api/deals/${dealId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete deal')
      setDeals(prev => prev.filter(d => d.id !== dealId))
    } catch (error) {
      console.error('Failed to delete deal:', error)
      alert('Failed to delete deal')
    }
  }

  const handleToggleRead = async (deal: Deal) => {
    try {
      // Optimistic update
      setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, readByAdmin: !d.readByAdmin } : d))
      setUnreadCount(prev => deal.readByAdmin ? prev + 1 : prev - 1)

      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readByAdmin: !deal.readByAdmin }),
      })

      if (!response.ok) {
        // Revert on failure
        setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, readByAdmin: deal.readByAdmin } : d))
        setUnreadCount(prev => deal.readByAdmin ? prev - 1 : prev + 1)
        throw new Error('Failed to update read status')
      }
    } catch (error) {
      console.error('Failed to update read status:', error)
    }
  }

  // Filter deals
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
  const dealsByUser: { [key: string]: Deal[] } = {}
  filteredDeals.forEach(deal => {
    const userName = deal.createdBy.name
    if (!dealsByUser[userName]) dealsByUser[userName] = []
    dealsByUser[userName].push(deal)
  })

  // Calculate totals
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

  // Grand totals
  const grandTotal = filteredDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded shadow text-sm font-medium transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Deals Report
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="bg-white px-4 py-2 rounded shadow text-sm font-medium text-gray-700">
              Total: <span className="text-green-600 font-bold">${grandTotal.toFixed(2)}</span>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {Object.keys(dealsByUser).length === 0 ? (
          <div className="bg-white rounded p-12 text-center shadow">
            <p className="text-gray-500">No deals found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* User Columns */}
            {Object.entries(dealsByUser).map(([userName, userDeals]) => {
              const totals = calculateTotals(userDeals)
              return (
                <div key={userName} className="bg-white rounded-lg shadow border border-gray-200 flex flex-col h-fit">
                  {/* User Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
                    <div>
                      <h2 className="font-bold text-gray-800 text-sm">{userName}</h2>
                      <div className="text-xs text-gray-500">{userDeals.length} Deals</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-green-600">${totals.total.toFixed(0)}</div>
                    </div>
                  </div>

                  {/* Deals List */}
                  <div className="p-2 space-y-2">
                    {userDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className={`border rounded p-2 text-xs relative ${deal.readByAdmin ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                          } hover:shadow-sm transition-shadow`}
                      >
                        {/* Row 1: Deal Number, Type, Controls */}
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            {/* Matched Indicator */}
                            {deal.vehicle && (
                              <span title="Added to Main List" className="text-green-500 font-bold text-sm">✓</span>
                            )}
                            {/* Deal Number */}
                            {editingDeal === deal.id ? (
                              <input
                                className="w-12 border rounded px-1"
                                value={editForm.dealNumber}
                                onChange={e => setEditForm({ ...editForm, dealNumber: e.target.value })}
                              />
                            ) : (
                              <span className="font-bold text-gray-800">#{deal.dealNumber}</span>
                            )}
                            {/* Type Badge */}
                            {editingDeal === deal.id ? (
                              <select
                                value={editForm.type}
                                onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                className="border rounded px-0 py-0"
                              >
                                <option value="DEPOSIT">Dep</option>
                                <option value="DEAL">Deal</option>
                              </select>
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold ${deal.type === 'DEPOSIT' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {deal.type === 'DEPOSIT' ? 'DEP' : 'DEAL'}
                              </span>
                            )}
                          </div>

                          {/* Right Side: Manual Tick & Actions */}
                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <>
                                {editingDeal === deal.id ? (
                                  <>
                                    <button onClick={() => handleSaveEdit(deal.id)} className="text-green-600 hover:text-green-800">✓</button>
                                    <button onClick={() => setEditingDeal(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleToggleRead(deal)}
                                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${deal.readByAdmin ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-gray-300 text-transparent hover:border-gray-400'
                                        }`}
                                      title="Mark as Processed"
                                    >
                                      <span className="text-[10px]">✓</span>
                                    </button>
                                    <button onClick={() => handleEditDeal(deal)} className="text-blue-400 hover:text-blue-600 ml-1">✎</button>
                                    <button onClick={() => handleDeleteDeal(deal.id)} className="text-red-400 hover:text-red-600">×</button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Vehicle & Insurance */}
                        <div className="grid grid-cols-1 gap-0.5 text-[10px] text-gray-500 pl-0.5 border-l-2 border-gray-100 mb-1">
                          {deal.vehicle ? (
                            <div className="truncate text-gray-700">
                              {deal.vehicle.year} {deal.vehicle.make} {deal.vehicle.model}
                            </div>
                          ) : (
                            <div className="italic text-gray-400">No Vehicle Match</div>
                          )}

                          {editingDeal === deal.id ? (
                            <input
                              className="w-full border rounded px-1"
                              placeholder="Insurance"
                              value={editForm.insurance}
                              onChange={e => setEditForm({ ...editForm, insurance: e.target.value })}
                            />
                          ) : (
                            deal.insurance && <div className="text-orange-600 truncate">{deal.insurance}</div>
                          )}
                        </div>

                        {/* Row 3: Amount */}
                        <div className="flex justify-end items-center">
                          {editingAmount[deal.id] !== undefined ? (
                            <input
                              autoFocus
                              type="number"
                              className="w-20 text-right border rounded px-1 text-xs"
                              value={editingAmount[deal.id]}
                              onChange={e => setEditingAmount({ ...editingAmount, [deal.id]: e.target.value })}
                              onBlur={() => handleAmountChange(deal.id, editingAmount[deal.id])}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleAmountChange(deal.id, editingAmount[deal.id])
                                if (e.key === 'Escape') {
                                  const newAmts = { ...editingAmount };
                                  delete newAmts[deal.id];
                                  setEditingAmount(newAmts);
                                }
                              }}
                            />
                          ) : (
                            <div
                              onClick={() => setEditingAmount({ ...editingAmount, [deal.id]: deal.amount?.toString() || '' })}
                              className={`cursor-pointer font-bold ${deal.amount ? 'text-gray-800' : 'text-gray-300'}`}
                            >
                              {deal.amount ? `$${deal.amount.toFixed(2)}` : '$ -'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
