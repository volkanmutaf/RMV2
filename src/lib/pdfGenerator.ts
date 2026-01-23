
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface ClaimData {
    vehicleOwner: string
    claimNumber?: string
    yearMakeModel: string
    insuranceCompany: string
    policyNumber?: string
    vin: string
}

export async function generateClaimPdf(data: ClaimData): Promise<Uint8Array> {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()

    // Add a blank page (Letter size)
    const page = pdfDoc.addPage([612, 792]) // 8.5 x 11 inches
    const { width, height } = page.getSize()

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Helper to draw text
    const drawText = (text: string, x: number, y: number, size: number = 12, isBold: boolean = false) => {
        page.drawText(text, {
            x,
            y,
            size,
            font: isBold ? fontBold : font,
            color: rgb(0, 0, 0),
            maxWidth: width - 100, // naive wrapping
        })
    }

    // --- Header ---
    const title = "AUTHORIZATION TO REPAIR,"
    const subtitle = "ASSIGNMENT OF CLAIM & DIRECTION TO PAY"

    const titleWidth = fontBold.widthOfTextAtSize(title, 16)
    const subtitleWidth = fontBold.widthOfTextAtSize(subtitle, 16)

    drawText(title, (width - titleWidth) / 2, height - 50, 16, true)
    drawText(subtitle, (width - subtitleWidth) / 2, height - 70, 16, true)

    // --- Grid / Info Section ---
    const startY = height - 120
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

    // Vehicle Owner Signature
    page.drawLine({
        start: { x: 50, y: sigY },
        end: { x: 250, y: sigY },
        thickness: 1,
        color: rgb(0, 0, 0),
    })
    drawText("Vehicle Owner Signature / Date", 50, sigY - 15, 8)

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
