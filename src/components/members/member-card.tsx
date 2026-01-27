'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Target, Briefcase, ListChecks, ClipboardList } from 'lucide-react'
import type { MemberProfile } from '@/lib/member-utils'

interface MemberWithCounts extends MemberProfile {
  counts: {
    keyResults: number
    initiatives: number
    tasks: number
    supportTasks: number
  }
}

interface MemberCardProps {
  member: MemberWithCounts
}

const COUNT_ITEMS = [
  { key: 'keyResults' as const, label: 'Key Results', icon: Target },
  { key: 'initiatives' as const, label: 'Initiatives', icon: Briefcase },
  { key: 'tasks' as const, label: 'Tasks', icon: ListChecks },
  { key: 'supportTasks' as const, label: 'Support Tasks', icon: ClipboardList },
]

export function MemberCard({ member }: MemberCardProps) {
  const totalItems =
    member.counts.keyResults +
    member.counts.initiatives +
    member.counts.tasks +
    member.counts.supportTasks

  return (
    <Link href={`/members/${member.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback
                className={cn(member.color, 'text-white font-semibold text-sm')}
              >
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{member.name}</h3>
              <p className="text-sm text-gray-500">{totalItems} total items</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {COUNT_ITEMS.map(item => {
              const Icon = item.icon
              return (
                <div key={item.key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-2xl font-bold">
                      {member.counts[item.key]}
                    </span>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
