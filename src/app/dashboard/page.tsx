'use client'

import { useState, useEffect } from 'react'

interface Note {
  id: string
  name?: string
  content: string
  completed: boolean
  createdByIP?: string
  createdAt: Date
  updatedAt: Date
}

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [noteName, setNoteName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [userIP, setUserIP] = useState('')

  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
    
    // Admin kontrolü ve IP bilgisi
    const checkAdminAndIP = async () => {
      try {
        const response = await fetch('/api/admin/check')
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
        setUserIP(data.clientIP || '')
      } catch (error) {
        console.error('Admin check failed:', error)
        setIsAdmin(false)
      }
    }
    
    checkAdminAndIP()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || !noteName.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: newNote.trim(),
          name: noteName.trim()
        }),
      })

      if (response.ok) {
        setNewNote('')
        setNoteName('')
        setShowAddModal(false) // Close modal
        fetchNotes() // Refresh notes list
      } else {
        console.error('Failed to add note')
      }
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditNote = async (note: Note) => {
    setEditingNote(note)
    setEditName(note.name || '')
    setEditContent(note.content)
  }

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote || !editContent.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingNote.id,
          content: editContent.trim()
        }),
      })

      if (response.ok) {
        setEditingNote(null)
        setEditName('')
        setEditContent('')
        fetchNotes()
      } else {
        console.error('Failed to update note')
      }
    } catch (error) {
      console.error('Error updating note:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/notes?id=${noteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchNotes()
      } else {
        console.error('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleToggleComplete = async (note: Note) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: note.id,
          completed: !note.completed
        }),
      })

      if (response.ok) {
        fetchNotes()
      } else {
        console.error('Failed to toggle note completion')
      }
    } catch (error) {
      console.error('Error toggling note completion:', error)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-800 to-slate-700 text-white rounded-lg shadow-lg border-b-2 border-blue-500 mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  📊 Dashboard
                </h1>
                <p className="text-sm text-slate-300">View and manage notes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Note Button, RTS and Refresh */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            ➕ Add Note
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            🏠 RTS
          </button>
          <button
            onClick={fetchNotes}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Notes Display */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading notes...</div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No notes yet. Add your first note above!</div>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`rounded-lg p-4 transition-colors ${
                    note.completed 
                      ? 'bg-green-50 border border-green-200 hover:bg-green-100' 
                      : 'bg-red-50 border border-red-200 hover:bg-red-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-3">
                    <div className="flex-1">
                      {note.name && (
                        <div className={`text-sm font-semibold text-blue-600 mb-2 ${
                          note.completed ? 'line-through' : ''
                        }`}>
                          {note.name}
                        </div>
                      )}
                      <div className={`text-gray-900 mb-2 ${
                        note.completed ? 'line-through' : ''
                      }`}>
                        {note.content}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Complete button - only show if user created the note or is admin */}
                      {(note.createdByIP === userIP || isAdmin) && (
                        <button
                          onClick={() => handleToggleComplete(note)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer ${
                            note.completed
                              ? 'bg-green-500 text-white shadow-lg hover:bg-green-600'
                              : 'bg-red-500 text-white shadow-lg hover:bg-red-600'
                          }`}
                          title={note.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {note.completed ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                            </svg>
                          )}
                        </button>
                      )}
                      {/* Edit button - only show if user created the note or is admin */}
                      {(note.createdByIP === userIP || isAdmin) && (
                        <button
                          onClick={() => handleEditNote(note)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                          title="Edit note"
                        >
                          ✏️
                        </button>
                      )}
                      {/* Delete button - only show for admin */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors cursor-pointer"
                          title="Delete note"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                        <div className="text-xs text-gray-500">
                          {note.updatedAt > note.createdAt ? 'Edited: ' : 'Added: '}
                          {formatDate(note.updatedAt > note.createdAt ? note.updatedAt : note.createdAt)}
                        </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Note Modal */}
        {showAddModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Add New Note</h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setNewNote('')
                      setNoteName('')
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="noteName" className="block text-sm font-medium text-gray-700 mb-2">
            Who&apos;s adding? <span className="text-red-500">*</span>
          </label>
          
          {/* Quick Name Buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {['Caner', 'Ferhat', 'Jordan', 'Onur', 'Ozge', 'Susan', 'Volkan'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setNoteName(name)}
                className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 cursor-pointer ${
                  noteName === name
                    ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:shadow-lg'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-400 hover:text-white hover:border-blue-400 hover:shadow-md'
                }`}
                disabled={isSubmitting}
              >
                {name}
              </button>
            ))}
          </div>
          
          {/* Hidden input for form validation */}
          <input
            type="hidden"
            value={noteName}
            required
          />
        </div>
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="note"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter your note here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-black"
                      rows={4}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={!newNote.trim() || !noteName.trim() || isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Note'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false)
                        setNewNote('')
                        setNoteName('')
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Note Modal */}
        {editingNote && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Edit Note</h3>
                  <button
                    onClick={() => {
                      setEditingNote(null)
                      setEditName('')
                      setEditContent('')
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleUpdateNote} className="space-y-4">
                        <div>
                          <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-2">
                            Name (Read Only)
                          </label>
                    <input
                      id="editName"
                      type="text"
                      value={editName}
                      placeholder="Note name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                      disabled={true}
                      readOnly
                    />
                  </div>
                        <div>
                          <label htmlFor="editContent" className="block text-sm font-medium text-gray-700 mb-2">
                            Content <span className="text-red-500">*</span>
                          </label>
                    <textarea
                      id="editContent"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Enter your note here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-black"
                      rows={4}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={!editContent.trim() || isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Note'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNote(null)
                        setEditName('')
                        setEditContent('')
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
