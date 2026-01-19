export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { InitiativeDetail } from '@/components/initiatives/initiative-detail'

async function getInitiative(id: string) {
  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      comments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!initiative) {
    return null
  }

  // Serialize Date and Decimal fields for client component
  return {
    ...initiative,
    startDate: initiative.startDate.toISOString(),
    endDate: initiative.endDate.toISOString(),
    createdAt: initiative.createdAt.toISOString(),
    updatedAt: initiative.updatedAt.toISOString(),
    resourcesFinancial: initiative.resourcesFinancial
      ? Number(initiative.resourcesFinancial)
      : null,
    comments: initiative.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  }
}

export default async function InitiativeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const initiative = await getInitiative(id)

  if (!initiative) {
    notFound()
  }

  return <InitiativeDetail initiative={initiative} />
}
