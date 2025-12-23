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
    
    return NextResponse.json(deal)
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }
}

