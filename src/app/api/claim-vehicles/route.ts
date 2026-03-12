
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 25
    const skip = (page - 1) * limit
    const archived = searchParams.get('archived') === 'true'

    try {
        const [vehicles, total] = await Promise.all([
            prisma.claimVehicle.findMany({
                where: { isArchived: archived },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.claimVehicle.count({
                where: { isArchived: archived }
            })
        ])

        return NextResponse.json({
            vehicles,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        })
    } catch (error) {
        console.error('Failed to fetch claim vehicles:', error)
        return NextResponse.json({ error: 'Failed to fetch claim vehicles' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { year, make, model, color, vin, description } = body

        if (!year || !make || !model) {
            return NextResponse.json({ error: 'Year, make, and model are required' }, { status: 400 })
        }

        const vehicle = await prisma.claimVehicle.create({
            data: {
                year,
                make,
                model,
                color,
                vin,
                description,
            }
        })

        return NextResponse.json(vehicle)
    } catch (error) {
        console.error('Failed to create claim vehicle:', error)
        return NextResponse.json({ error: 'Failed to create claim vehicle' }, { status: 500 })
    }
}
