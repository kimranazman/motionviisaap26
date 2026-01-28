export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ProjectDetailPageClient } from './project-detail-page-client'

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
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
      costs: {
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' },
        ],
      },
    },
  })

  if (!project) {
    return null
  }

  // Serialize Decimal and Date values for client component
  return {
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
    costs: project.costs.map((cost) => ({
      ...cost,
      amount: Number(cost.amount),
      date: cost.date.toISOString(),
      createdAt: cost.createdAt.toISOString(),
      updatedAt: cost.updatedAt.toISOString(),
    })),
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  return <ProjectDetailPageClient project={project} />
}
