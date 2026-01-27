'use client'

import { MemberCard } from '@/components/members/member-card'
import type { MemberProfile } from '@/lib/member-utils'

interface MemberWithCounts extends MemberProfile {
  counts: {
    keyResults: number
    initiatives: number
    tasks: number
    supportTasks: number
  }
}

interface MembersOverviewProps {
  members: MemberWithCounts[]
}

export function MembersOverview({ members }: MembersOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {members.map(member => (
        <MemberCard key={member.slug} member={member} />
      ))}
    </div>
  )
}
