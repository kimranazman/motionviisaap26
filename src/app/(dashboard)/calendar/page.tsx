export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { CalendarView } from '@/components/calendar/calendar-view'
import { ViewModeToggle } from '@/components/objectives/view-mode-toggle'
import prisma from '@/lib/prisma'

async function getInitiatives() {
  const initiatives = await prisma.initiative.findMany({
    select: {
      id: true,
      title: true,
      keyResult: { select: { krId: true, description: true } },
      department: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  })

  return initiatives.map(i => ({
    ...i,
    startDate: i.startDate.toISOString(),
    endDate: i.endDate.toISOString(),
    keyResult: i.keyResult
      ? `${i.keyResult.krId} - ${i.keyResult.description}`
      : 'Unlinked',
  }))
}

async function getEventsToAttend() {
  const events = await prisma.eventToAttend.findMany({
    select: {
      id: true,
      name: true,
      priority: true,
      category: true,
      eventDate: true,
      location: true,
      status: true,
    },
  })
  return events
}

export default async function CalendarPage() {
  const [initiatives, events] = await Promise.all([
    getInitiatives(),
    getEventsToAttend(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Calendar"
        description="Initiative timelines and events to attend"
      />

      <div className="p-6">
        <div className="mb-6">
          <ViewModeToggle />
        </div>
        <CalendarView initiatives={initiatives} events={events} />
      </div>
    </div>
  )
}
