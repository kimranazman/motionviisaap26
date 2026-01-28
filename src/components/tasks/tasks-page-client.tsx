'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Table2 as TableIcon, KanbanSquare, Plus } from 'lucide-react'
import { TEAM_MEMBER_OPTIONS } from '@/lib/utils'
import { TaskFilterBar, type DueDateFilter } from './task-filter-bar'
import { TaskTableView } from './task-table-view'
import { TaskKanbanView } from './task-kanban-view'
import { TaskKanbanProjectView } from './task-kanban-project-view'
import { TaskDetailSheet } from '@/components/projects/task-detail-sheet'
import { ProjectSelect } from './project-select'

export interface CrossProjectTask {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  assignee: string | null
  depth: number
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
  allProjects: ProjectOption[]
}

const STORAGE_KEY = 'tasks-view-preference'
const GROUPING_STORAGE_KEY = 'tasks-grouping-preference'

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

export function TasksPageClient({ initialTasks, projects, allProjects }: TasksPageClientProps) {
  const router = useRouter()

  // Task state
  const [tasks, setTasks] = useState<CrossProjectTask[]>(initialTasks)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all')

  // View state
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  // Grouping mode state (only applies to kanban view)
  const [groupMode, setGroupMode] = useState<'status' | 'project'>('status')

  // Detail sheet state
  const [selectedTask, setSelectedTask] = useState<CrossProjectTask | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newProjectId, setNewProjectId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newStatus, setNewStatus] = useState('TODO')
  const [newPriority, setNewPriority] = useState('MEDIUM')
  const [newDueDate, setNewDueDate] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

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

  // Load grouping preference from localStorage (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GROUPING_STORAGE_KEY)
      if (stored === 'status' || stored === 'project') {
        setGroupMode(stored)
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

  // Persist grouping preference
  const handleGroupingChange = (mode: string) => {
    const validMode = mode as 'status' | 'project'
    setGroupMode(validMode)
    try {
      localStorage.setItem(GROUPING_STORAGE_KEY, validMode)
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

  // Reset create form
  const resetCreateForm = () => {
    setNewProjectId(null)
    setNewTitle('')
    setNewDescription('')
    setNewStatus('TODO')
    setNewPriority('MEDIUM')
    setNewDueDate('')
    setNewAssignee('')
    setCreateError(null)
  }

  // Handle create task
  const handleCreateTask = async () => {
    if (!newProjectId || !newTitle.trim()) return
    setIsCreating(true)
    setCreateError(null)
    try {
      const response = await fetch(`/api/projects/${newProjectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          status: newStatus,
          priority: newPriority,
          dueDate: newDueDate || null,
          assignee: newAssignee || null,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        setCreateError(data.error || 'Failed to create task')
        return
      }
      setIsCreateOpen(false)
      resetCreateForm()
      router.refresh()
    } catch {
      setCreateError('Failed to create task')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar, Add Task, and View Toggle */}
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

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          {/* Add Task Button + Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) resetCreateForm()
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Project selector (required) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <ProjectSelect
                    value={newProjectId}
                    onValueChange={setNewProjectId}
                    projects={allProjects}
                  />
                </div>

                {/* Title (required) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Set up venue equipment"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <Textarea
                    placeholder="Optional details..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Due Date and Assignee */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Assignee
                    </label>
                    <Select
                      value={newAssignee || '__unassigned__'}
                      onValueChange={(v) => setNewAssignee(v === '__unassigned__' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unassigned__">Unassigned</SelectItem>
                        {TEAM_MEMBER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Error message */}
                {createError && (
                  <p className="text-sm text-red-500">{createError}</p>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreateTask}
                  disabled={!newProjectId || !newTitle.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Task'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Toggle + Grouping Toggle */}
          <div className="flex items-center gap-2">
            {/* Grouping Toggle (only in kanban mode) */}
            {viewMode === 'kanban' && (
              <Tabs
                value={groupMode}
                onValueChange={handleGroupingChange}
                className="shrink-0"
              >
                <TabsList className="bg-white/70 backdrop-blur-xl border border-gray-200/50 h-9">
                  <TabsTrigger value="status" className="text-xs px-2 data-[state=active]:bg-white">
                    By Status
                  </TabsTrigger>
                  <TabsTrigger value="project" className="text-xs px-2 data-[state=active]:bg-white">
                    By Project
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

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
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <TaskTableView tasks={filteredTasks} onTaskClick={handleTaskClick} />
      )}

      {/* Kanban View (By Status) */}
      {viewMode === 'kanban' && groupMode === 'status' && (
        <TaskKanbanView
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onTasksChange={(updatedTasks) => {
            // Merge updated tasks back into full tasks array
            setTasks(prev => prev.map(t => {
              const updated = updatedTasks.find(u => u.id === t.id)
              return updated || t
            }))
          }}
        />
      )}

      {/* Kanban View (By Project) */}
      {viewMode === 'kanban' && groupMode === 'project' && (
        <TaskKanbanProjectView
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onTasksChange={(updatedTasks) => {
            // Merge updated tasks back into full tasks array
            setTasks(prev => prev.map(t => {
              const updated = updatedTasks.find(u => u.id === t.id)
              return updated || t
            }))
          }}
        />
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
