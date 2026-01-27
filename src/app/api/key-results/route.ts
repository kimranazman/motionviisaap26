import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

// GET /api/key-results - List all key results with initiative counts
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const keyResults = await prisma.keyResult.findMany({
      include: {
        _count: {
          select: { initiatives: true },
        },
      },
      orderBy: [{ objective: 'asc' }, { krId: 'asc' }],
    })

    // Serialize Decimal fields to Number
    const serialized = keyResults.map((kr) => ({
      ...kr,
      target: Number(kr.target),
      actual: Number(kr.actual),
      progress: Number(kr.progress),
      weight: Number(kr.weight),
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error fetching key results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch key results' },
      { status: 500 }
    )
  }
}
