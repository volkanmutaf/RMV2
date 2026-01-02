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
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editNoteText, setEditNoteText] = useState('')

  // Permissions
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.role === 'EDITOR'
  const canFixPermission = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.role === 'EDITOR'

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
        // Access is now open to all logged-in users
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
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
    }
  }

  const handleFix = async (transactionId: string) => {
    if (!currentUser) return

    if (!canFixPermission) {
      alert('Only Admin, Manager, or Editor can fix mechanic notes.')
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

  const handleUnfix = async (transactionId: string) => {
    if (!canFixPermission) return

    // Confirmation dialog
    if (!confirm('Emin misiniz? Bu notu unfix yapmak istediğinizden emin misiniz? Not tekrar pending durumuna dönecek.')) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}/unfix-mechanic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to unfix note')
      }

      // Refresh notes
      fetchMechanicNotes()
    } catch (error) {
      console.error('Error unfixing note:', error)
      alert('Failed to unfix note')
    }
  }

  const handleEditNote = (note: MechanicNote) => {
    setEditingNote(note.id)
    setEditNoteText(note.note)
  }

  const handleSaveEdit = async (noteId: string) => {
    try {
      const response = await fetch(`/api/transactions/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-status-change': 'true'
        },
        body: JSON.stringify({ note: editNoteText, noteType: 'MECHANIC' }),
      })

      if (!response.ok) {
        throw new Error('Failed to update note')
      }

      fetchMechanicNotes()
      setEditingNote(null)
      setEditNoteText('')
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Failed to update note')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this mechanic note? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${noteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete note')
      }

      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mechanic notes...</p>
        </div>
      </div>
    )
  }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 p-4">
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showArchived
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                className={`rounded-lg shadow-md p-3 border-2 transition-all relative ${note.noteArchived
                    ? 'bg-gray-50 border-gray-300'
                    : note.noteApproved
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}
              >
                {canEdit && (
                  <div className="absolute top-2 right-2 flex gap-1 z-10">
                    {editingNote === note.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(note.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[10px] font-semibold transition-colors"
                          title="Save"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingNote(null)
                            setEditNoteText('')
                          }}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-[10px] font-semibold transition-colors"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditNote(note)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-semibold transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[10px] font-semibold transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="mb-2">
                  {note.noteArchived && (
                    <div className="mb-1 bg-orange-100 border border-orange-300 rounded px-1 py-0.5">
                      <span className="text-[10px] font-bold text-orange-700">⚠️ ARCHIVE</span>
                    </div>
                  )}
                  <div className="text-[10px] font-semibold text-gray-600 mb-1">
                    {formatDate(note.noteCreatedAt)}
                  </div>
                  <div className="text-xs font-bold text-gray-900 mb-1 truncate">
                    {note.customer.name}
                  </div>
                  <div className="text-[10px] text-gray-700 mb-2 truncate">
                    {note.vehicle.year} {note.vehicle.make} {note.vehicle.model}
                  </div>
                </div>

                <div className="mb-2">
                  {note.noteArchived ? (
                    <span className="bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      📦 Archived
                    </span>
                  ) : note.noteApproved ? (
                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      ✓ Fixed
                    </span>
                  ) : (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Pending
                    </span>
                  )}
                </div>

                {editingNote === note.id ? (
                  <textarea
                    value={editNoteText}
                    onChange={(e) => setEditNoteText(e.target.value)}
                    className="w-full px-2 py-1 border-2 border-blue-300 rounded text-[11px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                    autoFocus
                  />
                ) : (
                  <div className="text-[11px] text-gray-800 whitespace-pre-wrap mb-2 bg-white p-2 rounded border border-gray-200 max-h-24 overflow-y-auto">
                    {note.note}
                  </div>
                )}

                <div className="text-[10px] text-gray-600 mb-1">
                  <div>Added by: <span className="font-semibold">{note.noteCreatedBy || 'Unknown'}</span></div>
                  {note.noteCreatedAt && (
                    <div className="text-gray-500 mt-0.5">
                      {formatDateTime(note.noteCreatedAt)}
                    </div>
                  )}
                </div>

                {note.noteApproved && note.noteApprovedBy && (
                  <div className="text-[10px] text-green-700 mb-1">
                    <div>Fixed by: <span className="font-semibold">{note.noteApprovedBy}</span></div>
                    {note.noteApprovedAt && (
                      <div className="text-green-600 mt-0.5">
                        {formatDateTime(note.noteApprovedAt)}
                      </div>
                    )}
                  </div>
                )}

                {!note.noteApproved && !note.noteArchived && canFixPermission && (
                  <button
                    onClick={() => handleFix(note.id)}
                    className="w-full mt-2 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-medium transition-colors"
                  >
                    ✓ Fix
                  </button>
                )}

                {note.noteApproved && !note.noteArchived && canFixPermission && (
                  <button
                    onClick={() => handleUnfix(note.id)}
                    className="w-full mt-2 px-2 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-medium transition-colors"
                  >
                    ↺ Unfix
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


