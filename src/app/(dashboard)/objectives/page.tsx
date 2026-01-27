export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { ObjectiveHierarchy } from '@/components/objectives/objective-hierarchy'
import prisma from '@/lib/prisma'

async function getInitiatives() {
  const initiatives = await prisma.initiative.findMany({
    orderBy: [
      { objective: 'asc' },
      { keyResultId: 'asc' },
      { sequenceNumber: 'asc' },
    ],
    select: {
      id: true,
      sequenceNumber: true,
      title: true,
      objective: true,
      keyResultId: true,
      keyResult: {
        select: {
          id: true,
          krId: true,
          description: true,
          target: true,
          actual: true,
          unit: true,
          progress: true,
          deadline: true,
          status: true,
          owner: true,
          weight: true,
        },
      },
      department: true,
      status: true,
      personInCharge: true,
      startDate: true,
      endDate: true,
      position: true,
      budget: true,
      // Linked projects with revenue + cost aggregation
      projects: {
        select: {
          id: true,
          title: true,
          status: true,
          revenue: true,
          startDate: true,
          endDate: true,
          company: { select: { id: true, name: true } },
          costs: { select: { amount: true } },
        },
      },
    },
  })

  return initiatives.map(i => ({
    ...i,
    startDate: i.startDate.toISOString(),
    endDate: i.endDate.toISOString(),
    keyResult: i.keyResult
      ? {
          ...i.keyResult,
          target: Number(i.keyResult.target),
          actual: Number(i.keyResult.actual),
          progress: Number(i.keyResult.progress),
          weight: Number(i.keyResult.weight),
        }
      : null,
    projects: i.projects.map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      revenue: p.revenue ? Number(p.revenue) : null,
      totalCosts: p.costs.reduce((sum, c) => sum + Number(c.amount), 0),
      companyName: p.company?.name || null,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      endDate: p.endDate ? p.endDate.toISOString() : null,
    })),
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
