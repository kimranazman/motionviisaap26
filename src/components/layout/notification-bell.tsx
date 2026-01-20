'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDate, formatStatus, getStatusColor } from '@/lib/utils'

interface NotificationItem {
  id: string
  title: string
  status: string
  endDate: string
  personInCharge: string | null
}

interface NotificationsData {
  overdue: NotificationItem[]
  atRisk: NotificationItem[]
  dueSoon: NotificationItem[]
  totalCount: number
}

interface NotificationSectionProps {
  title: string
  items: NotificationItem[]
  borderColor: string
  onItemClick: () => void
}

function NotificationSection({
  title,
  items,
  borderColor,
  onItemClick,
}: NotificationSectionProps) {
  return (
    <div className="py-2">
      <div className={`border-l-2 ${borderColor} pl-3 mb-2`}>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {title} ({items.length})
        </h4>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/initiatives/${item.id}`}
            onClick={onItemClick}
            className="flex flex-col gap-1 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900 truncate">
              {item.title}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Due: {formatDate(item.endDate)}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(
                  item.status
                )}`}
              >
                {formatStatus(item.status)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationsData | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fetch on mount
    fetchNotifications()

    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)

    // Refresh on window focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchNotifications])

  const handleItemClick = () => {
    setIsOpen(false)
  }

  const totalCount = notifications?.totalCount ?? 0
  const hasNotifications = totalCount > 0

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {!isLoading && hasNotifications && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {hasNotifications && (
            <p className="text-xs text-gray-500">
              {totalCount} {totalCount === 1 ? 'item needs' : 'items need'}{' '}
              attention
            </p>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : hasNotifications ? (
            <div className="px-1 py-1">
              {notifications!.overdue.length > 0 && (
                <NotificationSection
                  title="Overdue"
                  items={notifications!.overdue}
                  borderColor="border-l-red-500"
                  onItemClick={handleItemClick}
                />
              )}
              {notifications!.atRisk.length > 0 && (
                <NotificationSection
                  title="At Risk"
                  items={notifications!.atRisk}
                  borderColor="border-l-orange-500"
                  onItemClick={handleItemClick}
                />
              )}
              {notifications!.dueSoon.length > 0 && (
                <NotificationSection
                  title="Due Soon"
                  items={notifications!.dueSoon}
                  borderColor="border-l-yellow-500"
                  onItemClick={handleItemClick}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <Bell className="h-8 w-8 text-gray-300 mb-2" />
              <span className="text-sm text-gray-500 text-center">
                No items need attention
              </span>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
