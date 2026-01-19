export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { GanttChart } from '@/components/timeline/gantt-chart'
import prisma from '@/lib/prisma'

async function getInitiatives() {
  const initiatives = await prisma.initiative.findMany({
    orderBy: [
      { department: 'asc' },
      { startDate: 'asc' },
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
    },
  })

  return initiatives.map(i => ({
    ...i,
    startDate: i.startDate.toISOString(),
    endDate: i.endDate.toISOString(),
  }))
}

export default async function TimelinePage() {
  const initiatives = await getInitiatives()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Timeline"
        description="Gantt chart view of all initiatives"
      />

      <div className="p-6">
        <GanttChart initiatives={initiatives} />
      </div>
    </div>
  )
}
