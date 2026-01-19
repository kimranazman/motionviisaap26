'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import {
  formatStatus,
  formatDepartment,
  formatDateRange,
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

export function RecentInitiatives({ initiatives }: RecentInitiativesProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          Recent Initiatives
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/initiatives" className="flex items-center gap-1 text-sm">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {initiatives.map((initiative) => (
            <Link
              key={initiative.id}
              href={`/initiatives/${initiative.id}`}
              className={`block rounded-lg border border-gray-200 p-4 border-l-4 ${getDepartmentBorderColor(
                initiative.department
              )} hover:bg-gray-50 transition-colors`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {initiative.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatDepartment(initiative.department)}</span>
                    <span>|</span>
                    <span>
                      {formatDateRange(initiative.startDate, initiative.endDate)}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={getStatusColor(initiative.status)}
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
      </CardContent>
    </Card>
  )
}
