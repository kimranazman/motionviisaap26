import { Header } from '@/components/layout/header'
import { PotentialBoard } from '@/components/potential-projects/potential-board'
import prisma from '@/lib/prisma'

export default async function PotentialProjectsPage() {
  const potentialProjects = await prisma.potentialProject.findMany({
    include: {
      company: {
        select: { id: true, name: true },
      },
      contact: {
        select: { id: true, name: true },
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
  }))

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Potential Projects"
        description="Track repeat client opportunities"
      />
      <main className="flex-1 overflow-auto p-6">
        <PotentialBoard initialData={serializedProjects} />
      </main>
    </div>
  )
}
