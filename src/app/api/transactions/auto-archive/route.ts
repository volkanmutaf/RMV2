import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Auto-archive transactions with PICKED_UP status that have been in that status for 24+ hours
 * This endpoint should be called periodically (e.g., via cron job)
 * Cron schedule: Every hour (0 * * * *)
 * 
 * Triggered automatically by Vercel cron jobs
 * GitHub webhook test
 */
export async function POST() {
  try {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago

    // Find transactions that:
    // 1. Have status PICKED_UP
    // 2. Are not already archived
    // 3. Have lastUpdatedAt that is 24+ hours ago (or null and createdAt is 24+ hours ago)
    const transactionsToArchive = await prisma.transaction.findMany({
      where: {
        status: 'PICKED_UP',
        archived: false,
        OR: [
          {
            lastUpdatedAt: {
              lte: twentyFourHoursAgo
            }
          },
          {
            lastUpdatedAt: null,
            createdAt: {
              lte: twentyFourHoursAgo
            }
          }
        ]
      },
      select: {
        id: true
      }
    })

    if (transactionsToArchive.length === 0) {
      return NextResponse.json({
        message: 'No transactions to archive',
        archivedCount: 0
      })
    }

    // Archive all found transactions
    const result = await prisma.transaction.updateMany({
      where: {
        id: {
          in: transactionsToArchive.map(t => t.id)
        }
      },
      data: {
        archived: true,
        archivedAt: now
      }
    })

    console.log(`Auto-archived ${result.count} transaction(s) with PICKED_UP status`)

    return NextResponse.json({
      message: `Successfully archived ${result.count} transaction(s)`,
      archivedCount: result.count
    })
  } catch (error) {
    console.error('Error auto-archiving transactions:', error)
    return NextResponse.json(
      {
        error: 'Failed to auto-archive transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also allow GET for manual testing
export async function GET() {
  return POST()
}

