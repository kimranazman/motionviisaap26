/**
 * Member utilities for the member workload dashboard.
 * Provides member profiles, lookup functions, and status/highlighting helpers.
 */

export interface MemberProfile {
  enumValue: string   // "KHAIRUL" (TeamMember enum)
  name: string        // "Khairul" (matches KR/ST owner strings)
  slug: string        // "khairul" (URL slug for /members/[name])
  initials: string    // "KH"
  color: string       // "bg-blue-600"
}

export const MEMBER_PROFILES: MemberProfile[] = [
  { enumValue: 'KHAIRUL', name: 'Khairul', slug: 'khairul', initials: 'KH', color: 'bg-blue-600' },
  { enumValue: 'AZLAN', name: 'Azlan', slug: 'azlan', initials: 'AZ', color: 'bg-green-600' },
  { enumValue: 'IZYANI', name: 'Izyani', slug: 'izyani', initials: 'IZ', color: 'bg-purple-600' },
]

// Lookup functions

export function getMemberBySlug(slug: string): MemberProfile | undefined {
  return MEMBER_PROFILES.find(m => m.slug === slug)
}

export function getMemberByEnum(enumValue: string): MemberProfile | undefined {
  return MEMBER_PROFILES.find(m => m.enumValue === enumValue)
}

// Overdue/At-Risk helpers

const COMPLETED_STATUSES = new Set(['DONE', 'COMPLETED', 'ACHIEVED', 'CANCELLED'])

export function isItemOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate) return false
  if (COMPLETED_STATUSES.has(status)) return false
  return new Date(dueDate) < new Date()
}

export function isItemAtRisk(status: string): boolean {
  return status === 'AT_RISK' || status === 'BEHIND'
}

export function shouldHighlightRed(status: string, dueDate?: string | null): boolean {
  return isItemAtRisk(status) || isItemOverdue(dueDate ?? null, status)
}

// Status breakdown helper

export function getStatusBreakdown(
  items: Array<{ status: string }>
): Array<{ status: string; label: string; count: number }> {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.status, (counts.get(item.status) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([status, count]) => ({
      status,
      label: status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()),
      count,
    }))
    .filter(entry => entry.count > 0)
}

// KR status helpers (duplicated from key-result-group.tsx for self-contained use)

export function getKrStatusColor(status: string): string {
  switch (status) {
    case 'ON_TRACK': return 'bg-green-100 text-green-700'
    case 'AT_RISK': return 'bg-orange-100 text-orange-700'
    case 'BEHIND': return 'bg-red-100 text-red-700'
    case 'ACHIEVED': return 'bg-emerald-100 text-emerald-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export function formatKrStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function getProgressBarColor(progress: number): string {
  if (progress >= 80) return '[&>div]:bg-green-500'
  if (progress >= 50) return '[&>div]:bg-yellow-500'
  return '[&>div]:bg-red-500'
}
