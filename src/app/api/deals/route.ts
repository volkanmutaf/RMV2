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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dealNumber, type, insurance } = await request.json()

    if (!dealNumber || dealNumber.length !== 4 || !/^\d{4}$/.test(dealNumber)) {
      return NextResponse.json({ error: 'Deal number must be exactly 4 digits' }, { status: 400 })
    }

    if (!type || (type !== 'DEPOSIT' && type !== 'DEAL')) {
      return NextResponse.json({ error: 'Type must be DEPOSIT or DEAL' }, { status: 400 })
    }

    // Check for duplicate deal number in existing Deals
    const existingDeal = await prisma.deal.findFirst({
      where: { dealNumber }
    })

    if (existingDeal) {
      return NextResponse.json({ error: `A deal with number ${dealNumber} already exists in deals.` }, { status: 400 })
    }

    // Check for duplicate deal number in Transactions (both active and archived)
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        ref: {
          contains: dealNumber
        }
      }
    })

    if (existingTransaction) {
      return NextResponse.json({
        error: `A transaction with Ref ${dealNumber} already exists${existingTransaction.archived ? ' in archive' : ''}.`
      }, { status: 400 })
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
        insurance: insurance && insurance.trim() !== '' ? insurance.trim() : null,
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

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and manager can view all deals
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
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

    // Get all transactions to match deal numbers with Ref column
    const transactions = await prisma.transaction.findMany({
      include: {
        vehicle: true,
        customer: true,
      },
      // Removed where: { archived: false } to include archived transactions in the check
    })

    // Match deals with transactions based on Ref column
    const dealsWithVehicles = deals.map(deal => {
      // Find transaction where Ref column matches deal number (4 digits)
      const matchingTransaction = transactions.find(t => {
        if (!t.ref) return false
        // Check if ref contains the 4-digit deal number
        const refMatch = t.ref.match(/\b\d{4}\b/)
        return refMatch && refMatch[0] === deal.dealNumber
      })

      return {
        ...deal,
        vehicle: matchingTransaction ? {
          year: matchingTransaction.vehicle.year,
          make: matchingTransaction.vehicle.make,
          model: matchingTransaction.vehicle.model,
          vin: matchingTransaction.vehicle.vin,
        } : null
      }
    })



    return NextResponse.json(dealsWithVehicles)
  } catch (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}

