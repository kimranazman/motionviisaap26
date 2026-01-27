export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { InitiativeDetail } from '@/components/initiatives/initiative-detail'

async function getInitiative(id: string) {
  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      keyResult: {
        select: { id: true, krId: true, description: true },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
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
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
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
