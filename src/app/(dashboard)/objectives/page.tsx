export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { ObjectiveHierarchy } from '@/components/objectives/objective-hierarchy'
import prisma from '@/lib/prisma'

async function getInitiatives() {
  const initiatives = await prisma.initiative.findMany({
    orderBy: [
      { objective: 'asc' },
      { keyResult: 'asc' },
      { sequenceNumber: 'asc' },
    ],
    select: {
      id: true,
      sequenceNumber: true,
      title: true,
      objective: true,
      keyResult: true,
      department: true,
      status: true,
      personInCharge: true,
      startDate: true,
      endDate: true,
      position: true,
    },
  })

  return initiatives.map(i => ({
    ...i,
    startDate: i.startDate.toISOString(),
    endDate: i.endDate.toISOString(),
  }))
}

export default async function ObjectivesPage() {
  const initiatives = await getInitiatives()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="By Objective"
        description="Initiatives grouped by Objective and Key Result"
      />

      <div className="p-3 md:p-6">
        <ObjectiveHierarchy initialData={initiatives} />
      </div>
    </div>
  )
}
