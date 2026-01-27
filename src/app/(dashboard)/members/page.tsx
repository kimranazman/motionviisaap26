export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { MembersOverview } from '@/components/members/members-overview'
import { MEMBER_PROFILES } from '@/lib/member-utils'
import prisma from '@/lib/prisma'

async function getMemberOverviewData() {
  const [initiativesByPerson, tasksByAssignee, allKRs, allSTs] = await Promise.all([
    prisma.initiative.groupBy({
      by: ['personInCharge'],
      _count: true,
    }),
    prisma.task.groupBy({
      by: ['assignee'],
      where: { parentId: null },
      _count: true,
    }),
    prisma.keyResult.findMany({
      select: { owner: true },
    }),
    prisma.supportTask.findMany({
      select: { owner: true },
    }),
  ])

  return MEMBER_PROFILES.map(member => {
    const initiativeCount =
      initiativesByPerson.find(g => g.personInCharge === member.enumValue)?._count ?? 0
    const taskCount =
      tasksByAssignee.find(g => g.assignee === member.enumValue)?._count ?? 0
    const krCount = allKRs.filter(
      kr => kr.owner?.toUpperCase() === member.enumValue
    ).length
    const stCount = allSTs.filter(
      st => st.owner?.toUpperCase() === member.enumValue
    ).length

    return {
      ...member,
      counts: {
        keyResults: krCount,
        initiatives: initiativeCount,
        tasks: taskCount,
        supportTasks: stCount,
      },
    }
  })
}

export default async function MembersPage() {
  const members = await getMemberOverviewData()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Members" description="Team workload overview" />
      <div className="p-3 md:p-6">
        <MembersOverview members={members} />
      </div>
    </div>
  )
}
