export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { InitiativesList } from '@/components/initiatives/initiatives-list'
import { ViewModeToggle } from '@/components/objectives/view-mode-toggle'
import prisma from '@/lib/prisma'

async function getInitiatives() {
  const initiatives = await prisma.initiative.findMany({
    orderBy: { sequenceNumber: 'asc' },
    include: {
      keyResult: {
        select: { id: true, krId: true, description: true },
      },
    },
  })

  return initiatives.map(i => ({
    ...i,
    startDate: i.startDate.toISOString(),
    endDate: i.endDate.toISOString(),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    resourcesFinancial: i.resourcesFinancial ? Number(i.resourcesFinancial) : null,
    keyResult: i.keyResult?.krId || 'Unlinked',
  }))
}

export default async function InitiativesPage() {
  const initiatives = await getInitiatives()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Initiatives"
        description="Manage all 28 strategic initiatives"
      />

      <div className="p-6">
        <div className="mb-6">
          <ViewModeToggle />
        </div>
        <InitiativesList initialData={initiatives} />
      </div>
    </div>
  )
}
