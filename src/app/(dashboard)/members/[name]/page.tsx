export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { MemberDetail } from '@/components/members/member-detail'
import { getMemberBySlug, type MemberProfile } from '@/lib/member-utils'

async function getMemberDetailData(member: MemberProfile) {
  const [keyResults, initiatives, accountableInitiatives, tasks, supportTasks] =
    await Promise.all([
      prisma.keyResult.findMany({
        where: { owner: member.name },
        orderBy: { krId: 'asc' },
      }),
      prisma.initiative.findMany({
        where: { personInCharge: member.enumValue as any },
        include: { keyResult: { select: { id: true, krId: true } } },
        orderBy: { sequenceNumber: 'asc' },
      }),
      prisma.initiative.findMany({
        where: {
          accountable: member.enumValue as any,
          NOT: { personInCharge: member.enumValue as any },
        },
        include: { keyResult: { select: { id: true, krId: true } } },
        orderBy: { sequenceNumber: 'asc' },
      }),
      prisma.task.findMany({
        where: { assignee: member.enumValue as any, parentId: null },
        include: { project: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTask.findMany({
        where: { owner: member.name },
        include: {
          keyResultLinks: {
            include: {
              keyResult: { select: { id: true, krId: true, description: true } },
            },
          },
        },
        orderBy: [{ category: 'asc' }, { taskId: 'asc' }],
      }),
    ])

  // Serialize Decimal and Date fields for client component
  const serializedKeyResults = keyResults.map(kr => ({
    ...kr,
    target: Number(kr.target),
    actual: Number(kr.actual),
    progress: Number(kr.progress),
    weight: Number(kr.weight),
    createdAt: kr.createdAt.toISOString(),
    updatedAt: kr.updatedAt.toISOString(),
  }))

  const serializeInitiative = (i: (typeof initiatives)[number]) => ({
    ...i,
    startDate: i.startDate.toISOString(),
    endDate: i.endDate.toISOString(),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  })

  const serializedInitiatives = initiatives.map(serializeInitiative)
  const serializedAccountable = accountableInitiatives.map(serializeInitiative)

  const serializedTasks = tasks.map(t => ({
    ...t,
    dueDate: t.dueDate?.toISOString() || null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  // SupportTask has no Date fields that need serialization, but has createdAt/updatedAt
  const serializedSupportTasks = supportTasks.map(st => ({
    ...st,
    createdAt: st.createdAt.toISOString(),
    updatedAt: st.updatedAt.toISOString(),
  }))

  return {
    member,
    keyResults: serializedKeyResults,
    initiatives: serializedInitiatives,
    accountableInitiatives: serializedAccountable,
    tasks: serializedTasks,
    supportTasks: serializedSupportTasks,
  }
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const member = getMemberBySlug(name)

  if (!member) {
    notFound()
  }

  const data = await getMemberDetailData(member)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={member.name}
        description={`Workload overview for ${member.name}`}
      />
      <div className="p-3 md:p-6">
        <MemberDetail data={data} />
      </div>
    </div>
  )
}
