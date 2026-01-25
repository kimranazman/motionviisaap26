import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// Helper function to collect all descendant task IDs
async function getDescendantTaskIds(taskId: string): Promise<string[]> {
  const descendants: string[] = []

  async function collectDescendants(parentId: string) {
    const children = await prisma.task.findMany({
      where: { parentId },
      select: { id: true },
    })
    for (const child of children) {
      descendants.push(child.id)
      await collectDescendants(child.id)
    }
  }

  await collectDescendants(taskId)
  return descendants
}

// GET /api/projects/[id]/tasks/[taskId] - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id: projectId, taskId } = await params

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        tags: {
          include: { tag: true },
        },
        _count: {
          select: { children: true, comments: true },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/tasks/[taskId] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, taskId } = await params
    const body = await request.json()

    // Verify task exists and belongs to project
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, projectId },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Build update data - do NOT allow changing parentId
    const updateData: {
      title?: string
      description?: string | null
      status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
      priority?: 'LOW' | 'MEDIUM' | 'HIGH'
      dueDate?: Date | null
      assignee?: 'KHAIRUL' | 'AZLAN' | 'IZYANI' | null
    } = {}

    if (body.title !== undefined) {
      if (!body.title?.trim()) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        )
      }
      updateData.title = body.title.trim()
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }
    if (body.priority !== undefined) {
      updateData.priority = body.priority
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }
    if (body.assignee !== undefined) {
      updateData.assignee = body.assignee || null
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete task with cascade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, taskId } = await params

    // Verify task exists and belongs to project
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, projectId },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Get all descendant task IDs recursively
    const descendantIds = await getDescendantTaskIds(taskId)
    const allTaskIds = [taskId, ...descendantIds]

    // Delete in transaction: TaskTag, TaskComment, then Tasks
    await prisma.$transaction([
      // Delete task tags for all tasks
      prisma.taskTag.deleteMany({
        where: { taskId: { in: allTaskIds } },
      }),
      // Delete comments for all tasks
      prisma.taskComment.deleteMany({
        where: { taskId: { in: allTaskIds } },
      }),
      // Delete tasks - children first (reverse order by depth), then parent
      // Since we collected descendants breadth-first, reverse gives us deepest first
      ...descendantIds.reverse().map((id) =>
        prisma.task.delete({ where: { id } })
      ),
      prisma.task.delete({ where: { id: taskId } }),
    ])

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
