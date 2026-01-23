'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { formatTeamMember } from '@/lib/utils'

interface TeamWorkloadProps {
  data: Array<{
    person: string | null
    count: number
  }>
  total: number
}

const TEAM_COLORS: Record<string, string> = {
  KHAIRUL: 'bg-blue-600',
  AZLAN: 'bg-green-600',
  IZYANI: 'bg-purple-600',
}

const TEAM_INITIALS: Record<string, string> = {
  KHAIRUL: 'KH',
  AZLAN: 'AZ',
  IZYANI: 'IZ',
}

export function TeamWorkload({ data, total }: TeamWorkloadProps) {
  return (
    <div className="h-full flex flex-col justify-center space-y-3">
      {data.map((item) => {
        const person = item.person || 'UNASSIGNED'
        const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0

        return (
          <div key={person} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={TEAM_COLORS[person] || 'bg-gray-400'}>
                {TEAM_INITIALS[person] || '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {formatTeamMember(item.person)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {item.count}
                </span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
