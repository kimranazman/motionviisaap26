// Pipeline stage configuration
export const STAGES = [
  { id: 'LEAD', title: 'Lead', colorDot: 'bg-gray-400' },
  { id: 'QUALIFIED', title: 'Qualified', colorDot: 'bg-blue-400' },
  { id: 'PROPOSAL', title: 'Proposal', colorDot: 'bg-purple-400' },
  { id: 'NEGOTIATION', title: 'Negotiation', colorDot: 'bg-amber-400' },
  { id: 'WON', title: 'Won', colorDot: 'bg-green-500' },
  { id: 'LOST', title: 'Lost', colorDot: 'bg-red-400' },
] as const

export type StageId = (typeof STAGES)[number]['id']

// Format stage for display
export function formatDealStage(stage: string): string {
  const stageMap: Record<string, string> = {
    LEAD: 'Lead',
    QUALIFIED: 'Qualified',
    PROPOSAL: 'Proposal',
    NEGOTIATION: 'Negotiation',
    WON: 'Won',
    LOST: 'Lost',
  }
  return stageMap[stage] || stage
}

// Get stage badge color
export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    LEAD: 'bg-gray-100 text-gray-700',
    QUALIFIED: 'bg-blue-100 text-blue-700',
    PROPOSAL: 'bg-purple-100 text-purple-700',
    NEGOTIATION: 'bg-amber-100 text-amber-700',
    WON: 'bg-green-100 text-green-700',
    LOST: 'bg-red-100 text-red-700',
  }
  return colors[stage] || 'bg-gray-100 text-gray-700'
}
