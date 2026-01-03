import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { UserSession, canEdit, isAdmin } from '@/lib/auth'

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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Define fields that EDITOR and MANAGER (canEdit) are allowed to update
    const allowedForEditor = [
      'status',
      'note',
      'noteType',
      'plate',
      'preInspection',
      'isUrgent'
    ]

    // Check if the update contains any restricted fields (requires ADMIN)
    const updateKeys = Object.keys(data)
    const hasRestrictedFields = updateKeys.some(key => !allowedForEditor.includes(key))

    if (hasRestrictedFields) {
      if (!isAdmin(user)) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required for these changes' }, { status: 403 })
      }
    } else {
      // For allowed fields, check general edit permission
      if (!canEdit(user)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Prepare update data
    const updateData: any = {
      plate: data.plate,
      note: data.note,
      noteType: data.noteType !== undefined ? data.noteType : undefined,
      ref: data.ref
    }

    // If date is being changed
    if (data.date !== undefined) {
      updateData.date = new Date(data.date)
    }

    // If contact is being changed, update customer
    if (data.contact !== undefined) {
      // Get transaction to find customerId
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        select: { customerId: true }
      })

      if (transaction) {
        await prisma.customer.update({
          where: { id: transaction.customerId },
          data: { contact: data.contact }
        })
      }
    }

    // If status is being changed, update lastUpdatedBy and lastUpdatedAt
    if (data.status !== undefined) {
      updateData.status = data.status && data.status !== '' ? data.status : null
      if (updateData.status !== null) {
        updateData.lastUpdatedBy = user.username
        updateData.lastUpdatedAt = new Date()
      }
    }

    // If note is being changed, update noteCreatedBy and noteCreatedAt
    if (data.note !== undefined) {
      updateData.noteCreatedBy = user.username
      updateData.noteCreatedAt = new Date()
      // Also update lastUpdatedBy for status changes
      updateData.lastUpdatedBy = user.username
      updateData.lastUpdatedAt = new Date()
      // Reset approval if note is changed
      if (data.note && data.note.trim() !== '') {
        updateData.noteApproved = false
        updateData.noteApprovedBy = null
        updateData.noteApprovedAt = null
      }
    }

    // If isUrgent is being changed
    if (data.isUrgent !== undefined) {
      updateData.isUrgent = data.isUrgent
    }

    // If preInspection is being changed
    if (data.preInspection !== undefined) {
      updateData.preInspection = data.preInspection
    }

    // Update transaction fields
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
        customer: true
      }
    })

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error('Error updating transaction:', error)

    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin kontrolü
    const user = await getCurrentUser()

    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    await prisma.transaction.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)

    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
