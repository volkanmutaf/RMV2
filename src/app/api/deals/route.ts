import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { UserSession, canEdit } from '@/lib/auth'

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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { dealNumber, type } = await request.json()
    
    if (!dealNumber || dealNumber.length !== 4 || !/^\d{4}$/.test(dealNumber)) {
      return NextResponse.json({ error: 'Deal number must be exactly 4 digits' }, { status: 400 })
    }
    
    if (!type || (type !== 'DEPOSIT' && type !== 'DEAL')) {
      return NextResponse.json({ error: 'Type must be DEPOSIT or DEAL' }, { status: 400 })
    }
    
    // Get user from database to get the ID
    const dbUser = await prisma.user.findUnique({
      where: { username: user.username }
    })
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const deal = await prisma.deal.create({
      data: {
        dealNumber,
        type,
        createdById: dbUser.id,
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
    console.error('Error creating deal:', error)
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Only admin can view all deals
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const deals = await prisma.deal.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(deals)
  } catch (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}

