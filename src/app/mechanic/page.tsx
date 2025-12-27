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

  useEffect(() => {
    fetchCurrentUser()
    fetchMechanicNotes()
  }, [])

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
      const response = await fetch('/api/transactions/mechanic')
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

  const handleApprove = async (transactionId: string) => {
    if (!currentUser) return
    
    // Check if user can approve (caner, volkan, or admin)
    const canApprove = currentUser.username.toLowerCase() === 'caner' || 
                      currentUser.username.toLowerCase() === 'volkan' || 
                      currentUser.role === 'ADMIN'
    
    if (!canApprove) {
      alert('Only Caner, Volkan, or Admin can approve mechanic notes.')
      return
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}/approve-mechanic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to approve note')
      }

      // Refresh notes
      fetchMechanicNotes()
    } catch (error) {
      console.error('Error approving note:', error)
      alert('Failed to approve note')
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

  const canApprove = currentUser && (
    currentUser.username.toLowerCase() === 'caner' || 
    currentUser.username.toLowerCase() === 'volkan' || 
    currentUser.role === 'ADMIN'
  )

  // Sort by date (newest first)
  const sortedNotes = [...notes].sort((a, b) => {
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

          <div className="mb-4 text-sm text-gray-600">
            Total Mechanic Notes: <strong>{sortedNotes.length}</strong>
          </div>
        </div>

        {sortedNotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔧</div>
            <p className="text-gray-600 text-xl font-semibold">No mechanic notes found</p>
            <p className="text-gray-400 text-sm mt-2">Mechanic notes will appear here when added.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                className={`rounded-lg shadow-lg p-4 border-2 transition-all ${
                  note.noteApproved
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
                  {note.noteApproved ? (
                    <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                      ✓ Approved
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

                {note.noteApproved && note.noteApprovedBy && (
                  <div className="text-xs text-green-700 mb-2">
                    <div>Approved by: <span className="font-semibold">{note.noteApprovedBy}</span></div>
                    {note.noteApprovedAt && (
                      <div className="text-green-600 mt-1">
                        {formatDateTime(note.noteApprovedAt)}
                      </div>
                    )}
                  </div>
                )}

                {!note.noteApproved && canApprove && (
                  <button
                    onClick={() => handleApprove(note.id)}
                    className="w-full mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ✓ Approve
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

