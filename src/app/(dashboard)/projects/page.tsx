import { Header } from '@/components/layout/header'
import { ProjectList } from '@/components/projects/project-list'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      company: {
        select: { id: true, name: true },
      },
      contact: {
        select: { id: true, name: true },
      },
      sourceDeal: {
        select: { id: true, title: true, stageChangedAt: true },
      },
      sourcePotential: {
        select: { id: true, title: true },
      },
      initiative: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Transform Decimal and Date values for client component
  const serializedProjects = projects.map((project) => ({
    ...project,
    revenue: project.revenue ? Number(project.revenue) : null,
    potentialRevenue: project.potentialRevenue ? Number(project.potentialRevenue) : null,
    startDate: project.startDate ? project.startDate.toISOString() : null,
    endDate: project.endDate ? project.endDate.toISOString() : null,
    sourceDeal: project.sourceDeal
      ? {
          ...project.sourceDeal,
          stageChangedAt: project.sourceDeal.stageChangedAt
            ? project.sourceDeal.stageChangedAt.toISOString()
            : undefined,
        }
      : null,
  }))

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Projects"
        description="Manage active projects and track deliverables"
      />
      <main className="flex-1 overflow-auto p-6">
        <ProjectList initialData={serializedProjects} />
      </main>
    </div>
  )
}
