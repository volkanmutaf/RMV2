import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all notes
export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

// POST - Create a new note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, name } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (name && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string if provided' },
        { status: 400 }
      )
    }

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const clientIP = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        name: name ? name.trim() : null,
        createdByIP: clientIP
      }
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}

// PUT - Update a note
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, content, completed } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (content !== undefined) updateData.content = content
    if (completed !== undefined) updateData.completed = completed

    const note = await prisma.note.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a note
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    await prisma.note.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}
