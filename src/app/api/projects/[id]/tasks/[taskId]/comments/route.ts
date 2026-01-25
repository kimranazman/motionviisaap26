import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

// GET /api/projects/[id]/tasks/[taskId]/comments - Get comments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id: projectId, taskId } = await params

    // Verify task exists and belongs to project
    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching task comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/tasks/[taskId]/comments - Create a new comment
// Note: Any authenticated user can comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { session, error } = await requireAuth()
  if (error) return error

  try {
    const { id: projectId, taskId } = await params
    const body = await request.json()

    // Validate content
    const content = body.content?.trim()
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Verify task exists and belongs to project
    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Create comment with logged-in user's ID
    const comment = await prisma.taskComment.create({
      data: {
        content,
        userId: session.user.id,
        taskId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating task comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
