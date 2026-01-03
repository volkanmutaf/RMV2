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
    const { amount, dealNumber, type, insurance, readByAdmin } = await request.json()
    
    const updateData: any = {}
    
    if (readByAdmin !== undefined) {
      if (typeof readByAdmin !== 'boolean') {
        return NextResponse.json({ error: 'readByAdmin must be a boolean' }, { status: 400 })
      }
      updateData.readByAdmin = readByAdmin
    }
    
    if (amount !== undefined) {
      if (amount !== null && (typeof amount !== 'number' || isNaN(amount))) {
        return NextResponse.json({ error: 'Amount must be a number or null' }, { status: 400 })
      }
      updateData.amount = amount === null || amount === '' ? null : Number(amount)
    }
    
    if (dealNumber !== undefined) {
      if (!dealNumber || dealNumber.length !== 4 || !/^\d{4}$/.test(dealNumber)) {
        return NextResponse.json({ error: 'Deal number must be exactly 4 digits' }, { status: 400 })
      }
      updateData.dealNumber = dealNumber
    }
    
    if (type !== undefined) {
      if (!type || (type !== 'DEPOSIT' && type !== 'DEAL')) {
        return NextResponse.json({ error: 'Type must be DEPOSIT or DEAL' }, { status: 400 })
      }
      updateData.type = type
    }
    
    if (insurance !== undefined) {
      updateData.insurance = insurance && insurance.trim() !== '' ? insurance.trim() : null
    }
    
    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const { id } = await params
    
    await prisma.deal.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Deal deleted successfully' })
  } catch (error) {
    console.error('Error deleting deal:', error)
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 })
  }
}

