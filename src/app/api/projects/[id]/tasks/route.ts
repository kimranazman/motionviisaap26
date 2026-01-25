import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/projects/[id]/tasks - List tasks for project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      include: {
        tags: {
          include: { tag: true },
        },
        _count: {
          select: { children: true, comments: true },
        },
      },
      orderBy: [
        { depth: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/tasks - Create task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Calculate depth and validate
    let depth = 0
    let parentTags: { tagId: string }[] = []

    if (body.parentId) {
      const parent = await prisma.task.findUnique({
        where: { id: body.parentId },
        select: {
          id: true,
          depth: true,
          tags: { select: { tagId: true } },
        },
      })

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent task not found' },
          { status: 404 }
        )
      }

      if (parent.depth >= 4) {
        return NextResponse.json(
          { error: 'Maximum nesting depth (5 levels) reached' },
          { status: 400 }
        )
      }

      depth = parent.depth + 1
      parentTags = parent.tags
    }

    // Get next sortOrder for siblings
    const maxSortOrder = await prisma.task.aggregate({
      where: {
        projectId: id,
        parentId: body.parentId || null,
      },
      _max: { sortOrder: true },
    })
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1

    // Create task with inherited tags in transaction
    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          projectId: id,
          parentId: body.parentId || null,
          title: body.title.trim(),
          description: body.description?.trim() || null,
          status: body.status || 'TODO',
          priority: body.priority || 'MEDIUM',
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          assignee: body.assignee || null,
          depth,
          sortOrder: nextSortOrder,
        },
      })

      // Inherit parent tags if creating subtask
      if (parentTags.length > 0) {
        await tx.taskTag.createMany({
          data: parentTags.map((pt) => ({
            taskId: newTask.id,
            tagId: pt.tagId,
            inherited: true,
          })),
        })
      }

      return newTask
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
