'use client'

import { POTENTIAL_STAGES } from '@/lib/potential-utils'
import { formatCurrency } from '@/lib/utils'

interface PotentialProject {
  id: string
  stage: string
  estimatedValue: number | null
}

interface PotentialMetricsProps {
  projects: PotentialProject[]
}

export function PotentialMetrics({ projects }: PotentialMetricsProps) {
  // Calculate metrics per stage
  const stageMetrics = POTENTIAL_STAGES.map((stage) => {
    const stageProjects = projects.filter((p) => p.stage === stage.id)
    const count = stageProjects.length
    const totalValue = stageProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0)
    return {
      ...stage,
      count,
      totalValue,
    }
  })

  // Calculate open pipeline (POTENTIAL stage only)
  const openProjects = projects.filter((p) => p.stage === 'POTENTIAL')
  const openPipelineValue = openProjects.reduce(
    (sum, p) => sum + (p.estimatedValue || 0),
    0
  )
  const openPipelineCount = openProjects.length

  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between gap-4 overflow-x-auto">
        {/* Open Pipeline Summary */}
        <div className="flex items-center gap-2 min-w-max pr-4 border-r border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Open Pipeline
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">
              {openPipelineValue > 0 ? formatCurrency(openPipelineValue) : '-'}
            </span>
            <span className="text-xs text-gray-500">
              ({openPipelineCount} project{openPipelineCount !== 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {/* Per-Stage Metrics */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {stageMetrics.map((stage) => (
            <div
              key={stage.id}
              className="flex items-center gap-2 min-w-max"
            >
              <div
                className={`w-2 h-2 rounded-full ${stage.colorDot}`}
              />
              <span className="text-xs text-gray-600">{stage.title}</span>
              <span className="text-xs font-medium text-gray-900">
                {stage.count}
              </span>
              {stage.totalValue > 0 && (
                <span className="text-xs text-gray-500">
                  ({formatCurrency(stage.totalValue)})
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
