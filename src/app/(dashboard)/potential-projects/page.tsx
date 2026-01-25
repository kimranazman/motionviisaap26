import { Header } from '@/components/layout/header'
import { PotentialBoard } from '@/components/potential-projects/potential-board'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function PotentialProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ showArchived?: string }>
}) {
  const { showArchived } = await searchParams

  const potentialProjects = await prisma.potentialProject.findMany({
    where: {
      ...(showArchived !== 'true' ? { isArchived: false } : {}),
    },
    include: {
      company: {
        select: { id: true, name: true },
      },
      contact: {
        select: { id: true, name: true },
      },
      project: {
        select: {
          id: true,
          title: true,
          status: true,
          revenue: true,
          potentialRevenue: true,
          costs: {
            select: { amount: true },
          },
        },
      },
    },
    orderBy: [
      { stage: 'asc' },
      { position: 'asc' },
    ],
  })

  // Transform Decimal values to numbers for client component
  const serializedProjects = potentialProjects.map(project => ({
    ...project,
    estimatedValue: project.estimatedValue ? Number(project.estimatedValue) : null,
    project: project.project ? {
      id: project.project.id,
      title: project.project.title,
      status: project.project.status,
      revenue: project.project.revenue ? Number(project.project.revenue) : null,
      potentialRevenue: project.project.potentialRevenue ? Number(project.project.potentialRevenue) : null,
      totalCosts: project.project.costs.reduce((sum, cost) => sum + Number(cost.amount), 0),
    } : null,
  }))

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Potential Projects"
        description="Track repeat client opportunities"
      />
      <main className="flex-1 overflow-auto p-6">
        <PotentialBoard
          initialData={serializedProjects}
          initialShowArchived={showArchived === 'true'}
        />
      </main>
    </div>
  )
}
