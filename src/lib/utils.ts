import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency in Malaysian Ringgit
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date for display
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Format date range
export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const startMonth = startDate.toLocaleDateString('en-MY', { month: 'short' })
  const endMonth = endDate.toLocaleDateString('en-MY', { month: 'short' })

  if (startMonth === endMonth) {
    return `${startDate.getDate()} - ${endDate.getDate()} ${startMonth}`
  }

  return `${startDate.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth}`
}

// Calculate progress percentage
export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min(Math.round((current / target) * 100), 100)
}

// Status color mapping
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NOT_STARTED: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    ON_HOLD: 'bg-yellow-100 text-yellow-700',
    AT_RISK: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

// Department color mapping for Gantt/timeline
export function getDepartmentColor(department: string): string {
  const colors: Record<string, string> = {
    BIZ_DEV: 'bg-purple-500',
    OPERATIONS: 'bg-blue-500',
    FINANCE: 'bg-green-500',
    MARKETING: 'bg-orange-500',
  }
  return colors[department] || 'bg-gray-500'
}

// Department border color for cards
export function getDepartmentBorderColor(department: string): string {
  const colors: Record<string, string> = {
    BIZ_DEV: 'border-l-purple-500',
    OPERATIONS: 'border-l-blue-500',
    FINANCE: 'border-l-green-500',
    MARKETING: 'border-l-orange-500',
  }
  return colors[department] || 'border-l-gray-500'
}

// Format status for display
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    ON_HOLD: 'On Hold',
    AT_RISK: 'At Risk',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }
  return statusMap[status] || status
}

// Format department for display
export function formatDepartment(department: string): string {
  const deptMap: Record<string, string> = {
    BIZ_DEV: 'Biz Dev',
    OPERATIONS: 'Operations',
    FINANCE: 'Finance',
    MARKETING: 'Marketing',
  }
  return deptMap[department] || department
}

// Format objective for display
export function formatObjective(objective: string): string {
  const objMap: Record<string, string> = {
    OBJ1_SCALE_EVENTS: 'Obj 1: Scale Events',
    OBJ2_BUILD_AI_TRAINING: 'Obj 2: Build AI Training',
  }
  return objMap[objective] || objective
}

// Format team member for display
export function formatTeamMember(member: string | null): string {
  if (!member) return '-'
  const memberMap: Record<string, string> = {
    KHAIRUL: 'Khairul',
    AZLAN: 'Azlan',
    IZYANI: 'Izyani',
  }
  return memberMap[member] || member
}

// Parse Excel serial date to JavaScript Date
export function parseExcelDate(serial: number): Date {
  // Excel dates are number of days since January 1, 1900
  // But Excel incorrectly treats 1900 as a leap year, so we adjust
  const utcDays = Math.floor(serial - 25569)
  const utcValue = utcDays * 86400 * 1000
  return new Date(utcValue)
}

// Get month abbreviation
export function getMonthAbbr(monthIndex: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[monthIndex] || ''
}

// Status options for forms/filters
export const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'AT_RISK', label: 'At Risk' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

// Department options for forms/filters
export const DEPARTMENT_OPTIONS = [
  { value: 'BIZ_DEV', label: 'Biz Dev' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'MARKETING', label: 'Marketing' },
]

// Objective options for forms/filters
export const OBJECTIVE_OPTIONS = [
  { value: 'OBJ1_SCALE_EVENTS', label: 'Obj 1: Scale Events' },
  { value: 'OBJ2_BUILD_AI_TRAINING', label: 'Obj 2: Build AI Training' },
]

// Team member options for forms/filters
export const TEAM_MEMBER_OPTIONS = [
  { value: 'KHAIRUL', label: 'Khairul' },
  { value: 'AZLAN', label: 'Azlan' },
  { value: 'IZYANI', label: 'Izyani' },
]
