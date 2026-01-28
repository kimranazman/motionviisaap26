import { Header } from '@/components/layout/header'
import { ProjectsPageClient } from '@/components/projects/projects-page-client'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ showArchived?: string; open?: string }>
}) {
  const { showArchived, open } = await searchParams

  // Run all queries in parallel for efficiency
  const [projects, taskCounts, taskDoneCounts, costTotals] = await Promise.all([
    // Main projects query
    prisma.project.findMany({
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
    }),
    // Task counts per project (top-level only)
    prisma.task.groupBy({
      by: ['projectId'],
      _count: { id: true },
      where: { parentId: null },
    }),
    // Completed task counts per project
    prisma.task.groupBy({
      by: ['projectId'],
      _count: { id: true },
      where: { parentId: null, status: 'DONE' },
    }),
    // Cost totals per project
    prisma.cost.groupBy({
      by: ['projectId'],
      _sum: { amount: true },
    }),
  ])

  // Create lookup maps for efficient merging
  const taskCountMap = new Map(taskCounts.map(t => [t.projectId, t._count.id]))
  const taskDoneCountMap = new Map(taskDoneCounts.map(t => [t.projectId, t._count.id]))
  const costTotalMap = new Map(costTotals.map(c => [c.projectId, Number(c._sum.amount || 0)]))

  // Transform Decimal and Date values for client component
  const serializedProjects = projects.map((project) => ({
    ...project,
    revenue: project.revenue ? Number(project.revenue) : null,
    potentialRevenue: project.potentialRevenue ? Number(project.potentialRevenue) : null,
    startDate: project.startDate ? project.startDate.toISOString() : null,
    endDate: project.endDate ? project.endDate.toISOString() : null,
    // NEW: Task counts for kanban cards
    taskCount: taskCountMap.get(project.id) || 0,
    taskDoneCount: taskDoneCountMap.get(project.id) || 0,
    // NEW: Total cost for kanban cards
    totalCost: costTotalMap.get(project.id) || 0,
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
        <ProjectsPageClient
          initialData={serializedProjects}
          initialShowArchived={showArchived === 'true'}
          openProjectId={open}
        />
      </main>
    </div>
  )
}
