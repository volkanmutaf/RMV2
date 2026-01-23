
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import fs from 'fs'
import path from 'path'

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

        const filePath = path.join(process.cwd(), 'public', claim.pdfPath)

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'PDF file not found' }, { status: 404 })
        }

        const fileBuffer = fs.readFileSync(filePath)

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${path.basename(claim.pdfPath)}"`
            }
        })

    } catch (error) {
        console.error('Error fetching PDF:', error)
        return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 })
    }
}
