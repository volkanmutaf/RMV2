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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const archived = searchParams.get('archived') === 'true'

    // Get all transactions with MECHANIC notes
    const transactions = await prisma.transaction.findMany({
      where: {
        note: { not: null },
        noteType: 'MECHANIC',
        archived: { not: true },
        noteArchived: archived
      },
      include: {
        vehicle: true,
        customer: true
      },
      orderBy: {
        noteCreatedAt: 'desc'
      }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching mechanic notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mechanic notes' },
      { status: 500 }
    )
  }
}

