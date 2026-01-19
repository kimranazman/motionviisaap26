export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import prisma from '@/lib/prisma'

async function getInitiatives() {
  const initiatives = await prisma.initiative.findMany({
    orderBy: { position: 'asc' },
    select: {
      id: true,
      sequenceNumber: true,
      title: true,
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

export default async function KanbanPage() {
  const initiatives = await getInitiatives()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Kanban Board"
        description="Drag and drop to update initiative status"
      />

      <div className="p-6 overflow-x-auto">
        <KanbanBoard initialData={initiatives} />
      </div>
    </div>
  )
}
