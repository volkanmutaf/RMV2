'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Deal {
  id: string
  dealNumber: string
  type: 'DEPOSIT' | 'DEAL'
  amount: number | null
  createdBy: {
    id: string
    username: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface UserSession {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'EDITOR' | 'VIEWER'
}

export default function DealsPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingAmount, setEditingAmount] = useState<{[key: string]: string}>({})
  
  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data || data.role !== 'ADMIN') {
          router.push('/')
          return
        }
        setCurrentUser(data)
        
        // Fetch deals
        fetch('/api/deals')
          .then(res => res.json())
          .then(data => {
            setDeals(data)
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
  
  // Group deals by user
  const dealsByUser: {[key: string]: Deal[]} = {}
  deals.forEach(deal => {
    const userName = deal.createdBy.name
    if (!dealsByUser[userName]) {
      dealsByUser[userName] = []
    }
    dealsByUser[userName].push(deal)
  })
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Deals Management</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            ← Back to Main
          </button>
        </div>
        
        {Object.keys(dealsByUser).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No deals found
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(dealsByUser).map(([userName, userDeals]) => (
              <div key={userName} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {userName} ({userDeals.length} {userDeals.length === 1 ? 'deal' : 'deals'})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deal Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userDeals.map((deal) => (
                        <tr key={deal.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {deal.dealNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              deal.type === 'DEPOSIT' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {deal.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingAmount[deal.id] !== undefined ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={editingAmount[deal.id]}
                                  onChange={(e) => setEditingAmount(prev => ({
                                    ...prev,
                                    [deal.id]: e.target.value
                                  }))}
                                  className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(deal.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

