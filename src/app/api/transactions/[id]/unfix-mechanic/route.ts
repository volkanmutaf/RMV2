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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can unfix
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Only Admin can unfix mechanic notes' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if transaction exists and has a fixed mechanic note
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: {
        note: true,
        noteType: true,
        noteApproved: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (!transaction.note || transaction.noteType !== 'MECHANIC' || !transaction.noteApproved) {
      return NextResponse.json(
        { error: 'This transaction does not have a fixed mechanic note' },
        { status: 400 }
      )
    }

    // Unfix the note (reset approval status)
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        noteApproved: false,
        noteApprovedBy: null,
        noteApprovedAt: null
      },
      include: {
        vehicle: true,
        customer: true
      }
    })

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error('Error unfixing mechanic note:', error)
    return NextResponse.json(
      { error: 'Failed to unfix mechanic note' },
      { status: 500 }
    )
  }
}

