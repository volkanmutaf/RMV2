import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const claim = await prisma.claim.findUnique({
            where: { id: params.id }
        })

        if (!claim) {
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
        }


        // Re-generate PDF on the fly
        const { generateClaimPdf } = await import('@/lib/pdfGenerator')

        const pdfBytes = await generateClaimPdf({
            vehicleOwner: claim.vehicleOwner,
            claimNumber: claim.claimNumber || undefined,
            yearMakeModel: claim.yearMakeModel,
            insuranceCompany: claim.insuranceCompany,
            policyNumber: claim.policyNumber || undefined,
            vin: claim.vin
        })

        const filename = `DirectionToPay_${claim.vin}.pdf`

        return new NextResponse(pdfBytes, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })

    } catch (error) {
        console.error('Error fetching PDF:', error)
        return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 })
    }
}
