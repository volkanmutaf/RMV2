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

    // Check permissions
    const isStatusChange = request.headers.get('x-status-change') === 'true'
    if (isStatusChange) {
      // Status change: ADMIN or EDITOR can do this
      if (!canEdit(user)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      // Other changes: Only ADMIN can do this
      if (!isAdmin(user)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }
    
    const { id } = await params
    const data = await request.json()
    
    // Prepare update data
    const updateData: any = {
      payment: data.payment,
      tax: data.tax ? parseFloat(data.tax) : null,
      plate: data.plate,
      note: data.note,
      ref: data.ref
    }

    // If status is being changed, update lastUpdatedBy
    if (data.status !== undefined) {
      updateData.status = data.status && data.status !== '' ? data.status : null
      if (updateData.status !== null) {
        updateData.lastUpdatedBy = user.username
      }
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
    
    // Admin error kontrolü
    const adminError = handleAdminError(error)
    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: adminError.status })
    }
    
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin kontrolü
    requireAdmin(request)
    
    const { id } = await params
    
    await prisma.transaction.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    
    // Admin error kontrolü
    const adminError = handleAdminError(error)
    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: adminError.status })
    }
    
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
