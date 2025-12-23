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
    // Admin kontrolü
    const user = await getCurrentUser()
    
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const { id } = await params
    console.log('Archive API called with ID:', id)
    
    // Update with archived field and archivedAt timestamp
    const archivedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        archived: true,
        archivedAt: new Date()
      },
      include: {
        vehicle: true,
        customer: true
      }
    })
    
    console.log('Archive successful:', archivedTransaction)
    return NextResponse.json(archivedTransaction)
  } catch (error) {
    console.error('Error archiving record:', error)
    return NextResponse.json({ error: 'Failed to archive record', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
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
    console.log('Unarchive API called with ID:', id)
    
    // Unarchive the transaction
    const unarchivedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        archived: false,
        archivedAt: null
      },
      include: {
        vehicle: true,
        customer: true
      }
    })
    
    console.log('Unarchive successful:', unarchivedTransaction)
    return NextResponse.json(unarchivedTransaction)
  } catch (error) {
    console.error('Error unarchiving record:', error)
    return NextResponse.json({ error: 'Failed to unarchive record', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
