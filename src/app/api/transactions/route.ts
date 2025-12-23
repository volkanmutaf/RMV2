import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleAdminError } from '@/lib/admin'

export async function GET() {
  try {
    console.log('Fetching transactions...')
    
    // Get all transactions and filter in JavaScript
    const allTransactions = await prisma.transaction.findMany({
      include: {
        vehicle: true,
        customer: true
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    console.log('All transactions:', allTransactions.length)
    
    // Filter out archived ones in JavaScript
    const transactions = allTransactions.filter(t => !t.archived)
    
    console.log('Non-archived transactions:', transactions.length)
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    try {
      requireAdmin(request)
    } catch (adminError) {
      console.error('Admin check failed:', adminError)
      const adminErrorResponse = handleAdminError(adminError)
      if (adminErrorResponse) {
        return NextResponse.json({ error: adminErrorResponse.message }, { status: adminErrorResponse.status })
      }
      throw adminError
    }
    
    const data = await request.json()
    
    // Check for duplicate VIN
    if (data.vehicle.vin && data.vehicle.vin.trim() !== '') {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { vin: data.vehicle.vin.trim() }
      })
      if (existingVehicle) {
        return NextResponse.json({ error: 'VIN number already exists' }, { status: 400 })
      }
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        vehicle: {
          create: {
            year: data.vehicle.year,
            make: data.vehicle.make,
            model: data.vehicle.model,
            vin: data.vehicle.vin
          }
        },
        customer: {
          create: {
            name: data.customer.name,
            contact: data.customer.contact
          }
        },
        payment: data.payment || 'UNPAID',
        tax: data.tax,
        status: data.status,
        plate: data.plate,
        note: data.note,
        ref: data.ref,
        date: data.date || new Date()
      },
      include: {
        vehicle: true,
        customer: true
      }
    })
    
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error creating transaction:', error)
    
    // Admin error kontrolü
    const adminError = handleAdminError(error)
    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: adminError.status })
    }
    
    return NextResponse.json({ 
      error: 'Failed to create transaction', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
