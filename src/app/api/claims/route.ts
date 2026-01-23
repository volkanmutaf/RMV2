import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const query = searchParams.get('query')

        const whereClause = query ? {
            OR: [
                { vehicleOwner: { contains: query, mode: 'insensitive' as const } },
                { vin: { contains: query, mode: 'insensitive' as const } },
                { claimNumber: { contains: query, mode: 'insensitive' as const } }
            ]
        } : {}

        const claims = await prisma.claim.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return NextResponse.json(claims)
    } catch (error) {
        console.error('Error fetching claims:', error)
        return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    console.log('API: Claims POST request received')
    try {
        const body = await req.json()
        const {
            vehicleOwner,
            claimNumber,
            yearMakeModel,
            insuranceCompany,
            policyNumber,
            vin
        } = body

        console.log('API: Validating input...', { vin })
        // Validation
        if (!vin || vin.length !== 17) {
            return NextResponse.json({ error: 'VIN must be exactly 17 characters' }, { status: 400 })
        }
        if (!vehicleOwner || !yearMakeModel || !insuranceCompany) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Generate dynamic PDF path (we will generate it on-the-fly)
        // No need to save to FS (fixes Vercel EROFS error)
        const relativePath = `/api/claims/DYNAMIC_ID_PLACEHOLDER/pdf`

        console.log('API: Saving to DB...')

        // Debug check for prisma model
        // @ts-ignore - Check if model is missing at runtime
        if (!prisma.claim) {
            throw new Error('Prisma Claim model is undefined. Did you run `npx prisma generate`?')
        }

        const claim = await prisma.claim.create({
            data: {
                vehicleOwner,
                claimNumber: claimNumber || null,
                yearMakeModel,
                insuranceCompany,
                policyNumber: policyNumber || null,
                vin,
                pdfPath: relativePath // Placeholder, we can update if needed or just use ID in frontend
            }
        })

        // Update the path now that we have the ID (optional, but good for consistency)
        const updatedClaim = await prisma.claim.update({
            where: { id: claim.id },
            data: { pdfPath: `/api/claims/${claim.id}/pdf` }
        })

        console.log('API: Claim created in DB:', claim.id)

        return NextResponse.json(updatedClaim)



    } catch (error) {
        console.error('Error creating claim:', error)
        // Return full error details in development
        return NextResponse.json({
            error: 'Failed to create claim',
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}
