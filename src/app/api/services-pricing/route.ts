import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { Prisma } from '@prisma/client'

// GET /api/services-pricing?view=all|by-service|by-client&service=X&companyId=X
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'all'

    if (view === 'all') {
      return handleAll()
    } else if (view === 'by-service') {
      return handleByService(searchParams)
    } else if (view === 'by-client') {
      return handleByClient(searchParams)
    }

    return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching services pricing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services pricing' },
      { status: 500 }
    )
  }
}

// All deliverables with value
async function handleAll() {
  const deliverables = await prisma.deliverable.findMany({
    where: {
      value: { not: null },
    },
    select: {
      id: true,
      title: true,
      description: true,
      value: true,
      aiExtracted: true,
      project: {
        select: {
          id: true,
          title: true,
          company: { select: { id: true, name: true } },
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Serialize Decimals to Numbers
  const serializedDeliverables = deliverables.map((d) => ({
    ...d,
    value: d.value !== null ? Number(d.value) : null,
    createdAt: d.createdAt.toISOString(),
  }))

  return NextResponse.json({
    deliverables: serializedDeliverables,
  })
}

// Deliverables filtered by service title
async function handleByService(searchParams: URLSearchParams) {
  const serviceFilter = searchParams.get('service')

  // Build where clause
  const where: Prisma.DeliverableWhereInput = {
    value: { not: null },
    ...(serviceFilter && { title: serviceFilter }),
  }

  const [deliverables, services] = await Promise.all([
    prisma.deliverable.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        value: true,
        aiExtracted: true,
        project: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
        createdAt: true,
      },
      orderBy: [{ title: 'asc' }, { createdAt: 'desc' }],
    }),
    // Get distinct service titles for dropdown
    prisma.deliverable.groupBy({
      by: ['title'],
      where: { value: { not: null } },
      _count: { id: true },
    }),
  ])

  // Serialize Decimals to Numbers
  const serializedDeliverables = deliverables.map((d) => ({
    ...d,
    value: d.value !== null ? Number(d.value) : null,
    createdAt: d.createdAt.toISOString(),
  }))

  const serviceTitles = services
    .map((s) => s.title)
    .sort()

  return NextResponse.json({
    deliverables: serializedDeliverables,
    services: serviceTitles,
  })
}

// Deliverables filtered by client (company)
async function handleByClient(searchParams: URLSearchParams) {
  const companyId = searchParams.get('companyId')

  // Build where clause
  const where: Prisma.DeliverableWhereInput = {
    value: { not: null },
    project: {
      companyId: companyId ? companyId : { not: null },
    },
  }

  const [deliverables, companies] = await Promise.all([
    prisma.deliverable.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        value: true,
        aiExtracted: true,
        project: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Get companies that have projects with deliverables with value
    prisma.company.findMany({
      where: {
        projects: {
          some: {
            deliverables: {
              some: { value: { not: null } },
            },
          },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // Serialize Decimals to Numbers
  const serializedDeliverables = deliverables.map((d) => ({
    ...d,
    value: d.value !== null ? Number(d.value) : null,
    createdAt: d.createdAt.toISOString(),
  }))

  return NextResponse.json({
    deliverables: serializedDeliverables,
    companies,
  })
}
