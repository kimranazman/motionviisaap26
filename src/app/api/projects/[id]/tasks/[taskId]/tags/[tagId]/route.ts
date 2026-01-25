import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'
import { getDescendantIds } from '@/lib/task-utils'

// DELETE /api/projects/[id]/tasks/[taskId]/tags/[tagId] - Remove tag from task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string; tagId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, taskId, tagId } = await params

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

    // Check if TaskTag exists
    const taskTag = await prisma.taskTag.findUnique({
      where: { taskId_tagId: { taskId, tagId } },
    })

    if (!taskTag) {
      return NextResponse.json(
        { error: 'Tag not assigned to task' },
        { status: 404 }
      )
    }

    // Cannot remove inherited tag directly
    if (taskTag.inherited) {
      return NextResponse.json(
        { error: 'Cannot remove inherited tag. Remove it from the parent task instead.' },
        { status: 400 }
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

    // Remove tag from task and all descendants in transaction
    await prisma.$transaction(async (tx) => {
      // Delete from task itself
      await tx.taskTag.delete({
        where: { taskId_tagId: { taskId, tagId } },
      })

      // Delete from all descendants where inherited=true
      if (descendantIds.length > 0) {
        await tx.taskTag.deleteMany({
          where: {
            tagId,
            taskId: { in: descendantIds },
            inherited: true,
          },
        })
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error removing tag from task:', error)
    return NextResponse.json(
      { error: 'Failed to remove tag from task' },
      { status: 500 }
    )
  }
}
