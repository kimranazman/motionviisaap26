'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table2 as TableIcon, KanbanSquare } from 'lucide-react'
import { TaskFilterBar, type DueDateFilter } from './task-filter-bar'
import { TaskTableView } from './task-table-view'
import { TaskDetailSheet } from '@/components/projects/task-detail-sheet'

export interface CrossProjectTask {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  assignee: string | null
  projectId: string
  project: { id: string; title: string }
  _count: { children: number; comments: number }
  createdAt: string
  updatedAt: string
}

export interface ProjectOption {
  id: string
  title: string
}

interface TasksPageClientProps {
  initialTasks: CrossProjectTask[]
  projects: ProjectOption[]
}

const STORAGE_KEY = 'tasks-view-preference'

function matchesDueDateFilter(
  task: { dueDate: string | null; status: string },
  filter: DueDateFilter
): boolean {
  if (filter === 'all') return true
  if (filter === 'no-date') return task.dueDate === null

  if (!task.dueDate) return false
  const dueDate = new Date(task.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  switch (filter) {
    case 'overdue':
      return dueDate < today && task.status !== 'DONE'
    case 'today':
      return dueDate.toDateString() === today.toDateString()
    case 'this-week': {
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()))
      weekEnd.setHours(23, 59, 59, 999)
      return dueDate >= today && dueDate <= weekEnd
    }
    case 'this-month': {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      return dueDate >= today && dueDate <= monthEnd
    }
    default:
      return true
  }
}

export function TasksPageClient({ initialTasks, projects }: TasksPageClientProps) {
  const router = useRouter()

  // Task state
  const [tasks] = useState<CrossProjectTask[]>(initialTasks)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all')

  // View state
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  // Detail sheet state
  const [selectedTask, setSelectedTask] = useState<CrossProjectTask | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Load view preference from localStorage (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'table' || stored === 'kanban') {
        setViewMode(stored)
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Persist view preference
  const handleViewChange = (mode: string) => {
    const validMode = mode as 'table' | 'kanban'
    setViewMode(validMode)
    try {
      localStorage.setItem(STORAGE_KEY, validMode)
    } catch {
      /* ignore */
    }
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Assignee filter
      if (assigneeFilter && task.assignee !== assigneeFilter) {
        return false
      }
      // Project filter
      if (projectFilter && task.project.id !== projectFilter) {
        return false
      }
      // Status filter
      if (statusFilter && task.status !== statusFilter) {
        return false
      }
      // Priority filter
      if (priorityFilter && task.priority !== priorityFilter) {
        return false
      }
      // Due date filter
      if (!matchesDueDateFilter(task, dueDateFilter)) {
        return false
      }
      return true
    })
  }, [tasks, searchQuery, assigneeFilter, projectFilter, statusFilter, priorityFilter, dueDateFilter])

  // Handle task row click
  const handleTaskClick = (task: CrossProjectTask) => {
    setSelectedTask(task)
    setIsSheetOpen(true)
  }

  // Handle task update (after saving in detail sheet)
  const handleTaskUpdate = () => {
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar and View Toggle */}
      <div className="flex gap-4 flex-col md:flex-row md:items-center md:justify-between">
        <TaskFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedAssignee={assigneeFilter}
          onAssigneeChange={setAssigneeFilter}
          selectedProject={projectFilter}
          onProjectChange={setProjectFilter}
          projects={projects}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
          selectedPriority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          selectedDueDate={dueDateFilter}
          onDueDateChange={setDueDateFilter}
        />

        {/* View Toggle */}
        <Tabs
          value={viewMode}
          onValueChange={handleViewChange}
          className="shrink-0 w-full md:w-auto"
        >
          <TabsList className="bg-white/70 backdrop-blur-xl border border-gray-200/50">
            <TabsTrigger value="table" className="gap-1.5 data-[state=active]:bg-white">
              <TableIcon className="h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5 data-[state=active]:bg-white">
              <KanbanSquare className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <TaskTableView tasks={filteredTasks} onTaskClick={handleTaskClick} />
      )}

      {/* Kanban View Placeholder */}
      {viewMode === 'kanban' && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <div className="text-center">
            <KanbanSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-600">Kanban view coming soon</p>
            <p className="text-sm text-gray-400 mt-1">
              Drag and drop tasks across status columns
            </p>
          </div>
        </div>
      )}

      {/* Summary line */}
      <div className="text-sm text-gray-500">
        <span className="hidden sm:inline">Showing </span>
        {filteredTasks.length} of {tasks.length}
        <span className="hidden sm:inline"> tasks</span>
      </div>

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={{ ...selectedTask, parentId: null }}
          projectId={selectedTask.projectId}
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </div>
  )
}
