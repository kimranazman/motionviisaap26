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
      // KPI fields
      kpiLabel: true,
      kpiTarget: true,
      kpiActual: true,
      kpiUnit: true,
      kpiManualOverride: true,
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
    kpiTarget: i.kpiTarget ? Number(i.kpiTarget) : null,
    kpiActual: i.kpiActual ? Number(i.kpiActual) : null,
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
