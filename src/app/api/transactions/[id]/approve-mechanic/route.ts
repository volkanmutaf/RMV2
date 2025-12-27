import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { UserSession } from '@/lib/auth'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can fix (caner, volkan, or admin)
    const canFix = user.username.toLowerCase() === 'caner' || 
                   user.username.toLowerCase() === 'volkan' || 
                   user.role === 'ADMIN'
    
    if (!canFix) {
      return NextResponse.json(
        { error: 'Only Caner, Volkan, or Admin can fix mechanic notes' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if transaction exists and has a mechanic note
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: {
        note: true,
        noteType: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (!transaction.note || transaction.noteType !== 'MECHANIC') {
      return NextResponse.json(
        { error: 'This transaction does not have a mechanic note' },
        { status: 400 }
      )
    }

    // Update fixed status
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        noteApproved: true,
        noteApprovedBy: user.username,
        noteApprovedAt: new Date()
      },
      include: {
        vehicle: true,
        customer: true
      }
    })

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error('Error fixing mechanic note:', error)
    return NextResponse.json(
      { error: 'Failed to fix mechanic note' },
      { status: 500 }
    )
  }
}

