import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { Prisma } from '@prisma/client'

// GET /api/pricing-history?view=by-item|by-client&item=X&companyId=X
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'by-item'

    if (view === 'by-item') {
      return handleByItem(searchParams)
    } else if (view === 'by-client') {
      return handleByClient(searchParams)
    }

    return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching pricing history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing history' },
      { status: 500 }
    )
  }
}

async function handleByItem(searchParams: URLSearchParams) {
  const itemFilter = searchParams.get('item')

  // Build where clause: costs with normalizedItem set
  const where: Prisma.CostWhereInput = {
    normalizedItem: itemFilter ? itemFilter : { not: null },
  }

  const [costs, normalizedItems] = await Promise.all([
    prisma.cost.findMany({
      where,
      select: {
        id: true,
        description: true,
        normalizedItem: true,
        amount: true,
        quantity: true,
        unitPrice: true,
        date: true,
        supplier: { select: { id: true, name: true } },
        project: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ normalizedItem: 'asc' }, { date: 'desc' }],
    }),
    // Get distinct normalizedItem values for dropdown
    prisma.cost.groupBy({
      by: ['normalizedItem'],
      where: { normalizedItem: { not: null } },
      _count: { id: true },
    }),
  ])

  // Serialize Decimals to Numbers
  const serializedCosts = costs.map((cost) => ({
    ...cost,
    amount: Number(cost.amount),
    quantity: cost.quantity !== null ? Number(cost.quantity) : null,
    unitPrice: cost.unitPrice !== null ? Number(cost.unitPrice) : null,
    date: cost.date.toISOString(),
  }))

  const items = normalizedItems
    .map((c) => c.normalizedItem)
    .filter((c): c is string => c !== null)
    .sort()

  return NextResponse.json({
    costs: serializedCosts,
    normalizedItems: items,
  })
}

async function handleByClient(searchParams: URLSearchParams) {
  const companyId = searchParams.get('companyId')

  // Build where clause: costs on projects with a company
  const where: Prisma.CostWhereInput = {
    project: {
      companyId: companyId ? companyId : { not: null },
    },
  }

  const [costs, companies] = await Promise.all([
    prisma.cost.findMany({
      where,
      select: {
        id: true,
        description: true,
        normalizedItem: true,
        amount: true,
        quantity: true,
        unitPrice: true,
        date: true,
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        project: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    }),
    // Get companies that have projects with costs
    prisma.company.findMany({
      where: {
        projects: {
          some: {
            costs: { some: {} },
          },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // Serialize Decimals to Numbers
  const serializedCosts = costs.map((cost) => ({
    ...cost,
    amount: Number(cost.amount),
    quantity: cost.quantity !== null ? Number(cost.quantity) : null,
    unitPrice: cost.unitPrice !== null ? Number(cost.unitPrice) : null,
    date: cost.date.toISOString(),
  }))

  return NextResponse.json({
    costs: serializedCosts,
    companies,
  })
}
