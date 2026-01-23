
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

interface ClaimData {
    vehicleOwner: string
    claimNumber?: string
    yearMakeModel: string
    insuranceCompany: string
    policyNumber?: string
    vin: string
}

export async function generateClaimPdf(data: ClaimData): Promise<Uint8Array> {

    // Load existing PDF template
    // NOTE: In Vercel, we need to read from the included file in the function
    const templatePath = path.join(process.cwd(), 'public', 'storage', 'claims', 'claims.pdf')
    let pdfDoc: PDFDocument

    if (fs.existsSync(templatePath)) {
        const templateBytes = fs.readFileSync(templatePath)
        pdfDoc = await PDFDocument.load(templateBytes)
    } else {
        // Fallback if template missing (should not happen if deployed correctly)
        pdfDoc = await PDFDocument.create()
        pdfDoc.addPage([612, 792]) // Letter size
    }

    const page = pdfDoc.getPages()[0]
    const { width, height } = page.getSize()

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Helper to draw text
    const drawText = (text: string, x: number, y: number, size: number = 10, isBold: boolean = false) => {
        page.drawText(text, {
            x,
            y,
            size,
            font: isBold ? fontBold : font,
            color: rgb(0, 0, 0),
            maxWidth: width - 100,
        })
    }

    // --- Header ---
    const title = "AUTHORIZATION TO REPAIR,"
    const subtitle = "ASSIGNMENT OF CLAIM & DIRECTION TO PAY"

    const titleWidth = fontBold.widthOfTextAtSize(title, 16)
    const subtitleWidth = fontBold.widthOfTextAtSize(subtitle, 16)

    // Draw header at the top (taking into account the template might have margins, but user asked for it)
    // height - 50 is standard top margin area
    drawText(title, (width - titleWidth) / 2, height - 50, 16, true)
    drawText(subtitle, (width - subtitleWidth) / 2, height - 70, 16, true)

    // --- Content Layout (Adjusted for Template) ---
    // Moved startY down to accommodate letterhead (approx 150-200 units from top)
    const startY = height - 200
    const lineHeight = 25
    const col1X = 50
    const col2X = 300

    // Row 1
    drawText("Vehicle Owner:", col1X, startY, 10, true)
    drawText(data.vehicleOwner, col1X + 100, startY, 10)

    drawText("Claim #:", col2X, startY, 10, true)
    drawText(data.claimNumber || "N/A", col2X + 60, startY, 10)

    // Row 2
    drawText("Year/Make/Model:", col1X, startY - lineHeight, 10, true)
    drawText(data.yearMakeModel, col1X + 100, startY - lineHeight, 10)

    // Row 3 (Insurance Company)
    drawText("Insurance Co:", col1X, startY - lineHeight * 2, 10, true)
    drawText(data.insuranceCompany, col1X + 100, startY - lineHeight * 2, 10)

    drawText("Policy #:", col2X, startY - lineHeight * 2, 10, true)
    drawText(data.policyNumber || "N/A", col2X + 60, startY - lineHeight * 2, 10)

    // Row 4
    drawText("VIN:", col1X, startY - lineHeight * 3, 10, true)
    drawText(data.vin, col1X + 100, startY - lineHeight * 3, 10)

    // --- Body Text ---
    const bodyY = startY - lineHeight * 5
    const bodyText = `I hereby authorize the above repair facility to repair my vehicle.

I hereby grant you and your employees permission to operate the vehicle herein described on streets, highways or elsewhere for the purpose of testing and/or inspection. An express mechanic's lien is hereby acknowledged on above vehicle to secure the amount of repairs thereto.

I also assign any and all claims that I have against the insurance company and/or the responsible party in connection with this vehicle lose to the above Repair Facility.

I hereby authorize the insurance company to pay the Repair Facility directly for all repair, supplemental and diminished value costs.

I agree to cooperate with the Repair Facility and the insurance company to ensure that the vehicle is repaired properly and that the insurance company pays for all repairs, and I appoint the Repair Facility as my attorney in fact to endorse any and all insurance checks or drafts for repairs to the vehicle.`

    let currentY = bodyY
    const paragraphs = bodyText.split('\n\n')

    for (const para of paragraphs) {
        const lines = splitTextToLines(para, font, 10, width - 100)
        for (const line of lines) {
            drawText(line, 50, currentY, 10)
            currentY -= 14
        }
        currentY -= 10 // paragraph spacing
    }

    // --- Signatures ---
    const sigY = currentY - 50
    const currentDate = new Date().toLocaleDateString('en-US') // e.g. 1/23/2026

    // Vehicle Owner Signature
    page.drawLine({
        start: { x: 50, y: sigY },
        end: { x: 250, y: sigY },
        thickness: 1,
        color: rgb(0, 0, 0),
    })
    drawText("Vehicle Owner Signature / Date", 50, sigY - 15, 8)

    // Add Date on line
    // Line ends at 250, let's put date at approx 180
    drawText(currentDate, 180, sigY + 2, 10)

    // Printed Name
    drawText("Printed Name:", 50, sigY - 35, 10, true)
    drawText(data.vehicleOwner, 120, sigY - 35, 10)

    // Rep Signature
    page.drawLine({
        start: { x: 300, y: sigY },
        end: { x: 500, y: sigY },
        thickness: 1,
        color: rgb(0, 0, 0),
    })
    drawText("Repair Fclty. Authorized Rep. / Date", 300, sigY - 15, 8)

    // Add Date on line
    // Line ends at 500, let's put date at approx 430
    drawText(currentDate, 430, sigY + 2, 10)

    return await pdfDoc.save()
}

function splitTextToLines(text: string, font: any, size: number, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = font.widthOfTextAtSize(`${currentLine} ${word}`, size)
        if (width < maxWidth) {
            currentLine += ` ${word}`
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    lines.push(currentLine)
    return lines
}
