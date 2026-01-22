// Project status configuration
export const PROJECT_STATUSES = [
  { id: 'DRAFT', title: 'Draft', colorDot: 'bg-gray-400' },
  { id: 'ACTIVE', title: 'Active', colorDot: 'bg-blue-500' },
  { id: 'COMPLETED', title: 'Completed', colorDot: 'bg-green-500' },
  { id: 'CANCELLED', title: 'Cancelled', colorDot: 'bg-red-400' },
] as const

export type ProjectStatusId = (typeof PROJECT_STATUSES)[number]['id']

// Format status for display
export function formatProjectStatus(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'Draft',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }
  return statusMap[status] || status
}

// Get status badge color
export function getProjectStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

// Get source label for display
export function getSourceLabel(
  sourceDeal: { title: string } | null,
  sourcePotential: { title: string } | null
): { type: 'deal' | 'potential' | 'direct'; label: string } {
  if (sourceDeal) {
    return { type: 'deal', label: `From deal: ${sourceDeal.title}` }
  }
  if (sourcePotential) {
    return { type: 'potential', label: `From potential: ${sourcePotential.title}` }
  }
  return { type: 'direct', label: 'Direct creation' }
}
