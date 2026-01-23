
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { generateClaimPdf } from '@/lib/pdfGenerator'
import fs from 'fs'
import path from 'path'

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

        console.log('API: Generating PDF...')
        // Generate PDF
        const pdfBytes = await generateClaimPdf({
            vehicleOwner,
            claimNumber,
            yearMakeModel,
            insuranceCompany,
            policyNumber,
            vin
        })
        console.log('API: PDF Generated, size:', pdfBytes.length)

        // Save PDF to file system (dev implementation)
        // Production should use S3/Blob storage
        const storageDir = path.join(process.cwd(), 'public', 'storage', 'claims')
        console.log('API: Ensuring storage directory:', storageDir)
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true })
        }

        // Helper to sanitize filename
        const safeVin = vin.replace(/[^a-zA-Z0-9]/g, '')
        const filename = `HE_DirectionToPay_${safeVin}_${Date.now()}.pdf`
        const filePath = path.join(storageDir, filename)

        console.log('API: Writing file to:', filePath)
        fs.writeFileSync(filePath, pdfBytes)

        // Save to DB
        const relativePath = `/storage/claims/${filename}`
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
                pdfPath: relativePath
            }
        })
        console.log('API: Claim created in DB:', claim.id)

        return NextResponse.json(claim)

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
