
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params

    try {
        const body = await request.json()
        const { year, make, model, color, vin, description, isArchived } = body

        const updateData: any = {}
        if (year !== undefined) updateData.year = year
        if (make !== undefined) updateData.make = make
        if (model !== undefined) updateData.model = model
        if (color !== undefined) updateData.color = color
        if (vin !== undefined) updateData.vin = vin
        if (description !== undefined) updateData.description = description
        if (isArchived !== undefined) {
            updateData.isArchived = isArchived
            updateData.archivedAt = isArchived ? new Date() : null
        }

        const vehicle = await prisma.claimVehicle.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(vehicle)
    } catch (error) {
        console.error('Failed to update claim vehicle:', error)
        return NextResponse.json({ error: 'Failed to update claim vehicle' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params

    try {
        await prisma.claimVehicle.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete claim vehicle:', error)
        return NextResponse.json({ error: 'Failed to delete claim vehicle' }, { status: 500 })
    }
}
