export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { EventsView } from '@/components/events/events-view'
import prisma from '@/lib/prisma'

async function getEventsToAttend() {
  const events = await prisma.eventToAttend.findMany({
    orderBy: [
      { priority: 'asc' },
      { name: 'asc' },
    ],
  })

  return events.map(e => ({
    ...e,
    estimatedCost: e.estimatedCost ? Number(e.estimatedCost) : null,
  }))
}

export default async function EventsPage() {
  const events = await getEventsToAttend()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Events to Attend"
        description="38 industry events for networking and business development in 2026"
      />

      <div className="p-6">
        <EventsView events={events} />
      </div>
    </div>
  )
}
