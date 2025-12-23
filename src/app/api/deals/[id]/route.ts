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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const { id } = await params
    const { amount } = await request.json()
    
    if (amount !== null && amount !== undefined && (typeof amount !== 'number' || isNaN(amount))) {
      return NextResponse.json({ error: 'Amount must be a number or null' }, { status: 400 })
    }
    
    const deal = await prisma.deal.update({
      where: { id },
      data: {
        amount: amount === null || amount === '' ? null : Number(amount)
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        }
      }
    })
    
    // Get all transactions to match deal numbers with Ref column
    const transactions = await prisma.transaction.findMany({
      include: {
        vehicle: true,
        customer: true,
      },
      where: {
        archived: false,
      }
    })
    
    // Find matching transaction
    const matchingTransaction = transactions.find(t => {
      if (!t.ref) return false
      const refMatch = t.ref.match(/\b\d{4}\b/)
      return refMatch && refMatch[0] === deal.dealNumber
    })
    
    const dealWithVehicle = {
      ...deal,
      vehicle: matchingTransaction ? {
        year: matchingTransaction.vehicle.year,
        make: matchingTransaction.vehicle.make,
        model: matchingTransaction.vehicle.model,
        vin: matchingTransaction.vehicle.vin,
      } : null
    }
    
    return NextResponse.json(dealWithVehicle)
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }
}

