import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const categoryFilter = searchParams.get('category')
    const supplierFilter = searchParams.get('supplier')

    // Build where clause - only costs with suppliers
    const where: Record<string, unknown> = {
      supplierId: { not: null },
    }

    if (categoryFilter) {
      where.normalizedItem = categoryFilter
    }

    if (supplierFilter) {
      where.supplierId = supplierFilter
    }

    // Fetch costs with suppliers
    const costs = await prisma.cost.findMany({
      where,
      select: {
        id: true,
        description: true,
        normalizedItem: true,
        amount: true,
        date: true,
        supplier: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Get unique categories and suppliers for filter dropdowns
    const [categories, suppliers] = await Promise.all([
      prisma.cost.groupBy({
        by: ['normalizedItem'],
        where: {
          supplierId: { not: null },
          normalizedItem: { not: null },
        },
      }),
      prisma.supplier.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ])

    // Serialize costs (convert Decimal to Number)
    const serializedCosts = costs.map(cost => ({
      ...cost,
      amount: Number(cost.amount),
    }))

    return NextResponse.json({
      items: serializedCosts,
      categories: categories
        .map(c => c.normalizedItem)
        .filter((c): c is string => c !== null)
        .sort(),
      suppliers,
    })
  } catch (error) {
    console.error('Error fetching supplier items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier items' },
      { status: 500 }
    )
  }
}
