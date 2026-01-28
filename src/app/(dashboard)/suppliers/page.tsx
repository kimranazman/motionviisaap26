import prisma from '@/lib/prisma'
import { SupplierList } from '@/components/suppliers/supplier-list'

export const dynamic = 'force-dynamic'

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: {
        select: { costs: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your vendors and track spending
        </p>
      </div>
      <SupplierList initialData={suppliers} />
    </div>
  )
}
