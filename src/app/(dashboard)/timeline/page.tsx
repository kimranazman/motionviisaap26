export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { GanttChart } from '@/components/timeline/gantt-chart'
import { ViewModeToggle } from '@/components/objectives/view-mode-toggle'
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

      <div className="p-4 md:p-6">
        <div className="mb-6">
          <ViewModeToggle />
        </div>
        {/* Mobile scroll hint */}
        <p className="text-xs text-gray-500 mb-3 md:hidden">
          ← Scroll horizontally to see timeline →
        </p>
        <GanttChart initiatives={initiatives} />
      </div>
    </div>
  )
}
