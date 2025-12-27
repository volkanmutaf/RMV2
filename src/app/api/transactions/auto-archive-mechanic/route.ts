import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all fixed mechanic notes that were fixed more than 24 hours ago
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const fixedMechanicNotes = await prisma.transaction.findMany({
      where: {
        noteType: 'MECHANIC',
        noteApproved: true,
        noteArchived: false,
        noteApprovedAt: {
          lte: twentyFourHoursAgo
        }
      }
    })

    // Archive them
    let archivedCount = 0
    for (const transaction of fixedMechanicNotes) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          noteArchived: true
        }
      })
      archivedCount++
    }

    return NextResponse.json({ 
      message: `Archived ${archivedCount} mechanic notes`,
      archivedCount 
    })
  } catch (error) {
    console.error('Error archiving mechanic notes:', error)
    return NextResponse.json(
      { error: 'Failed to archive mechanic notes' },
      { status: 500 }
    )
  }
}

