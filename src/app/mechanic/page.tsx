'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MechanicNote {
  id: string
  customer: {
    name: string
  }
  vehicle: {
    year: string
    make: string
    model: string
  }
  note: string
  noteCreatedBy: string | null
  noteCreatedAt: Date | null
  noteApproved: boolean
  noteApprovedBy: string | null
  noteApprovedAt: Date | null
  noteArchived: boolean
  date: Date
}

interface UserSession {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'EDITOR' | 'VIEWER'
}

export default function MechanicPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<MechanicNote[]>([])
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchMechanicNotes()
    }
  }, [showArchived, currentUser])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.user) {
        setCurrentUser(data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      router.push('/login')
    }
  }

  const fetchMechanicNotes = async () => {
    try {
      const response = await fetch(`/api/transactions/mechanic?archived=${showArchived}`)
      if (!response.ok) {
        throw new Error('Failed to fetch mechanic notes')
      }
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error('Error fetching mechanic notes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchMechanicNotes()
    }
  }, [showArchived, currentUser])

  const handleFix = async (transactionId: string) => {
    if (!currentUser) return
    
    // Check if user can fix (caner, volkan, or admin)
    const canFix = currentUser.username.toLowerCase() === 'caner' || 
                   currentUser.username.toLowerCase() === 'volkan' || 
                   currentUser.role === 'ADMIN'
    
    if (!canFix) {
      alert('Only Caner, Volkan, or Admin can fix mechanic notes.')
      return
    }

    // Confirmation dialog
    if (!confirm('Emin misiniz? Bu notu fixed olarak işaretlemek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}/fix-mechanic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fix note')
      }

      // Refresh notes
      fetchMechanicNotes()
    } catch (error) {
      console.error('Error fixing note:', error)
      alert('Failed to fix note')
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const canFix = currentUser && (
    currentUser.username.toLowerCase() === 'caner' || 
    currentUser.username.toLowerCase() === 'volkan' || 
    currentUser.role === 'ADMIN'
  )

  // Filter notes by search term
  const filteredNotes = notes.filter(note => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      note.customer.name.toLowerCase().includes(search) ||
      `${note.vehicle.year} ${note.vehicle.make} ${note.vehicle.model}`.toLowerCase().includes(search) ||
      note.note.toLowerCase().includes(search) ||
      (note.noteCreatedBy && note.noteCreatedBy.toLowerCase().includes(search))
    )
  })

  // Sort by date (newest first)
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const dateA = a.noteCreatedAt ? new Date(a.noteCreatedAt).getTime() : 0
    const dateB = b.noteCreatedAt ? new Date(b.noteCreatedAt).getTime() : 0
    return dateB - dateA
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">🔧 Mechanic Notes</h1>
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-600">
                Logged in as: <strong>{currentUser?.name}</strong> ({currentUser?.role})
              </span>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  router.push('/login')
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Total Mechanic Notes: <strong>{sortedNotes.length}</strong>
              {showArchived && <span className="ml-2 text-orange-600 font-semibold">(Archived)</span>}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showArchived
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {showArchived ? 'Show Active' : 'Show Archived'}
              </button>
            </div>
          </div>
        </div>

        {sortedNotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔧</div>
            <p className="text-gray-600 text-xl font-semibold">No mechanic notes found</p>
            <p className="text-gray-400 text-sm mt-2">
              {showArchived 
                ? 'No archived mechanic notes found.' 
                : 'Mechanic notes will appear here when added.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                className={`rounded-lg shadow-lg p-4 border-2 transition-all ${
                  note.noteArchived
                    ? 'bg-gray-50 border-gray-300'
                    : note.noteApproved
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                      {formatDate(note.noteCreatedAt)}
                    </div>
                    <div className="text-sm font-bold text-gray-900 mb-1">
                      {note.customer.name}
                    </div>
                    <div className="text-xs text-gray-700 mb-2">
                      {note.vehicle.year} {note.vehicle.make} {note.vehicle.model}
                    </div>
                  </div>
                  {note.noteArchived ? (
                    <div className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">
                      📦 Archived
                    </div>
                  ) : note.noteApproved ? (
                    <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                      ✓ Fixed
                    </div>
                  ) : (
                    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      Pending
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-800 whitespace-pre-wrap mb-3 bg-white p-2 rounded border border-gray-200">
                  {note.note}
                </div>
                
                <div className="text-xs text-gray-600 mb-2">
                  <div>Added by: <span className="font-semibold">{note.noteCreatedBy || 'Unknown'}</span></div>
                  {note.noteCreatedAt && (
                    <div className="text-gray-500 mt-1">
                      {formatDateTime(note.noteCreatedAt)}
                    </div>
                  )}
                </div>

                {note.noteArchived && (
                  <div className="text-xs text-orange-700 mb-2 bg-orange-50 p-2 rounded border border-orange-200">
                    <div className="font-semibold">⚠️ This note is archived</div>
                  </div>
                )}

                {note.noteApproved && note.noteApprovedBy && (
                  <div className="text-xs text-green-700 mb-2">
                    <div>Fixed by: <span className="font-semibold">{note.noteApprovedBy}</span></div>
                    {note.noteApprovedAt && (
                      <div className="text-green-600 mt-1">
                        {formatDateTime(note.noteApprovedAt)}
                      </div>
                    )}
                  </div>
                )}

                {!note.noteApproved && !note.noteArchived && canFix && (
                  <button
                    onClick={() => handleFix(note.id)}
                    className="w-full mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ✓ Fix
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

