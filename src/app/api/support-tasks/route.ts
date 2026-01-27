import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { SupportTaskCategory } from '@prisma/client'

// GET /api/support-tasks - List all support tasks with KR relations
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    // Build where clause with optional category filter
    const where = category
      ? { category: category as SupportTaskCategory }
      : {}

    const tasks = await prisma.supportTask.findMany({
      where,
      include: {
        keyResultLinks: {
          include: {
            keyResult: {
              select: {
                id: true,
                krId: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: [{ category: 'asc' }, { taskId: 'asc' }],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching support tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tasks' },
      { status: 500 }
    )
  }
}
