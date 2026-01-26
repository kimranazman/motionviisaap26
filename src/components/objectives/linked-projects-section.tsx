'use client'

import Link from 'next/link'
import { FolderOpen, ExternalLink } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { formatProjectStatus, getProjectStatusColor } from '@/lib/project-utils'

export interface LinkedProject {
  id: string
  title: string
  status: string
  revenue: number | null
  totalCosts: number
  companyName: string | null
  startDate: string | null
  endDate: string | null
}

interface LinkedProjectsSectionProps {
  projects: LinkedProject[]
}

export function LinkedProjectsSection({ projects }: LinkedProjectsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <FolderOpen className="h-4 w-4" />
        Linked Projects
        {projects.length > 0 && (
          <span className="text-xs text-gray-400">({projects.length})</span>
        )}
      </h3>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <FolderOpen className="h-8 w-8 mb-2" />
          <span className="text-sm">No linked projects</span>
        </div>
      ) : (
        <div className="space-y-1">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group block rounded-lg p-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left side: title + client */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {project.title}
                    </span>
                    <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  {project.companyName && (
                    <p className="text-xs text-gray-500 mt-0.5">{project.companyName}</p>
                  )}
                </div>

                {/* Right side: status badge + financials */}
                <div className="text-right shrink-0">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      getProjectStatusColor(project.status)
                    )}
                  >
                    {formatProjectStatus(project.status)}
                  </span>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    <div>{formatCurrency(project.revenue)}</div>
                    <div>Cost: {formatCurrency(project.totalCosts)}</div>
                  </div>
                </div>
              </div>

              {/* Date range */}
              {(project.startDate || project.endDate) && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {project.startDate && project.endDate
                    ? `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`
                    : project.startDate
                      ? `From ${formatDate(project.startDate)}`
                      : `Until ${formatDate(project.endDate)}`
                  }
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
