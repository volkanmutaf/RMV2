
import { PrismaClient } from '../src/generated/prisma'
import { generateClaimPdf } from '../src/lib/pdfGenerator'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Starting Diagnosis ---')

    // 1. Test PDF Generation
    console.log('1. Testing PDF Generation...')
    try {
        const pdfBytes = await generateClaimPdf({
            vehicleOwner: 'Test Owner',
            claimNumber: 'TEST-123',
            yearMakeModel: '2020 Test Car',
            insuranceCompany: 'Test Ins',
            policyNumber: 'POL-123',
            vin: '12345678901234567'
        })
        console.log('   ✅ PDF Generated, size:', pdfBytes.length)

        // 2. Test File System
        console.log('2. Testing File System...')
        const storageDir = path.join(process.cwd(), 'public', 'storage', 'claims')
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true })
        }
        const filePath = path.join(storageDir, 'test-claim.pdf')
        fs.writeFileSync(filePath, pdfBytes)
        console.log('   ✅ File saved at:', filePath)

        // 3. Test Database
        console.log('3. Testing Database Connection & Insert...')
        // @ts-ignore
        if (!prisma.claim) {
            console.error('   ❌ prisma.claim is undefined!')
        } else {
            console.log('   ℹ️ prisma.claim model exists')
        }

        const claim = await prisma.claim.create({
            data: {
                vehicleOwner: 'Test Owner',
                claimNumber: 'TEST-123',
                yearMakeModel: '2020 Test Car',
                insuranceCompany: 'Test Ins',
                policyNumber: 'POL-123',
                vin: '12345678901234567',
                pdfPath: '/storage/claims/test-claim.pdf'
            }
        })
        console.log('   ✅ Claim inserted with ID:', claim.id)

        // Cleanup
        await prisma.claim.delete({ where: { id: claim.id } })
        console.log('   ✅ Test claim deleted')

    } catch (error) {
        console.error('   ❌ FAILED:', error)
        if (error instanceof Error) {
            console.error('   Stack:', error.stack)
        }
    } finally {
        await prisma.$disconnect()
    }
}

main()
