'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import {
  formatStatus,
  formatDepartment,
  getStatusColor,
  getDepartmentBorderColor,
} from '@/lib/utils'

interface Initiative {
  id: string
  title: string
  status: string
  department: string
  startDate: string
  endDate: string
}

interface RecentInitiativesProps {
  initiatives: Initiative[]
}

// Limit to 4 items to fit without scrolling
const MAX_ITEMS = 4

export function RecentInitiatives({ initiatives }: RecentInitiativesProps) {
  const displayedInitiatives = initiatives.slice(0, MAX_ITEMS)

  return (
    <div className="h-full flex flex-col">
      {/* Header with View all link */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">
          {initiatives.length} total
        </span>
        <Button variant="ghost" size="sm" asChild className="h-7 px-2">
          <Link href="/initiatives" className="flex items-center gap-1 text-xs">
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      {/* Initiatives list */}
      <div className="flex-1 space-y-2">
        {displayedInitiatives.map((initiative) => (
          <Link
            key={initiative.id}
            href={`/initiatives/${initiative.id}`}
            className={`block rounded-md border border-gray-200 p-2 border-l-4 ${getDepartmentBorderColor(
              initiative.department
            )} hover:bg-gray-50 transition-colors`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {initiative.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {formatDepartment(initiative.department)}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`${getStatusColor(initiative.status)} text-xs shrink-0`}
              >
                {formatStatus(initiative.status)}
              </Badge>
            </div>
          </Link>
        ))}

        {initiatives.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No initiatives found
          </p>
        )}
      </div>
    </div>
  )
}
