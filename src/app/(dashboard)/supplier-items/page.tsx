import prisma from '@/lib/prisma'
import { SupplierItemsTable } from '@/components/supplier-items/supplier-items-table'
import { PricingTabs } from '@/components/supplier-items/pricing-tabs'
import { PricingHistoryByItem } from '@/components/supplier-items/pricing-history-by-item'
import { PricingHistoryByClient } from '@/components/supplier-items/pricing-history-by-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pricing History | SAAP 2026',
  description: 'Track and compare item pricing across suppliers and clients',
}

export default async function SupplierItemsPage() {
  const [costs, categories, suppliers, companies, allNormalizedItems] =
    await Promise.all([
      prisma.cost.findMany({
        where: { supplierId: { not: null } },
        select: {
          id: true,
          description: true,
          normalizedItem: true,
          amount: true,
          quantity: true,
          unitPrice: true,
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
      // All normalized items (not just supplier items) for by-item view
      prisma.cost.groupBy({
        by: ['normalizedItem'],
        where: { normalizedItem: { not: null } },
      }),
    ])

  const serializedCosts = costs.map((cost) => ({
    ...cost,
    amount: Number(cost.amount),
    quantity: cost.quantity !== null ? Number(cost.quantity) : null,
    unitPrice: cost.unitPrice !== null ? Number(cost.unitPrice) : null,
    date: cost.date.toISOString(),
  }))

  const categoryList = categories
    .map((c) => c.normalizedItem)
    .filter((c): c is string => c !== null)
    .sort()

  const normalizedItemsList = allNormalizedItems
    .map((c) => c.normalizedItem)
    .filter((c): c is string => c !== null)
    .sort()

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pricing History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track and compare item pricing across suppliers and clients
        </p>
      </div>

      <PricingTabs
        allItemsContent={
          <SupplierItemsTable
            initialItems={serializedCosts}
            categories={categoryList}
            suppliers={suppliers}
          />
        }
        byItemContent={
          <PricingHistoryByItem normalizedItems={normalizedItemsList} />
        }
        byClientContent={<PricingHistoryByClient companies={companies} />}
      />
    </div>
  )
}
