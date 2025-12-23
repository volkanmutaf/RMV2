import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { UserSession, isAdmin } from '@/lib/auth'

async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session')
    if (!sessionCookie) return null
    return JSON.parse(sessionCookie.value) as UserSession
  } catch {
    return null
  }
}

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
    const user = await getCurrentUser()
    
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
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
    
    return NextResponse.json({ 
      error: 'Failed to create transaction', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
