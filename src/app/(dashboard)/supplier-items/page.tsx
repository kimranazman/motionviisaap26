import prisma from '@/lib/prisma'
import { SupplierItemsTable } from '@/components/supplier-items/supplier-items-table'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Price Comparison | SAAP 2026',
  description: 'Compare prices across suppliers',
}

export default async function SupplierItemsPage() {
  const [costs, categories, suppliers] = await Promise.all([
    prisma.cost.findMany({
      where: { supplierId: { not: null } },
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
    }),
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

  const serializedCosts = costs.map((cost) => ({
    ...cost,
    amount: Number(cost.amount),
    date: cost.date.toISOString(),
  }))

  const categoryList = categories
    .map((c) => c.normalizedItem)
    .filter((c): c is string => c !== null)
    .sort()

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Price Comparison</h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare prices across suppliers by filtering items
        </p>
      </div>

      <SupplierItemsTable
        initialItems={serializedCosts}
        categories={categoryList}
        suppliers={suppliers}
      />
    </div>
  )
}
