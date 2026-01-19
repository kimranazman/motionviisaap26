'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => {
            const person = item.person || 'UNASSIGNED'
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0

            return (
              <div key={person} className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={TEAM_COLORS[person] || 'bg-gray-400'}>
                    {TEAM_INITIALS[person] || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {formatTeamMember(item.person)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.count} initiatives
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
