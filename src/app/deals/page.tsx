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
  const totalCount = filteredDeals.length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
      <div className="max-w-[1920px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="text-slate-500 hover:text-slate-800 transition-colors"
                title="Back to Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Deals Report</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                  {unreadCount} New
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm ml-9">Manage and track deposit and deal records across the team.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Stats Card */}
            <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Total Volume</p>
                <p className="text-2xl font-bold text-emerald-600">${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Deals</p>
                <p className="text-lg font-bold text-slate-700">{totalCount}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search deals, plates, names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        {Object.keys(dealsByUser).length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-200">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">No deals found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search terms or create a new deal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {Object.entries(dealsByUser).map(([userName, userDeals]) => {
              const totals = calculateTotals(userDeals)
              return (
                <div key={userName} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-fit overflow-hidden">
                  {/* User Column Header */}
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-800 text-sm leading-tight">{userName}</h2>
                        <p className="text-xs text-slate-500">{userDeals.length} Records</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-600">${totals.total.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Total</div>
                    </div>
                  </div>

                  {/* Deals List */}
                  <div className="p-3 space-y-3 bg-slate-50/30 min-h-[200px]">
                    {userDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className={`group relative border rounded-lg p-3 transition-all duration-200 ${deal.readByAdmin
                            ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                            : 'bg-blue-50/80 border-blue-200 hover:bg-blue-50 hover:shadow-md'
                          }`}
                      >
                        {/* Status Indicator Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${deal.readByAdmin ? 'bg-transparent' : 'bg-blue-500'}`}></div>

                        {/* Top Row */}
                        <div className="flex justify-between items-start mb-2 pl-1">
                          <div className="flex items-center gap-2">
                            {/* Matched Indicator */}
                            {deal.vehicle && (
                              <div className="tooltip" title="Linked to Inventory">
                                <span className="flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold ring-1 ring-emerald-200/50">
                                  ✓
                                </span>
                              </div>
                            )}

                            {/* Deal Number */}
                            {editingDeal === deal.id ? (
                              <input
                                className="w-16 border border-indigo-300 rounded px-1.5 py-0.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={editForm.dealNumber}
                                onChange={e => setEditForm({ ...editForm, dealNumber: e.target.value })}
                              />
                            ) : (
                              <span className="font-mono font-bold text-slate-700 text-sm">#{deal.dealNumber}</span>
                            )}

                            {/* Type Badge */}
                            {editingDeal === deal.id ? (
                              <select
                                value={editForm.type}
                                onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                className="border border-indigo-300 rounded px-1 text-xs py-0.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                              >
                                <option value="DEPOSIT">Dep</option>
                                <option value="DEAL">Deal</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${deal.type === 'DEPOSIT'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                }`}>
                                {deal.type === 'DEPOSIT' ? 'Deposit' : 'Deal'}
                              </span>
                            )}

                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <>
                                {editingDeal === deal.id ? (
                                  <div className="flex items-center bg-white shadow-sm rounded-md border border-slate-200 overflow-hidden">
                                    <button onClick={() => handleSaveEdit(deal.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 transition-colors" title="Save">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </button>
                                    <div className="w-px h-4 bg-slate-200"></div>
                                    <button onClick={() => setEditingDeal(null)} className="p-1 text-slate-500 hover:bg-slate-50 transition-colors" title="Cancel">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleToggleRead(deal)}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${deal.readByAdmin
                                          ? 'text-emerald-500 hover:bg-emerald-50'
                                          : 'bg-white border border-slate-200 text-slate-300 hover:border-emerald-500 hover:text-emerald-500 shadow-sm'
                                        }`}
                                      title={deal.readByAdmin ? "Mark as Unread" : "Mark as Read"}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                    <button onClick={() => handleEditDeal(deal)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors" title="Edit">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                    </button>
                                    <button onClick={() => handleDeleteDeal(deal.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Middle Row: Vehicle Info */}
                        <div className="mb-2.5 pl-1">
                          {deal.vehicle ? (
                            <div className="text-xs font-medium text-slate-700 truncate" title={`${deal.vehicle.year} ${deal.vehicle.make} ${deal.vehicle.model}`}>
                              {deal.vehicle.year} {deal.vehicle.make} {deal.vehicle.model}
                            </div>
                          ) : (
                            <div className="text-xs italic text-slate-400 font-light">Vehicle not linked</div>
                          )}

                          {editingDeal === deal.id ? (
                            <input
                              className="w-full mt-1 border border-indigo-300 rounded px-1.5 py-0.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="Insurance Provider"
                              value={editForm.insurance}
                              onChange={e => setEditForm({ ...editForm, insurance: e.target.value })}
                            />
                          ) : (
                            deal.insurance && (
                              <div className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                <span className="truncate max-w-[150px]">{deal.insurance}</span>
                              </div>
                            )
                          )}
                        </div>

                        {/* Bottom Row: Amount */}
                        <div className="flex justify-end items-end pt-2 border-t border-dashed border-slate-100">
                          {editingAmount[deal.id] !== undefined ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-400">$</span>
                              <input
                                autoFocus
                                type="number"
                                className="w-20 text-right border border-indigo-300 rounded px-1 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                            </div>
                          ) : (
                            <div
                              onClick={() => setEditingAmount({ ...editingAmount, [deal.id]: deal.amount?.toString() || '' })}
                              className={`cursor-pointer group-hover:bg-slate-50 px-2 py-0.5 rounded transition-colors ${deal.amount ? 'text-slate-700' : 'text-slate-300'
                                }`}
                            >
                              <span className="text-xs text-slate-400 mr-0.5">$</span>
                              <span className={`font-bold text-lg ${!deal.amount && 'text-sm font-normal'}`}>
                                {deal.amount ? deal.amount.toFixed(2) : '-'}
                              </span>
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
