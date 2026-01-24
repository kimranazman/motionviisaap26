'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, ArrowRight, Plus } from 'lucide-react'
import { formatProjectStatus, getProjectStatusColor } from '@/lib/project-utils'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  title: string
  description: string | null
  revenue: number | null              // Actual revenue from AI invoices
  potentialRevenue: number | null     // From deal/potential conversion
  status: string
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
  initiative: { id: string; title: string } | null
  sourceDeal: { id: string; title: string } | null
  sourcePotential: { id: string; title: string } | null
}

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

// Format revenue as MYR
function formatRevenue(value: number | null): string {
  if (value === null) return '-'
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Get source badge info
function getSourceBadge(
  sourceDeal: { title: string } | null,
  sourcePotential: { title: string } | null
): { type: 'deal' | 'potential' | 'direct'; className: string } {
  if (sourceDeal) {
    return { type: 'deal', className: 'bg-green-50 text-green-700 border-green-200' }
  }
  if (sourcePotential) {
    return { type: 'potential', className: 'bg-blue-50 text-blue-700 border-blue-200' }
  }
  return { type: 'direct', className: 'bg-gray-50 text-gray-600 border-gray-200' }
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const sourceBadge = getSourceBadge(project.sourceDeal, project.sourcePotential)

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-medium text-gray-900 truncate">
              {project.title}
            </h3>

            {/* Company */}
            {project.company && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                <Building2 className="h-3.5 w-3.5" />
                <span className="truncate">{project.company.name}</span>
              </div>
            )}
          </div>

          {/* Revenue */}
          <div className="text-right shrink-0">
            <div className="font-medium text-gray-900">
              {formatRevenue(project.revenue)}
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Status badge */}
          <Badge
            variant="secondary"
            className={cn('text-xs', getProjectStatusColor(project.status))}
          >
            {formatProjectStatus(project.status)}
          </Badge>

          {/* Source indicator */}
          <Badge
            variant="outline"
            className={cn('text-xs', sourceBadge.className)}
          >
            {sourceBadge.type === 'deal' && (
              <>
                <ArrowRight className="h-3 w-3 mr-1" />
                Deal
              </>
            )}
            {sourceBadge.type === 'potential' && (
              <>
                <ArrowRight className="h-3 w-3 mr-1" />
                Potential
              </>
            )}
            {sourceBadge.type === 'direct' && (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Direct
              </>
            )}
          </Badge>

          {/* KRI indicator */}
          {project.initiative && (
            <Badge
              variant="outline"
              className="text-xs bg-purple-50 text-purple-700 border-purple-200"
            >
              KRI
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
