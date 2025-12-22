import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleAdminError } from '@/lib/admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin kontrolü
    requireAdmin(request)
    
    const { id } = await params
    const data = await request.json()
    
    // Update transaction fields
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        payment: data.payment,
        tax: data.tax ? parseFloat(data.tax) : null,
        status: data.status && data.status !== '' ? data.status : null,
        plate: data.plate,
        note: data.note,
        ref: data.ref
      },
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
