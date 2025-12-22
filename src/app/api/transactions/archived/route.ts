import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const allTransactions = await prisma.transaction.findMany({
      include: {
        vehicle: true,
        customer: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    // Filter archived ones in JavaScript
    const archivedTransactions = allTransactions.filter(t => t.archived)
    
    return NextResponse.json(archivedTransactions)
  } catch (error) {
    console.error('Error fetching archived transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch archived transactions' }, { status: 500 })
  }
}
