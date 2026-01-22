import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

// GET /api/cost-categories - List active cost categories
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const categories = await prisma.costCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching cost categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost categories' },
      { status: 500 }
    )
  }
}
