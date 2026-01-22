// Potential Projects stage configuration
export const POTENTIAL_STAGES = [
  { id: 'POTENTIAL', title: 'Potential', colorDot: 'bg-blue-400' },
  { id: 'CONFIRMED', title: 'Confirmed', colorDot: 'bg-green-500' },
  { id: 'CANCELLED', title: 'Cancelled', colorDot: 'bg-gray-400' },
] as const

export type PotentialStageId = (typeof POTENTIAL_STAGES)[number]['id']

// Format stage for display
export function formatPotentialStage(stage: string): string {
  const stageMap: Record<string, string> = {
    POTENTIAL: 'Potential',
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
  }
  return stageMap[stage] || stage
}

// Get stage badge color
export function getPotentialStageColor(stage: string): string {
  const colors: Record<string, string> = {
    POTENTIAL: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  }
  return colors[stage] || 'bg-gray-100 text-gray-700'
}
