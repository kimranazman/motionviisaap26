'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Target, Briefcase, ListChecks, ClipboardList } from 'lucide-react'
import { MemberStatsHeader } from '@/components/members/member-stats-header'
import { MemberKrSection } from '@/components/members/member-kr-section'
import { MemberInitiativesSection } from '@/components/members/member-initiatives-section'
import { MemberAccountableSection } from '@/components/members/member-accountable-section'
import { MemberTasksSection } from '@/components/members/member-tasks-section'
import { MemberSupportTasksSection } from '@/components/members/member-support-tasks-section'
import { getStatusBreakdown, formatKrStatus } from '@/lib/member-utils'
import { formatStatus } from '@/lib/utils'
import { formatTaskStatus } from '@/lib/task-utils'
import type { TaskStatus } from '@prisma/client'
import type { MemberProfile } from '@/lib/member-utils'

// Serialized types matching server page output
export interface SerializedKeyResult {
  id: string
  krId: string
  objective: string
  description: string
  metricType: string
  target: number
  actual: number
  unit: string
  progress: number
  deadline: string
  status: string
  owner: string
  howWeMeasure: string | null
  notes: string | null
  weight: number
  createdAt: string
  updatedAt: string
}

export interface SerializedInitiative {
  id: string
  sequenceNumber: number
  objective: string
  department: string
  title: string
  startDate: string
  endDate: string
  personInCharge: string | null
  accountable: string | null
  status: string
  remarks: string | null
  position: number
  keyResultId: string | null
  keyResult: { id: string; krId: string } | null
  budget: string | null
  resources: string | null
  createdAt: string
  updatedAt: string
}

export interface SerializedTask {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assignee: string | null
  projectId: string
  project: { id: string; title: string }
  parentId: string | null
  depth: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SerializedSupportTask {
  id: string
  taskId: string
  category: string
  task: string
  owner: string
  frequency: string | null
  priority: string
  notes: string | null
  keyResultLinks: Array<{
    id: string
    keyResult: {
      id: string
      krId: string
      description: string
    }
  }>
  createdAt: string
  updatedAt: string
}

export interface MemberDetailData {
  member: MemberProfile
  keyResults: SerializedKeyResult[]
  initiatives: SerializedInitiative[]
  accountableInitiatives: SerializedInitiative[]
  tasks: SerializedTask[]
  supportTasks: SerializedSupportTask[]
}

interface MemberDetailProps {
  data: MemberDetailData
}

export function MemberDetail({ data }: MemberDetailProps) {
  const { member, keyResults, initiatives, accountableInitiatives, tasks, supportTasks } = data

  // Compute stats for header
  const krBreakdown = getStatusBreakdown(keyResults).map(b => ({
    ...b,
    label: formatKrStatus(b.status),
  }))

  const initiativeBreakdown = getStatusBreakdown(initiatives).map(b => ({
    ...b,
    label: formatStatus(b.status),
  }))

  const taskBreakdown = getStatusBreakdown(tasks).map(b => ({
    ...b,
    label: formatTaskStatus(b.status as TaskStatus),
  }))

  // Support tasks have priority, not status -- use priority for breakdown
  const stPriorityBreakdown = getStatusBreakdown(
    supportTasks.map(st => ({ status: st.priority }))
  )

  const stats = [
    {
      label: 'Key Results',
      count: keyResults.length,
      icon: Target,
      breakdown: krBreakdown,
    },
    {
      label: 'Initiatives',
      count: initiatives.length,
      icon: Briefcase,
      breakdown: initiativeBreakdown,
    },
    {
      label: 'Tasks',
      count: tasks.length,
      icon: ListChecks,
      breakdown: taskBreakdown,
    },
    {
      label: 'Support Tasks',
      count: supportTasks.length,
      icon: ClipboardList,
      breakdown: stPriorityBreakdown,
    },
  ]

  return (
    <div className="space-y-6">
      <Link
        href="/members"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Members
      </Link>

      <MemberStatsHeader stats={stats} />

      <MemberKrSection keyResults={keyResults} memberName={member.name} />

      <MemberInitiativesSection
        initiatives={initiatives}
        memberName={member.name}
      />

      <MemberAccountableSection
        initiatives={accountableInitiatives}
        memberName={member.name}
      />

      <MemberTasksSection tasks={tasks} memberName={member.name} />

      <MemberSupportTasksSection
        supportTasks={supportTasks}
        memberName={member.name}
      />
    </div>
  )
}
