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

export default function VehicleTable({ transactions, currentUser }: VehicleTableProps) {
  // Debug: Log transactions
  useEffect(() => {
    console.log('VehicleTable - transactions received:', transactions.length)
    console.log('VehicleTable - transactions:', transactions)
  }, [transactions])

  const [isAdmin, setIsAdmin] = useState(false) // Start as non-admin
  const [canEdit, setCanEdit] = useState(false) // Can edit (ADMIN or EDITOR)
  const [editingPlate, setEditingPlate] = useState<string | null>(null)
  const [editingTax, setEditingTax] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editingRef, setEditingRef] = useState<string | null>(null)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'warning'>('success')
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [transactionToArchive, setTransactionToArchive] = useState<string | null>(null)
  const [noteValues, setNoteValues] = useState<{[key: string]: string}>({})
  const [refValues, setRefValues] = useState<{[key: string]: string}>({})
  const [plateValues, setPlateValues] = useState<{[key: string]: string}>({})
  const [taxValues, setTaxValues] = useState<{[key: string]: string}>({})
  const [localNotes, setLocalNotes] = useState<{[key: string]: string}>({})
  const [localRefs, setLocalRefs] = useState<{[key: string]: string}>({})
  const [localPlates, setLocalPlates] = useState<{[key: string]: string}>({})
  const [localPayments, setLocalPayments] = useState<{[key: string]: string}>({})
  const [localStatuses, setLocalStatuses] = useState<{[key: string]: string}>({})
  const [localTaxes, setLocalTaxes] = useState<{[key: string]: string}>({})
  const [isClient, setIsClient] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [testInput, setTestInput] = useState('')
  const [testOutput, setTestOutput] = useState('')
  const [showExcelParseModal, setShowExcelParseModal] = useState(false)
  const [excelParseInput, setExcelParseInput] = useState('')
  const [excelParseOutput, setExcelParseOutput] = useState('')
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
  const [filterPayment, setFilterPayment] = useState('')
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
    // Initialize local notes, refs, plates, payments, statuses, and taxes with transaction data
    const initialNotes: {[key: string]: string} = {}
    const initialRefs: {[key: string]: string} = {}
    const initialPlates: {[key: string]: string} = {}
    const initialPayments: {[key: string]: string} = {}
    const initialStatuses: {[key: string]: string} = {}
    const initialTaxes: {[key: string]: string} = {}
    transactions.forEach(transaction => {
      initialNotes[transaction.id] = transaction.note || ''
      initialRefs[transaction.id] = transaction.ref || ''
      initialPlates[transaction.id] = transaction.plate || ''
      initialPayments[transaction.id] = transaction.payment || 'UNPAID'
      initialStatuses[transaction.id] = transaction.status || ''
      initialTaxes[transaction.id] = transaction.tax?.toString() || ''
    })
    setLocalNotes(initialNotes)
    setLocalRefs(initialRefs)
    setLocalPlates(initialPlates)
    setLocalPayments(initialPayments)
    setLocalStatuses(initialStatuses)
    setLocalTaxes(initialTaxes)
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
    { value: 'AWAITING_STAMP', label: 'Awaiting Stamp' }
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
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Skip lines that look like vehicle info, VIN, stock, mileage, etc.
      if (!line.match(/^\d{4}\s/) && // Not year
          !line.match(/^\d+/) && // Not starting with numbers
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
          line.length > 2 && line.length < 50) { // Reasonable name length
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
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Skip lines that look like vehicle info, VIN, stock, mileage, etc.
      if (!line.match(/^\d{4}\s/) && // Not year
          !line.match(/^[A-HJ-NPR-Z0-9]{17}$/) && // Not VIN
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
          line.length > 2 && line.length < 50) { // Reasonable name length
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
          payment: 'UNPAID',
          tax: null,
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
          // Show success notification
          setSuccessMessage('Customer and Vehicle Added Successfully!')
          setShowSuccessNotification(true)
          
          // Reset form
          setQuickAddText('')
          setParsedData(null)
          setEditableData(null)
          setShowQuickAdd(false)
          
          // Refresh the page to show new data
          setTimeout(() => {
          window.location.reload()
          }, 1000) // Small delay to show notification
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
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 shadow-sm'
      case 'PICKED_UP':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 shadow-sm'
      case 'INSPECTED':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 shadow-sm'
      case 'TRANSFER_PLATE':
        return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 shadow-sm'
      case 'RE_INSPECTION':
        return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300 shadow-sm'
      case 'READY_FOR_PICKUP':
        return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300 shadow-sm'
      case 'TITLE_PENDING':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 shadow-sm'
      case 'AWAITING_STAMP':
        return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300 shadow-sm'
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300 shadow-sm'
    }
  }

  const getPaymentColorClasses = (status: string) => {
    // Status rengine göre payment butonunun rengini belirle
    const statusColors = {
      'REGISTERED': 'from-red-100 to-red-200 text-red-800 border-red-300',
      'PICKED_UP': 'from-green-100 to-green-200 text-green-800 border-green-300',
      'INSPECTED': 'from-blue-100 to-blue-200 text-blue-800 border-blue-300',
      'TRANSFER_PLATE': 'from-purple-100 to-purple-200 text-purple-800 border-purple-300',
      'RE_INSPECTION': 'from-orange-100 to-orange-200 text-orange-800 border-orange-300',
      'READY_FOR_PICKUP': 'from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300',
      'TITLE_PENDING': 'from-red-100 to-red-200 text-red-800 border-red-300',
      'AWAITING_STAMP': 'from-orange-100 to-orange-200 text-orange-800 border-orange-300'
    }
    
    const colorClass = statusColors[status as keyof typeof statusColors] || 'from-gray-100 to-gray-200 text-gray-800 border-gray-300'
    
    return `bg-gradient-to-r ${colorClass} border shadow-sm`
  }

  const getRowColorClasses = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 shadow-sm'
      case 'PICKED_UP':
        return 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-400 shadow-sm'
      case 'INSPECTED':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400 shadow-sm'
      case 'TRANSFER_PLATE':
        return 'bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-400 shadow-sm'
      case 'RE_INSPECTION':
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-400 shadow-sm'
      case 'READY_FOR_PICKUP':
        return 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-l-4 border-emerald-400 shadow-sm'
      case 'TITLE_PENDING':
        return 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 shadow-sm'
      case 'AWAITING_STAMP':
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-400 shadow-sm'
      default:
        return ''
    }
  }

  const handleNoteChange = async (transactionId: string, newNote: string) => {
    try {
      // Update local state immediately
      setLocalNotes(prev => ({
        ...prev,
        [transactionId]: newNote
      }))
      
      // Update database
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: newNote
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update note')
      }
      
      console.log('Note updated successfully!')
    } catch (error) {
      console.error('Failed to update note:', error)
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

  const handlePaymentChange = async (transactionId: string, newPayment: string) => {
    try {
      // Update local state immediately
      setLocalPayments(prev => ({
        ...prev,
        [transactionId]: newPayment
      }))
      
      // Update database
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment: newPayment
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update payment')
      }
      
      console.log('Payment updated successfully!')
    } catch (error) {
      console.error('Failed to update payment:', error)
    }
  }

  const handleTaxChange = async (transactionId: string, newTax: string) => {
    try {
      // Update local state immediately
      setLocalTaxes(prev => ({
        ...prev,
        [transactionId]: newTax
      }))
      
      // Update database
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tax: newTax ? parseFloat(newTax) : null
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update tax')
      }
      
      console.log('Tax updated successfully!')
    } catch (error) {
      console.error('Failed to update tax:', error)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
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
    
    const matchesPayment = filterPayment === '' || transaction.payment === filterPayment
    
    return matchesSearch && matchesStatus && matchesPayment
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
      case 'payment':
        aValue = a.payment
        bValue = b.payment
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
    console.log('- filterPayment:', filterPayment)
    if (transactions.length > 0) {
      console.log('- First transaction:', transactions[0])
      console.log('- First transaction archived:', transactions[0].archived)
    }
  }, [transactions, filteredTransactions, sortedTransactions, searchTerm, filterStatus, filterPayment])

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
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Vehicle</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">VIN</th>
{isAdmin && (
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Payment</th>
              )}
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Tax</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Plate</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Note</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Contact</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Ref</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedTransactions.map((transaction, index) => (
                <tr key={transaction.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
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
                    <div className="text-xs font-medium text-gray-900">
                      {transaction.payment === 'PAID' ? 'Paid' : 'Unpaid'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.tax ? `$${transaction.tax.toFixed(2)}` : '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-xs font-medium px-2 py-1 rounded-full">
                      {transaction.status ? 
                        statusOptions.find(opt => opt.value === transaction.status)?.label || 
                        transaction.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                        : '-'
                      }
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.plate || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.note || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {transaction.customer.contact ? (
                      <a 
                        href={`tel:${transaction.customer.contact}`}
                        className="text-xs text-gray-600 font-mono cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-all duration-200"
                        title="Click to call"
                      >
                        {transaction.customer.contact}
                      </a>
                    ) : (
                      <div className="text-xs text-gray-600 font-mono">
                        -
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {transaction.ref || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isAdmin && (
                      <button
                        onClick={() => confirmArchive(transaction.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                        title="Add to archive"
                      >
                        📁
                      </button>
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
                <div className="text-sm font-semibold text-blue-300">{filteredTransactions.length}</div>
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
          
          {/* Payment Filter - Admin Only */}
          {isAdmin && (
            <div className="sm:w-32">
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
              >
                <option value="">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
          )}
          
          
          {/* Clear Button */}
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('')
              setFilterPayment('')
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
          {isAdmin && (
            <div className="flex flex-row gap-2">
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
            </div>
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
                {isAdmin ? (
                  <select 
                    className="text-xs font-medium border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 mt-1 touch-manipulation bg-white text-gray-900"
                    value={localPayments[transaction.id] || transaction.payment || 'UNPAID'}
                    onChange={(e) => {
                      handlePaymentChange(transaction.id, e.target.value)
                    }}
                  >
                    <option value="PAID" className="text-gray-900 bg-white">💰 Paid</option>
                    <option value="UNPAID" className="text-gray-900 bg-white">⏳ Unpaid</option>
                  </select>
                ) : (
                  <div className={`text-xs font-bold px-3 py-2 rounded-lg mt-1 ${
                    getPaymentColorClasses(localStatuses[transaction.id] || transaction.status || '')
                  }`}>
                    {transaction.payment === 'PAID' ? '💰 Paid' : '⏳ Unpaid'}
                  </div>
                )}
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
                <span className="text-gray-500">Tax:</span>
                <div className="font-semibold text-gray-900">
                  {transaction.tax ? `$${transaction.tax.toFixed(2)}` : '-'}
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
                    {transaction.lastUpdatedBy && (
                      <div className="text-xs text-gray-500 mt-1">
                        <div>Last updated by: {transaction.lastUpdatedBy}</div>
                        {(transaction as any).lastUpdatedAt && (
                          <div className="text-xs text-gray-400">
                            {new Date((transaction as any).lastUpdatedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
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
                {transaction.customer.contact ? (
                  <a 
                    href={`tel:${transaction.customer.contact}`}
                    className="font-mono text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors touch-manipulation"
                    title="Tap to call"
                  >
                    {transaction.customer.contact}
                  </a>
                ) : (
                  <div className="font-mono text-gray-600">
                    -
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
            
            {transaction.note && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-gray-500 text-xs">Note:</span>
                <div className="text-xs font-semibold text-gray-900 mt-1">
                  {transaction.note}
                </div>
              </div>
            )}
            
            {/* Archive Button */}
            {isAdmin && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => confirmArchive(transaction.id)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
                  title="Add to archive"
                >
                  📁 Add to Archive
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
                onClick={() => handleSort('payment')}
              >
                <div className="flex items-center gap-1">
                  💰 Payment
                  {sortBy === 'payment' && (
                    <span className="text-blue-300">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider border-r border-slate-500">
                💵 Tax
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sortedTransactions.map((transaction, index) => (
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
{isAdmin && (
                <td className="px-3 py-2 whitespace-nowrap">
                  <select 
                    className="text-xs font-medium border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[100px] shadow-sm hover:border-gray-400 transition-colors bg-white text-gray-900"
                    value={localPayments[transaction.id] || transaction.payment || 'UNPAID'}
                    onChange={(e) => {
                      handlePaymentChange(transaction.id, e.target.value)
                    }}
                  >
                    <option value="PAID" className="text-gray-900 bg-white">Paid</option>
                    <option value="UNPAID" className="text-gray-900 bg-white">Unpaid</option>
                  </select>
                </td>
              )}
                <td className="px-3 py-2 whitespace-nowrap">
                  {isAdmin && editingTax === transaction.id ? (
                    <input
                      type="number"
                      step="0.01"
                      className="text-xs border-2 border-blue-300 rounded px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter tax..."
                      value={taxValues[transaction.id] || ''}
                      onChange={(e) => {
                        setTaxValues(prev => ({
                          ...prev,
                          [transaction.id]: e.target.value
                        }))
                      }}
                      autoFocus
                      onBlur={(e) => {
                        const newValue = e.target.value.trim()
                        handleTaxChange(transaction.id, newValue)
                        setEditingTax(null)
                        setTaxValues(prev => {
                          const updated = {...prev}
                          delete updated[transaction.id]
                          return updated
                        })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = e.currentTarget.value.trim()
                          handleTaxChange(transaction.id, newValue)
                          setEditingTax(null)
                          setTaxValues(prev => {
                            const updated = {...prev}
                            delete updated[transaction.id]
                            return updated
                          })
                        } else if (e.key === 'Escape') {
                          setEditingTax(null)
                          setTaxValues(prev => {
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
                          setTaxValues(prev => ({
                            ...prev,
                            [transaction.id]: '' // Start with empty input
                          }))
                          setEditingTax(transaction.id)
                        }
                      }}
                    >
                      {(localTaxes[transaction.id] !== undefined ? localTaxes[transaction.id] : transaction.tax?.toString()) ? 
                        `$${(localTaxes[transaction.id] !== undefined ? parseFloat(localTaxes[transaction.id]) || 0 : transaction.tax || 0).toFixed(2)}` : 
                        '-'
                      }
                      {isAdmin && (
                        <button
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleTaxChange(transaction.id, '')
                          }}
                          title="Clear tax"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {canEdit ? (
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
                  ) : (
                    <div className="flex flex-col">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status ? 
                          statusOptions.find(opt => opt.value === transaction.status)?.label || 
                          transaction.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                          : '-'
                        }
                      </span>
                      {transaction.lastUpdatedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          <div>Last updated by: {transaction.lastUpdatedBy}</div>
                          {(transaction as any).lastUpdatedAt && (
                            <div className="text-xs text-gray-400">
                              {new Date((transaction as any).lastUpdatedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}
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
                  {isAdmin && editingNote === transaction.id ? (
                    <input
                      type="text"
                      className="text-xs border-2 border-blue-300 rounded px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      placeholder="Enter note..."
                      value={noteValues[transaction.id] || ''}
                      onChange={(e) => {
                        setNoteValues(prev => ({
                          ...prev,
                          [transaction.id]: e.target.value
                        }))
                      }}
                      autoFocus
                      onBlur={(e) => {
                        const newValue = e.target.value.trim()
                        handleNoteChange(transaction.id, newValue)
                        setEditingNote(null)
                        setNoteValues(prev => {
                          const updated = {...prev}
                          delete updated[transaction.id]
                          return updated
                        })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = e.currentTarget.value.trim()
                          handleNoteChange(transaction.id, newValue)
                          setEditingNote(null)
                          setNoteValues(prev => {
                            const updated = {...prev}
                            delete updated[transaction.id]
                            return updated
                          })
                        } else if (e.key === 'Escape') {
                          setEditingNote(null)
                          setNoteValues(prev => {
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
                          setNoteValues(prev => ({
                            ...prev,
                            [transaction.id]: '' // Start with empty input
                          }))
                          setEditingNote(transaction.id)
                        }
                      }}
                    >
                      {(localNotes[transaction.id] !== undefined ? localNotes[transaction.id] : transaction.note) || '-'}
                      {isAdmin && (
                        <button
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleNoteChange(transaction.id, '')
                          }}
                          title="Clear note"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {transaction.customer.contact ? (
                    <a 
                      href={`tel:${transaction.customer.contact}`}
                      className="text-xs text-gray-600 font-mono cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-all duration-200"
                      title="Click to call"
                    >
                      {transaction.customer.contact}
                    </a>
                  ) : (
                    <div className="text-xs text-gray-600 font-mono">
                      -
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => confirmArchive(transaction.id)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                      title="Add to archive"
                    >
                      📁
                    </button>
           {(transaction.status === 'TITLE_PENDING' || localStatuses[transaction.id] === 'TITLE_PENDING') && (
             <div 
               className="w-3 h-3 bg-red-500 rounded-full"
               title="Title Pending - Requires Attention"
             >
             </div>
           )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        {sortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-600 text-xl font-semibold mb-2">
                {searchTerm || filterStatus || filterPayment ? 'No matching records found' : 'No records found'}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {searchTerm || filterStatus || filterPayment 
                  ? 'Try adjusting your search criteria or filters' 
                  : 'Use the Quick Add button above to add new records'
                }
              </p>
              {(searchTerm || filterStatus || filterPayment) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterStatus('')
                    setFilterPayment('')
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
