import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'
import { getDescendantIds } from '@/lib/task-utils'

// POST /api/projects/[id]/tasks/[taskId]/tags - Add tag to task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, taskId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.tagId) {
      return NextResponse.json(
        { error: 'tagId is required' },
        { status: 400 }
      )
    }

    // Verify task exists and belongs to project
    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { id: true },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: body.tagId },
      select: { id: true },
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Check if tag is already on task
    const existingTaskTag = await prisma.taskTag.findUnique({
      where: { taskId_tagId: { taskId, tagId: body.tagId } },
    })

    if (existingTaskTag) {
      return NextResponse.json(
        { error: 'Tag already assigned to task' },
        { status: 409 }
      )
    }

    // Get all tasks in project to find descendants
    const allTasks = await prisma.task.findMany({
      where: { projectId },
      select: { id: true, parentId: true },
    })

    // Get descendant task IDs
    const descendantIds = getDescendantIds(
      allTasks.map((t) => ({
        id: t.id,
        title: '',
        description: null,
        status: 'TODO' as const,
        priority: 'MEDIUM' as const,
        dueDate: null,
        assignee: null,
        projectId,
        parentId: t.parentId,
        depth: 0,
        sortOrder: 0,
        createdAt: '',
        updatedAt: '',
      })),
      taskId
    )

    // Add tag to task and all descendants in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Add tag to the task itself (not inherited)
      const taskTag = await tx.taskTag.create({
        data: {
          taskId,
          tagId: body.tagId,
          inherited: false,
        },
        include: {
          tag: true,
        },
      })

      // Add tag to all descendants (inherited=true)
      if (descendantIds.length > 0) {
        await Promise.all(
          descendantIds.map((descendantId) =>
            tx.taskTag.upsert({
              where: { taskId_tagId: { taskId: descendantId, tagId: body.tagId } },
              create: { taskId: descendantId, tagId: body.tagId, inherited: true },
              update: { inherited: true },
            })
          )
        )
      }

      return taskTag
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error adding tag to task:', error)
    return NextResponse.json(
      { error: 'Failed to add tag to task' },
      { status: 500 }
    )
  }
}
