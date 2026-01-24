import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma, InitiativeStatus, InitiativeDepartment, Objective, TeamMember } from '@prisma/client'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/initiatives - List all initiatives with filters
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    const objective = searchParams.get('objective')
    const personInCharge = searchParams.get('personInCharge')
    const search = searchParams.get('search')

    const where: Prisma.InitiativeWhereInput = {}

    if (status) {
      where.status = status as InitiativeStatus
    }

    if (department) {
      where.department = department as InitiativeDepartment
    }

    if (objective) {
      where.objective = objective as Objective
    }

    if (personInCharge) {
      where.personInCharge = personInCharge as TeamMember
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { monthlyObjective: { contains: search } },
        { weeklyTasks: { contains: search } },
        { remarks: { contains: search } },
      ]
    }

    const initiatives = await prisma.initiative.findMany({
      where,
      orderBy: [{ sequenceNumber: 'asc' }],
    })

    return NextResponse.json(initiatives)
  } catch (error) {
    console.error('Error fetching initiatives:', error)
    return NextResponse.json(
      { error: 'Failed to fetch initiatives' },
      { status: 500 }
    )
  }
}

// POST /api/initiatives - Create new initiative
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()

    // Get next sequence number
    const maxSeq = await prisma.initiative.aggregate({
      _max: { sequenceNumber: true },
    })
    const nextSeq = (maxSeq._max.sequenceNumber || 0) + 1

    const initiative = await prisma.initiative.create({
      data: {
        sequenceNumber: nextSeq,
        objective: body.objective,
        keyResult: body.keyResult,
        department: body.department,
        title: body.title,
        monthlyObjective: body.monthlyObjective || null,
        weeklyTasks: body.weeklyTasks || null,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        resourcesFinancial: body.resourcesFinancial || null,
        resourcesNonFinancial: body.resourcesNonFinancial || null,
        personInCharge: body.personInCharge || null,
        accountable: body.accountable || null,
        status: body.status || 'NOT_STARTED',
        remarks: body.remarks || null,
        position: nextSeq,
      },
    })

    return NextResponse.json(initiative, { status: 201 })
  } catch (error) {
    console.error('Error creating initiative:', error)
    return NextResponse.json(
      { error: 'Failed to create initiative' },
      { status: 500 }
    )
  }
}
