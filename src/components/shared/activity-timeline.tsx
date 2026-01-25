'use client'

import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatActivityAction } from '@/lib/activity-utils'

interface ActivityTimelineProps {
  logs: {
    id: string
    action: string
    field?: string | null
    oldValue?: string | null
    newValue?: string | null
    createdAt: string
    user?: { name?: string | null; image?: string | null } | null
  }[]
  isLoading?: boolean
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ActivityTimeline({ logs, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return <TimelineSkeleton />
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity yet
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3">
          {/* User Avatar */}
          <Avatar className="h-8 w-8">
            {log.user?.image ? (
              <AvatarImage src={log.user.image} alt={log.user.name || 'User'} />
            ) : null}
            <AvatarFallback className="text-xs">
              {log.user?.name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{log.user?.name || 'System'}</span>
              {' '}
              <span className="text-muted-foreground">
                {formatActivityAction(log.action)}
              </span>
            </p>
            {/* Show old -> new value if field changed */}
            {log.field && log.oldValue && log.newValue && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {log.field}: &quot;{log.oldValue}&quot; &rarr; &quot;{log.newValue}&quot;
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
