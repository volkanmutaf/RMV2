'use client'

import { useState, useEffect } from 'react'
import { Transaction, Vehicle, Customer, VehicleStatus } from '@/generated/prisma'

interface TransactionWithRelations extends Transaction {
  vehicle: Vehicle
  customer: Customer
}

interface UserSession {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'EDITOR' | 'VIEWER'
}

interface VehicleTableProps {
  transactions: TransactionWithRelations[]
  currentUser: UserSession | null
}

export default function VehicleTable({ transactions: initialTransactions, currentUser }: VehicleTableProps) {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>(initialTransactions)
  const [readNotes, setReadNotes] = useState<Set<string>>(new Set())
  
  // Load read notes from localStorage on mount
  useEffect(() => {
    if (currentUser) {
      const readSet = new Set<string>()
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`note_read_`) && key.endsWith(`_${currentUser.username}`)) {
          readSet.add(key)
        }
      }
      setReadNotes(readSet)
    }
  }, [currentUser])
  
  // Update transactions when prop changes
  useEffect(() => {
    setTransactions(initialTransactions)
    // Force re-render to update badges
    if (currentUser) {
      const readSet = new Set<string>()
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`note_read_`) && key.endsWith(`_${currentUser.username}`)) {
          readSet.add(key)
        }
      }
      setReadNotes(readSet)
    }
  }, [initialTransactions, currentUser])
  
  // Debug: Log transactions
  useEffect(() => {
    console.log('VehicleTable - transactions received:', transactions.length)
    console.log('VehicleTable - transactions:', transactions)
  }, [transactions])

  const [isAdmin, setIsAdmin] = useState(false) // Start as non-admin
  const [canEdit, setCanEdit] = useState(false) // Can edit (ADMIN or EDITOR)
  const [editingPlate, setEditingPlate] = useState<string | null>(null)
  const [editingRef, setEditingRef] = useState<string | null>(null)
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedTransactionForNote, setSelectedTransactionForNote] = useState<string | null>(null)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'warning'>('success')
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [transactionToArchive, setTransactionToArchive] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  const [showUrgentConfirm, setShowUrgentConfirm] = useState(false)
  const [transactionToUrgent, setTransactionToUrgent] = useState<string | null>(null)
  const [refValues, setRefValues] = useState<{[key: string]: string}>({})
  const [plateValues, setPlateValues] = useState<{[key: string]: string}>({})
  const [contactValues, setContactValues] = useState<{[key: string]: string}>({})
  const [dateValues, setDateValues] = useState<{[key: string]: string}>({})
  const [localNotes, setLocalNotes] = useState<{[key: string]: string}>({})
  const [localRefs, setLocalRefs] = useState<{[key: string]: string}>({})
  const [localPlates, setLocalPlates] = useState<{[key: string]: string}>({})
  const [localStatuses, setLocalStatuses] = useState<{[key: string]: string}>({})
  const [localContacts, setLocalContacts] = useState<{[key: string]: string}>({})
  const [isClient, setIsClient] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [testInput, setTestInput] = useState('')
  const [testOutput, setTestOutput] = useState('')
  const [showExcelParseModal, setShowExcelParseModal] = useState(false)
  const [excelParseInput, setExcelParseInput] = useState('')
  const [excelParseOutput, setExcelParseOutput] = useState('')
  const [showAddDealModal, setShowAddDealModal] = useState(false)
  const [dealNumber, setDealNumber] = useState('')
  const [dealType, setDealType] = useState<'DEPOSIT' | 'DEAL' | ''>('')
  const [dealInsurance, setDealInsurance] = useState('')
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null)
  const [vehicleNames, setVehicleNames] = useState<{[key: string]: string}>({})

  // Notification function
  const showNotificationMessage = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
    setNotificationMessage(message)
    setNotificationType(type)
    setShowNotification(true)
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setShowNotification(false)
    }, 5000)
  }
  
  // Admin IP kontrolü
  useEffect(() => {
    if (currentUser) {
      setIsAdmin(currentUser.role === 'ADMIN')
      setCanEdit(currentUser.role === 'ADMIN' || currentUser.role === 'EDITOR')
    }
  }, [currentUser])
  const [quickAddText, setQuickAddText] = useState('')
  const [parsedData, setParsedData] = useState<{
    vehicle: string
    vin: string
    customer: string
    contact: string
  } | null>(null)
  const [editableData, setEditableData] = useState<{
    vehicle: string
    vin: string
    customer: string
    contact: string
  } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Dynamic sorting function
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // If clicking the same column, toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // If clicking a different column, set it as sortBy and default to desc
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  useEffect(() => {
    setIsClient(true)
    // Initialize local notes, refs, plates, contacts, and statuses with transaction data
    const initialNotes: {[key: string]: string} = {}
    const initialRefs: {[key: string]: string} = {}
    const initialPlates: {[key: string]: string} = {}
    const initialStatuses: {[key: string]: string} = {}
    const initialContacts: {[key: string]: string} = {}
    transactions.forEach(transaction => {
      initialNotes[transaction.id] = transaction.note || ''
      initialRefs[transaction.id] = transaction.ref || ''
      initialPlates[transaction.id] = transaction.plate || ''
      initialStatuses[transaction.id] = transaction.status || ''
      initialContacts[transaction.id] = transaction.customer.contact || ''
    })
    setLocalNotes(initialNotes)
    setLocalRefs(initialRefs)
    setLocalPlates(initialPlates)
    setLocalStatuses(initialStatuses)
    setLocalContacts(initialContacts)
  }, [transactions])

  const statusOptions = [
    { value: '', label: 'Select Status' },
    { value: 'TRANSFER_PLATE', label: 'Transfer Plate' },
    { value: 'PICKED_UP', label: 'Picked up' },
    { value: 'INSPECTED', label: 'Inspected' },
    { value: 'REGISTERED', label: 'Registered' },
    { value: 'RE_INSPECTION', label: 'Re-inspection' },
    { value: 'READY_FOR_PICKUP', label: 'Ready for pick up' },
    { value: 'TITLE_PENDING', label: 'Title Pending' },
    { value: 'AWAITING_STAMP', label: 'Awaiting Stamp' },
    { value: 'TITLE_REQUESTED', label: 'Title Requested' },
    { value: 'DEPOSIT', label: 'Deposit' }
  ]

  const copyToClipboard = async (text: string) => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      setShowCopyNotification(true)
      console.log('Copied to clipboard:', text)
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (successful) {
          setShowCopyNotification(true)
          console.log('Copied to clipboard (fallback):', text)
        } else {
          throw new Error('Copy command failed')
        }
      }
    } catch (err) {
      console.error('Failed to copy: ', err)
      // Final fallback - show the text in an alert
      alert(`VIN: ${text}\n\nCopy this text manually.`)
    }
  }

  // Auto-hide copy notification after 3.5 seconds
  useEffect(() => {
    if (showCopyNotification) {
      const timer = setTimeout(() => {
        setShowCopyNotification(false)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [showCopyNotification])

  const parseQuickAddText = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    let vehicle = ''
    let vin = ''
    let customer = ''
    let contact = ''
    
    // Parse vehicle (first line - year make model)
    if (lines.length > 0) {
      vehicle = lines[0]
    }
    
    // Parse VIN (look for 17-character alphanumeric string)
    const vinMatch = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/)
    if (vinMatch) {
      vin = vinMatch[0]
    }
    
    // Parse customer name (look for name pattern - usually after VIN/stock info)
    // First, find VIN line index to search after it
    let vinLineIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/\b[A-HJ-NPR-Z0-9]{17}\b/)) {
        vinLineIndex = i
        break
      }
    }
    
    // Start searching from after VIN line (or from beginning if VIN not found)
    const startIndex = vinLineIndex >= 0 ? vinLineIndex + 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      // Skip lines that look like vehicle info, VIN, stock, mileage, etc.
      if (!line.match(/^\d{4}\s/) && // Not year
          !line.match(/^[A-HJ-NPR-Z0-9]{17}$/) && // Not VIN (exact match)
          !line.match(/\b[A-HJ-NPR-Z0-9]{17}\b/) && // Not VIN (anywhere in line)
          !line.match(/Stock\s*#/) && // Not stock number
          !line.match(/\d+\s*days/) && // Not days
          !line.match(/\d+,\d+\s*miles/) && // Not mileage
          !line.match(/^\d+$/) && // Not just numbers
          !line.match(/\([0-9\s\-\(\)]+\)/) && // Not phone number
          !line.match(/@/) && // Not email
          !line.match(/\d+\s+\w+/) && // Not address pattern
          !line.match(/Sport Utility/) && // Not vehicle description
          !line.match(/4D/) && // Not vehicle description
          !line.match(/Pre-Qual/) && // Not status
          !line.match(/Credit Report/) && // Not report type
          !line.match(/TurboPass Report/) && // Not report type
          !line.match(/^\d+\s+\w+\s+St/) && // Not street address
          !line.match(/,\s*[A-Z]{2}\s+\d{5}/) && // Not address with state zip
          line.length > 2 && line.length < 50 && // Reasonable name length
          /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line)) { // Looks like "FirstName LastName"
        customer = line
        break
      }
    }
    
    // Parse contact (full phone number)
    const phoneMatch = text.match(/\([0-9\s\-\(\)]+\)/)
    if (phoneMatch) {
      // Find the line with the phone number and get the full line
      const phoneLine = lines.find(line => line.includes(phoneMatch[0]))
      if (phoneLine) {
        contact = phoneLine.trim()
      } else {
        contact = phoneMatch[0]
      }
    }
    
    return { vehicle, vin, customer, contact }
  }

  const handleQuickAddParse = () => {
    const parsed = parseQuickAddText(quickAddText)
    setParsedData(parsed)
    setEditableData(parsed)
  }

  const parseVehicleData = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    let year = ''
    let make = ''
    let model = ''
    let trim = ''
    let vin = ''
    let stockNo = ''
    let exteriorColor = ''
    let mileage = ''
    
    // Parse each line
    lines.forEach(line => {
      if (line.startsWith('Year ')) {
        year = line.replace('Year ', '').trim()
      } else if (line.startsWith('Make ')) {
        make = line.replace('Make ', '').trim()
      } else if (line.startsWith('Model ')) {
        model = line.replace('Model ', '').trim()
      } else if (line.startsWith('Trim ')) {
        trim = line.replace('Trim ', '').trim()
      } else if (line.startsWith('VIN ')) {
        vin = line.replace('VIN ', '').trim()
      } else if (line.startsWith('Stock No. ')) {
        stockNo = line.replace('Stock No. ', '').trim()
      } else if (line.startsWith('Exterior Color ')) {
        exteriorColor = line.replace('Exterior Color ', '').trim()
      } else if (line.startsWith('Mileage ')) {
        mileage = line.replace('Mileage ', '').trim()
      }
    })
    
    // Format output as requested
    const output = `Stock No:
${stockNo}

${year}
${make}
${model}

${exteriorColor}
${vin}
${trim} 
${mileage}`
    
    return output
  }

  // Update test output when input changes
  useEffect(() => {
    if (testInput) {
      setTestOutput(parseVehicleData(testInput))
    } else {
      setTestOutput('')
    }
  }, [testInput])

  // Parse data for Excel format
  const parseExcelFormat = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    let vehicle = ''
    let vin = ''
    let vinLast8 = ''
    let customer = ''
    let contact = ''
    let ref = ''
    
    // Parse vehicle (first line - year make model)
    if (lines.length > 0) {
      vehicle = lines[0]
    }
    
    // Parse VIN (look for 17-character alphanumeric string)
    const vinMatch = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/)
    if (vinMatch) {
      vin = vinMatch[0]
      vinLast8 = vin.slice(-8) // Last 8 digits
    }
    
    // Parse Stock # for Ref
    const stockMatch = text.match(/Stock\s*#\s*(\d+)/i)
    if (stockMatch) {
      ref = stockMatch[1]
    }
    
    // Parse customer name (look for name pattern - usually after VIN/stock info)
    // First, find VIN line index to search after it
    let vinLineIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/\b[A-HJ-NPR-Z0-9]{17}\b/)) {
        vinLineIndex = i
        break
      }
    }
    
    // Start searching from after VIN line (or from beginning if VIN not found)
    const startIndex = vinLineIndex >= 0 ? vinLineIndex + 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      // Skip lines that look like vehicle info, VIN, stock, mileage, etc.
      if (!line.match(/^\d{4}\s/) && // Not year
          !line.match(/^[A-HJ-NPR-Z0-9]{17}$/) && // Not VIN (exact match)
          !line.match(/\b[A-HJ-NPR-Z0-9]{17}\b/) && // Not VIN (anywhere in line)
          !line.match(/Stock\s*#/) && // Not stock number
          !line.match(/\d+\s*days/) && // Not days
          !line.match(/\d+,\d+\s*miles/) && // Not mileage
          !line.match(/^\d+$/) && // Not just numbers
          !line.match(/\([0-9\s\-\(\)]+\)/) && // Not phone number
          !line.match(/@/) && // Not email
          !line.match(/^\d+\s+\w+/) && // Not address pattern
          !line.match(/Sport Utility/) && // Not vehicle description
          !line.match(/4D/) && // Not vehicle description
          !line.match(/Pre-Qual/) && // Not status
          !line.match(/Credit Report/) && // Not report type
          !line.match(/TurboPass Report/) && // Not report type
          !line.match(/Class:\s*\d+/) && // Not class
          !line.match(/^\d+\s+\w+\s+St/) && // Not street address
          !line.match(/,\s*[A-Z]{2}\s+\d{5}/) && // Not address with state zip
          line.length > 2 && line.length < 50 && // Reasonable name length
          /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line)) { // Looks like "FirstName LastName"
        customer = line
        break
      }
    }
    
    // Parse contact (full phone number) - look for phone number pattern
    // Pattern: (XXX) XXX-XXXX or variations
    // Try to find the line with phone number first
    for (const line of lines) {
      // Check for common phone number patterns
      if (line.match(/\(\d{3}\)\s*\d{3}-\d{4}/)) {  // (617) 794-0607
        contact = line.trim()
        break
      } else if (line.match(/\(\d{3}\)\s*\d{3}\s*\d{4}/)) {  // (617) 794 0607
        contact = line.trim()
        break
      } else if (line.match(/\d{3}-\d{3}-\d{4}/)) {  // 617-794-0607
        contact = line.trim()
        break
      } else if (line.match(/\(?\d{3}\)?\s*-?\s*\d{3}\s*-?\s*\d{4}/)) {  // Other variations
        contact = line.trim()
        break
      }
    }
    
    // If not found in lines, try to find in full text
    if (!contact) {
      const phonePatterns = [
        /\(\d{3}\)\s*\d{3}-\d{4}/,                 // (617) 794-0607
        /\(\d{3}\)\s*\d{3}\s*\d{4}/,                // (617) 794 0607
        /\d{3}-\d{3}-\d{4}/,                       // 617-794-0607
        /\(?\d{3}\)?\s*-?\s*\d{3}\s*-?\s*\d{4}/    // Other variations
      ]
      
      for (const pattern of phonePatterns) {
        const phoneMatch = text.match(pattern)
        if (phoneMatch) {
          contact = phoneMatch[0].trim()
          break
        }
      }
    }
    
    // Get current date in MM/DD/YYYY format
    const today = new Date()
    const date = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`
    
    // Create Excel row format: Customer | Vehicle | Date | VIN | VIN Last 8 | Contact
    // Using tab-separated format for easy copy-paste to Excel
    const excelRow = [
      customer || '',      // Customer
      vehicle || '',       // Vehicle
      date,                // Date
      vin || '',           // VIN
      vinLast8 || '',      // VIN Last 8 digits
      contact || ''        // Contact
    ].join('\t') // Tab-separated for Excel
    
    return excelRow
  }

  // Update Excel parse output when input changes
  useEffect(() => {
    if (excelParseInput) {
      setExcelParseOutput(parseExcelFormat(excelParseInput))
    } else {
      setExcelParseOutput('')
    }
  }, [excelParseInput])

  const handleQuickAddSubmit = async () => {
    if (editableData) {
      try {
        // Check for duplicate VIN
        if (editableData.vin && editableData.vin.trim() !== '') {
          const existingVin = transactions.find(t => t.vehicle.vin === editableData.vin.trim())
          if (existingVin) {
            showNotificationMessage('This VIN number is already in use. Please enter a unique VIN number.', 'error')
            return
          }
        }
        
        // Create a new transaction object using editable data
        const newTransaction = {
          vehicle: {
            year: editableData.vehicle.split(' ')[0] || '',
            make: editableData.vehicle.split(' ')[1] || '',
            model: editableData.vehicle.split(' ').slice(2).join(' ') || '',
            vin: editableData.vin || ''
          },
          customer: {
            name: editableData.customer || '',
            contact: editableData.contact || ''
          },
          status: null,
          plate: '',
          note: '',
          ref: '',
          date: new Date()
        }
        
        // Save to database via API
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newTransaction)
        })
        
        if (response.ok) {
          const newTransaction = await response.json()
          
          // Add new transaction to the list without page reload
          setTransactions(prev => {
            // Check if transaction already exists (avoid duplicates)
            const exists = prev.find(t => t.id === newTransaction.id)
            if (exists) {
              return prev
            }
            // Add new transaction at the beginning
            return [newTransaction, ...prev]
          })
          
          // Show success notification
          setSuccessMessage('Customer and Vehicle Added Successfully!')
          setShowSuccessNotification(true)
          
          // Reset form
          setQuickAddText('')
          setParsedData(null)
          setEditableData(null)
          setShowQuickAdd(false)
        } else {
          const errorData = await response.json()
          if (response.status === 400 && errorData.error === 'VIN number already exists') {
            showNotificationMessage('This VIN number is already in use. Please enter a unique VIN number.', 'error')
          } else {
            throw new Error('Failed to create transaction')
          }
        }
        
      } catch (error) {
        console.error('Error creating transaction:', error)
        setSuccessMessage('Error adding customer and vehicle. Please try again.')
        setShowSuccessNotification(true)
      }
    }
  }

  const handleStatusChange = async (transactionId: string, newStatus: string) => {
    try {
      // If changing to TRANSFER_PLATE, check if plate is empty
      if (newStatus === 'TRANSFER_PLATE') {
        const transaction = transactions.find(t => t.id === transactionId)
        const currentPlate = localPlates[transactionId] !== undefined ? localPlates[transactionId] : transaction?.plate
        if (!currentPlate || currentPlate.trim() === '') {
          showNotificationMessage('Plate field cannot be empty when status is "Transfer Plate". Please enter a plate number first.', 'error')
          return
        }
      }
      
      // Update local state immediately
      setLocalStatuses(prev => ({
        ...prev,
        [transactionId]: newStatus
      }))
      
      // Update database
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-status-change': 'true' // Mark this as a status change
        },
        body: JSON.stringify({
          status: newStatus === '' ? null : newStatus
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update status')
      }
      
      // Refresh transactions to get updated lastUpdatedBy and lastUpdatedAt
      const refreshResponse = await fetch('/api/transactions')
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setTransactions(data)
      }
      
      console.log('Status updated successfully!')
    } catch (error) {
      console.error('Failed to update status:', error)
      // Revert local state on error
      setLocalStatuses(prev => ({
        ...prev,
        [transactionId]: transactions.find(t => t.id === transactionId)?.status || ''
      }))
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
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200 shadow-sm'
    }
  }


  const getRowColorClasses = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-300 shadow-sm'
      case 'PICKED_UP':
        return 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-300 shadow-sm'
      case 'INSPECTED':
        return 'bg-gradient-to-r from-indigo-50 to-indigo-100 border-l-4 border-indigo-300 shadow-sm'
      case 'TRANSFER_PLATE':
        return 'bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-300 shadow-sm'
      case 'RE_INSPECTION':
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-300 shadow-sm'
      case 'READY_FOR_PICKUP':
        return 'bg-gradient-to-r from-teal-50 to-teal-100 border-l-4 border-teal-300 shadow-sm'
      case 'TITLE_PENDING':
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-300 shadow-sm'
      case 'AWAITING_STAMP':
        return 'bg-gradient-to-r from-pink-50 to-pink-100 border-l-4 border-pink-300 shadow-sm'
      case 'TITLE_REQUESTED':
        return 'bg-gradient-to-r from-cyan-50 to-cyan-100 border-l-4 border-cyan-300 shadow-sm'
      case 'DEPOSIT':
        return 'bg-gradient-to-r from-slate-50 to-slate-100 border-l-4 border-slate-200 shadow-sm'
      default:
        return ''
    }
  }


  const handleRefChange = async (transactionId: string, newRef: string) => {
    try {
      // Update local state immediately
      setLocalRefs(prev => ({
        ...prev,
        [transactionId]: newRef
      }))
      
      // Update database
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: newRef
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update ref')
      }
      
      console.log('Ref updated successfully!')
    } catch (error) {
      console.error('Failed to update ref:', error)
    }
  }

  const handleContactChange = async (transactionId: string, newContact: string) => {
    try {
      // Update local state immediately
      setLocalContacts(prev => ({
        ...prev,
        [transactionId]: newContact
      }))
      
      // Update database
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: newContact
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update contact')
      }
      
      // Refresh transactions to get updated contact
      const refreshResponse = await fetch('/api/transactions')
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setTransactions(data)
      }
      
      console.log('Contact updated successfully!')
    } catch (error) {
      console.error('Failed to update contact:', error)
      // Revert local state on error
      setLocalContacts(prev => ({
        ...prev,
        [transactionId]: transactions.find(t => t.id === transactionId)?.customer.contact || ''
      }))
    }
  }

  const handleVehicleNameChange = async (transactionId: string, newName: string) => {
    try {
      // Update local state immediately
      setVehicleNames(prev => ({
        ...prev,
        [transactionId]: newName
      }))

      // Update in database
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicleName: newName }),
      })

      if (!response.ok) {
        throw new Error('Failed to update vehicle name')
      }

      // Show success notification
      showNotificationMessage('Vehicle name updated successfully!', 'success')
    } catch (error) {
      console.error('Failed to update vehicle name:', error)
      showNotificationMessage('Failed to update vehicle name', 'error')
    }
  }

  const handlePreInspectionChange = async (transactionId: string, checked: boolean) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preInspection: checked }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update pre-inspection status')
      }
      
      const updatedTransaction = await response.json()
      setTransactions(prev => prev.map(t => t.id === transactionId ? updatedTransaction : t))
      
      showNotificationMessage(`Pre-inspection ${checked ? 'marked' : 'unmarked'} successfully!`, 'success')
    } catch (error) {
      console.error('Failed to update pre-inspection:', error)
      showNotificationMessage('Failed to update pre-inspection status', 'error')
    }
  }

  const handlePlateChange = async (transactionId: string, newPlate: string) => {
    try {
      // Find the transaction to check its status
      const transaction = transactions.find(t => t.id === transactionId)
      
      // If status is TRANSFER_PLATE and plate is empty, show error
      if (transaction?.status === 'TRANSFER_PLATE' && (!newPlate || newPlate.trim() === '')) {
        showNotificationMessage('Plate field cannot be empty when status is "Transfer Plate"', 'error')
        return
      }
      
      // Check for duplicate plate numbers (excluding current transaction)
      if (newPlate && newPlate.trim() !== '') {
        const existingPlate = transactions.find(t => 
          t.id !== transactionId && 
          (localPlates[t.id] !== undefined ? localPlates[t.id] : t.plate) === newPlate.trim()
        )
        if (existingPlate) {
          showNotificationMessage('This plate number is already in use. Please enter a unique plate number.', 'error')
          return
        }
      }
      
      // Update local state immediately
      setLocalPlates(prev => ({
        ...prev,
        [transactionId]: newPlate
      }))
      
      // Update database
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plate: newPlate
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update plate')
      }
      
      console.log('Plate updated successfully!')
    } catch (error) {
      console.error('Failed to update plate:', error)
    }
  }

  const handleDateChange = async (transactionId: string, newDate: string) => {
    try {
      // Parse the date string (MM/DD/YYYY format)
      const [month, day, year] = newDate.split('/')
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date format')
      }
      
      // Update database
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: dateObj.toISOString() }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update date')
      }
      
      // Refresh transactions
      const refreshResponse = await fetch('/api/transactions')
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setTransactions(data.filter((t: TransactionWithRelations) => !t.archived))
      }
      
      setEditingDate(null)
      setDateValues(prev => {
        const updated = {...prev}
        delete updated[transactionId]
        return updated
      })
      showNotificationMessage('Date updated successfully!', 'success')
    } catch (error) {
      console.error('Failed to update date:', error)
      showNotificationMessage('Failed to update date', 'error')
      setEditingDate(null)
      setDateValues(prev => {
        const updated = {...prev}
        delete updated[transactionId]
        return updated
      })
    }
  }

  const openNoteModal = (transactionId: string) => {
    setSelectedTransactionForNote(transactionId)
    setShowNoteModal(true)
  }

  const closeNoteModal = () => {
    setShowNoteModal(false)
    setSelectedTransactionForNote(null)
  }

  const handleNoteSave = async (transactionId: string, newNote: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-status-change': 'true'
        },
        body: JSON.stringify({ note: newNote }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update note')
      }
      
      // Refresh transactions
      const refreshResponse = await fetch('/api/transactions')
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        const updatedTransactions = data.filter((t: TransactionWithRelations) => !t.archived)
        setTransactions(updatedTransactions)
        setLocalNotes(prev => ({
          ...prev,
          [transactionId]: newNote
        }))
        
        // If current user saved the note, mark it as read
        if (currentUser && newNote) {
          const updatedTransaction = updatedTransactions.find((t: TransactionWithRelations) => t.id === transactionId)
          if (updatedTransaction && (updatedTransaction as any).noteCreatedAt) {
            const readKey = `note_read_${transactionId}_${currentUser.username}`
            const noteCreatedAtTime = new Date((updatedTransaction as any).noteCreatedAt).getTime().toString()
            localStorage.setItem(readKey, noteCreatedAtTime)
            setReadNotes(prev => new Set(prev).add(readKey))
          }
        }
      }
      
      showNotificationMessage('Note saved successfully!', 'success')
      closeNoteModal()
    } catch (error) {
      console.error('Failed to save note:', error)
      showNotificationMessage('Failed to save note', 'error')
    }
  }

  const handleNoteDelete = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-status-change': 'true'
        },
        body: JSON.stringify({ note: '' }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete note')
      }
      
      // Refresh transactions
      const refreshResponse = await fetch('/api/transactions')
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setTransactions(data.filter((t: TransactionWithRelations) => !t.archived))
        setLocalNotes(prev => ({
          ...prev,
          [transactionId]: ''
        }))
      }
      
      showNotificationMessage('Note deleted successfully!', 'success')
      closeNoteModal()
    } catch (error) {
      console.error('Failed to delete note:', error)
      showNotificationMessage('Failed to delete note', 'error')
    }
  }

  const handleArchiveTransaction = async (transactionId: string) => {
    try {
      console.log('Attempting to archive transaction:', transactionId)
      
      const response = await fetch(`/api/transactions/${transactionId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('Archive response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Archive API error:', errorData)
        throw new Error(`Failed to archive record: ${errorData.error || 'Unknown error'}`)
      }
      
      const result = await response.json()
      console.log('Archive successful:', result)
      
      // Show success notification
      setSuccessMessage('Record added to archive successfully!')
      setShowSuccessNotification(true)
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Error archiving transaction:', error)
      setSuccessMessage(`Error adding record to archive: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setShowSuccessNotification(true)
    }
  }

  const confirmArchive = (transactionId: string) => {
    setTransactionToArchive(transactionId)
    setShowArchiveConfirm(true)
  }

  const executeArchive = () => {
    if (transactionToArchive) {
      handleArchiveTransaction(transactionToArchive)
      setShowArchiveConfirm(false)
      setTransactionToArchive(null)
    }
  }

  const confirmDelete = (transactionId: string) => {
    setTransactionToDelete(transactionId)
    setShowDeleteConfirm(true)
  }

  const executeDelete = async () => {
    if (!transactionToDelete) return
    
    try {
      const response = await fetch(`/api/transactions/${transactionToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete transaction')
      }
      
      // Remove from local state
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete))
      
      showNotificationMessage('Transaction deleted successfully!', 'success')
      setShowDeleteConfirm(false)
      setTransactionToDelete(null)
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      showNotificationMessage('Failed to delete transaction', 'error')
      setShowDeleteConfirm(false)
      setTransactionToDelete(null)
    }
  }

  const confirmUrgent = (transactionId: string) => {
    setTransactionToUrgent(transactionId)
    setShowUrgentConfirm(true)
  }

  const executeUrgent = async () => {
    if (!transactionToUrgent) return
    
    try {
      const response = await fetch(`/api/transactions/${transactionToUrgent}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-status-change': 'true' // Allow EDITOR to mark as urgent
        },
        body: JSON.stringify({ isUrgent: true }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to mark as urgent')
      }
      
      const updatedTransaction = await response.json()
      setTransactions(prev => prev.map(t => t.id === transactionToUrgent ? updatedTransaction : t))
      
      showNotificationMessage('Transaction marked as urgent!', 'success')
      setShowUrgentConfirm(false)
      setTransactionToUrgent(null)
    } catch (error) {
      console.error('Failed to mark as urgent:', error)
      showNotificationMessage('Failed to mark as urgent', 'error')
      setShowUrgentConfirm(false)
      setTransactionToUrgent(null)
    }
  }

  const formatDate = (date: Date) => {
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

  // Filter and search functionality
  const filteredTransactions = transactions.filter(transaction => {
    // First, exclude archived transactions (only show where archived is false or null/undefined)
    if (transaction.archived === true) {
      return false
    }
    
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

  // Sort functionality
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue: string | number, bValue: string | number
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
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
        return 0
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Debug: Log transactions
  useEffect(() => {
    console.log('VehicleTable Debug:')
    console.log('- transactions prop:', transactions.length)
    console.log('- filteredTransactions:', filteredTransactions.length)
    console.log('- sortedTransactions:', sortedTransactions.length)
    console.log('- searchTerm:', searchTerm)
    console.log('- filterStatus:', filterStatus)
    if (transactions.length > 0) {
      console.log('- First transaction:', transactions[0])
      console.log('- First transaction archived:', transactions[0].archived)
    }
  }, [transactions, filteredTransactions, sortedTransactions, searchTerm, filterStatus])

  const getStatusColor = (status: VehicleStatus | null) => {
    switch (status) {
      case 'REGISTERED':
        return 'text-red-600'
      case 'PICKED_UP':
      case 'INSPECTED':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }


  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Days</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Vehicle</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">VIN</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Plate</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Note</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Contact</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Ref</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Last Updated By</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedTransactions.map((transaction, index) => (
                <tr key={transaction.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {editingDate === transaction.id ? (
                      <input
                        type="text"
                        value={dateValues[transaction.id] !== undefined ? dateValues[transaction.id] : formatDate(transaction.date)}
                        onChange={(e) => {
                          // Allow MM/DD/YYYY format
                          let value = e.target.value.replace(/\D/g, '')
                          if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2)
                          if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5, 9)
                          setDateValues(prev => ({
                            ...prev,
                            [transaction.id]: value
                          }))
                        }}
                        onBlur={(e) => {
                          const newDate = dateValues[transaction.id] || formatDate(transaction.date)
                          if (newDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                            handleDateChange(transaction.id, newDate)
                          } else {
                            setEditingDate(null)
                            setDateValues(prev => {
                              const updated = {...prev}
                              delete updated[transaction.id]
                              return updated
                            })
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newDate = dateValues[transaction.id] || formatDate(transaction.date)
                            if (newDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                              handleDateChange(transaction.id, newDate)
                            }
                          } else if (e.key === 'Escape') {
                            setEditingDate(null)
                            setDateValues(prev => {
                              const updated = {...prev}
                              delete updated[transaction.id]
                              return updated
                            })
                          }
                        }}
                        className="text-xs text-gray-900 font-medium bg-white border border-gray-300 rounded px-2 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                        placeholder="MM/DD/YYYY"
                      />
                    ) : (
                      <div 
                        className="text-xs text-gray-900 font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                        onClick={() => {
                          setEditingDate(transaction.id)
                          setDateValues(prev => ({
                            ...prev,
                            [transaction.id]: formatDate(transaction.date)
                          }))
                        }}
                        title="Click to edit date"
                      >
                        {formatDate(transaction.date)}
                      </div>
                    )}
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
                    {editingVehicle === transaction.id ? (
                      <input
                        type="text"
                        value={vehicleNames[transaction.id] || formatVehicle(transaction.vehicle)}
                        onChange={(e) => setVehicleNames(prev => ({
                          ...prev,
                          [transaction.id]: e.target.value
                        }))}
                        className="text-xs font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                        onBlur={(e) => {
                          const newValue = e.target.value.trim()
                          handleVehicleNameChange(transaction.id, newValue)
                          setEditingVehicle(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newValue = e.currentTarget.value.trim()
                            handleVehicleNameChange(transaction.id, newValue)
                            setEditingVehicle(null)
                          } else if (e.key === 'Escape') {
                            setEditingVehicle(null)
                          }
                        }}
                      />
                    ) : (
                      <div 
                        className="text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                        onClick={() => setEditingVehicle(transaction.id)}
                        title="Click to edit vehicle name"
                      >
                        {vehicleNames[transaction.id] || formatVehicle(transaction.vehicle)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div 
                      className={`text-xs font-mono ${
                        transaction.vehicle.vin 
                          ? 'text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors' 
                          : 'text-gray-600'
                      }`}
                      onClick={() => {
                        if (transaction.vehicle.vin) {
                          copyToClipboard(transaction.vehicle.vin)
                        }
                      }}
                      title={transaction.vehicle.vin ? "Click to copy VIN" : ""}
                    >
                      {transaction.vehicle.vin || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {canEdit ? (
                      <select 
                        className={`text-xs font-medium border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full touch-manipulation ${
                          getStatusColorClasses(localStatuses[transaction.id] || transaction.status || '')
                        }`}
                        value={localStatuses[transaction.id] || transaction.status || ''}
                        onChange={(e) => {
                          handleStatusChange(transaction.id, e.target.value)
                        }}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value} className="text-gray-900 bg-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                        getStatusColorClasses(localStatuses[transaction.id] || transaction.status || '')
                      }`}>
                      {transaction.status ? 
                        statusOptions.find(opt => opt.value === transaction.status)?.label || 
                        transaction.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                        : '-'
                      }
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.plate || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => openNoteModal(transaction.id)}
                      className={`text-xs px-3 py-1 rounded transition-colors cursor-pointer ${
                        transaction.note 
                          ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                      title={transaction.note ? "Click to view/edit note" : "Click to add note"}
                    >
                      {transaction.note ? '📝 Note' : '➕ No Note'}
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isAdmin && editingContact === transaction.id ? (
                      <input
                        type="text"
                        className="text-xs border-2 border-blue-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-mono"
                        placeholder="Enter contact..."
                        value={contactValues[transaction.id] !== undefined ? contactValues[transaction.id] : (localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact || '')}
                        onChange={(e) => {
                          setContactValues(prev => ({
                            ...prev,
                            [transaction.id]: e.target.value
                          }))
                        }}
                        autoFocus
                        onBlur={(e) => {
                          const newValue = e.target.value.trim()
                          const originalValue = localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : (transaction.customer.contact || '')
                          
                          // Only save if value actually changed
                          if (newValue !== originalValue) {
                            handleContactChange(transaction.id, newValue)
                          }
                          setEditingContact(null)
                          setContactValues(prev => {
                            const updated = {...prev}
                            delete updated[transaction.id]
                            return updated
                          })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newValue = e.currentTarget.value.trim()
                            const originalValue = localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : (transaction.customer.contact || '')
                            
                            // Only save if value actually changed
                            if (newValue !== originalValue) {
                              handleContactChange(transaction.id, newValue)
                            }
                            setEditingContact(null)
                            setContactValues(prev => {
                              const updated = {...prev}
                              delete updated[transaction.id]
                              return updated
                            })
                          } else if (e.key === 'Escape') {
                            setEditingContact(null)
                            setContactValues(prev => {
                              const updated = {...prev}
                              delete updated[transaction.id]
                              return updated
                            })
                          }
                        }}
                      />
                    ) : (
                      <div 
                        className="relative inline-flex items-center px-2 py-1 rounded text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors group border border-gray-300 bg-white text-gray-900 min-w-[100px] h-8"
                        onClick={() => {
                          if (isAdmin) {
                            setContactValues(prev => ({
                              ...prev,
                              [transaction.id]: localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact || ''
                            }))
                            setEditingContact(transaction.id)
                          }
                        }}
                      >
                        {(localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact) || '-'}
                        {isAdmin && (localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact) && (
                          <button
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleContactChange(transaction.id, '')
                            }}
                            title="Clear contact"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.ref || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {transaction.lastUpdatedBy ? (
                      <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                        <div className="font-medium">👤 {transaction.lastUpdatedBy}</div>
                        {(transaction as any).lastUpdatedAt && (
                          <div className="text-gray-500 text-[10px]">
                            🕒 {new Date((transaction as any).lastUpdatedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isAdmin && (
                      <div className="flex gap-1">
                      <button
                        onClick={() => confirmArchive(transaction.id)}
                          className={`${
                            (transaction.status === 'TITLE_REQUESTED' || localStatuses[transaction.id] === 'TITLE_REQUESTED')
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-orange-500 hover:bg-orange-600'
                          } text-white px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer`}
                        title="Add to archive"
                      >
                        📁
                      </button>
                        <button
                          onClick={() => confirmDelete(transaction.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                          title="Delete permanently"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Professional Notification */}
      {showNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-xl transform transition-all duration-300 ${
            notificationType === 'error' ? 'bg-red-50 border-2 border-red-200' :
            notificationType === 'warning' ? 'bg-yellow-50 border-2 border-yellow-200' :
            'bg-green-50 border-2 border-green-200'
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                notificationType === 'error' ? 'bg-red-100' :
                notificationType === 'warning' ? 'bg-yellow-100' :
                'bg-green-100'
              }`}>
                {notificationType === 'error' ? (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : notificationType === 'warning' ? (
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  notificationType === 'error' ? 'text-red-800' :
                  notificationType === 'warning' ? 'text-yellow-800' :
                  'text-green-800'
                }`}>
                  {notificationMessage}
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className={`ml-4 flex-shrink-0 rounded-md p-1.5 ${
                  notificationType === 'error' ? 'text-red-500 hover:bg-red-100' :
                  notificationType === 'warning' ? 'text-yellow-500 hover:bg-yellow-100' :
                  'text-green-500 hover:bg-green-100'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  notificationType === 'error' ? 'focus:ring-red-500' :
                  notificationType === 'warning' ? 'focus:ring-yellow-500' :
                  'focus:ring-green-500'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Notification */}
      {showCopyNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span className="font-semibold">Copied to clipboard!</span>
            <button
              onClick={() => setShowCopyNotification(false)}
              className="ml-2 text-white hover:text-gray-200 text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Success/Error Notification */}
      {showSuccessNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                successMessage.includes('Error') ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {successMessage.includes('Error') ? (
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${
                successMessage.includes('Error') ? 'text-red-600' : 'text-gray-900'
              }`}>
                {successMessage.includes('Error') ? '❌ Error!' : '🎉 Success!'}
              </h3>
              <p className="text-gray-600 mb-6">
                {successMessage}
              </p>
              <button
                onClick={() => setShowSuccessNotification(false)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer ${
                  successMessage.includes('Error') 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Compact Professional Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-lg shadow-lg border-b-2 border-blue-500 mb-4">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Huggard & Ewing Automotive
                </h1>
                <p className="text-xs text-slate-300">Registration Tracking System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Last Updated Info */}
              <div className="bg-slate-600/50 backdrop-blur-sm rounded-lg px-3 py-1">
                <div className="text-xs text-slate-300">Last Updated</div>
                <div className="text-sm font-semibold text-green-300">
                  {(() => {
                    if (sortedTransactions.length === 0) return 'Never'
                    const latestUpdate = Math.max(...sortedTransactions.map(t => new Date(t.updatedAt).getTime()))
                    const date = new Date(latestUpdate)
                    return date.toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                  })()}
                </div>
              </div>
              <div className="bg-slate-600/50 backdrop-blur-sm rounded-lg px-3 py-1">
                <div className="text-xs text-slate-300">Total</div>
                <div className="text-lg font-bold text-white">{sortedTransactions.length}</div>
              </div>
              <div className="bg-slate-600/50 backdrop-blur-sm rounded-lg px-3 py-1">
                <div className="text-xs text-slate-300">Filtered</div>
                <div className="text-sm font-semibold text-blue-300">
          {filteredTransactions.length} / {transactions.length} transactions
        </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Compact Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search customer, VIN, vehicle, contact, plate, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="sm:w-40">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            >
              <option value="">All Statuses</option>
              <option value="no-status">No Status</option>
              {statusOptions.slice(1).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          
          {/* Clear Button */}
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('')
              setSortBy('date')
              setSortOrder('desc')
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </div>
      
      {/* Compact Quick Add Section */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-row gap-2">
            <button
              onClick={() => setShowAddDealModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer"
            >
              💰 Add Deal
            </button>
            {isAdmin && (
              <>
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer"
              >
                  {showQuickAdd ? '❌ Cancel' : '➕ Add Vehicle'}
              </button>
              <button
                onClick={() => setShowTestModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer"
              >
                  🧪 Test Parse
              </button>
              <button
                onClick={() => setShowExcelParseModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer"
              >
                  📊 Excel Parse
              </button>
              </>
            )}
            </div>
          {isAdmin && (
            <a
              href="/deals"
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer inline-block text-center"
            >
              💰 Deals
            </a>
          )}
          <button
            onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer"
          >
              🔄 Refresh
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer"
          >
              📊 Dashboard
          </button>
          </div>
          <div className="flex justify-end gap-2 items-center">
            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  {currentUser.name} ({currentUser.role})
                </span>
                {isAdmin && (
                  <button
                    onClick={() => window.location.href = '/users'}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer"
                  >
                    👥 Users
                  </button>
                )}
            {isAdmin && (
              <button
                onClick={() => window.open('/archive', '_blank')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer"
              >
                📁 Archive
              </button>
            )}
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    window.location.href = '/login'
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation cursor-pointer"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Add Modal */}
        {isAdmin && showQuickAdd && (
          <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Quick Add</h3>
                  <button
                    onClick={() => setShowQuickAdd(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
                  >
                    ×
                  </button>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vehicle Information
                  </label>
                  <textarea
                    value={quickAddText}
                    onChange={(e) => setQuickAddText(e.target.value)}
                    placeholder="Paste vehicle information here..."
                    className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    style={{ lineHeight: '1.5' }}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button
                    onClick={handleQuickAddParse}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation cursor-pointer"
                  >
                    Parse Data
                  </button>
                  {parsedData && (
                    <button
                      onClick={handleQuickAddSubmit}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation cursor-pointer"
                    >
                      Add to Table
                    </button>
                  )}
                  <button
                    onClick={() => setShowQuickAdd(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                
                {/* Parsed Data Preview - Always Show */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Parsed Data Preview (Editable)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Vehicle:</label>
                      <input
                        type="text"
                        value={editableData?.vehicle || ''}
                        onChange={(e) => setEditableData(prev => prev ? {...prev, vehicle: e.target.value} : null)}
                        className="w-full text-gray-900 bg-white p-3 rounded-lg border-2 border-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Not found"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">VIN:</label>
                      <input
                        type="text"
                        value={editableData?.vin || ''}
                        onChange={(e) => setEditableData(prev => prev ? {...prev, vin: e.target.value} : null)}
                        className="w-full text-gray-900 bg-white p-3 rounded-lg border-2 border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Not found"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Customer:</label>
                      <input
                        type="text"
                        value={editableData?.customer || ''}
                        onChange={(e) => setEditableData(prev => prev ? {...prev, customer: e.target.value} : null)}
                        className="w-full text-gray-900 bg-white p-3 rounded-lg border-2 border-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Not found"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Contact:</label>
                      <input
                        type="text"
                        value={editableData?.contact || ''}
                        onChange={(e) => setEditableData(prev => prev ? {...prev, contact: e.target.value} : null)}
                        className="w-full text-gray-900 bg-white p-3 rounded-lg border-2 border-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Not found"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4 font-medium">
                    You can edit the parsed data above. The edited values will be saved to the table.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Card View */}
      <div className="block md:hidden">
        {/* Mobile Sort Indicator */}
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl border-2 border-blue-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <div>
                <div className="text-blue-800 font-bold text-sm">
                  Sorted by: <span className="capitalize bg-blue-200 px-2 py-1 rounded-lg">{sortBy}</span>
                </div>
                <div className="text-blue-600 text-xs font-medium">
                  {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-blue-600 text-xs font-medium bg-blue-100 px-2 py-1 rounded-lg">
                📱 Mobile View
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {sortedTransactions.map((transaction, index) => (
          <div 
            key={transaction.id}
            className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 ${
              getRowColorClasses(localStatuses[transaction.id] || transaction.status || '') || 
              (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                {editingVehicle === transaction.id ? (
                  <input
                    type="text"
                    value={vehicleNames[transaction.id] || formatVehicle(transaction.vehicle)}
                    onChange={(e) => setVehicleNames(prev => ({
                      ...prev,
                      [transaction.id]: e.target.value
                    }))}
                    className="font-bold text-gray-900 text-sm bg-white border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                    onBlur={(e) => {
                      const newValue = e.target.value.trim()
                      handleVehicleNameChange(transaction.id, newValue)
                      setEditingVehicle(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newValue = e.currentTarget.value.trim()
                        handleVehicleNameChange(transaction.id, newValue)
                        setEditingVehicle(null)
                      } else if (e.key === 'Escape') {
                        setEditingVehicle(null)
                      }
                    }}
                  />
                ) : (
                  <h3 
                    className="font-bold text-gray-900 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                    onClick={() => setEditingVehicle(transaction.id)}
                    title="Click to edit vehicle name"
                  >
                    {vehicleNames[transaction.id] || formatVehicle(transaction.vehicle)}
                  </h3>
                )}
                <p className="text-xs text-gray-600">{transaction.customer.name}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{formatDate(transaction.date)}</div>
                <div className="text-xs mt-1">
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
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">VIN:</span>
                <div 
                  className="font-mono text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors touch-manipulation"
                  onClick={() => {
                    if (transaction.vehicle.vin) {
                      copyToClipboard(transaction.vehicle.vin)
                    }
                  }}
                >
                  {transaction.vehicle.vin || '-'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                {canEdit ? (
                  <select 
                    className={`text-xs font-medium border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full touch-manipulation ${
                      getStatusColorClasses(localStatuses[transaction.id] || transaction.status || '')
                    }`}
                    value={localStatuses[transaction.id] || transaction.status || ''}
                    onChange={(e) => {
                      handleStatusChange(transaction.id, e.target.value)
                    }}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value} className="text-gray-900 bg-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-col">
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                    getStatusColorClasses(localStatuses[transaction.id] || transaction.status || '')
                  }`}>
                    {transaction.status ? 
                      statusOptions.find(opt => opt.value === transaction.status)?.label || 
                      transaction.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                      : '-'
                    }
                    </div>
                  </div>
                )}
              </div>
              <div>
                <span className="text-gray-500">Plate:</span>
                <div className="font-semibold text-gray-900">
                  {transaction.plate || '-'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Contact:</span>
                {isAdmin && editingContact === transaction.id ? (
                  <input
                    type="text"
                    className="text-xs border-2 border-blue-300 rounded px-2 py-1 w-full mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-mono"
                    placeholder="Enter contact..."
                    value={contactValues[transaction.id] !== undefined ? contactValues[transaction.id] : (localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact || '')}
                    onChange={(e) => {
                      setContactValues(prev => ({
                        ...prev,
                        [transaction.id]: e.target.value
                      }))
                    }}
                    autoFocus
                    onBlur={(e) => {
                      const newValue = e.target.value.trim()
                      const originalValue = localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : (transaction.customer.contact || '')
                      
                      // Only save if value actually changed
                      if (newValue !== originalValue) {
                        handleContactChange(transaction.id, newValue)
                      }
                      setEditingContact(null)
                      setContactValues(prev => {
                        const updated = {...prev}
                        delete updated[transaction.id]
                        return updated
                      })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newValue = e.currentTarget.value.trim()
                        const originalValue = localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : (transaction.customer.contact || '')
                        
                        // Only save if value actually changed
                        if (newValue !== originalValue) {
                          handleContactChange(transaction.id, newValue)
                        }
                        setEditingContact(null)
                        setContactValues(prev => {
                          const updated = {...prev}
                          delete updated[transaction.id]
                          return updated
                        })
                      } else if (e.key === 'Escape') {
                        setEditingContact(null)
                        setContactValues(prev => {
                          const updated = {...prev}
                          delete updated[transaction.id]
                          return updated
                        })
                      }
                    }}
                  />
                ) : (
                  <div 
                    className="font-mono text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors touch-manipulation"
                    onClick={() => {
                      if (isAdmin) {
                        setContactValues(prev => ({
                          ...prev,
                          [transaction.id]: localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact || ''
                        }))
                        setEditingContact(transaction.id)
                      } else if (transaction.customer.contact) {
                        window.location.href = `tel:${transaction.customer.contact}`
                      }
                    }}
                    title={isAdmin ? "Tap to edit" : "Tap to call"}
                  >
                    {(localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact) || '-'}
                  </div>
                )}
              </div>
              <div>
                <span className="text-gray-500">Ref:</span>
                <div className="font-semibold text-gray-900">
                  {transaction.ref || '-'}
                </div>
              </div>
            </div>
            
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-gray-500 text-xs">Note:</span>
                <button
                  onClick={() => {
                    // Mark note as read when opening modal
                    if (transaction.note && (transaction as any).noteCreatedAt && currentUser) {
                      const readKey = `note_read_${transaction.id}_${currentUser.username}`
                      const noteCreatedAtTime = new Date((transaction as any).noteCreatedAt).getTime().toString()
                      localStorage.setItem(readKey, noteCreatedAtTime)
                      setReadNotes(prev => new Set(prev).add(readKey))
                    }
                    openNoteModal(transaction.id)
                  }}
                  className={`text-xs px-3 py-1 rounded transition-colors cursor-pointer mt-1 w-full relative ${
                    transaction.note 
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title={transaction.note ? "Click to view/edit note" : "Click to add note"}
                >
                  {(() => {
                    // Check if note is new for current user
                    if (!transaction.note || !currentUser) {
                      return <span>{transaction.note ? '📝 Note' : '➕ No Note'}</span>
                    }
                    
                    const noteCreatedAt = (transaction as any).noteCreatedAt
                    if (!noteCreatedAt) {
                      // Old note without createdAt - don't show badge
                      return <span>📝 Note</span>
                    }
                    
                    const readKey = `note_read_${transaction.id}_${currentUser.username}`
                    const lastReadTimeStr = localStorage.getItem(readKey)
                    
                    // If never read, show badge
                    if (!lastReadTimeStr) {
                      return (
                        <span className="relative inline-block w-full">
                          📝 Note
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg z-10">
                            1
                          </span>
                        </span>
                      )
                    }
                    
                    // Compare timestamps
                    const noteTime = new Date(noteCreatedAt).getTime()
                    const lastReadTime = parseInt(lastReadTimeStr, 10)
                    const isNewNote = noteTime > lastReadTime
                    
                    return (
                      <span className="relative inline-block w-full">
                        📝 Note
                        {isNewNote && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg z-10">
                            1
                          </span>
                        )}
                      </span>
                    )
                  })()}
                </button>
              </div>
            {transaction.lastUpdatedBy && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-gray-500 text-xs">Last Updated By:</span>
                <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border border-gray-300 bg-white text-gray-900 mt-1">
                  <div>
                    <div className="font-medium">👤 {transaction.lastUpdatedBy}</div>
                    {(transaction as any).lastUpdatedAt && (
                      <div className="text-gray-500 text-[10px] mt-0.5">
                        🕒 {new Date((transaction as any).lastUpdatedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Pre-inspection Checkbox */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(transaction as any).preInspection || false}
                  onChange={(e) => handlePreInspectionChange(transaction.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded border border-gray-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200 flex items-center justify-center">
                  {(transaction as any).preInspection && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </label>
            </div>
            
            {/* Archive and Delete Buttons */}
            {isAdmin && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => confirmArchive(transaction.id)}
                  className={`w-full ${
                    (transaction.status === 'TITLE_REQUESTED' || localStatuses[transaction.id] === 'TITLE_REQUESTED')
                      ? 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700'
                      : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'
                  } text-white px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2`}
                  title="Add to archive"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span>Archive</span>
                </button>
                <button
                  onClick={() => confirmDelete(transaction.id)}
                  className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  title="Delete permanently"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gradient-to-r from-slate-700 to-slate-600 shadow-md">
            <tr>
              <th 
                className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  📅 Date
                  {sortBy === 'date' && (
                    <span className="text-blue-300">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
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
                    <span className="text-blue-300">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
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
                    <span className="text-blue-300">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                🔢 VIN
              </th>
              <th 
                className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500 cursor-pointer hover:bg-slate-600 transition-colors select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  📊 Status
                  {sortBy === 'status' && (
                    <span className="text-blue-300">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
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
              <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                🔗 Ref
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                👤 Last Updated By
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  {transactions.length === 0 ? (
                    <div>
                      <p className="text-lg font-semibold mb-2">No transactions found</p>
                      <p className="text-sm">Add a new vehicle to get started.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold mb-2">No transactions match your filters</p>
                      <p className="text-sm">Total transactions: {transactions.length}</p>
                      <p className="text-xs text-gray-400 mt-1">Try clearing your search or filters</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              sortedTransactions.map((transaction, index) => (
              <tr 
                key={transaction.id}
                className={`hover:bg-blue-50 transition-colors duration-200 ${
                  getRowColorClasses(localStatuses[transaction.id] || transaction.status || '') || 
                  (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')
                }`}
              >
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
                  {editingVehicle === transaction.id ? (
                    <input
                      type="text"
                      value={vehicleNames[transaction.id] || formatVehicle(transaction.vehicle)}
                      onChange={(e) => setVehicleNames(prev => ({
                        ...prev,
                        [transaction.id]: e.target.value
                      }))}
                      className="text-xs font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                      onBlur={(e) => {
                        const newValue = e.target.value.trim()
                        handleVehicleNameChange(transaction.id, newValue)
                        setEditingVehicle(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = e.currentTarget.value.trim()
                          handleVehicleNameChange(transaction.id, newValue)
                          setEditingVehicle(null)
                        } else if (e.key === 'Escape') {
                          setEditingVehicle(null)
                        }
                      }}
                    />
                  ) : (
                    <div 
                      className="text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                      onClick={() => setEditingVehicle(transaction.id)}
                      title="Click to edit vehicle name"
                    >
                      {vehicleNames[transaction.id] || formatVehicle(transaction.vehicle)}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div 
                    className={`text-xs font-mono ${
                      transaction.vehicle.vin 
                        ? 'text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors' 
                        : 'text-gray-600'
                    }`}
                    onClick={() => {
                      if (transaction.vehicle.vin) {
                        copyToClipboard(transaction.vehicle.vin)
                      }
                    }}
                    title={transaction.vehicle.vin ? "Click to copy VIN" : ""}
                  >
                    {transaction.vehicle.vin || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {canEdit ? (
                    <>
                    <select 
                      className={`text-xs font-medium border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[120px] shadow-sm hover:border-gray-400 transition-colors ${
                        getStatusColorClasses(localStatuses[transaction.id] || transaction.status || '')
                      }`}
                      value={localStatuses[transaction.id] || transaction.status || ''}
                      onChange={(e) => {
                        handleStatusChange(transaction.id, e.target.value)
                      }}
                      style={{
                        backgroundColor: (() => {
                          const status = localStatuses[transaction.id] || transaction.status || ''
                          if (status === 'REGISTERED') return '#fef2f2'
                          if (status === 'PICKED_UP') return '#f0fdf4'
                          if (status === 'INSPECTED') return '#eff6ff'
                          if (status === 'TRANSFER_PLATE') return '#faf5ff'
                          if (status === 'RE_INSPECTION') return '#fff7ed'
                          if (status === 'READY_FOR_PICKUP') return '#ecfdf5'
                          if (status === 'TITLE_PENDING') return '#fef2f2'
                          if (status === 'AWAITING_STAMP') return '#fff7ed'
                            if (status === 'TITLE_REQUESTED') return '#f0fdf4'
                          return '#f9fafb'
                        })(),
                        color: (() => {
                          const status = localStatuses[transaction.id] || transaction.status || ''
                          if (status === 'REGISTERED') return '#991b1b'
                          if (status === 'PICKED_UP') return '#166534'
                          if (status === 'INSPECTED') return '#1e40af'
                          if (status === 'TRANSFER_PLATE') return '#7c3aed'
                          if (status === 'RE_INSPECTION') return '#c2410c'
                          if (status === 'READY_FOR_PICKUP') return '#047857'
                          if (status === 'TITLE_PENDING') return '#991b1b'
                          if (status === 'AWAITING_STAMP') return '#c2410c'
                            if (status === 'TITLE_REQUESTED') return '#166534'
                          return '#374151'
                        })()
                      }}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value} className="text-gray-900 bg-white">
                          {option.label}
                        </option>
                      ))}
                    </select>
                    </>
                  ) : (
                    <div className="flex flex-col">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status ? 
                        statusOptions.find(opt => opt.value === transaction.status)?.label || 
                        transaction.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                        : '-'
                      }
                    </span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {isAdmin && editingPlate === transaction.id ? (
                    <input
                      type="text"
                      className="text-xs border-2 border-blue-300 rounded px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter plate..."
                      value={plateValues[transaction.id] || ''}
                      onChange={(e) => {
                        setPlateValues(prev => ({
                          ...prev,
                          [transaction.id]: e.target.value
                        }))
                      }}
                      autoFocus
                      onBlur={(e) => {
                        const newValue = e.target.value.trim()
                        handlePlateChange(transaction.id, newValue)
                        setEditingPlate(null)
                        setPlateValues(prev => {
                          const updated = {...prev}
                          delete updated[transaction.id]
                          return updated
                        })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = e.currentTarget.value.trim()
                          handlePlateChange(transaction.id, newValue)
                          setEditingPlate(null)
                          setPlateValues(prev => {
                            const updated = {...prev}
                            delete updated[transaction.id]
                            return updated
                          })
                        } else if (e.key === 'Escape') {
                          setEditingPlate(null)
                          setPlateValues(prev => {
                            const updated = {...prev}
                            delete updated[transaction.id]
                            return updated
                          })
                        }
                      }}
                    />
                  ) : (
                    <div 
                      className="relative inline-flex items-center px-2 py-1 rounded text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors group border border-gray-300 bg-white text-gray-900 min-w-[80px] h-8"
                      onClick={() => {
                        if (isAdmin) {
                          setPlateValues(prev => ({
                            ...prev,
                            [transaction.id]: '' // Start with empty input
                          }))
                          setEditingPlate(transaction.id)
                        }
                      }}
                    >
                      {(localPlates[transaction.id] !== undefined ? localPlates[transaction.id] : transaction.plate) || '-'}
                      {isAdmin && (
                        <button
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handlePlateChange(transaction.id, '')
                          }}
                          title="Clear plate"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <button
                    onClick={() => openNoteModal(transaction.id)}
                    className={`text-xs px-3 py-1 rounded transition-colors cursor-pointer ${
                      transaction.note 
                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    title={transaction.note ? "Click to view/edit note" : "Click to add note"}
                  >
                    {transaction.note ? '📝 Note' : '➕ No Note'}
                  </button>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {isAdmin && editingContact === transaction.id ? (
                    <input
                      type="text"
                      className="text-xs border-2 border-blue-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-mono"
                      placeholder="Enter contact..."
                      value={contactValues[transaction.id] !== undefined ? contactValues[transaction.id] : (localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact || '')}
                      onChange={(e) => {
                        setContactValues(prev => ({
                          ...prev,
                          [transaction.id]: e.target.value
                        }))
                      }}
                      autoFocus
                      onBlur={(e) => {
                        const newValue = e.target.value.trim()
                        const originalValue = localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : (transaction.customer.contact || '')
                        
                        // Only save if value actually changed
                        if (newValue !== originalValue) {
                          handleContactChange(transaction.id, newValue)
                        }
                        setEditingContact(null)
                        setContactValues(prev => {
                          const updated = {...prev}
                          delete updated[transaction.id]
                          return updated
                        })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = e.currentTarget.value.trim()
                          const originalValue = localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : (transaction.customer.contact || '')
                          
                          // Only save if value actually changed
                          if (newValue !== originalValue) {
                            handleContactChange(transaction.id, newValue)
                          }
                          setEditingContact(null)
                          setContactValues(prev => {
                            const updated = {...prev}
                            delete updated[transaction.id]
                            return updated
                          })
                        } else if (e.key === 'Escape') {
                          setEditingContact(null)
                          setContactValues(prev => {
                            const updated = {...prev}
                            delete updated[transaction.id]
                            return updated
                          })
                        }
                      }}
                    />
                  ) : (
                    <div 
                      className="relative inline-flex items-center px-2 py-1 rounded text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors group border border-gray-300 bg-white text-gray-900 min-w-[100px] h-8"
                      onClick={() => {
                        if (isAdmin) {
                          setContactValues(prev => ({
                            ...prev,
                            [transaction.id]: localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact || ''
                          }))
                          setEditingContact(transaction.id)
                        }
                      }}
                    >
                      {(localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact) || '-'}
                      {isAdmin && (localContacts[transaction.id] !== undefined ? localContacts[transaction.id] : transaction.customer.contact) && (
                        <button
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleContactChange(transaction.id, '')
                          }}
                          title="Clear contact"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {isAdmin && editingRef === transaction.id ? (
                    <input
                      type="text"
                      className="text-xs border-2 border-blue-300 rounded px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter ref..."
                      value={refValues[transaction.id] !== undefined ? refValues[transaction.id] : (localRefs[transaction.id] !== undefined ? localRefs[transaction.id] : transaction.ref || '')}
                      onChange={(e) => {
                        setRefValues(prev => ({
                          ...prev,
                          [transaction.id]: e.target.value
                        }))
                      }}
                      autoFocus
                      onBlur={(e) => {
                        const newValue = e.target.value.trim()
                        const originalValue = localRefs[transaction.id] !== undefined ? localRefs[transaction.id] : (transaction.ref || '')
                        
                        // Only save if value actually changed
                        if (newValue !== originalValue) {
                        handleRefChange(transaction.id, newValue)
                        }
                        setEditingRef(null)
                        setRefValues(prev => {
                          const updated = {...prev}
                          delete updated[transaction.id]
                          return updated
                        })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = e.currentTarget.value.trim()
                          const originalValue = localRefs[transaction.id] !== undefined ? localRefs[transaction.id] : (transaction.ref || '')
                          
                          // Only save if value actually changed
                          if (newValue !== originalValue) {
                          handleRefChange(transaction.id, newValue)
                          }
                          setEditingRef(null)
                          setRefValues(prev => {
                            const updated = {...prev}
                            delete updated[transaction.id]
                            return updated
                          })
                        } else if (e.key === 'Escape') {
                          // Cancel editing and restore original value
                          setEditingRef(null)
                          setRefValues(prev => {
                            const updated = {...prev}
                            delete updated[transaction.id]
                            return updated
                          })
                        }
                      }}
                    />
                  ) : (
                    <div 
                      className="relative inline-flex items-center px-2 py-1 rounded text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors group border border-gray-300 bg-white text-gray-900 min-w-[80px] h-8"
                      onClick={() => {
                        if (isAdmin) {
                          // Initialize with current value, not empty
                          const currentRef = localRefs[transaction.id] !== undefined ? localRefs[transaction.id] : (transaction.ref || '')
                          setRefValues(prev => ({
                            ...prev,
                            [transaction.id]: currentRef
                          }))
                          setEditingRef(transaction.id)
                        }
                      }}
                    >
                      {(localRefs[transaction.id] !== undefined ? localRefs[transaction.id] : transaction.ref) || '-'}
                      {isAdmin && (
                        <button
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRefChange(transaction.id, '')
                          }}
                          title="Clear ref"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {transaction.lastUpdatedBy ? (
                    <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                      <div className="font-medium">👤 {transaction.lastUpdatedBy}</div>
                      {(transaction as any).lastUpdatedAt && (
                        <div className="text-gray-500 text-[10px]">
                          🕒 {new Date((transaction as any).lastUpdatedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {/* Pre-inspection Checkbox */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(transaction as any).preInspection || false}
                        onChange={(e) => handlePreInspectionChange(transaction.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded border border-gray-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200 flex items-center justify-center">
                        {(transaction as any).preInspection && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </label>
                    
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => confirmArchive(transaction.id)}
                          className={`${
                            (transaction.status === 'TITLE_REQUESTED' || localStatuses[transaction.id] === 'TITLE_REQUESTED')
                              ? 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700'
                              : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'
                          } text-white px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-1 min-w-[32px]`}
                          title="Add to archive"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDelete(transaction.id)}
                          className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-1 min-w-[32px]"
                          title="Delete permanently"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                    {(transaction.status === 'TITLE_PENDING' || localStatuses[transaction.id] === 'TITLE_PENDING') && (
                      <div className="flex items-center gap-1.5">
                        <div 
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                            (transaction as any).isUrgent ? 'bg-yellow-400 shadow-sm shadow-yellow-400/50' : 'bg-red-400 shadow-sm shadow-red-400/50'
                          }`}
                          title={(transaction as any).isUrgent ? "Title Pending - Urgent" : "Title Pending - Requires Attention"}
                        />
                        {canEdit && !(transaction as any).isUrgent && (
                          <button
                            onClick={() => confirmUrgent(transaction.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center min-w-[32px]"
                            title="Mark as urgent"
                          >
                            <span className="text-[10px]">U</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        
        {sortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-600 text-xl font-semibold mb-2">
                {searchTerm || filterStatus ? 'No matching records found' : 'No records found'}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {searchTerm || filterStatus 
                  ? 'Try adjusting your search criteria or filters' 
                  : 'Use the Quick Add button above to add new records'
                }
              </p>
              {(searchTerm || filterStatus) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterStatus('')
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-4 text-orange-500">📁</div>
              <h3 className="text-lg font-semibold mb-2 text-orange-600">Add to Archive</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to add this record to the archive? It will be moved to the archive and hidden from the main table.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeArchive}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Add to Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Confirmation Modal */}
      {showUrgentConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-4 text-yellow-500">⚠️</div>
              <h3 className="text-lg font-semibold mb-2 text-yellow-600">Mark as Urgent</h3>
              <p className="text-gray-700 mb-4">
                Are you sure this title is urgent? The status dot will turn yellow to indicate urgency.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowUrgentConfirm(false)
                    setTransactionToUrgent(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeUrgent}
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Mark as Urgent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && selectedTransactionForNote && (() => {
        const transaction = transactions.find(t => t.id === selectedTransactionForNote)
        if (!transaction) return null
        const currentNote = transaction.note || ''
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Note for {formatVehicle(transaction.vehicle)}
                </h3>
                <button
                  onClick={closeNoteModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                {currentNote ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="text-xs text-blue-600 font-semibold mb-2">📝 Current Note:</div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap mb-2">{currentNote}</div>
                    {(transaction as any).noteCreatedBy && (
                      <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-blue-200">
                        Added by: <span className="font-semibold text-gray-800">{(transaction as any).noteCreatedBy}</span>
                        {(transaction as any).noteCreatedAt && (
                          <span className="text-gray-500 ml-2">
                            ({new Date((transaction as any).noteCreatedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-center">
                    <div className="text-sm text-gray-500">No note available</div>
                  </div>
                )}
              </div>
              
              <textarea
                value={localNotes[selectedTransactionForNote] !== undefined ? localNotes[selectedTransactionForNote] : currentNote}
                onChange={(e) => {
                  setLocalNotes(prev => ({
                    ...prev,
                    [selectedTransactionForNote]: e.target.value
                  }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                placeholder="Enter note here..."
                rows={6}
              />
              
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => {
                    const noteToSave = localNotes[selectedTransactionForNote] !== undefined 
                      ? localNotes[selectedTransactionForNote] 
                      : currentNote
                    handleNoteSave(selectedTransactionForNote, noteToSave)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Save Note
                </button>
                {currentNote && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this note?')) {
                        handleNoteDelete(selectedTransactionForNote)
                      }
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={closeNoteModal}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-4 text-red-500">🗑️</div>
              <h3 className="text-lg font-semibold mb-2 text-red-600">Delete Permanently</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this transaction? This will permanently delete the transaction, vehicle, and customer from the database. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setTransactionToDelete(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Parse Modal */}
      {showTestModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Test Parse</h3>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Information
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Paste vehicle information here..."
                  className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  style={{ lineHeight: '1.5' }}
                />
              </div>
              
              {/* Parse Output Section */}
              {testInput && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parsed Output (Editable):
                  </label>
                  <textarea
                    value={testOutput}
                    onChange={(e) => setTestOutput(e.target.value)}
                    className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono"
                    style={{ lineHeight: '1.5' }}
                    placeholder="Parsed output will appear here..."
                  />
                  <button
                    onClick={() => {
                      try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(testOutput)
                          alert('Copied to clipboard!')
                        } else {
                          // Fallback for older browsers or non-HTTPS
                          const textArea = document.createElement('textarea')
                          textArea.value = testOutput
                          document.body.appendChild(textArea)
                          textArea.select()
                          document.execCommand('copy')
                          document.body.removeChild(textArea)
                          alert('Copied to clipboard!')
                        }
                      } catch (err) {
                        console.error('Failed to copy: ', err)
                        alert(`Failed to copy to clipboard. Here's the text:\n\n${testOutput}`)
                      }
                    }}
                    className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddDealModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add Deal</h3>
                <button
                  onClick={() => {
                    setShowAddDealModal(false)
                    setDealNumber('')
                    setDealType('')
                    setDealInsurance('')
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deal Number (4 digits) *
                </label>
                <input
                  type="text"
                  value={dealNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setDealNumber(value)
                  }}
                  placeholder="0000"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  maxLength={4}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="dealType"
                      value="DEPOSIT"
                      checked={dealType === 'DEPOSIT'}
                      onChange={(e) => setDealType(e.target.value as 'DEPOSIT' | 'DEAL')}
                      className="mr-2 w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-900">Deposit</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="dealType"
                      value="DEAL"
                      checked={dealType === 'DEAL'}
                      onChange={(e) => setDealType(e.target.value as 'DEPOSIT' | 'DEAL')}
                      className="mr-2 w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-900">Deal</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Insurance (Optional)
                </label>
                <input
                  type="text"
                  value={dealInsurance}
                  onChange={(e) => setDealInsurance(e.target.value)}
                  placeholder="Enter insurance information..."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAddDealModal(false)
                    setDealNumber('')
                    setDealType('')
                    setDealInsurance('')
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (dealNumber.length !== 4) {
                      showNotificationMessage('Deal number must be exactly 4 digits', 'error')
                      return
                    }
                    if (!dealType) {
                      showNotificationMessage('Please select a type (Deposit or Deal)', 'error')
                      return
                    }
                    
                    try {
                      const response = await fetch('/api/deals', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          dealNumber,
                          type: dealType,
                          insurance: dealInsurance.trim() || null,
                        }),
                      })
                      
                      if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.error || 'Failed to create deal')
                      }
                      
                      showNotificationMessage('Deal added successfully!', 'success')
                      setShowAddDealModal(false)
                      setDealNumber('')
                      setDealType('')
                      setDealInsurance('')
                    } catch (error) {
                      console.error('Failed to create deal:', error)
                      showNotificationMessage(error instanceof Error ? error.message : 'Failed to create deal', 'error')
                    }
                  }}
                  disabled={dealNumber.length !== 4 || !dealType}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Parse Modal */}
      {showExcelParseModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Excel Parse</h3>
                <button
                  onClick={() => setShowExcelParseModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Information
                </label>
                <textarea
                  value={excelParseInput}
                  onChange={(e) => setExcelParseInput(e.target.value)}
                  placeholder="Paste vehicle information here..."
                  className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  style={{ lineHeight: '1.5' }}
                />
              </div>
              
              {/* Excel Output Section */}
              {excelParseOutput && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Excel Row (Tab-separated, ready to paste):
                  </label>
                  <div className="mb-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    Format: Customer | Vehicle | Date | VIN | VIN Last 8 | Contact
                  </div>
                  <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                    <textarea
                      value={excelParseOutput}
                      onChange={(e) => setExcelParseOutput(e.target.value)}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono resize-none"
                      placeholder="Excel row will appear here..."
                      rows={1}
                      style={{ 
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        whiteSpace: 'nowrap',
                        minHeight: '48px'
                      }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        try {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(excelParseOutput)
                            alert('Copied to clipboard! You can now paste it into Excel.')
                          } else {
                            // Fallback for older browsers or non-HTTPS
                            const textArea = document.createElement('textarea')
                            textArea.value = excelParseOutput
                            document.body.appendChild(textArea)
                            textArea.select()
                            document.execCommand('copy')
                            document.body.removeChild(textArea)
                            alert('Copied to clipboard! You can now paste it into Excel.')
                          }
                        } catch (err) {
                          console.error('Failed to copy: ', err)
                          alert(`Failed to copy to clipboard. Here's the text:\n\n${excelParseOutput}`)
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                      📋 Copy to Clipboard
                    </button>
                    <button
                      onClick={() => {
                        setExcelParseInput('')
                        setExcelParseOutput('')
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowExcelParseModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
