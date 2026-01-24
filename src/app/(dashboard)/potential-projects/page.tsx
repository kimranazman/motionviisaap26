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
          revenue: true,
          potentialRevenue: true,
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
      ...project.project,
      revenue: project.project.revenue ? Number(project.project.revenue) : null,
      potentialRevenue: project.project.potentialRevenue ? Number(project.project.potentialRevenue) : null,
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
