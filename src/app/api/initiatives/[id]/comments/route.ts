import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/initiatives/[id]/comments - Get comments for an initiative
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comments = await prisma.comment.findMany({
      where: { initiativeId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/initiatives/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.content || !body.author) {
      return NextResponse.json(
        { error: 'Content and author are required' },
        { status: 400 }
      )
    }

    // Verify initiative exists
    const initiative = await prisma.initiative.findUnique({
      where: { id },
    })

    if (!initiative) {
      return NextResponse.json(
        { error: 'Initiative not found' },
        { status: 404 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        content: body.content,
        author: body.author,
        initiativeId: id,
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

// DELETE /api/initiatives/[id]/comments?commentId=xxx - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    void _params // Acknowledge params for route segment
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      )
    }

    await prisma.comment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
